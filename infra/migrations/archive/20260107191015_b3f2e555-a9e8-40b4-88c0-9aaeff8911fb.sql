-- =====================================================
-- FASE 2: ADICIONAR organization_id ÀS TABELAS TRANSACIONAIS
-- =====================================================

-- 2.1 Adicionar coluna organization_id às tabelas principais
ALTER TABLE public.orcamentos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contatos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.pedidos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.oportunidades ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.atividades_crm ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contas_receber ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contas_pagar ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.lancamentos_financeiros ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.comissoes ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.solicitacoes_visita ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.notificacoes ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 2.2 Criar índices para performance
CREATE INDEX idx_orcamentos_org ON public.orcamentos(organization_id);
CREATE INDEX idx_contatos_org ON public.contatos(organization_id);
CREATE INDEX idx_pedidos_org ON public.pedidos(organization_id);
CREATE INDEX idx_oportunidades_org ON public.oportunidades(organization_id);
CREATE INDEX idx_atividades_crm_org ON public.atividades_crm(organization_id);
CREATE INDEX idx_contas_receber_org ON public.contas_receber(organization_id);
CREATE INDEX idx_contas_pagar_org ON public.contas_pagar(organization_id);
CREATE INDEX idx_lancamentos_org ON public.lancamentos_financeiros(organization_id);

-- =====================================================
-- FASE 2.3: ATUALIZAR RLS POLICIES PARA MULTI-TENANT
-- =====================================================

-- ORCAMENTOS: Drop existing policies and create new ones
DROP POLICY IF EXISTS "Users can view own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can create orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can update own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can delete own orcamentos" ON public.orcamentos;

CREATE POLICY "Org users can view orcamentos" ON public.orcamentos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create orcamentos" ON public.orcamentos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update orcamentos" ON public.orcamentos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete orcamentos" ON public.orcamentos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- CONTATOS: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can create contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can update own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can delete own contatos" ON public.contatos;

CREATE POLICY "Org users can view contatos" ON public.contatos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create contatos" ON public.contatos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update contatos" ON public.contatos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete contatos" ON public.contatos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- PEDIDOS: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can create pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can update own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can delete own pedidos" ON public.pedidos;

CREATE POLICY "Org users can view pedidos" ON public.pedidos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create pedidos" ON public.pedidos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update pedidos" ON public.pedidos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete pedidos" ON public.pedidos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- OPORTUNIDADES: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can create oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can update own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can delete own oportunidades" ON public.oportunidades;

CREATE POLICY "Org users can view oportunidades" ON public.oportunidades
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create oportunidades" ON public.oportunidades
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update oportunidades" ON public.oportunidades
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete oportunidades" ON public.oportunidades
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- ATIVIDADES_CRM: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own atividades" ON public.atividades_crm;
DROP POLICY IF EXISTS "Users can create atividades" ON public.atividades_crm;
DROP POLICY IF EXISTS "Users can update own atividades" ON public.atividades_crm;
DROP POLICY IF EXISTS "Users can delete own atividades" ON public.atividades_crm;

CREATE POLICY "Org users can view atividades_crm" ON public.atividades_crm
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create atividades_crm" ON public.atividades_crm
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update atividades_crm" ON public.atividades_crm
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete atividades_crm" ON public.atividades_crm
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- CONTAS_RECEBER: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can create contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can update own contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can delete own contas_receber" ON public.contas_receber;

CREATE POLICY "Org users can view contas_receber" ON public.contas_receber
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create contas_receber" ON public.contas_receber
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update contas_receber" ON public.contas_receber
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete contas_receber" ON public.contas_receber
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- CONTAS_PAGAR: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can create contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can update own contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can delete own contas_pagar" ON public.contas_pagar;

CREATE POLICY "Org users can view contas_pagar" ON public.contas_pagar
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create contas_pagar" ON public.contas_pagar
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update contas_pagar" ON public.contas_pagar
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete contas_pagar" ON public.contas_pagar
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- LANCAMENTOS_FINANCEIROS: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Users can create lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Users can update own lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Users can delete own lancamentos" ON public.lancamentos_financeiros;

CREATE POLICY "Org users can view lancamentos" ON public.lancamentos_financeiros
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create lancamentos" ON public.lancamentos_financeiros
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update lancamentos" ON public.lancamentos_financeiros
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete lancamentos" ON public.lancamentos_financeiros
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- COMISSOES: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own comissoes" ON public.comissoes;
DROP POLICY IF EXISTS "Users can create comissoes" ON public.comissoes;
DROP POLICY IF EXISTS "Users can update own comissoes" ON public.comissoes;

CREATE POLICY "Org users can view comissoes" ON public.comissoes
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create comissoes" ON public.comissoes
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update comissoes" ON public.comissoes
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- SOLICITACOES_VISITA: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view solicitacoes" ON public.solicitacoes_visita;
DROP POLICY IF EXISTS "Users can update solicitacoes" ON public.solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacao" ON public.solicitacoes_visita;

CREATE POLICY "Org users can view solicitacoes_visita" ON public.solicitacoes_visita
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update solicitacoes_visita" ON public.solicitacoes_visita
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Anyone can create solicitacao_visita" ON public.solicitacoes_visita
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- NOTIFICACOES: Multi-tenant policies (user-specific + org)
DROP POLICY IF EXISTS "Users can view own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can update own notificacoes" ON public.notificacoes;

CREATE POLICY "Users can view own notificacoes" ON public.notificacoes
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (organization_id = public.get_user_organization_id() OR organization_id IS NULL));

CREATE POLICY "Users can update own notificacoes" ON public.notificacoes
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (organization_id = public.get_user_organization_id() OR organization_id IS NULL));