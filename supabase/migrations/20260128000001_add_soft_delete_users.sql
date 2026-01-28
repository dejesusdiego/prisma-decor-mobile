-- =====================================================
-- T6.7: Soft Delete Usuários - Migration
-- Adiciona coluna deleted_at e atualiza políticas
-- =====================================================

-- 1. Adicionar coluna deleted_at na tabela user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 2. Atualizar RLS policies para filtrar usuários deletados

-- Policy para SELECT: não mostrar usuários deletados
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (
  deleted_at IS NULL 
  AND auth.uid() = user_id
);

-- Policy para SELECT: admins podem ver todos os usuários ativos
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
TO authenticated
USING (
  deleted_at IS NULL 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- 3. Função para soft delete de usuário
CREATE OR REPLACE FUNCTION public.soft_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desativar usuários';
  END IF;

  -- Impedir auto-desativação
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Não é possível desativar seu próprio usuário';
  END IF;

  -- Realizar soft delete
  UPDATE public.user_roles
  SET 
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.soft_delete_user IS 
'Desativa um usuário (soft delete). Apenas admins podem executar.';

-- 4. Função para restaurar usuário
CREATE OR REPLACE FUNCTION public.restore_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem restaurar usuários';
  END IF;

  -- Restaurar usuário
  UPDATE public.user_roles
  SET 
    deleted_at = NULL,
    deleted_by = NULL
  WHERE user_id = p_user_id
    AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.restore_user IS 
'Restaura um usuário previamente desativado. Apenas admins podem executar.';

-- 5. View para listar todos os usuários (ativos e inativos) - apenas para admins
CREATE OR REPLACE VIEW public.v_users_with_status AS
SELECT 
  ur.user_id,
  ur.role,
  ur.created_at,
  ur.deleted_at,
  ur.deleted_by,
  CASE WHEN ur.deleted_at IS NULL THEN 'active' ELSE 'inactive' END as status
FROM public.user_roles ur;

COMMENT ON VIEW public.v_users_with_status IS 
'View que mostra todos os usuários com seu status de ativação';
