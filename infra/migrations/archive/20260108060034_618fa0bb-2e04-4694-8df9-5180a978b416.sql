-- Criar função security definer para verificar se usuário atual é owner
CREATE OR REPLACE FUNCTION public.is_current_user_org_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  );
$$;

-- Remover política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members;

-- Recriar política usando funções security definer (sem recursão)
CREATE POLICY "Owners can manage members"
ON public.organization_members
FOR ALL
USING (
  organization_id = get_user_organization_id_direct()
  AND is_current_user_org_owner()
)
WITH CHECK (
  organization_id = get_user_organization_id_direct()
  AND is_current_user_org_owner()
);