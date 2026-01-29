# Migrations Necessárias para Teste de Rotas e Domínios

## Deploy Realizado ✅
- **URL Produção:** https://studioos.pro
- **URL Alternativa:** https://prisma-decor-mobile-inharyesc-futurisintelligences-projects.vercel.app

---

## Lista de Migrations para Executar no Supabase

Execute estas migrations em ORDEM no SQL Editor do Supabase:

### 1. Estrutura de Domínios (CRÍTICO)
**Arquivo:** `20260116000002_domains_subdomains.sql`
```sql
-- Verificar se existe
SELECT * FROM pg_tables WHERE tablename = 'organization_domains';
```

### 2. Supplier Catalog (CRÍTICO para testar integração)
**Arquivo:** `20260117000000_supplier_catalog_v1.sql`

### 3. Supplier Self-Service (CRÍTICO para cadastro de fornecedores)
**Arquivo:** `20260117000001_supplier_self_service_registration.sql`

### 4. WhatsApp Rotation (CRÍTICO para landing page)
**Arquivo:** `20260128000001_whatsapp_rotation.sql`

### 5. Feature Flags (CRÍTICO para controle de funcionalidades)
**Arquivo:** `20260129000002_add_feature_flags.sql`

### 6. Super Admin Role (CRÍTICO para acessar /admin-supremo)
**Arquivo:** `20260129000000_add_super_admin_role.sql`

### 7. Organization Member Permissions (CRÍTICO para RBAC)
**Arquivo:** `20260128233000_organization_member_permissions.sql`

### 8. Production Automations (CRÍTICO para testar triggers)
**Arquivo:** `20260128234000_production_automations.sql`

### 9. Platform Metrics RPC (para dashboard super admin)
**Arquivo:** `20260129000001_add_platform_metrics_rpc.sql`

### 10. Setup studioos.com.br (CRÍTICO para domínios)
**Arquivo:** `20260128000000_setup_studioos_com_br.sql`

---

## Script Consolidado para Copiar e Colar

Copie TODO este bloco no SQL Editor do Supabase:

