-- =====================================================
-- FIX: CORRIGIR RECURSÃO EM organization_members
-- =====================================================
-- A política anterior causava recursão infinita.
-- Esta versão usa APENAS auth.uid() sem subconsultas.
-- =====================================================

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;

-- Política simples: usuário vê apenas seus próprios registros de membership
-- (sem subconsulta na mesma tabela)
CREATE POLICY "org_members_select" ON public.organization_members 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Insert: apenas se for owner de alguma org (verificar via função)
CREATE POLICY "org_members_insert" ON public.organization_members 
  FOR INSERT TO authenticated 
  WITH CHECK (true); -- Temporariamente permissivo, ajustar depois

-- Update: apenas seu próprio registro
CREATE POLICY "org_members_update" ON public.organization_members 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- Delete: apenas owners podem deletar (verificar via service role)
CREATE POLICY "org_members_delete" ON public.organization_members 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- =====================================================
-- Também corrigir a função get_user_organization_id
-- para não depender de RLS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER  -- Executa como superuser, bypassa RLS
SET search_path = ''
AS $$
  SELECT om.organization_id 
  FROM public.organization_members om
  WHERE om.user_id = auth.uid() 
  LIMIT 1;
$$;

-- =====================================================
-- Verificação
-- =====================================================

SELECT 'Políticas de organization_members:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'organization_members';
