-- =====================================================
-- POLÍTICAS RLS E FUNÇÕES AUXILIARES
-- Exportado em: 2026-01-13
-- Projeto: emmogpqoqfmwtipxwcit (Prisma ERP)
-- =====================================================

-- IMPORTANTE: Execute este arquivo APÓS criar as tabelas (03_SCHEMA_TABLES.sql)
-- e ANTES de inserir dados.

-- =====================================================
-- PARTE 1: FUNÇÕES AUXILIARES (EXECUTAR PRIMEIRO!)
-- =====================================================

-- Tipo enum para roles (se não existir)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Função: get_user_organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
  LIMIT 1
$function$;

-- Função: get_user_organization_id_direct
CREATE OR REPLACE FUNCTION public.get_user_organization_id_direct()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
  LIMIT 1
$function$;

-- Função: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Função: is_current_user_org_owner
CREATE OR REPLACE FUNCTION public.is_current_user_org_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
      AND role = 'owner'
  )
$function$;

-- =====================================================
-- PARTE 2: HABILITAR RLS NAS TABELAS
-- =====================================================

ALTER TABLE public.atividades_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprovantes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_comissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cortina_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_descontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_alteracoes_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_extrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padroes_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_confeccao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_instalacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 3: POLÍTICAS RLS (143 políticas)
-- =====================================================