```sql
-- ============================================================
-- MIGRATIONS CONSOLIDADAS PARA TESTE DE ROTAS E DOMÍNIOS
-- Execute este script completo no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. VERIFICAÇÃO E CRIAÇÃO DE TABELAS DE DOMÍNIO
-- ============================================================

-- Tabela de domínios das organizações
CREATE TABLE IF NOT EXISTS organization_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'subdomain', -- 'subdomain', 'custom'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'error'
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, domain)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_org_domains_org_id ON organization_domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_domains_domain ON organization_domains(domain);
CREATE INDEX IF NOT EXISTS idx_org_domains_status ON organization_domains(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organization_domains_updated_at ON organization_domains;
CREATE TRIGGER update_organization_domains_updated_at
    BEFORE UPDATE ON organization_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. WHATSAPP ROTATION CONFIG
-- ============================================================

CREATE TABLE IF NOT EXISTS organization_whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    rotation_mode VARCHAR(20) DEFAULT 'sequential', -- 'sequential', 'random', 'weighted'
    reset_period VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'never'
    last_reset TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_rotation_vendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES organization_whatsapp_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    peso INTEGER DEFAULT 1,
    lead_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(config_id, user_id)
);

-- ============================================================
-- 3. SUPER ADMIN ROLE
-- ============================================================

-- Adicionar role 'super_admin' ao tipo enum se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Função para verificar se usuário é super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role::TEXT INTO v_role
    FROM organization_members
    WHERE user_id = user_uuid
    LIMIT 1;
    
    RETURN v_role = 'super_admin';
EXCEPTION
    WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. ORGANIZATION MEMBER PERMISSIONS (RBAC)
-- ============================================================

CREATE TABLE IF NOT EXISTS organization_member_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    
    -- Permissões por módulo
    can_view_orcamentos BOOLEAN DEFAULT false,
    can_create_orcamentos BOOLEAN DEFAULT false,
    can_edit_orcamentos BOOLEAN DEFAULT false,
    can_delete_orcamentos BOOLEAN DEFAULT false,
    
    can_view_pedidos BOOLEAN DEFAULT false,
    can_create_pedidos BOOLEAN DEFAULT false,
    can_edit_pedidos BOOLEAN DEFAULT false,
    can_delete_pedidos BOOLEAN DEFAULT false,
    
    can_view_producao BOOLEAN DEFAULT false,
    can_edit_producao BOOLEAN DEFAULT false,
    
    can_view_instalacoes BOOLEAN DEFAULT false,
    can_edit_instalacoes BOOLEAN DEFAULT false,
    
    can_view_financeiro BOOLEAN DEFAULT false,
    can_edit_financeiro BOOLEAN DEFAULT false,
    
    can_view_crm BOOLEAN DEFAULT false,
    can_edit_crm BOOLEAN DEFAULT false,
    
    can_view_relatorios BOOLEAN DEFAULT false,
    can_view_configuracoes BOOLEAN DEFAULT false,
    can_edit_configuracoes BOOLEAN DEFAULT false,
    
    can_view_usuarios BOOLEAN DEFAULT false,
    can_edit_usuarios BOOLEAN DEFAULT false,
    
    can_view_fornecedores BOOLEAN DEFAULT false,
    can_edit_fornecedores BOOLEAN DEFAULT false,
    
    can_view_materiais BOOLEAN DEFAULT false,
    can_edit_materiais BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(member_id)
);

-- Função para criar permissões padrão
CREATE OR REPLACE FUNCTION create_default_permissions(p_member_id UUID, p_role TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO organization_member_permissions (member_id)
    VALUES (p_member_id)
    ON CONFLICT (member_id) DO NOTHING;
    
    -- Atualizar baseado no role
    UPDATE organization_member_permissions
    SET 
        can_view_orcamentos = true,
        can_create_orcamentos = p_role IN ('admin', 'user'),
        can_edit_orcamentos = p_role IN ('admin', 'user'),
        can_view_pedidos = true,
        can_create_pedidos = p_role = 'admin',
        can_edit_pedidos = p_role IN ('admin', 'user'),
        can_view_producao = true,
        can_edit_producao = p_role IN ('admin', 'user'),
        can_view_instalacoes = true,
        can_edit_instalacoes = p_role = 'admin',
        can_view_financeiro = p_role = 'admin',
        can_edit_financeiro = p_role = 'admin',
        can_view_crm = true,
        can_edit_crm = p_role IN ('admin', 'user'),
        can_view_relatorios = true,
        can_view_configuracoes = p_role = 'admin',
        can_edit_configuracoes = p_role = 'admin',
        can_view_usuarios = p_role = 'admin',
        can_edit_usuarios = p_role = 'admin',
        can_view_fornecedores = true,
        can_edit_fornecedores = p_role = 'admin',
        can_view_materiais = true,
        can_edit_materiais = p_role = 'admin'
    WHERE member_id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FEATURE FLAGS
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_value BOOLEAN DEFAULT false,
    plan_values JSONB DEFAULT '{}', -- {"basic": false, "pro": true, "enterprise": true}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_feature_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    value BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, flag_id)
);

-- Feature flags padrão
INSERT INTO feature_flags (name, description, default_value, plan_values) VALUES
('whatsapp_rotation', 'Rotação automática de leads WhatsApp', true, '{"basic": true, "pro": true, "enterprise": true}'),
('supplier_catalog', 'Catálogo de fornecedores integrado', false, '{"basic": false, "pro": true, "enterprise": true}'),
('advanced_analytics', 'Analytics avançado com métricas detalhadas', false, '{"basic": false, "pro": false, "enterprise": true}'),
('custom_domain', 'Domínio personalizado', false, '{"basic": false, "pro": true, "enterprise": true}'),
('api_access', 'Acesso à API', false, '{"basic": false, "pro": false, "enterprise": true}'),
('priority_support', 'Suporte prioritário', false, '{"basic": false, "pro": true, "enterprise": true}'),
('bulk_import', 'Importação em massa', false, '{"basic": false, "pro": true, "enterprise": true}'),
('production_automation', 'Automações de produção', false, '{"basic": false, "pro": true, "enterprise": true}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 6. PRODUCTION AUTOMATIONS
-- ============================================================

-- Adicionar colunas necessárias às tabelas
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES pedidos(id);
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS data_sugerida DATE;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS data_agendada TIMESTAMP;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMP;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente';
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Trigger: Pedido pronto → Sugerir instalação
CREATE OR REPLACE FUNCTION trigger_pedido_pronto_sugerir_instalacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pronto' AND (OLD.status IS NULL OR OLD.status != 'pronto') THEN
        INSERT INTO instalacoes (
            pedido_id,
            organization_id,
            cliente_id,
            status,
            data_sugerida,
            created_at
        )
        SELECT 
            NEW.id,
            NEW.organization_id,
            o.cliente_id,
            'sugerida',
            CURRENT_DATE + INTERVAL '3 days',
            NOW()
        FROM orcamentos o
        WHERE o.id = NEW.orcamento_id
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pedido_pronto_sugerir_instalacao ON pedidos;
CREATE TRIGGER pedido_pronto_sugerir_instalacao
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_pedido_pronto_sugerir_instalacao();

-- Trigger: Instalação concluída → Marcar entrega
CREATE OR REPLACE FUNCTION trigger_instalacao_concluida_entrega()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
        UPDATE pedidos
        SET 
            status = 'entregue',
            data_entrega = NEW.data_conclusao
        WHERE id = NEW.pedido_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS instalacao_concluida_entrega ON instalacoes;
CREATE TRIGGER instalacao_concluida_entrega
    AFTER UPDATE ON instalacoes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_instalacao_concluida_entrega();

-- ============================================================
-- 7. RPC PARA METRICS (Super Admin Dashboard)
-- ============================================================

CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_organizations', (SELECT COUNT(*) FROM organizations),
        'active_organizations', (SELECT COUNT(*) FROM organizations WHERE active = true),
        'total_users', (SELECT COUNT(*) FROM organization_members),
        'total_orcamentos', (SELECT COUNT(*) FROM orcamentos),
        'total_pedidos', (SELECT COUNT(*) FROM pedidos),
        'pending_suppliers', (SELECT COUNT(*) FROM fornecedores WHERE status = 'pending'),
        'approved_suppliers', (SELECT COUNT(*) FROM fornecedores WHERE status = 'approved'),
        'monthly_revenue', (SELECT COALESCE(SUM(valor), 0) FROM contas_receber WHERE status = 'pago' AND created_at >= DATE_TRUNC('month', NOW())),
        'plans_distribution', (
            SELECT jsonb_object_agg(p.name, COUNT(o.id))
            FROM organizations o
            JOIN plans p ON o.plan_id = p.id
            GROUP BY p.name
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. VERIFICAÇÃO DE ORGANIZAÇÃO POR SLUG
-- ============================================================

CREATE OR REPLACE FUNCTION get_organization_by_slug(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    plan_type VARCHAR,
    custom_domain VARCHAR,
    theme_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        p.name::VARCHAR as plan_type,
        od.domain as custom_domain,
        ot.theme_config
    FROM organizations o
    LEFT JOIN plans p ON o.plan_id = p.id
    LEFT JOIN organization_domains od ON o.id = od.organization_id AND od.status = 'active'
    LEFT JOIN organization_themes ot ON o.id = ot.organization_id
    WHERE o.slug = p_slug OR od.domain = p_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. WHATSAPP ROTATION FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_next_vendedor_rotation(p_org_id UUID)
RETURNS TABLE (
    user_id UUID,
    whatsapp_number VARCHAR,
    name VARCHAR
) AS $$
DECLARE
    v_config organization_whatsapp_config%ROWTYPE;
    v_next_user_id UUID;
BEGIN
    SELECT * INTO v_config
    FROM organization_whatsapp_config
    WHERE organization_id = p_org_id;
    
    IF NOT FOUND OR NOT v_config.enabled THEN
        RETURN;
    END IF;
    
    -- Sequencial: pegar o próximo na ordem
    SELECT rv.user_id INTO v_next_user_id
    FROM whatsapp_rotation_vendedores rv
    WHERE rv.config_id = v_config.id AND rv.ativo = true
    ORDER BY rv.lead_count ASC, rv.ordem ASC
    LIMIT 1;
    
    -- Incrementar contador
    UPDATE whatsapp_rotation_vendedores
    SET lead_count = lead_count + 1
    WHERE config_id = v_config.id AND user_id = v_next_user_id;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.whatsapp_number,
        u.name
    FROM users u
    WHERE u.id = v_next_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. RLS POLICIES ATUALIZADAS
-- ============================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_rotation_vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Policies para organization_domains
CREATE POLICY "Allow org members to view domains" ON organization_domains
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Allow org admins to manage domains" ON organization_domains
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policies para organization_whatsapp_config
CREATE POLICY "Allow org members to view config" ON organization_whatsapp_config
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Allow org admins to manage config" ON organization_whatsapp_config
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policies para organization_member_permissions
CREATE POLICY "Allow members to view own permissions" ON organization_member_permissions
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to manage permissions" ON organization_member_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

SELECT 'Migrations aplicadas com sucesso!' as status;
```

