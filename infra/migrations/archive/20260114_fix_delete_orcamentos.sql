-- =============================================
-- FIX: Corrigir política de DELETE para orcamentos
-- =============================================

-- A política atual pode estar falhando se get_user_organization_id() retornar NULL
-- Vamos criar uma política mais robusta que também permite deletar se o usuário criou o orçamento

DROP POLICY IF EXISTS "Org users can delete orcamentos" ON orcamentos;

-- Nova política: permite deletar se:
-- 1. O orçamento pertence à organização do usuário, OU
-- 2. O usuário criou o orçamento (created_by_user_id)
CREATE POLICY "Org users can delete orcamentos" ON orcamentos
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_organization_id() 
    OR created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = orcamentos.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Comentário
COMMENT ON POLICY "Org users can delete orcamentos" ON orcamentos IS 
  'Permite deletar orçamentos da própria organização, criados pelo usuário, ou se for owner/admin';
