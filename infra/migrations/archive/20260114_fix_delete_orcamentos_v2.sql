-- =============================================
-- FIX V2: Política de DELETE mais robusta para orcamentos
-- =============================================

-- A política anterior depende de get_user_organization_id() que pode retornar NULL
-- Vamos criar uma política que verifica diretamente sem depender da função

DROP POLICY IF EXISTS "Org users can delete orcamentos" ON orcamentos;

-- Nova política: permite deletar se:
-- 1. O usuário criou o orçamento (created_by_user_id = auth.uid()), OU
-- 2. O usuário está na mesma organização do orçamento (verificação direta)
CREATE POLICY "Org users can delete orcamentos" ON orcamentos
  FOR DELETE TO authenticated
  USING (
    -- Opção 1: Usuário criou o orçamento
    created_by_user_id = auth.uid()
    OR
    -- Opção 2: Usuário está na mesma organização (verificação direta sem função)
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = orcamentos.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Comentário
COMMENT ON POLICY "Org users can delete orcamentos" ON orcamentos IS 
  'Permite deletar orçamentos criados pelo usuário ou se o usuário está na mesma organização do orçamento.';
