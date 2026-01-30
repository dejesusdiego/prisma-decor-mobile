-- =====================================================
-- CONSOLIDAÇÃO: Todas as Migrations do Sprint 7 (CORRIGIDA)
-- Data: 2026-01-29
-- Sprint: 7 - Painel Admin Supremo Parte 1
-- 
-- IMPORTANTE: Esta versão é compatível com o schema existente
-- da tabela subscriptions (usando plan_id em vez de plan_type)
-- =====================================================

-- =====================================================
-- MIGRATION 1: 20260129000000_add_super_admin_role.sql
-- Adiciona role super_admin e schema de subscriptions
-- =====================================================

-- 1. Adicionar valor 'super_admin' ao enum user_role se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'super_admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'super_admin';
        END IF;
    END IF;
END $$;

-- 2. Tabela de Super Admins (se não existir)
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Tabela de Planos (se não existir)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco_mensal DECIMAL(10,2) NOT NULL,
    preco_implementacao DECIMAL(10,2) DEFAULT 0,
    preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90,
    max_usuarios INT NOT NULL,
    max_usuarios_expansivel BOOLEAN DEFAULT true,
    max_orcamentos_mes INT,
    max_storage_gb INT DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    ativo BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    ordem INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Assinaturas - usa schema existente com plan_id
-- NOTA: A tabela já existe de 20260113_planos_assinaturas.sql
-- Apenas garantimos que as colunas necessárias existem

-- Adicionar colunas ASAAS se não existirem
DO $$
BEGIN
    -- Colunas para integração ASAAS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'asaas_customer_id') THEN
        ALTER TABLE subscriptions ADD COLUMN asaas_customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'asaas_subscription_id') THEN
        ALTER TABLE subscriptions ADD COLUMN asaas_subscription_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end') THEN
        ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_start') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_start TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_end') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_end TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'currency') THEN
        ALTER TABLE subscriptions ADD COLUMN currency TEXT DEFAULT 'BRL';
    END IF;
END $$;

-- 5. Tabela de eventos de subscription (histórico)
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'activated', 'renewed', 'cancelled', 'paused', 'resumed',
        'payment_received', 'payment_failed', 'payment_overdue', 'trial_started', 'trial_ended', 'plan_changed'
    )),
    previous_status TEXT,
    new_status TEXT,
    previous_plan TEXT,
    new_plan TEXT,
    amount_cents INTEGER,
    metadata JSONB,
    asaas_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabela de faturas (invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE,
    asaas_invoice_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asaas_payment_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'received', 'overdue', 'cancelled', 'refunded')),
    payment_method TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Inserir planos padrão se não existirem
INSERT INTO plans (codigo, nome, descricao, preco_mensal, preco_implementacao, preco_usuario_adicional, max_usuarios, max_usuarios_expansivel, max_orcamentos_mes, features, ordem, destaque) VALUES
('starter_3', 'Starter', 'Ideal para pequenas empresas começando a organizar seus processos', 
 49900, 300000, 6990, 3, true, 100,
 '["orcamentos", "crm_basico", "producao", "calendario"]'::jsonb,
 1, false),
('pro_10', 'Profissional', 'Para empresas em crescimento que precisam de mais controle',
 89900, 450000, 6990, 10, true, 500,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "calendario"]'::jsonb,
 2, true),
('business_25', 'Business', 'Solução completa para operações de médio porte',
 149900, 700000, 6990, 25, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "calendario", "suporte_prioritario"]'::jsonb,
 3, false),
('enterprise_50', 'Enterprise', 'Máxima performance para grandes operações',
 249900, 1200000, 5990, 50, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "integracao_whatsapp", "api_acesso", "calendario", "suporte_prioritario", "customizacoes"]'::jsonb,
 4, false)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  preco_mensal = EXCLUDED.preco_mensal,
  preco_implementacao = EXCLUDED.preco_implementacao,
  preco_usuario_adicional = EXCLUDED.preco_usuario_adicional,
  max_usuarios = EXCLUDED.max_usuarios,
  max_usuarios_expansivel = EXCLUDED.max_usuarios_expansivel,
  max_orcamentos_mes = EXCLUDED.max_orcamentos_mes,
  features = EXCLUDED.features,
  ordem = EXCLUDED.ordem,
  destaque = EXCLUDED.destaque,
  updated_at = now();

