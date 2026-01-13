-- ============================================================
-- MODELO DE NEGÓCIO: PLANOS E ASSINATURAS
-- Prisma ERP - Sistema Multi-Tenant para Decoração
-- ============================================================

-- Tabela de Super Admins (donos do ERP)
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL, -- 'starter_3', 'pro_10', 'business_25', 'enterprise_50'
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Preços
  preco_mensal DECIMAL(10,2) NOT NULL,
  preco_implementacao DECIMAL(10,2) DEFAULT 0,
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90, -- Preço por usuário extra
  
  -- Limites
  max_usuarios INT NOT NULL, -- Usuários inclusos no plano
  max_usuarios_expansivel BOOLEAN DEFAULT true, -- Permite adicionar mais usuários?
  max_orcamentos_mes INT, -- NULL = ilimitado
  max_storage_gb INT DEFAULT 5,
  
  -- Features (JSON)
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false, -- Plano mais popular
  ordem INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  
  -- Status
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  
  -- Período
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Usuários Adicionais
  usuarios_adicionais INT DEFAULT 0,
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90,
  
  -- Pagamento
  payment_method TEXT, -- 'pix', 'boleto', 'cartao'
  stripe_subscription_id TEXT,
  
  -- Customizações (overrides do plano)
  custom_max_usuarios INT,
  custom_preco_mensal DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Histórico de Pagamentos
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  
  metodo_pagamento TEXT,
  comprovante_url TEXT,
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uso mensal por organização (para limites)
CREATE TABLE IF NOT EXISTS organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  mes_referencia DATE NOT NULL, -- Primeiro dia do mês
  
  -- Contadores
  orcamentos_criados INT DEFAULT 0,
  usuarios_ativos INT DEFAULT 0,
  storage_usado_mb DECIMAL(10,2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, mes_referencia)
);

-- ============================================================
-- INSERIR PLANOS PADRÃO
-- ============================================================

INSERT INTO plans (codigo, nome, descricao, preco_mensal, preco_implementacao, preco_usuario_adicional, max_usuarios, max_usuarios_expansivel, max_orcamentos_mes, features, ordem, destaque) VALUES

-- Plano Starter (3 usuários)
('starter_3', 'Starter', 'Ideal para pequenas empresas começando a organizar seus processos', 
 499.00, 3000.00, 69.90, 3, true, 100,
 '["orcamentos", "crm_basico", "producao", "calendario"]'::jsonb,
 1, false),

-- Plano Profissional (10 usuários) - DESTAQUE
('pro_10', 'Profissional', 'Para empresas em crescimento que precisam de mais controle',
 899.00, 4500.00, 69.90, 10, true, 500,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "calendario"]'::jsonb,
 2, true),

-- Plano Business (25 usuários)
('business_25', 'Business', 'Solução completa para operações de médio porte',
 1499.00, 7000.00, 69.90, 25, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "calendario", "suporte_prioritario"]'::jsonb,
 3, false),

