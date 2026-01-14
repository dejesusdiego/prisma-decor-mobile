-- =====================================================
-- FIX: Garantir que user_roles funciona corretamente
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_manage" ON public.user_roles;

-- Política simples e direta: usuário pode ler sua própria role
CREATE POLICY "user_roles_select_own" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_roles';

-- Verificar dados
SELECT * FROM public.user_roles;
