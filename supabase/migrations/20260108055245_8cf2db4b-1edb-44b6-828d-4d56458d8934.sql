
-- Criar função security definer para obter organization_id sem recursão
CREATE OR REPLACE FUNCTION public.get_user_organization_id_direct()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Remover política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Users can view org members same org" ON public.organization_members;

-- Criar nova política sem recursão
CREATE POLICY "Users can view org members same org" 
ON public.organization_members
FOR SELECT
USING (
  user_id = auth.uid() 
  OR organization_id = get_user_organization_id_direct()
);

-- Remover política de owners que também pode causar recursão
DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members;

-- Criar nova política de owners sem recursão
CREATE POLICY "Owners can manage members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role = 'owner'
  )
);
