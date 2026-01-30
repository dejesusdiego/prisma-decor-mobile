-- 1. Corrigir função get_user_organization_id com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 2. Remover políticas problemáticas de organization_members
DROP POLICY IF EXISTS "Users can view members of their organization" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;

-- 3. Criar políticas que não causam recursão (usando auth.uid() diretamente)
CREATE POLICY "Users can view own membership" 
ON organization_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view org members same org" 
ON organization_members FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om 
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can manage members" 
ON organization_members FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);