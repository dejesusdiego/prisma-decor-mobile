-- ============================================================
-- SUPPLIERS V1 HOTFIX — RLS e Hardening
-- ============================================================
-- Data: 2026-01-21
-- Objetivo: Blindar feature contra bugs e vazamentos de dados
-- ============================================================

-- ============================================================
-- 1. CORRIGIR RLS: supplier_materials — Filtrar por status='approved'
-- ============================================================

-- Remover política antiga que não filtra por status
DROP POLICY IF EXISTS "Organizations can view linked supplier materials" ON public.supplier_materials;

-- Criar política corrigida que EXIGE suppliers.status = 'approved'
CREATE POLICY "Organizations can view linked supplier materials"
  ON public.supplier_materials
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      INNER JOIN public.suppliers s
        ON so.supplier_id = s.id
      WHERE om.user_id = auth.uid()
        AND so.active = true
        AND s.active = true
        AND s.status = 'approved'  -- OBRIGATÓRIO: apenas fornecedores aprovados
    )
    AND active = true
  );

COMMENT ON POLICY "Organizations can view linked supplier materials" ON public.supplier_materials IS 
'Organizações podem ver APENAS materiais de fornecedores aprovados e vinculados. Exige suppliers.status = approved.';

-- ============================================================
-- 2. HARDENING: approve_supplier — Verificação explícita de JWT
-- ============================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.approve_supplier(UUID, UUID) CASCADE;

-- Recriar função com verificação FECHADA de JWT
CREATE OR REPLACE FUNCTION public.approve_supplier(
  p_supplier_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_jwt_role TEXT;
  v_jwt_exists BOOLEAN := false;
BEGIN
  -- Verificar se JWT existe (request.jwt.claims)
  BEGIN
    -- Tentar ler JWT claims
    v_jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
    v_jwt_exists := true;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se não conseguir ler JWT, negar acesso
      v_jwt_exists := false;
      v_jwt_role := NULL;
  END;
  
  -- Se JWT não existe ou role não é service_role, NEGAR
  IF NOT v_jwt_exists OR v_jwt_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not_authorized: Apenas service_role pode aprovar fornecedores. JWT inválido ou ausente.';
  END IF;

  -- Validar inputs
  IF p_supplier_id IS NULL THEN
    RAISE EXCEPTION 'supplier_id_required: ID do fornecedor é obrigatório';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório';
  END IF;

  -- Verificar se supplier existe
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RAISE EXCEPTION 'supplier_not_found: Fornecedor não encontrado';
  END IF;

  -- Atualizar status do supplier (apenas se estiver pending)
  UPDATE public.suppliers
  SET 
    status = 'approved',
    approved_at = now(),
    updated_at = now()
  WHERE id = p_supplier_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'supplier_already_processed: Fornecedor não encontrado ou já aprovado/rejeitado';
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
    role = 'supplier',
    updated_at = now();

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função para aprovar fornecedor. APENAS service_role pode executar. Verifica JWT explicitamente. Requer supplier_id e user_id válidos.';

-- Garantir que apenas service_role pode executar (revogar anon/authenticated)
REVOKE EXECUTE ON FUNCTION public.approve_supplier(UUID, UUID) FROM anon, authenticated;

-- ============================================================
-- 3. HARDENING: register_supplier — Forçar status='pending' sempre
-- ============================================================

-- Garantir que coluna cnpj_normalized existe (se não existir, criar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'suppliers' 
      AND column_name = 'cnpj_normalized'
  ) THEN
    ALTER TABLE public.suppliers ADD COLUMN cnpj_normalized TEXT;
    
    -- Preencher valores existentes
    UPDATE public.suppliers
    SET cnpj_normalized = regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g')
    WHERE cnpj_normalized IS NULL;
    
    -- Criar índice único
    CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_cnpj_normalized_unique 
    ON public.suppliers(cnpj_normalized) 
    WHERE cnpj_normalized IS NOT NULL AND cnpj_normalized != '';
  END IF;
END $$;

-- Remover função antiga
DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) CASCADE;

