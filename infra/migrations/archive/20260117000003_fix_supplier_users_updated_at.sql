-- ============================================================
-- FIX: Remover referência a updated_at em supplier_users
-- ============================================================
-- A tabela supplier_users não possui coluna updated_at
-- Esta migration corrige a função approve_supplier que tentava atualizá-la
-- Data: 2026-01-17
-- ============================================================

-- Recriar função approve_supplier sem referência a updated_at
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
  -- NOTA: supplier_users não possui coluna updated_at, então não tentamos atualizá-la
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
    -- Removido: updated_at = now() (coluna não existe)

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função para aprovar fornecedor. Apenas service_role pode executar. Requer supplier_id e user_id válidos. Corrigida para não referenciar updated_at em supplier_users.';