-- 9. Indexes para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas ON subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_events_sub ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created ON subscription_events(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_sub ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_super_admins_user ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_codigo ON plans(codigo);

-- 10. RLS Policies
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies para super_admins
CREATE POLICY "Super admins podem gerenciar super_admins" ON super_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Policies para plans
CREATE POLICY "Todos podem ver planos ativos" ON plans
  FOR SELECT USING (ativo = true);
CREATE POLICY "Super admins gerenciam planos" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Policies para subscriptions (já existem, mas garantimos)
DROP POLICY IF EXISTS "Super admin can manage all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Organization members can view own subscription" ON subscriptions;
CREATE POLICY "Super admin can manage all subscriptions" ON subscriptions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own subscription" ON subscriptions FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Policies para subscription_events
CREATE POLICY "Super admin can manage all subscription events" ON subscription_events FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own subscription events" ON subscription_events FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Policies para invoices
CREATE POLICY "Super admin can manage all invoices" ON invoices FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own invoices" ON invoices FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Policies para payments
CREATE POLICY "Super admin can manage all payments" ON payments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own payments" ON payments FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- 11. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE super_admins IS 'Super administradores da plataforma';
COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE subscription_events IS 'Histórico de eventos das assinaturas';
COMMENT ON TABLE invoices IS 'Faturas das assinaturas';
COMMENT ON TABLE payments IS 'Pagamentos realizados';


-- =====================================================
-- MIGRATION 2: 20260129000001_add_platform_metrics_rpc.sql
-- Adiciona RPCs para métricas da plataforma (ADAPTADO para schema existente)
-- =====================================================

-- Função auxiliar para obter código do plano a partir do subscription
CREATE OR REPLACE FUNCTION get_subscription_plan_code(p_subscription_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_plan_code TEXT;
BEGIN
    SELECT p.codigo INTO v_plan_code
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.id = p_subscription_id;
    RETURN v_plan_code;
END;
$$;

CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS TABLE (mrr BIGINT, arr BIGINT, total_tenants BIGINT, active_tenants BIGINT, churn_rate NUMERIC, avg_ltv NUMERIC, new_this_month BIGINT, canceled_this_month BIGINT, growth_rate NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_mrr BIGINT; v_total_tenants BIGINT; v_active_tenants BIGINT; v_new_this_month BIGINT; v_canceled_this_month BIGINT; v_canceled_last_month BIGINT; v_active_last_month BIGINT; v_churn_rate NUMERIC; v_avg_ltv NUMERIC; v_growth_rate NUMERIC; v_last_month_mrr BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;
  
  -- Calcular MRR baseado no preço mensal dos planos
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.codigo LIKE '%annual%' THEN ROUND(p.preco_mensal / 12.0)
      ELSE p.preco_mensal 
    END::BIGINT
  ), 0) INTO v_current_mrr 
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.status IN ('active', 'trial');
  
  SELECT COUNT(DISTINCT organization_id) INTO v_total_tenants 
  FROM subscriptions 
  WHERE status IN ('active', 'trial', 'cancelled');
  
  SELECT COUNT(DISTINCT organization_id) INTO v_active_tenants 
  FROM subscriptions 
  WHERE status = 'active';
  
  SELECT COUNT(*) INTO v_new_this_month 
  FROM subscription_events 
  WHERE event_type = 'created' AND created_at >= DATE_TRUNC('month', NOW());
  
  SELECT COUNT(*) INTO v_canceled_this_month 
  FROM subscription_events 
  WHERE event_type = 'cancelled' AND created_at >= DATE_TRUNC('month', NOW());
  
  SELECT COUNT(*) INTO v_canceled_last_month 
  FROM subscription_events 
  WHERE event_type = 'cancelled' AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', NOW());
  
  v_active_last_month := v_active_tenants + v_canceled_this_month;
  IF v_active_last_month > 0 THEN v_churn_rate := ROUND((v_canceled_last_month::NUMERIC / v_active_last_month) * 100, 2); ELSE v_churn_rate := 0; END IF;
  
  IF v_total_tenants > 0 AND v_churn_rate > 0 THEN 
    v_avg_ltv := ROUND((v_current_mrr::NUMERIC / v_total_tenants) / (v_churn_rate / 100), 2);
  ELSE 
    v_avg_ltv := COALESCE(v_current_mrr::NUMERIC / NULLIF(v_total_tenants, 0) * 24, 0); 
  END IF;
  
  -- Calcular MRR do mês anterior
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.codigo LIKE '%annual%' THEN ROUND(p.preco_mensal / 12.0)
      ELSE p.preco_mensal 
    END::BIGINT
  ), 0) INTO v_last_month_mrr 
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.status = 'active' 
    AND s.created_at < DATE_TRUNC('month', NOW()) 
    AND (s.cancelled_at IS NULL OR s.cancelled_at >= DATE_TRUNC('month', NOW()));
  
  IF v_last_month_mrr > 0 THEN 
    v_growth_rate := ROUND(((v_current_mrr - v_last_month_mrr)::NUMERIC / v_last_month_mrr) * 100, 2); 
  ELSE 
    v_growth_rate := 0; 
  END IF;
  
  RETURN QUERY SELECT v_current_mrr, v_current_mrr * 12, v_total_tenants, v_active_tenants, v_churn_rate, v_avg_ltv, v_new_this_month, v_canceled_this_month, v_growth_rate;
