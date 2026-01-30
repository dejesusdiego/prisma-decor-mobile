-- ============================================================
-- SUPPLIER SELF-SERVICE HARDENING
-- ============================================================
-- Migration incremental para hardening do fluxo de cadastro
-- e aprovação de fornecedores
-- Data: 2026-01-17
-- ============================================================

-- ============================================================
-- 1. TRAVAR approve_supplier (service role / platform admin)
-- ============================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.approve_supplier(UUID, UUID) CASCADE;

-- Recriar função com verificação de autorização
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
  v_is_platform_admin BOOLEAN := false;
BEGIN
  -- Verificar role do JWT (service_role ou authenticated)
  -- Nota: Em ambiente de produção, isso pode retornar NULL se não houver JWT
  -- Nesse caso, verificar via service_role diretamente
  BEGIN
    v_jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION
    WHEN OTHERS THEN
      v_jwt_role := NULL;
  END;
  
  -- Se não conseguir ler do JWT, verificar se é service_role via outra forma
  IF v_jwt_role IS NULL THEN
    -- Tentar verificar se está executando como service_role
    -- (service_role tem privilégios elevados)
    -- Se não conseguir determinar, negar por segurança
    v_jwt_role := 'authenticated'; -- Default para negar
  END IF;
  
  -- Verificar se é service_role (service key)
  IF v_jwt_role = 'service_role' THEN
    -- Autorizado - continuar
  ELSE
    -- Verificar se é platform admin (opcional - se existir mecanismo)
    -- Por enquanto, apenas service_role é permitido
    -- Se no futuro houver tabela de platform_admins, adicionar verificação aqui
    
    -- Se não for service_role, negar acesso
    RAISE EXCEPTION 'not_authorized: Apenas service_role pode aprovar fornecedores';
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

  -- Atualizar status do supplier
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
    role = 'supplier';

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função para aprovar fornecedor. Apenas service_role pode executar. Requer supplier_id e user_id válidos.';

-- Remover permissões públicas (se existirem)
REVOKE EXECUTE ON FUNCTION public.approve_supplier(UUID, UUID) FROM anon, authenticated;

-- Garantir que apenas service_role pode executar
-- (service_role já tem acesso por padrão via SECURITY DEFINER)

-- ============================================================
-- 2. REMOVER/FECHAR acesso público à view supplier_pending_registrations
-- ============================================================

-- Revogar acesso público
REVOKE SELECT ON public.supplier_pending_registrations FROM anon, authenticated;

-- Garantir que apenas service_role pode acessar
-- (service_role já tem acesso por padrão)

COMMENT ON VIEW public.supplier_pending_registrations IS 
'View auxiliar para listar fornecedores pendentes de aprovação. Acesso restrito a service_role (admin manual via Supabase Dashboard).';

-- ============================================================
-- 3. SANITY-CHECK no register_supplier
-- ============================================================

-- Criar índices únicos para CNPJ e email (normalizados)
-- Primeiro, criar coluna auxiliar para CNPJ normalizado (apenas dígitos)
DO $$
BEGIN
  -- Adicionar coluna para CNPJ normalizado se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'suppliers' 
    AND column_name = 'cnpj_normalized'
  ) THEN
    ALTER TABLE public.suppliers 
    ADD COLUMN cnpj_normalized TEXT;
    
    -- Normalizar CNPJs existentes
    UPDATE public.suppliers
    SET cnpj_normalized = regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g')
    WHERE cnpj IS NOT NULL;
    
    -- Criar índice único para CNPJ normalizado
    CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_cnpj_normalized_unique 
    ON public.suppliers(cnpj_normalized) 
    WHERE cnpj_normalized IS NOT NULL AND cnpj_normalized != '';
    
    COMMENT ON COLUMN public.suppliers.cnpj_normalized IS 
    'CNPJ normalizado (apenas dígitos) para validação de unicidade';
  END IF;
END $$;

-- Criar índice único para email (já normalizado na função)
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_email_unique 
ON public.suppliers(lower(trim(email))) 
WHERE email IS NOT NULL AND email != '';

-- Remover função antiga
DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) CASCADE;

-- Recriar função com sanity-checks
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
  v_email_normalized TEXT;
  v_slug_counter INT := 0;
  v_max_slug_attempts INT := 100;