-- =====================================================
-- TABELA: atividades_crm
-- =====================================================
CREATE POLICY "Authenticated users can create atividades" ON public.atividades_crm AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete atividades from their organization" ON public.atividades_crm AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update atividades from their organization" ON public.atividades_crm AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view atividades from their organization" ON public.atividades_crm AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: categorias_financeiras
-- =====================================================
CREATE POLICY "Authenticated users can create categorias" ON public.categorias_financeiras AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete categorias from their organization" ON public.categorias_financeiras AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update categorias from their organization" ON public.categorias_financeiras AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view categorias from their organization" ON public.categorias_financeiras AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: comissoes
-- =====================================================
CREATE POLICY "Users can create comissoes in their organization" ON public.comissoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can delete comissoes from their organization" ON public.comissoes AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update comissoes in their organization" ON public.comissoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view comissoes from their organization" ON public.comissoes AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: comprovantes_pagamento
-- =====================================================
CREATE POLICY "Users can delete their own comprovantes" ON public.comprovantes_pagamento AS PERMISSIVE FOR DELETE TO authenticated USING ((uploaded_by_user_id = auth.uid()));
CREATE POLICY "Users can insert comprovantes" ON public.comprovantes_pagamento AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view comprovantes from their org" ON public.comprovantes_pagamento AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- =====================================================
-- TABELA: configuracoes_comissao
-- =====================================================
CREATE POLICY "Users can create config comissao in their org" ON public.configuracoes_comissao AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can delete config comissao from their org" ON public.configuracoes_comissao AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update config comissao in their org" ON public.configuracoes_comissao AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view config comissao from their org" ON public.configuracoes_comissao AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: configuracoes_sistema
-- =====================================================
CREATE POLICY "Authenticated users can create configuracoes" ON public.configuracoes_sistema AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete configuracoes from their organization" ON public.configuracoes_sistema AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update configuracoes from their organization" ON public.configuracoes_sistema AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view configuracoes from their organization" ON public.configuracoes_sistema AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: contas_pagar
-- =====================================================
CREATE POLICY "Authenticated users can create contas_pagar" ON public.contas_pagar AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete contas_pagar from their organization" ON public.contas_pagar AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update contas_pagar from their organization" ON public.contas_pagar AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view contas_pagar from their organization" ON public.contas_pagar AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: contas_receber
-- =====================================================
CREATE POLICY "Authenticated users can create contas_receber" ON public.contas_receber AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete contas_receber from their organization" ON public.contas_receber AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update contas_receber from their organization" ON public.contas_receber AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view contas_receber from their organization" ON public.contas_receber AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: contatos
-- =====================================================
CREATE POLICY "Authenticated users can create contatos" ON public.contatos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete contatos from their organization" ON public.contatos AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update contatos from their organization" ON public.contatos AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view contatos from their organization" ON public.contatos AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: cortina_items
-- =====================================================
CREATE POLICY "Authenticated users can create cortina_items" ON public.cortina_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete cortina_items via orcamento org check" ON public.cortina_items AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1 FROM orcamentos WHERE ((orcamentos.id = cortina_items.orcamento_id) AND (orcamentos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can update cortina_items via orcamento org check" ON public.cortina_items AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1 FROM orcamentos WHERE ((orcamentos.id = cortina_items.orcamento_id) AND (orcamentos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can view cortina_items via orcamento org check" ON public.cortina_items AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM orcamentos WHERE ((orcamentos.id = cortina_items.orcamento_id) AND (orcamentos.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: extratos_bancarios
-- =====================================================
CREATE POLICY "Users can create extratos in their org" ON public.extratos_bancarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can delete extratos from their org" ON public.extratos_bancarios AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update extratos in their org" ON public.extratos_bancarios AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view extratos from their org" ON public.extratos_bancarios AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: formas_pagamento
-- =====================================================
CREATE POLICY "Authenticated users can create formas_pagamento" ON public.formas_pagamento AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete formas_pagamento from their organization" ON public.formas_pagamento AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update formas_pagamento from their organization" ON public.formas_pagamento AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view formas_pagamento from their organization" ON public.formas_pagamento AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: historico_descontos
-- =====================================================
CREATE POLICY "Authenticated users can create historico_descontos" ON public.historico_descontos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view historico_descontos via orcamento org" ON public.historico_descontos AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM orcamentos WHERE ((orcamentos.id = historico_descontos.orcamento_id) AND (orcamentos.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: historico_producao
-- =====================================================
CREATE POLICY "Authenticated users can create historico_producao" ON public.historico_producao AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view historico via pedido org check" ON public.historico_producao AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = historico_producao.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: instalacoes
-- =====================================================
CREATE POLICY "Users can create instalacoes via pedido org" ON public.instalacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = instalacoes.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can delete instalacoes via pedido org" ON public.instalacoes AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = instalacoes.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can update instalacoes via pedido org" ON public.instalacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = instalacoes.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can view instalacoes via pedido org" ON public.instalacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = instalacoes.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: itens_pedido
-- =====================================================
CREATE POLICY "Authenticated users can create itens_pedido" ON public.itens_pedido AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete itens via pedido org check" ON public.itens_pedido AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = itens_pedido.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can update itens via pedido org check" ON public.itens_pedido AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = itens_pedido.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can view itens via pedido org check" ON public.itens_pedido AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = itens_pedido.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: lancamentos_financeiros
-- =====================================================
CREATE POLICY "Authenticated users can create lancamentos" ON public.lancamentos_financeiros AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete lancamentos from their organization" ON public.lancamentos_financeiros AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update lancamentos from their organization" ON public.lancamentos_financeiros AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view lancamentos from their organization" ON public.lancamentos_financeiros AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: log_alteracoes_status
-- =====================================================
CREATE POLICY "Authenticated users can create log entries" ON public.log_alteracoes_status AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view logs via orcamento org" ON public.log_alteracoes_status AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM orcamentos WHERE ((orcamentos.id = log_alteracoes_status.orcamento_id) AND (orcamentos.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: materiais
-- =====================================================
CREATE POLICY "Admins can delete materiais" ON public.materiais AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR is_current_user_org_owner()));
CREATE POLICY "Admins can insert materiais" ON public.materiais AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update materiais" ON public.materiais AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR is_current_user_org_owner()));
CREATE POLICY "Users can view materiais from their organization" ON public.materiais AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: materiais_pedido
-- =====================================================
CREATE POLICY "Authenticated users can create materiais_pedido" ON public.materiais_pedido AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete materiais via pedido org" ON public.materiais_pedido AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = materiais_pedido.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can update materiais via pedido org" ON public.materiais_pedido AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = materiais_pedido.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can view materiais via pedido org" ON public.materiais_pedido AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM pedidos WHERE ((pedidos.id = materiais_pedido.pedido_id) AND (pedidos.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: movimentacoes_extrato
-- =====================================================
CREATE POLICY "Users can create movimentacoes in their org" ON public.movimentacoes_extrato AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can delete movimentacoes from their org" ON public.movimentacoes_extrato AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update movimentacoes in their org" ON public.movimentacoes_extrato AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view movimentacoes from their org" ON public.movimentacoes_extrato AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: notificacoes
-- =====================================================
CREATE POLICY "Users can create their own notifications" ON public.notificacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can delete their own notifications" ON public.notificacoes AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can update their own notifications" ON public.notificacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can view their own notifications" ON public.notificacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));

-- =====================================================
-- TABELA: oportunidades
-- =====================================================
CREATE POLICY "Authenticated users can create oportunidades" ON public.oportunidades AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete oportunidades from their organization" ON public.oportunidades AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update oportunidades from their organization" ON public.oportunidades AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view oportunidades from their organization" ON public.oportunidades AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: orcamentos
-- =====================================================
CREATE POLICY "Authenticated users can create orcamentos" ON public.orcamentos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete orcamentos from their organization" ON public.orcamentos AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update orcamentos from their organization" ON public.orcamentos AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view orcamentos from their organization" ON public.orcamentos AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: organization_members
-- =====================================================
CREATE POLICY "Members can view their own membership" ON public.organization_members AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Org owners can delete members" ON public.organization_members AS PERMISSIVE FOR DELETE TO authenticated USING (is_current_user_org_owner());
CREATE POLICY "Org owners can insert members" ON public.organization_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_current_user_org_owner());
CREATE POLICY "Org owners can update members" ON public.organization_members AS PERMISSIVE FOR UPDATE TO authenticated USING (is_current_user_org_owner());
CREATE POLICY "Org owners can view all members" ON public.organization_members AS PERMISSIVE FOR SELECT TO authenticated USING (is_current_user_org_owner());