END;
$$;
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO service_role;

CREATE OR REPLACE FUNCTION get_mrr_history(months_count INTEGER DEFAULT 12)
RETURNS TABLE (month_label TEXT, month_date DATE, mrr_value BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE i INTEGER; target_date DATE; month_mrr BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;
  FOR i IN 0..(months_count - 1) LOOP
    target_date := DATE_TRUNC('month', NOW() - (i || ' months')::INTERVAL)::DATE;
    SELECT COALESCE(SUM(
      CASE 
        WHEN p.codigo LIKE '%annual%' THEN ROUND(p.preco_mensal / 12.0)
        ELSE p.preco_mensal 
      END::BIGINT
    ), 0) INTO month_mrr
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.status = 'active' 
      AND s.created_at <= (target_date + INTERVAL '1 month' - INTERVAL '1 day') 
      AND (s.cancelled_at IS NULL OR s.cancelled_at > target_date);
    month_label := TO_CHAR(target_date, 'Mon YY'); month_date := target_date; mrr_value := month_mrr;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;
GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION get_recent_subscriptions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (subscription_id UUID, organization_id UUID, organization_name TEXT, organization_slug TEXT, plan_code TEXT, status TEXT, price_cents INTEGER, created_at TIMESTAMPTZ, event_type TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;
  RETURN QUERY
  SELECT s.id AS subscription_id, s.organization_id, o.name AS organization_name, o.slug AS organization_slug, 
         p.codigo AS plan_code, s.status, 
         (p.preco_mensal::INTEGER) as price_cents, 
         s.created_at, se.event_type
  FROM subscriptions s 
  JOIN organizations o ON o.id = s.organization_id
  JOIN plans p ON p.id = s.plan_id
  LEFT JOIN LATERAL (SELECT event_type FROM subscription_events WHERE subscription_id = s.id ORDER BY created_at DESC LIMIT 1) se ON true
  ORDER BY s.created_at DESC LIMIT limit_count;
END;
$$;
GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO service_role;

COMMENT ON FUNCTION get_platform_metrics() IS 'Returns platform-wide SaaS metrics (MRR, ARR, churn, LTV) for super admin dashboard. Requires super_admin role.';
COMMENT ON FUNCTION get_mrr_history(INTEGER) IS 'Returns MRR history for the last N months. Requires super_admin role.';
COMMENT ON FUNCTION get_recent_subscriptions(INTEGER) IS 'Returns recent subscriptions with organization details. Requires super_admin role.';


-- =====================================================
-- MIGRATION 3: 20260129000001_fix_admin_domain.sql
-- Adiciona domínio admin.studioos.pro
-- =====================================================

INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.pro', 'admin', NULL, true) ON CONFLICT (hostname) DO NOTHING;
INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.com.br', 'admin', NULL, true) ON CONFLICT (hostname) DO NOTHING;

UPDATE public.domains SET active = true, updated_at = now() WHERE hostname IN ('panel.studioos.pro', 'panel.studioos.com.br');

UPDATE public.domains SET active = true, updated_at = now() WHERE hostname IN (
    'studioos.pro', 'www.studioos.pro', 'studioos.com.br', 'www.studioos.com.br',
    'admin.studioos.pro', 'admin.studioos.com.br',
    'fornecedores.studioos.pro', 'fornecedores.studioos.com.br',
    'app.studioos.pro', 'app.studioos.com.br'
);

COMMENT ON TABLE public.domains IS 'Tabela de domínios para roteamento. admin.studioos.pro = role admin';


-- =====================================================
-- MIGRATION 4: 20260129000002_add_feature_flags.sql
-- Adiciona sistema de feature flags (ADAPTADO para schema existente)
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'general',
  default_value BOOLEAN DEFAULT false,
  plan_values JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  value BOOLEAN NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, feature_flag_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org ON organization_feature_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_feature ON organization_feature_overrides(feature_flag_id);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on feature_flags" ON feature_flags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can read feature_flags" ON feature_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin full access on org_feature_overrides" ON organization_feature_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Org users can read their overrides" ON organization_feature_overrides FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Função auxiliar para obter código do plano da organização
CREATE OR REPLACE FUNCTION get_org_plan_code(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_plan_code TEXT;
BEGIN
    SELECT p.codigo INTO v_plan_code
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.organization_id = p_org_id
      AND s.status IN ('trial', 'active')
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_plan_code, 'starter_3');
END;
$$;

CREATE OR REPLACE FUNCTION check_feature_flag(p_organization_id UUID, p_flag_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_flag_id UUID; v_default_value BOOLEAN; v_plan_values JSONB; v_override_value BOOLEAN; v_org_plan TEXT;
BEGIN
  SELECT id, default_value, plan_values INTO v_flag_id, v_default_value, v_plan_values FROM feature_flags WHERE name = p_flag_name;
  IF v_flag_id IS NULL THEN RETURN false; END IF;
  SELECT value INTO v_override_value FROM organization_feature_overrides WHERE organization_id = p_organization_id AND feature_flag_id = v_flag_id;
  IF v_override_value IS NOT NULL THEN RETURN v_override_value; END IF;
  
  -- Obter plano da organização (código do plano)
  v_org_plan := get_org_plan_code(p_organization_id);
  
  -- Mapear códigos de plano para chaves do plan_values
  -- starter_3 -> starter, pro_10 -> pro, business_25 -> business, enterprise_50 -> enterprise
  v_org_plan := CASE 
    WHEN v_org_plan LIKE 'starter%' THEN 'starter'
    WHEN v_org_plan LIKE 'pro%' THEN 'pro'
    WHEN v_org_plan LIKE 'business%' THEN 'business'
    WHEN v_org_plan LIKE 'enterprise%' THEN 'enterprise'
    ELSE 'starter'
  END;
  
  IF v_plan_values ? v_org_plan THEN RETURN (v_plan_values->>v_org_plan)::BOOLEAN; END IF;
  RETURN v_default_value;
END;
$$;
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO anon;

CREATE OR REPLACE FUNCTION get_organization_features(p_organization_id UUID)
RETURNS TABLE (name TEXT, description TEXT, category TEXT, value BOOLEAN, has_override BOOLEAN, plan_value BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org_plan TEXT;
BEGIN
  v_org_plan := get_org_plan_code(p_organization_id);
  
  -- Mapear para chave do plan_values
  v_org_plan := CASE 
    WHEN v_org_plan LIKE 'starter%' THEN 'starter'
    WHEN v_org_plan LIKE 'pro%' THEN 'pro'
    WHEN v_org_plan LIKE 'business%' THEN 'business'
    WHEN v_org_plan LIKE 'enterprise%' THEN 'enterprise'
    ELSE 'starter'
  END;
  
  RETURN QUERY
  SELECT ff.name, ff.description, ff.category,
    COALESCE(ofo.value, CASE WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN ELSE ff.default_value END) as value,
    ofo.value IS NOT NULL as has_override,
    CASE WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN ELSE ff.default_value END as plan_value
  FROM feature_flags ff
  LEFT JOIN organization_feature_overrides ofo ON ofo.feature_flag_id = ff.id AND ofo.organization_id = p_organization_id
  ORDER BY ff.category, ff.name;
END;
$$;
GRANT EXECUTE ON FUNCTION get_organization_features(UUID) TO authenticated;

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_feature_overrides_updated_at ON organization_feature_overrides;
CREATE TRIGGER update_org_feature_overrides_updated_at BEFORE UPDATE ON organization_feature_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO feature_flags (name, description, category, default_value, plan_values) VALUES
('advanced_analytics', 'Relatórios avançados e dashboards personalizados', 'analytics', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('multi_user', 'Suporte a múltiplos usuários na organização', 'users', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('api_access', 'Acesso à API para integrações', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('webhooks', 'Webhooks para eventos em tempo real', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('custom_domain', 'Uso de domínio personalizado', 'branding', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('white_label', 'Remoção da marca Prisma', 'branding', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('priority_support', 'Suporte prioritário via chat e email', 'support', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('dedicated_manager', 'Gerente de conta dedicado', 'support', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('advanced_permissions', 'Permissões granulares por usuário', 'users', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('export_data', 'Exportação de dados em CSV/Excel', 'data', true, '{"starter": true, "pro": true, "business": true, "enterprise": true}'),
('bulk_import', 'Importação em massa de dados', 'data', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('custom_reports', 'Relatórios customizados', 'analytics', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE feature_flags IS 'Stores feature flags/toggles for the platform with plan-based defaults';
COMMENT ON TABLE organization_feature_overrides IS 'Stores organization-specific overrides for feature flags';
COMMENT ON FUNCTION check_feature_flag(UUID, TEXT) IS 'Checks if a feature flag is enabled for a specific organization, considering plan values and overrides';
COMMENT ON FUNCTION get_organization_features(UUID) IS 'Returns all feature flags with their current values for a specific organization';


-- =====================================================
-- MIGRATION 5: 20260129000002_fix_studioos_com_br_role.sql
-- Corrige role de studioos.com.br para marketing
-- =====================================================

UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'studioos.com.br';
UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'www.studioos.com.br';
UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'studioos.pro';
UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'www.studioos.pro';

UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now()
WHERE hostname IN ('studioos.com.br', 'www.studioos.com.br', 'studioos.pro', 'www.studioos.pro') AND role = 'admin';

INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.com.br', 'admin', NULL, true) ON CONFLICT (hostname) DO UPDATE SET role = 'admin', organization_id = NULL, active = true;
INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.pro', 'admin', NULL, true) ON CONFLICT (hostname) DO UPDATE SET role = 'admin', organization_id = NULL, active = true;

COMMENT ON TABLE public.domains IS 'Tabela de domínios para roteamento. REGRA CRÍTICA: studioos.com.br/pro = marketing (LP pública), admin.studioos.com.br/pro = admin (painel admin)';


-- =====================================================
-- FIM DAS MIGRATIONS
-- =====================================================
SELECT 'Todas as migrations do Sprint 7 foram aplicadas com sucesso! (Versão corrigida - compatível com schema existente)' AS result;