BEGIN
  -- ============================================================
  -- VALIDAÇÃO DE INPUTS
  -- ============================================================
  
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'name_required: Nome da empresa é obrigatório';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'email_required: E-mail é obrigatório';
  END IF;

  -- Normalizar email (lowercase + trim)
  v_email_normalized := lower(trim(p_email));
  
  -- Validar formato básico de email
  IF v_email_normalized !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'email_invalid: Formato de e-mail inválido';
  END IF;

  -- Normalizar CNPJ (apenas dígitos)
  IF p_cnpj IS NOT NULL AND trim(p_cnpj) != '' THEN
    v_cnpj_normalized := regexp_replace(trim(p_cnpj), '[^0-9]', '', 'g');
    
    -- Validar tamanho do CNPJ (14 dígitos)
    IF length(v_cnpj_normalized) != 14 AND length(v_cnpj_normalized) != 0 THEN
      RAISE EXCEPTION 'cnpj_invalid: CNPJ deve ter 14 dígitos';
    END IF;
  ELSE
    v_cnpj_normalized := NULL;
  END IF;

  -- ============================================================
  -- ANTI-DUPLICIDADE: Verificar CNPJ
  -- ============================================================
  
  IF v_cnpj_normalized IS NOT NULL AND v_cnpj_normalized != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.suppliers 
      WHERE cnpj_normalized = v_cnpj_normalized
    ) THEN
      RAISE EXCEPTION 'cnpj_already_registered: CNPJ já cadastrado';
    END IF;
  END IF;

  -- ============================================================
  -- ANTI-DUPLICIDADE: Verificar Email
  -- ============================================================
  
  IF EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE lower(trim(email)) = v_email_normalized
  ) THEN
    RAISE EXCEPTION 'email_already_registered: E-mail já cadastrado';
  END IF;

  -- ============================================================
  -- GERAR SLUG ÚNICO
  -- ============================================================
  
  v_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi'));
  v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
  
  -- Garantir unicidade do slug com sufixo incremental
  WHILE EXISTS (SELECT 1 FROM public.suppliers WHERE slug = v_slug) AND v_slug_counter < v_max_slug_attempts LOOP
    v_slug_counter := v_slug_counter + 1;
    v_slug := regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi') || '-' || v_slug_counter::text;
    v_slug := lower(regexp_replace(v_slug, '^-|-$', '', 'g'));
  END LOOP;

  IF v_slug_counter >= v_max_slug_attempts THEN
    RAISE EXCEPTION 'slug_generation_failed: Não foi possível gerar slug único após múltiplas tentativas';
  END IF;

  -- ============================================================
  -- OBTER USER_ID
  -- ============================================================
  
  v_user_id_final := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id_final IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório (fornecido ou via auth)';
  END IF;

  -- ============================================================
  -- INSERIR SUPPLIER (STATUS SEMPRE 'pending')
  -- ============================================================
  
  INSERT INTO public.suppliers (
    name,
    slug,
    email,
    phone,
    cnpj,
    cnpj_normalized,
    service_states,
    product_categories,
    status,  -- SEMPRE 'pending' (não aceitar input)
    active
  ) VALUES (
    trim(p_name),
    v_slug,
    v_email_normalized,
    CASE WHEN p_phone IS NOT NULL AND trim(p_phone) != '' THEN trim(p_phone) ELSE NULL END,
    CASE WHEN p_cnpj IS NOT NULL AND trim(p_cnpj) != '' THEN trim(p_cnpj) ELSE NULL END,
    v_cnpj_normalized,
    COALESCE(p_service_states, '{}'),
    COALESCE(p_product_categories, '{}'),
    'pending',  -- FORÇAR status 'pending' (ignorar qualquer input)
    true
  )
  RETURNING id INTO v_supplier_id;

  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'insert_failed: Erro ao inserir fornecedor';
  END IF;

  -- ============================================================
  -- CRIAR VÍNCULO supplier_users
  -- ============================================================
  
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

  -- ============================================================
  -- CONFIRMAR EMAIL AUTOMATICAMENTE (SEM CONFIRMAÇÃO POR EMAIL)
  -- ============================================================
  -- Como temos aprovação manual de fornecedores, não precisamos
  -- de confirmação de email. Confirmamos automaticamente aqui.
  
  IF v_user_id_final IS NOT NULL THEN
    BEGIN
      -- Confirmar email imediatamente (não requer confirmação por email)
      UPDATE auth.users
      SET email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE id = v_user_id_final
        AND email_confirmed_at IS NULL;
        
      -- Se a atualização não funcionar (por questões de segurança do Supabase),
      -- o usuário ainda poderá fazer login se a confirmação de email estiver
      -- desabilitada no Dashboard do Supabase
    EXCEPTION
      WHEN OTHERS THEN
        -- Se falhar, apenas logar (não quebrar o cadastro)
        -- Nota: Se isso falhar, o usuário precisará que a confirmação de email
        -- esteja desabilitada no Supabase Dashboard
        RAISE WARNING 'Não foi possível confirmar email automaticamente: %. Certifique-se de que a confirmação de email está desabilitada no Supabase Dashboard.', SQLERRM;
    END;
  END IF;

  RETURN v_supplier_id;
END;
$$;

COMMENT ON FUNCTION public.register_supplier IS 
'Função RPC para cadastro público de fornecedores. 
- Status sempre "pending" (não aceita input)
- Normaliza CNPJ (apenas dígitos) e email (lowercase/trim)
- Bloqueia duplicidade por CNPJ e email
- Gera slug único com sufixo incremental
- Requer aprovação manual via approve_supplier (service_role)';

-- Manter permissão pública para cadastro (anon/authenticated)
GRANT EXECUTE ON FUNCTION public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) TO anon, authenticated;

-- ============================================================
-- TRIGGER PARA MANTER cnpj_normalized ATUALIZADO
-- ============================================================

-- Criar função para atualizar cnpj_normalized automaticamente
CREATE OR REPLACE FUNCTION public.update_supplier_cnpj_normalized()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.cnpj IS NOT NULL AND trim(NEW.cnpj) != '' THEN
    NEW.cnpj_normalized := regexp_replace(trim(NEW.cnpj), '[^0-9]', '', 'g');
  ELSE
    NEW.cnpj_normalized := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_supplier_cnpj_normalized ON public.suppliers;
CREATE TRIGGER trigger_update_supplier_cnpj_normalized
  BEFORE INSERT OR UPDATE OF cnpj ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_cnpj_normalized();

COMMENT ON FUNCTION public.update_supplier_cnpj_normalized IS 
'Trigger para manter cnpj_normalized atualizado automaticamente quando cnpj é inserido ou atualizado.';
