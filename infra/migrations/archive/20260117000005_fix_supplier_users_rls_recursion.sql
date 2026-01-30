-- ============================================================
-- FIX: Recursão infinita na política RLS de supplier_users
-- ============================================================
-- Data: 2026-01-17
-- Problema: Política "Suppliers can view own users" causa recursão infinita
-- porque verifica supplier_users dentro de uma query que já acessa supplier_users
-- ============================================================

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Suppliers can view own users" ON public.supplier_users;

-- Criar política simplificada SEM recursão
-- Usuário pode ver apenas seu próprio vínculo (user_id = auth.uid())
CREATE POLICY "Suppliers can view own users"
  ON public.supplier_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Remover política de organizações que também pode causar recursão
DROP POLICY IF EXISTS "Organizations can view their suppliers" ON public.supplier_users;

-- Criar política para organizações usando função SECURITY DEFINER (sem recursão)
-- Organizações podem ver supplier_users de fornecedores vinculados
CREATE POLICY "Organizations can view linked supplier users"
  ON public.supplier_users
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND so.active = true
    )
  );

COMMENT ON POLICY "Suppliers can view own users" ON public.supplier_users IS 
'Permite que fornecedores vejam apenas seu próprio vínculo (user_id = auth.uid()). Sem recursão.';

COMMENT ON POLICY "Organizations can view linked supplier users" ON public.supplier_users IS 
'Permite que organizações vejam supplier_users de fornecedores vinculados. Usa join direto sem recursão.';
