-- =====================================================
-- FASE 1: MIGRAR REGISTROS ÓRFÃOS PARA PRISMA
-- =====================================================

-- Atualizar todos os registros sem organization_id para Prisma (ID fixo)
UPDATE atividades_crm SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE categorias_financeiras SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE comissoes SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE configuracoes_sistema SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE contas_pagar SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE contas_receber SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE contatos SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE formas_pagamento SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE lancamentos_financeiros SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE notificacoes SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE oportunidades SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE orcamentos SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE pedidos SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE solicitacoes_visita SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;

-- =====================================================
-- FASE 2: RECRIAR POLÍTICAS RLS SEM CLÁUSULA NULL
-- =====================================================

-- ATIVIDADES_CRM
DROP POLICY IF EXISTS "Org users can view atividades_crm" ON atividades_crm;
DROP POLICY IF EXISTS "Org users can create atividades_crm" ON atividades_crm;
DROP POLICY IF EXISTS "Org users can update atividades_crm" ON atividades_crm;
DROP POLICY IF EXISTS "Org users can delete atividades_crm" ON atividades_crm;

CREATE POLICY "Org users can view atividades_crm" ON atividades_crm
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create atividades_crm" ON atividades_crm
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update atividades_crm" ON atividades_crm
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete atividades_crm" ON atividades_crm
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CATEGORIAS_FINANCEIRAS
DROP POLICY IF EXISTS "Org users can view categorias_financeiras" ON categorias_financeiras;
DROP POLICY IF EXISTS "Org users can manage categorias_financeiras" ON categorias_financeiras;

CREATE POLICY "Org users can view categorias_financeiras" ON categorias_financeiras
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can manage categorias_financeiras" ON categorias_financeiras
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- COMISSOES
DROP POLICY IF EXISTS "Org users can view comissoes" ON comissoes;
DROP POLICY IF EXISTS "Org users can create comissoes" ON comissoes;
DROP POLICY IF EXISTS "Org users can update comissoes" ON comissoes;

CREATE POLICY "Org users can view comissoes" ON comissoes
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create comissoes" ON comissoes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update comissoes" ON comissoes
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CONFIGURACOES_SISTEMA
DROP POLICY IF EXISTS "Org users can view configuracoes_sistema" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Org users can manage configuracoes_sistema" ON configuracoes_sistema;

CREATE POLICY "Org users can view configuracoes_sistema" ON configuracoes_sistema
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can manage configuracoes_sistema" ON configuracoes_sistema
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- CONTAS_PAGAR
DROP POLICY IF EXISTS "Org users can view contas_pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Org users can create contas_pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Org users can update contas_pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Org users can delete contas_pagar" ON contas_pagar;

CREATE POLICY "Org users can view contas_pagar" ON contas_pagar
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create contas_pagar" ON contas_pagar
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update contas_pagar" ON contas_pagar
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete contas_pagar" ON contas_pagar
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CONTAS_RECEBER
DROP POLICY IF EXISTS "Org users can view contas_receber" ON contas_receber;
DROP POLICY IF EXISTS "Org users can create contas_receber" ON contas_receber;
DROP POLICY IF EXISTS "Org users can update contas_receber" ON contas_receber;
DROP POLICY IF EXISTS "Org users can delete contas_receber" ON contas_receber;

CREATE POLICY "Org users can view contas_receber" ON contas_receber
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create contas_receber" ON contas_receber
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update contas_receber" ON contas_receber
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete contas_receber" ON contas_receber
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CONTATOS
DROP POLICY IF EXISTS "Org users can view contatos" ON contatos;
DROP POLICY IF EXISTS "Org users can create contatos" ON contatos;
DROP POLICY IF EXISTS "Org users can update contatos" ON contatos;
DROP POLICY IF EXISTS "Org users can delete contatos" ON contatos;

CREATE POLICY "Org users can view contatos" ON contatos
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create contatos" ON contatos
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update contatos" ON contatos
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete contatos" ON contatos
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- FORMAS_PAGAMENTO
DROP POLICY IF EXISTS "Org users can view formas_pagamento" ON formas_pagamento;
DROP POLICY IF EXISTS "Org users can manage formas_pagamento" ON formas_pagamento;

CREATE POLICY "Org users can view formas_pagamento" ON formas_pagamento
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can manage formas_pagamento" ON formas_pagamento
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- LANCAMENTOS_FINANCEIROS
DROP POLICY IF EXISTS "Org users can view lancamentos_financeiros" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Org users can create lancamentos_financeiros" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Org users can update lancamentos_financeiros" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Org users can delete lancamentos_financeiros" ON lancamentos_financeiros;

CREATE POLICY "Org users can view lancamentos_financeiros" ON lancamentos_financeiros
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create lancamentos_financeiros" ON lancamentos_financeiros
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update lancamentos_financeiros" ON lancamentos_financeiros
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete lancamentos_financeiros" ON lancamentos_financeiros
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- NOTIFICACOES
DROP POLICY IF EXISTS "Org users can view notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Org users can create notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Org users can update notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Org users can delete notificacoes" ON notificacoes;

CREATE POLICY "Org users can view notificacoes" ON notificacoes
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create notificacoes" ON notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update notificacoes" ON notificacoes
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete notificacoes" ON notificacoes
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- OPORTUNIDADES
DROP POLICY IF EXISTS "Org users can view oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Org users can create oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Org users can update oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Org users can delete oportunidades" ON oportunidades;

CREATE POLICY "Org users can view oportunidades" ON oportunidades
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create oportunidades" ON oportunidades
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update oportunidades" ON oportunidades
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete oportunidades" ON oportunidades
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- ORCAMENTOS
DROP POLICY IF EXISTS "Org users can view orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Org users can create orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Org users can update orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Org users can delete orcamentos" ON orcamentos;

CREATE POLICY "Org users can view orcamentos" ON orcamentos
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create orcamentos" ON orcamentos
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update orcamentos" ON orcamentos
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete orcamentos" ON orcamentos
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- PEDIDOS
DROP POLICY IF EXISTS "Org users can view pedidos" ON pedidos;
DROP POLICY IF EXISTS "Org users can create pedidos" ON pedidos;
DROP POLICY IF EXISTS "Org users can update pedidos" ON pedidos;
DROP POLICY IF EXISTS "Org users can delete pedidos" ON pedidos;

CREATE POLICY "Org users can view pedidos" ON pedidos
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create pedidos" ON pedidos
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update pedidos" ON pedidos
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete pedidos" ON pedidos
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- SOLICITACOES_VISITA
DROP POLICY IF EXISTS "Org users can view solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can update solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can delete solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacoes_visita" ON solicitacoes_visita;

CREATE POLICY "Org users can view solicitacoes_visita" ON solicitacoes_visita
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Anyone can create solicitacoes_visita" ON solicitacoes_visita
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Org users can update solicitacoes_visita" ON solicitacoes_visita
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete solicitacoes_visita" ON solicitacoes_visita
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());