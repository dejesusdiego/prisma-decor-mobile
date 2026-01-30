-- =============================================
-- FEATURE FLAGS - Sistema de Controle por Plano
-- =============================================

-- 1. Criar enum para os planos
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('starter', 'profissional', 'business', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de configuração de planos
CREATE TABLE IF NOT EXISTS planos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome subscription_plan NOT NULL UNIQUE,
  nome_exibicao TEXT NOT NULL,
  preco_mensal DECIMAL(10,2) NOT NULL,
  usuarios_base INTEGER NOT NULL,
  limite_orcamentos INTEGER, -- NULL = ilimitado
  -- Features booleanas
  crm_basico BOOLEAN DEFAULT true,
  crm_avancado BOOLEAN DEFAULT false,
  producao_kanban BOOLEAN DEFAULT true,
  financeiro_completo BOOLEAN DEFAULT false,
  relatorios_bi BOOLEAN DEFAULT false,
  nfe_integracao BOOLEAN DEFAULT true,
  suporte_prioritario BOOLEAN DEFAULT false,
  whatsapp_integrado BOOLEAN DEFAULT false,
  api_acesso BOOLEAN DEFAULT false,
  customizacoes BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Inserir dados dos planos
INSERT INTO planos_config (nome, nome_exibicao, preco_mensal, usuarios_base, limite_orcamentos, crm_avancado, financeiro_completo, relatorios_bi, suporte_prioritario, whatsapp_integrado, api_acesso, customizacoes)
VALUES 
  ('starter', 'Starter', 499.00, 3, 100, false, false, false, false, false, false, false),
  ('profissional', 'Profissional', 899.00, 10, 500, true, true, true, false, false, false, false),
  ('business', 'Business', 1499.00, 25, NULL, true, true, true, true, false, false, false),
  ('enterprise', 'Enterprise', 2499.00, 50, NULL, true, true, true, true, true, true, true)
ON CONFLICT (nome) DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  preco_mensal = EXCLUDED.preco_mensal,
  usuarios_base = EXCLUDED.usuarios_base,
  limite_orcamentos = EXCLUDED.limite_orcamentos,
  crm_avancado = EXCLUDED.crm_avancado,
  financeiro_completo = EXCLUDED.financeiro_completo,
  relatorios_bi = EXCLUDED.relatorios_bi,
  suporte_prioritario = EXCLUDED.suporte_prioritario,
  whatsapp_integrado = EXCLUDED.whatsapp_integrado,
  api_acesso = EXCLUDED.api_acesso,
  customizacoes = EXCLUDED.customizacoes,
  updated_at = now();

-- 4. Adicionar coluna de plano na tabela organizations (se não existir)
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN plano subscription_plan DEFAULT 'starter';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN plano_valido_ate TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN usuarios_adicionais INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 5. Criar função para verificar se organização tem acesso a uma feature
CREATE OR REPLACE FUNCTION org_has_feature(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_plano subscription_plan;
  has_feature BOOLEAN;
BEGIN
  -- Buscar plano da organização
  SELECT plano INTO org_plano FROM organizations WHERE id = org_id;
  
  IF org_plano IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se o plano tem a feature
  EXECUTE format('SELECT %I FROM planos_config WHERE nome = $1', feature_name)
  INTO has_feature
  USING org_plano;
  
  RETURN COALESCE(has_feature, false);
END;
$$;

-- 6. Criar função para obter limite de orçamentos
CREATE OR REPLACE FUNCTION org_get_orcamento_limit(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_plano subscription_plan;
  limite INTEGER;
BEGIN
  SELECT plano INTO org_plano FROM organizations WHERE id = org_id;
  
  IF org_plano IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT limite_orcamentos INTO limite FROM planos_config WHERE nome = org_plano;
  
  RETURN limite; -- NULL = ilimitado
END;
$$;

-- 7. Criar função para contar orçamentos do mês atual
CREATE OR REPLACE FUNCTION org_count_orcamentos_mes(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COUNT(*) INTO total
  FROM orcamentos
  WHERE organization_id = org_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
  
  RETURN total;
END;
$$;

-- 8. Criar função para verificar se pode criar mais orçamentos
CREATE OR REPLACE FUNCTION org_can_create_orcamento(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  limite INTEGER;
  atual INTEGER;
BEGIN
  limite := org_get_orcamento_limit(org_id);
  
  -- NULL = ilimitado
  IF limite IS NULL THEN
    RETURN true;
  END IF;
  
  atual := org_count_orcamentos_mes(org_id);
  
  RETURN atual < limite;
END;
$$;

-- 9. Criar função para obter limite de usuários
CREATE OR REPLACE FUNCTION org_get_user_limit(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_record RECORD;
  base_limit INTEGER;
BEGIN
  SELECT o.plano, o.usuarios_adicionais, p.usuarios_base
  INTO org_record
  FROM organizations o
  JOIN planos_config p ON p.nome = o.plano
  WHERE o.id = org_id;
  
  IF org_record IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN org_record.usuarios_base + COALESCE(org_record.usuarios_adicionais, 0);
END;
$$;

-- 10. Criar função para obter todas as features do plano da organização
CREATE OR REPLACE FUNCTION org_get_features(org_id UUID)
RETURNS TABLE (
  plano TEXT,
  plano_nome TEXT,
  limite_orcamentos INTEGER,
  limite_usuarios INTEGER,
  orcamentos_mes INTEGER,
  crm_basico BOOLEAN,
  crm_avancado BOOLEAN,
  producao_kanban BOOLEAN,
  financeiro_completo BOOLEAN,
  relatorios_bi BOOLEAN,
  nfe_integracao BOOLEAN,
  suporte_prioritario BOOLEAN,
  whatsapp_integrado BOOLEAN,
  api_acesso BOOLEAN,
  customizacoes BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.plano::TEXT,
    p.nome_exibicao,
    p.limite_orcamentos,
    (p.usuarios_base + COALESCE(o.usuarios_adicionais, 0))::INTEGER,
    org_count_orcamentos_mes(org_id),
    p.crm_basico,
    p.crm_avancado,
    p.producao_kanban,
    p.financeiro_completo,
    p.relatorios_bi,
    p.nfe_integracao,
    p.suporte_prioritario,
    p.whatsapp_integrado,
    p.api_acesso,
    p.customizacoes
  FROM organizations o
  JOIN planos_config p ON p.nome = o.plano
  WHERE o.id = org_id;
END;
$$;

-- 11. RLS para planos_config (leitura pública para usuários autenticados)
ALTER TABLE planos_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planos_config_select" ON planos_config;
CREATE POLICY "planos_config_select" ON planos_config
  FOR SELECT TO authenticated
  USING (true);

-- 12. Atualizar organizações existentes para ter plano starter
UPDATE organizations SET plano = 'starter' WHERE plano IS NULL;

-- Comentário final
COMMENT ON TABLE planos_config IS 'Configuração de planos e features disponíveis por plano';
COMMENT ON FUNCTION org_has_feature IS 'Verifica se uma organização tem acesso a determinada feature baseado no seu plano';
COMMENT ON FUNCTION org_get_features IS 'Retorna todas as features e limites da organização';
