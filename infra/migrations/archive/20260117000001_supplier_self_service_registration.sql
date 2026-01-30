-- ============================================================
-- SUPPLIER SELF-SERVICE REGISTRATION + APPROVAL
-- ============================================================
-- Migration para permitir cadastro público de fornecedores
-- com sistema de aprovação manual
-- Data: 2026-01-17
-- ============================================================

-- 1. Adicionar coluna status em suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL;

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL;

-- Adicionar campo de categorias de produtos
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS product_categories TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.suppliers.status IS 
'Status de aprovação do fornecedor: pending (aguardando), approved (aprovado), rejected (rejeitado)';

COMMENT ON COLUMN public.suppliers.approved_at IS 
'Data/hora da aprovação do cadastro';

COMMENT ON COLUMN public.suppliers.rejected_at IS 
'Data/hora da rejeição do cadastro';

COMMENT ON COLUMN public.suppliers.product_categories IS 
'Categorias de produtos que o fornecedor trabalha: tecidos, papel-de-parede, trilho, moveis-soltos, motorizacao';

-- 2. Atualizar suppliers existentes para 'approved' (compatibilidade)
UPDATE public.suppliers 
SET status = 'approved', approved_at = created_at
WHERE status = 'pending' AND created_at < now();

-- 3. Remover função antiga se existir (com assinatura diferente)
-- Remove todas as possíveis versões da função (com e sem product_categories)
DO $$ 
BEGIN
  -- Tenta remover todas as versões possíveis
  DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], UUID);
  DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID);
EXCEPTION 
  WHEN OTHERS THEN
    -- Se der erro, continua (função pode não existir)
    NULL;
END $$;

-- 4. Criar função RPC para cadastro público seguro (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.register_supplier(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_service_states TEXT[] DEFAULT '{}',
  p_product_categories TEXT[] DEFAULT '{}',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_supplier_id UUID;
  v_user_id_final UUID;
BEGIN
  -- Validar inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Nome da empresa é obrigatório';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'E-mail é obrigatório';
  END IF;

  -- Gerar slug do nome
  v_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi'));
  v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
  
  -- Garantir unicidade do slug
  WHILE EXISTS (SELECT 1 FROM public.suppliers WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || floor(random() * 1000)::text;
  END LOOP;

  -- Usar user_id fornecido ou auth.uid() se disponível
  v_user_id_final := COALESCE(p_user_id, auth.uid());

  -- Criar ou atualizar supplier (upsert por email ou CNPJ se fornecido)
  INSERT INTO public.suppliers (
    name,
    slug,
    email,
    phone,
    cnpj,
    service_states,
    product_categories,
    status,
    active
  ) VALUES (
    trim(p_name),
    v_slug,
    trim(lower(p_email)),
    CASE WHEN p_phone IS NOT NULL THEN trim(p_phone) ELSE NULL END,
    CASE WHEN p_cnpj IS NOT NULL THEN trim(p_cnpj) ELSE NULL END,
    COALESCE(p_service_states, '{}'),
    COALESCE(p_product_categories, '{}'),
    'pending',
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    cnpj = EXCLUDED.cnpj,
    service_states = EXCLUDED.service_states,
    product_categories = EXCLUDED.product_categories,
    status = CASE 
      WHEN suppliers.status = 'approved' THEN 'approved' -- Manter aprovado se já estava
      ELSE 'pending' 
    END
  RETURNING id INTO v_supplier_id;

  -- Criar vínculo supplier_users automaticamente (mesmo com status='pending')
  -- Isso permite acesso limitado ao portal enquanto aguarda aprovação
  IF v_user_id_final IS NOT NULL THEN
    INSERT INTO public.supplier_users (
      supplier_id,
      user_id,
      role,
      active
    ) VALUES (
      v_supplier_id,
      v_user_id_final,
      'supplier',
      true
    )
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET
      active = true,
      role = 'supplier';
  END IF;

  -- Confirmar email automaticamente (MVP - não exigir confirmação manual)
  -- Isso permite login imediato após cadastro
  IF v_user_id_final IS NOT NULL THEN
    -- Atualizar email_confirmed_at via admin API (SECURITY DEFINER permite)
    -- Nota: Isso só funciona se a política do Supabase permitir
    -- Se não funcionar, o usuário precisará confirmar via email ou admin precisa confirmar manualmente
    UPDATE auth.users
    SET email_confirmed_at = now()
    WHERE id = v_user_id_final
      AND email_confirmed_at IS NULL;
  END IF;

  RETURN v_supplier_id;
END;
$$;

COMMENT ON FUNCTION public.register_supplier IS 
'Função RPC para cadastro público de fornecedores. Cria supplier com status=pending. Requer aprovação manual.';

-- 5. Permitir execução pública da função (apenas para cadastro)
-- Especificar assinatura completa para evitar ambiguidade
GRANT EXECUTE ON FUNCTION public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) TO anon, authenticated;

-- 5. Ajustar RLS para permitir INSERT via função (já é SECURITY DEFINER, então bypassa RLS)
-- Mas manter RLS nas policies existentes para SELECT/UPDATE

-- 6. Atualizar policy de suppliers para considerar status
-- (Manter policies existentes, apenas adicionar verificação de status onde necessário)

-- 7. Criar função auxiliar para aprovar fornecedor (para uso manual no Supabase)
CREATE OR REPLACE FUNCTION public.approve_supplier(
  p_supplier_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar status do supplier
  UPDATE public.suppliers
  SET 
    status = 'approved',
    approved_at = now()
  WHERE id = p_supplier_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fornecedor não encontrado ou já aprovado/rejeitado';
  END IF;

  -- Criar vínculo supplier_users se não existir
  INSERT INTO public.supplier_users (
    supplier_id,
    user_id,
    role,
    active
  ) VALUES (
    p_supplier_id,
    p_user_id,
    'supplier',
    true
  )
  ON CONFLICT (supplier_id, user_id) DO UPDATE SET
    active = true,
    role = 'supplier';

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função auxiliar para aprovar fornecedor manualmente. Atualiza status e cria vínculo supplier_users.';

-- 9. Ajustar SupplierPortal: verificar status na policy de supplier_users
-- (Isso será feito no código frontend, mas podemos adicionar uma view auxiliar)

-- 10. Remover view antiga e recriar com product_categories
DROP VIEW IF EXISTS public.supplier_pending_registrations CASCADE;

-- 11. Criar view auxiliar para ver fornecedores pendentes (útil para admin)
CREATE OR REPLACE VIEW public.supplier_pending_registrations AS
SELECT 
  s.id,
  s.name,
  s.slug,
  s.email,
  s.phone,
  s.cnpj,
  s.service_states,
  s.product_categories,
  s.status,
  s.created_at,
  s.updated_at,
  -- Tentar encontrar user_id pelo email
  (
    SELECT id 
    FROM auth.users 
    WHERE email = s.email 
    LIMIT 1
  ) AS user_id
FROM public.suppliers s
WHERE s.status = 'pending'
ORDER BY s.created_at DESC;

COMMENT ON VIEW public.supplier_pending_registrations IS 
'View auxiliar para listar fornecedores pendentes de aprovação. Útil para aprovação manual via Supabase Dashboard.';

-- 12. RLS para a view (apenas admins podem ver, mas no MVP será público para facilitar aprovação manual)
-- No futuro, quando houver painel admin, criar policy adequada
-- Por enquanto, deixar sem RLS específico (acesso via Supabase Dashboard com service_role)