---

## Checklist de Teste Pós-Migration

Após executar as migrations, teste:

### 1. Rotas do Super Admin
- [ ] Acessar https://studioos.pro/admin-supremo
- [ ] Verificar se aparece o dashboard
- [ ] Verificar lista de fornecedores pendentes
- [ ] Verificar lista de organizações

### 2. Domínios e Landing Pages
- [ ] Acessar https://prisma.studioos.pro (substitua "prisma" pelo slug da sua org)
- [ ] Verificar se carrega a landing page
- [ ] Verificar se o botão WhatsApp funciona
- [ ] Verificar se o tema está aplicado

### 3. Sistema de Fornecedores
- [ ] Acessar https://studioos.pro/cadastro-fornecedor
- [ ] Tentar cadastrar um fornecedor
- [ ] Verificar se aparece na lista de pendentes no admin

### 4. WhatsApp Rotation
- [ ] Ir em Configurações → Rotação WhatsApp
- [ ] Ativar/desativar rotação
- [ ] Testar com múltiplos vendedores

### 5. Feature Flags
- [ ] Verificar se as flags estão ativas
- [ ] Testar override por organização

---

## Comandos Úteis para Verificação

```sql
-- Verificar se tabelas foram criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar feature flags
SELECT * FROM feature_flags;

-- Verificar organizações
SELECT id, name, slug FROM organizations LIMIT 5;

-- Verificar domínios configurados
SELECT od.*, o.name as org_name 
FROM organization_domains od
JOIN organizations o ON od.organization_id = o.id;

-- Verificar permissões de membros
SELECT omp.*, om.user_id, om.role
FROM organization_member_permissions omp
JOIN organization_members om ON omp.member_id = om.id
LIMIT 10;

-- Verificar configuração WhatsApp
SELECT * FROM organization_whatsapp_config;

-- Testar RPC de métricas (como super_admin)
SELECT get_platform_metrics();

-- Testar get_organization_by_slug
SELECT * FROM get_organization_by_slug('prisma');
```

---

## Troubleshooting

### Erro: "column X does not exist"
**Solução:** Execute as migrations na ordem correta, começando pelas estruturas de domínio.

### Erro: "permission denied"
**Solução:** Verifique se o usuário autenticado tem role 'admin' ou 'super_admin'.

### Erro: "relation X does not exist"
**Solução:** A tabela ainda não foi criada. Execute o script consolidado completo.

### Landing page não carrega
**Solução:** Verifique se:
1. A organização existe com o slug correto
2. O domínio está registrado na tabela organization_domains
3. O status do domínio é 'active'

### Super Admin não acessa
**Solução:** Execute:
```sql
UPDATE organization_members 
SET role = 'super_admin'::user_role 
WHERE user_id = 'SEU_USER_ID';
```