-- =====================================================
-- TABELA: organization_usage
-- =====================================================
CREATE POLICY "Users can view usage from their organization" ON public.organization_usage AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: organizations
-- =====================================================
CREATE POLICY "Members can view their organization" ON public.organizations AS PERMISSIVE FOR SELECT TO authenticated USING ((id = get_user_organization_id_direct()));
CREATE POLICY "Owners can update their organization" ON public.organizations AS PERMISSIVE FOR UPDATE TO authenticated USING ((id = get_user_organization_id_direct()));

-- =====================================================
-- TABELA: padroes_conciliacao
-- =====================================================
CREATE POLICY "Users can create padroes in their org" ON public.padroes_conciliacao AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can delete padroes from their org" ON public.padroes_conciliacao AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update padroes in their org" ON public.padroes_conciliacao AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view padroes from their org" ON public.padroes_conciliacao AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: parcelas_receber
-- =====================================================
CREATE POLICY "Authenticated users can create parcelas" ON public.parcelas_receber AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete parcelas via conta_receber org" ON public.parcelas_receber AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1 FROM contas_receber WHERE ((contas_receber.id = parcelas_receber.conta_receber_id) AND (contas_receber.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can update parcelas via conta_receber org" ON public.parcelas_receber AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1 FROM contas_receber WHERE ((contas_receber.id = parcelas_receber.conta_receber_id) AND (contas_receber.organization_id = get_user_organization_id())))));
CREATE POLICY "Users can view parcelas via conta_receber org" ON public.parcelas_receber AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM contas_receber WHERE ((contas_receber.id = parcelas_receber.conta_receber_id) AND (contas_receber.organization_id = get_user_organization_id())))));

-- =====================================================
-- TABELA: pedidos
-- =====================================================
CREATE POLICY "Authenticated users can create pedidos" ON public.pedidos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete pedidos from their organization" ON public.pedidos AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update pedidos from their organization" ON public.pedidos AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view pedidos from their organization" ON public.pedidos AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: plans
-- =====================================================
CREATE POLICY "Anyone can view active plans" ON public.plans AS PERMISSIVE FOR SELECT TO authenticated USING ((ativo = true));

-- =====================================================
-- TABELA: regras_conciliacao
-- =====================================================
CREATE POLICY "Users can create regras in their org" ON public.regras_conciliacao AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can delete regras from their org" ON public.regras_conciliacao AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can update regras in their org" ON public.regras_conciliacao AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view regras from their org" ON public.regras_conciliacao AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: servicos_confeccao
-- =====================================================
CREATE POLICY "Admins can delete servicos_confeccao" ON public.servicos_confeccao AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR is_current_user_org_owner()));
CREATE POLICY "Admins can insert servicos_confeccao" ON public.servicos_confeccao AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update servicos_confeccao" ON public.servicos_confeccao AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR is_current_user_org_owner()));
CREATE POLICY "Users can view servicos_confeccao from their org" ON public.servicos_confeccao AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: servicos_instalacao
-- =====================================================
CREATE POLICY "Admins can delete servicos_instalacao" ON public.servicos_instalacao AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR is_current_user_org_owner()));
CREATE POLICY "Admins can insert servicos_instalacao" ON public.servicos_instalacao AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update servicos_instalacao" ON public.servicos_instalacao AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR is_current_user_org_owner()));
CREATE POLICY "Users can view servicos_instalacao from their org" ON public.servicos_instalacao AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: solicitacoes_visita
-- =====================================================
CREATE POLICY "Anyone can create solicitacoes_visita" ON public.solicitacoes_visita AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Authenticated users can update solicitacoes" ON public.solicitacoes_visita AS PERMISSIVE FOR UPDATE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can delete solicitacoes from their org" ON public.solicitacoes_visita AS PERMISSIVE FOR DELETE TO authenticated USING ((organization_id = get_user_organization_id()));
CREATE POLICY "Users can view solicitacoes from their org" ON public.solicitacoes_visita AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: subscriptions
-- =====================================================
CREATE POLICY "Users can view subscriptions from their organization" ON public.subscriptions AS PERMISSIVE FOR SELECT TO authenticated USING ((organization_id = get_user_organization_id()));

-- =====================================================
-- TABELA: user_roles
-- =====================================================
CREATE POLICY "Admins can manage user roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR is_current_user_org_owner()));
CREATE POLICY "Users can view their own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));

-- =====================================================
-- FIM DO ARQUIVO
-- =====================================================
