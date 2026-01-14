-- =====================================================
-- POLÍTICAS RLS FINAIS - VERSÃO CORRIGIDA
-- =====================================================
-- Executa em 2 partes:
-- 1. Limpa todas as políticas
-- 2. Cria novas políticas (apenas para tabelas que existem)
-- =====================================================

-- =====================================================
-- PARTE 1: LIMPAR TODAS AS POLÍTICAS
-- =====================================================

DO $$ 
DECLARE
    tbl TEXT;
    pol RECORD;
    tables_to_clean TEXT[] := ARRAY[
        'organization_members', 'user_onboarding', 'user_roles', 'organizations',
        'orcamentos', 'contatos', 'materiais', 'oportunidades', 'atividades_crm',
        'pedidos', 'itens_pedido', 'instalacoes', 'lancamentos_financeiros',
        'contas_receber', 'contas_pagar', 'parcelas_receber', 'categorias_financeiras',
        'formas_pagamento', 'servicos_confeccao', 'servicos_instalacao',
        'configuracoes_sistema', 'configuracoes_comissao', 'notificacoes',
        'solicitacoes_visita', 'plans', 'subscriptions', 'comissoes',
        'cortina_items', 'historico_producao', 'log_alteracoes_status',
        'comprovantes_pagamento', 'historico_descontos', 'materiais_pedido',
        'extratos_bancarios', 'movimentacoes_extrato', 'padroes_conciliacao',
        'regras_conciliacao', 'organization_usage', 'subscription_payments', 'super_admins'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_to_clean
    LOOP
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Políticas removidas';
END $$;

-- =====================================================
-- PARTE 2: FUNÇÃO AUXILIAR
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT om.organization_id 
  FROM public.organization_members om
  WHERE om.user_id = auth.uid() 
  LIMIT 1;
$$;

-- =====================================================
-- PARTE 3: TABELAS BASE (sem get_user_organization_id)
-- =====================================================

-- organization_members
CREATE POLICY "org_members_select" ON public.organization_members 
  FOR SELECT TO authenticated 
  USING (organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()));

CREATE POLICY "org_members_insert" ON public.organization_members 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.uid() AND om.role = 'owner' AND om.organization_id = organization_id));

CREATE POLICY "org_members_update" ON public.organization_members 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.uid() AND om.role = 'owner'));

CREATE POLICY "org_members_delete" ON public.organization_members 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.uid() AND om.role = 'owner'));

-- user_onboarding
CREATE POLICY "user_onboarding_all" ON public.user_onboarding 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_roles
CREATE POLICY "user_roles_select" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_manage" ON public.user_roles 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- organizations
CREATE POLICY "organizations_select" ON public.organizations 
  FOR SELECT TO authenticated 
  USING (id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()));

CREATE POLICY "organizations_update" ON public.organizations 
  FOR UPDATE TO authenticated 
  USING (id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid() AND om.role = 'owner'));

-- =====================================================
-- PARTE 4: TABELAS COM organization_id
-- =====================================================

-- orcamentos
CREATE POLICY "orcamentos_all" ON public.orcamentos 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- contatos
CREATE POLICY "contatos_all" ON public.contatos 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- materiais
CREATE POLICY "materiais_all" ON public.materiais 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- oportunidades
CREATE POLICY "oportunidades_all" ON public.oportunidades 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- atividades_crm
CREATE POLICY "atividades_crm_all" ON public.atividades_crm 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- pedidos
CREATE POLICY "pedidos_all" ON public.pedidos 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- lancamentos_financeiros
CREATE POLICY "lancamentos_all" ON public.lancamentos_financeiros 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- contas_receber
CREATE POLICY "contas_receber_all" ON public.contas_receber 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- contas_pagar
CREATE POLICY "contas_pagar_all" ON public.contas_pagar 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- categorias_financeiras
CREATE POLICY "categorias_all" ON public.categorias_financeiras 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- formas_pagamento
CREATE POLICY "formas_pagamento_all" ON public.formas_pagamento 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- servicos_confeccao
CREATE POLICY "servicos_confeccao_all" ON public.servicos_confeccao 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- servicos_instalacao
CREATE POLICY "servicos_instalacao_all" ON public.servicos_instalacao 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- configuracoes_sistema
CREATE POLICY "config_sistema_all" ON public.configuracoes_sistema 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- configuracoes_comissao
CREATE POLICY "config_comissao_all" ON public.configuracoes_comissao 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- comissoes
CREATE POLICY "comissoes_all" ON public.comissoes 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- notificacoes
CREATE POLICY "notificacoes_all" ON public.notificacoes 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- solicitacoes_visita
CREATE POLICY "visita_insert_public" ON public.solicitacoes_visita 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "visita_select_org" ON public.solicitacoes_visita 
  FOR SELECT TO authenticated 
  USING (organization_id IS NULL OR organization_id = get_user_organization_id());