-- Recriar função com status sempre 'pending'
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
SET search_path = public, auth
AS $$
DECLARE
  v_slug TEXT;
  v_supplier_id UUID;
  v_user_id_final UUID;
  v_cnpj_normalized TEXT;
BEGIN
  -- Validar inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'name_required: Nome da empresa é obrigatório';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'email_required: E-mail é obrigatório';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório para vincular o fornecedor';
  END IF;

  -- Normalizar CNPJ (remover caracteres não numéricos)
  v_cnpj_normalized := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
  IF p_cnpj IS NOT NULL AND LENGTH(v_cnpj_normalized) != 14 THEN
    RAISE EXCEPTION 'cnpj_invalid: CNPJ deve conter 14 dígitos numéricos';
  END IF;

  -- Verificar duplicidade de CNPJ (usando normalizado)
  IF v_cnpj_normalized IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE cnpj_normalized = v_cnpj_normalized
  ) THEN
    RAISE EXCEPTION 'cnpj_already_registered: Este CNPJ já está cadastrado';
  END IF;

  -- Verificar duplicidade de email (normalizado)
  IF EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE email = trim(lower(p_email))
  ) THEN
    RAISE EXCEPTION 'email_already_registered: Este e-mail já está cadastrado';
  END IF;

  -- Gerar slug do nome
  v_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi'));
  v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
  
  -- Garantir unicidade do slug
  WHILE EXISTS (SELECT 1 FROM public.suppliers WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || floor(random() * 1000)::text;
  END LOOP;

  -- Usar user_id fornecido
  v_user_id_final := p_user_id;

  -- Criar ou atualizar supplier (status SEMPRE 'pending' no cadastro self-service)
  INSERT INTO public.suppliers (
    name,
    slug,
    email,
    phone,
    cnpj,
    cnpj_normalized,
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
    v_cnpj_normalized,
    COALESCE(p_service_states, '{}'),
    COALESCE(p_product_categories, '{}'),
    'pending', -- SEMPRE pending no cadastro self-service
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    cnpj = EXCLUDED.cnpj,
    cnpj_normalized = EXCLUDED.cnpj_normalized,
    service_states = EXCLUDED.service_states,
    product_categories = EXCLUDED.product_categories,
    status = 'pending', -- FORÇAR pending mesmo em ON CONFLICT (não manter approved)
    updated_at = now()
  RETURNING id INTO v_supplier_id;

  -- Criar vínculo supplier_users automaticamente (mesmo com status='pending')
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
      role = 'supplier',
      updated_at = now();
  END IF;

  -- Confirmar email automaticamente (MVP - não exigir confirmação manual)
  IF v_user_id_final IS NOT NULL THEN
    BEGIN
      UPDATE auth.users
      SET email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE id = v_user_id_final
        AND email_confirmed_at IS NULL;
    EXCEPTION
      WHEN OTHERS THEN
        -- Se falhar, apenas logar (não quebrar o cadastro)
        RAISE WARNING 'Não foi possível confirmar email automaticamente: %', SQLERRM;
    END;
  END IF;

  RETURN v_supplier_id;
END;
$$;

COMMENT ON FUNCTION public.register_supplier IS 
'Função RPC para cadastro público de fornecedores. SEMPRE cria/atualiza com status=pending. Requer aprovação manual via approve_supplier.';

-- Manter permissões públicas (cadastro self-service)
GRANT EXECUTE ON FUNCTION public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) TO anon, authenticated;

-- ============================================================
-- 4. GARANTIR: supplier_pending_registrations não é pública
-- ============================================================

-- Revogar acesso público (se ainda não foi revogado)
REVOKE SELECT ON public.supplier_pending_registrations FROM anon, authenticated;

-- Comentário de documentação
COMMENT ON VIEW public.supplier_pending_registrations IS 
'View auxiliar para listar fornecedores pendentes de aprovação. APENAS service_role pode acessar. Não deve ser consultada por anon/authenticated.';
