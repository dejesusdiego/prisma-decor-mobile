-- StudioOS V5 - Initial Seed
-- Dados essenciais para primeira execução
-- Execute APÓS o baseline_schema.sql

-- Planos de assinatura
INSERT INTO plans (id, name, slug, description, price_monthly, price_yearly, features, limits, active, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'Starter',
    'starter',
    'Ideal para pequenos negócios começando com automação',
    97.00,
    970.00,
    '["Até 50 orçamentos/mês", "1 usuário", "Suporte por email", "Relatórios básicos"]',
    '{"orcamentos_mes": 50, "usuarios": 1, "storage_gb": 5}'::jsonb,
    true,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Pro',
    'pro',
    'Para empresas em crescimento que precisam de mais recursos',
    297.00,
    2970.00,
    '["Orçamentos ilimitados", "5 usuários", "Suporte prioritário", "Relatórios avançados", "Integração WhatsApp"]',
    '{"orcamentos_mes": -1, "usuarios": 5, "storage_gb": 50}'::jsonb,
    true,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Business',
    'business',
    'Solução completa para grandes empresas',
    997.00,
    9970.00,
    '["Tudo do Pro", "Usuários ilimitados", "API dedicada", "Suporte 24/7", "Onboarding personalizado", "SLA garantido"]',
    '{"orcamentos_mes": -1, "usuarios": -1, "storage_gb": 500}'::jsonb,
    true,
    now(),
    now()
  )
ON CONFLICT (slug) DO NOTHING;

-- Configurações padrão da plataforma
INSERT INTO platform_settings (id, key, value, description, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'default_plan_slug',
    '"starter"',
    'Plano padrão para novas organizações',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'max_orcamentos_free_trial',
    '5',
    'Número máximo de orçamentos no período de trial',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'trial_days',
    '14',
    'Dias de trial gratuito',
    now(),
    now()
  )
ON CONFLICT (key) DO NOTHING;

-- Status padrão para orçamentos (enums não precisam de seed, são verificações)

-- Feature flags padrão (desabilitadas inicialmente)
INSERT INTO feature_flags (id, name, key, description, default_value, plan_values, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'Módulo Financeiro',
    'modulo_financeiro',
    'Acesso ao módulo de contas a pagar/receber',
    false,
    '{"starter": false, "pro": true, "business": true}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Módulo CRM',
    'modulo_crm',
    'Acesso ao módulo de gestão de contatos',
    false,
    '{"starter": false, "pro": true, "business": true}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Módulo Produção',
    'modulo_producao',
    'Acesso ao controle de produção e etapas',
    false,
    '{"starter": false, "pro": true, "business": true}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Módulo Fornecedores',
    'modulo_fornecedores',
    'Acesso ao portal de fornecedores',
    false,
    '{"starter": false, "pro": false, "business": true}'::jsonb,
    now(),
    now()
  )
ON CONFLICT (key) DO NOTHING;

-- Categorias de materiais padrão
INSERT INTO material_categories (id, name, slug, description, active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Cortinas', 'cortinas', 'Tecidos e cortinas em geral', true, now(), now()),
  (gen_random_uuid(), 'Persianas', 'persianas', 'Persianas horizontais e verticais', true, now(), now()),
  (gen_random_uuid(), 'Toldos', 'toldos', 'Toldos e coberturas', true, now(), now()),
  (gen_random_uuid(), 'Acessórios', 'acessorios', 'Acessórios diversos', true, now(), now()),
  (gen_random_uuid(), 'Motorização', 'motorizacao', 'Motores e automação', true, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Unidades de medida padrão
INSERT INTO measurement_units (id, name, symbol, type, active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Metro', 'm', 'length', true, now(), now()),
  (gen_random_uuid(), 'Metro Quadrado', 'm²', 'area', true, now(), now()),
  (gen_random_uuid(), 'Unidade', 'un', 'unit', true, now(), now()),
  (gen_random_uuid(), 'Centímetro', 'cm', 'length', true, now(), now()),
  (gen_random_uuid(), 'Milímetro', 'mm', 'length', true, now(), now())
ON CONFLICT (symbol) DO NOTHING;

-- Tipos de cortina padrão
INSERT INTO cortina_types (id, name, slug, description, default_config, active, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'Cortina Onda',
    'onda',
    'Cortina com efeito onda suave',
    '{"fator_onda": 2.0, "recolhimento": "centro"}'::jsonb,
    true,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Cortina Tradicional',
    'tradicional',
    'Cortina com pregas tradicionais',
    '{"tipo_prega": "americana", "recolhimento": "lateral"}'::jsonb,
    true,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Blackout',
    'blackout',
    'Cortina com bloqueio total de luz',
    '{"bloqueio_luz": 100}'::jsonb,
    true,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Tela Solar',
    'tela-solar',
    'Tela solar para proteção UV',
    '{"protecao_uv": 95}'::jsonb,
    true,
    now(),
    now()
  )
ON CONFLICT (slug) DO NOTHING;

-- Status de pedido padrão
INSERT INTO pedido_status (id, name, slug, description, color, order_index, active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Aguardando Produção', 'aguardando', 'Pedido aprovado, aguardando início', '#F59E0B', 1, true, now(), now()),
  (gen_random_uuid(), 'Em Corte', 'corte', 'Material sendo cortado', '#3B82F6', 2, true, now(), now()),
  (gen_random_uuid(), 'Em Costura', 'costura', 'Em processo de costura', '#8B5CF6', 3, true, now(), now()),
  (gen_random_uuid(), 'Em Montagem', 'montagem', 'Montagem final do produto', '#EC4899', 4, true, now(), now()),
  (gen_random_uuid(), 'Em Revisão', 'revisao', 'Revisão de qualidade', '#F97316', 5, true, now(), now()),
  (gen_random_uuid(), 'Pronto para Entrega', 'pronto', 'Produto finalizado', '#10B981', 6, true, now(), now()),
  (gen_random_uuid(), 'Entregue', 'entregue', 'Produto entregue ao cliente', '#059669', 7, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