CREATE POLICY "visita_update_org" ON public.solicitacoes_visita 
  FOR UPDATE TO authenticated 
  USING (organization_id IS NULL OR organization_id = get_user_organization_id());

CREATE POLICY "visita_delete_org" ON public.solicitacoes_visita 
  FOR DELETE TO authenticated 
  USING (organization_id = get_user_organization_id());

-- plans
CREATE POLICY "plans_public" ON public.plans 
  FOR SELECT TO anon, authenticated 
  USING (ativo = true);

-- subscriptions
CREATE POLICY "subscriptions_all" ON public.subscriptions 
  FOR ALL TO authenticated 
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- PARTE 5: TABELAS FILHO (via JOIN) - COM VERIFICAÇÃO
-- =====================================================

-- cortina_items (referencia orcamentos.id via orcamento_id)
CREATE POLICY "cortina_items_all" ON public.cortina_items 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.organization_id = get_user_organization_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.organization_id = get_user_organization_id()));

-- parcelas_receber (referencia contas_receber.id via conta_receber_id)
CREATE POLICY "parcelas_all" ON public.parcelas_receber 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.contas_receber c WHERE c.id = conta_receber_id AND c.organization_id = get_user_organization_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contas_receber c WHERE c.id = conta_receber_id AND c.organization_id = get_user_organization_id()));

-- itens_pedido (referencia pedidos.id via pedido_id)
CREATE POLICY "itens_pedido_all" ON public.itens_pedido 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id()));

-- instalacoes (referencia pedidos.id via pedido_id)
CREATE POLICY "instalacoes_all" ON public.instalacoes 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id()));

-- historico_producao (referencia pedidos.id via pedido_id)
CREATE POLICY "historico_producao_all" ON public.historico_producao 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id()));

-- log_alteracoes_status (referencia orcamentos.id via orcamento_id)
CREATE POLICY "log_status_all" ON public.log_alteracoes_status 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.organization_id = get_user_organization_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.organization_id = get_user_organization_id()));

-- historico_descontos (referencia orcamentos.id via orcamento_id)
CREATE POLICY "historico_descontos_all" ON public.historico_descontos 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.organization_id = get_user_organization_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.organization_id = get_user_organization_id()));

-- =====================================================
-- PARTE 6: TABELAS OPCIONAIS (ignorar erros se não existirem)
-- =====================================================

-- materiais_pedido
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'materiais_pedido' AND table_schema = 'public';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "materiais_pedido_all" ON public.materiais_pedido FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.organization_id = get_user_organization_id()))';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- comprovantes_pagamento
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'comprovantes_pagamento' AND table_schema = 'public';
  IF FOUND THEN
    -- Verificar se a coluna correta existe
    PERFORM 1 FROM information_schema.columns 
    WHERE table_name = 'comprovantes_pagamento' AND column_name = 'conta_receber_id';
    IF FOUND THEN
      EXECUTE 'CREATE POLICY "comprovantes_all" ON public.comprovantes_pagamento FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.contas_receber c WHERE c.id = conta_receber_id AND c.organization_id = get_user_organization_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.contas_receber c WHERE c.id = conta_receber_id AND c.organization_id = get_user_organization_id()))';
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- extratos_bancarios
DO $$ BEGIN
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'extratos_bancarios' AND column_name = 'organization_id';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "extratos_bancarios_all" ON public.extratos_bancarios FOR ALL TO authenticated USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id())';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- movimentacoes_extrato
DO $$ BEGIN
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'movimentacoes_extrato' AND column_name = 'organization_id';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "movimentacoes_extrato_all" ON public.movimentacoes_extrato FOR ALL TO authenticated USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id())';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- padroes_conciliacao
DO $$ BEGIN
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'padroes_conciliacao' AND column_name = 'organization_id';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "padroes_conciliacao_all" ON public.padroes_conciliacao FOR ALL TO authenticated USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id())';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- regras_conciliacao
DO $$ BEGIN
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'regras_conciliacao' AND column_name = 'organization_id';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "regras_conciliacao_all" ON public.regras_conciliacao FOR ALL TO authenticated USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id())';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- organization_usage
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'organization_usage' AND table_schema = 'public';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "org_usage_all" ON public.organization_usage FOR ALL TO authenticated USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id())';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- subscription_payments
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'subscription_payments' AND table_schema = 'public';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "sub_payments_all" ON public.subscription_payments FOR ALL TO authenticated USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id())';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- super_admins
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'super_admins' AND table_schema = 'public';
  IF FOUND THEN
    EXECUTE 'CREATE POLICY "super_admins_select" ON public.super_admins FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =====================================================
-- FIM - VERIFICAÇÃO
-- =====================================================

SELECT tablename, COUNT(*) as policies 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY tablename;