-- Plano Enterprise (50+ usuários)
('enterprise_50', 'Enterprise', 'Máxima performance para grandes operações',
 2499.00, 12000.00, 59.90, 50, true, NULL,
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

-- ============================================================
-- POLICIES RLS
-- ============================================================

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;

-- Super admins: apenas super admins veem
CREATE POLICY "Super admins podem ver super_admins" ON super_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Planos: todos podem ver planos ativos
CREATE POLICY "Todos podem ver planos ativos" ON plans
  FOR SELECT USING (ativo = true);

CREATE POLICY "Super admins gerenciam planos" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Assinaturas: organização vê sua própria, super admins veem todas
CREATE POLICY "Org vê sua assinatura" ON subscriptions
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "Super admins gerenciam assinaturas" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Pagamentos: mesma lógica
CREATE POLICY "Org vê seus pagamentos" ON subscription_payments
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE organization_id = get_user_organization_id()
    )
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Uso: organização vê seu próprio uso
CREATE POLICY "Org vê seu uso" ON organization_usage
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Verificar se organização tem feature
CREATE OR REPLACE FUNCTION org_has_feature(p_org_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_features JSONB;
BEGIN
  SELECT p.features INTO v_features
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  RETURN v_features ? p_feature;
END;
$$;

-- Verificar limite de usuários (considerando usuários adicionais)
CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_max_usuarios_base INT;
  v_usuarios_adicionais INT;
  v_max_usuarios_total INT;
  v_usuarios_atuais INT;
  v_expansivel BOOLEAN;
BEGIN
  -- Buscar limite do plano + usuários adicionais
  SELECT 
    COALESCE(s.custom_max_usuarios, p.max_usuarios),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(p.max_usuarios_expansivel, true)
  INTO v_max_usuarios_base, v_usuarios_adicionais, v_expansivel
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = NEW.organization_id
    AND s.status IN ('trial', 'active');
  
  -- Total = base + adicionais
  v_max_usuarios_total := v_max_usuarios_base + v_usuarios_adicionais;
  
  -- Contar usuários atuais
  SELECT COUNT(*) INTO v_usuarios_atuais
  FROM organization_members
  WHERE organization_id = NEW.organization_id;
  
  -- Verificar limite (NULL = ilimitado)
  IF v_max_usuarios_total IS NOT NULL AND v_usuarios_atuais >= v_max_usuarios_total THEN
    IF v_expansivel THEN
      RAISE EXCEPTION 'Limite de usuários atingido (% de %). Adicione mais usuários ao seu plano por R$ 69,90/mês cada.', v_usuarios_atuais, v_max_usuarios_total;
    ELSE
      RAISE EXCEPTION 'Limite de usuários atingido para este plano (% de %)', v_usuarios_atuais, v_max_usuarios_total;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para verificar limite ao adicionar membro
DROP TRIGGER IF EXISTS check_user_limit_trigger ON organization_members;
CREATE TRIGGER check_user_limit_trigger
  BEFORE INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION check_user_limit();

-- ============================================================
-- FUNÇÕES DE CÁLCULO DE PREÇO
-- ============================================================

-- Calcular preço total mensal da assinatura (plano + usuários adicionais)
CREATE OR REPLACE FUNCTION calcular_preco_mensal_assinatura(p_org_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_preco_base DECIMAL(10,2);
  v_usuarios_adicionais INT;
  v_preco_usuario_adicional DECIMAL(10,2);
  v_preco_total DECIMAL(10,2);
BEGIN
  SELECT 
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)
  INTO v_preco_base, v_usuarios_adicionais, v_preco_usuario_adicional
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  -- Preço total = base + (usuários adicionais × preço por usuário)
  v_preco_total := COALESCE(v_preco_base, 0) + (COALESCE(v_usuarios_adicionais, 0) * COALESCE(v_preco_usuario_adicional, 69.90));
  
  RETURN v_preco_total;
END;
$$;

-- Obter detalhes da assinatura com cálculos
CREATE OR REPLACE FUNCTION get_subscription_details(p_org_id UUID)
RETURNS TABLE (
  plano_nome TEXT,
  plano_codigo TEXT,
  preco_base DECIMAL(10,2),
  usuarios_inclusos INT,
  usuarios_adicionais INT,
  usuarios_total INT,
  preco_usuario_adicional DECIMAL(10,2),
  valor_usuarios_adicionais DECIMAL(10,2),
  preco_total_mensal DECIMAL(10,2),
  status TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.nome,
    p.codigo,
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    p.max_usuarios,
    COALESCE(s.usuarios_adicionais, 0),
    p.max_usuarios + COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90),
    (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    COALESCE(s.custom_preco_mensal, p.preco_mensal) + (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    s.status,
    s.trial_ends_at,
    s.current_period_end
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id;
END;
$$;

-- Adicionar usuários extras à assinatura
CREATE OR REPLACE FUNCTION adicionar_usuarios_assinatura(
  p_org_id UUID,
  p_quantidade INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE subscriptions
  SET 
    usuarios_adicionais = COALESCE(usuarios_adicionais, 0) + p_quantidade,
    updated_at = now()
  WHERE organization_id = p_org_id
    AND status IN ('trial', 'active');
END;
$$;

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_sub ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_organization_usage_org_mes ON organization_usage(organization_id, mes_referencia);