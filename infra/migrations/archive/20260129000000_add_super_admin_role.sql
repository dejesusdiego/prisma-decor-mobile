-- Migration: Add super_admin role and platform subscriptions schema
-- Data: 2026-01-29
-- Sprint: 7 - Painel Admin Supremo

-- ============================================
-- 1. Adicionar role 'super_admin' ao tipo enum
-- ============================================
-- Nota: Se o tipo for enum, precisamos adicionar o valor
-- Verificar primeiro o tipo atual da coluna role

-- Adicionar valor 'super_admin' ao enum user_role se existir
DO $$
BEGIN
    -- Verificar se o tipo enum existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Adicionar 'super_admin' ao enum se não existir
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'super_admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'super_admin';
        END IF;
    END IF;
END $$;

-- ============================================
-- 2. Tabela de subscriptions (integração ASAAS)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados do ASAAS
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    
    -- Plano e valores
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'business', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'expired')),
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Período
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_org_subscription UNIQUE (organization_id),
    CONSTRAINT unique_asaas_subscription UNIQUE (asaas_subscription_id)
);

-- ============================================
-- 3. Tabela de eventos de subscription (histórico)
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Tipo de evento
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created',
        'activated',
        'renewed',
        'cancelled',
        'paused',
        'resumed',
        'payment_received',
        'payment_failed',
        'payment_overdue',
        'trial_started',
        'trial_ended',
        'plan_changed'
    )),
    
    -- Dados do evento
    previous_status TEXT,
    new_status TEXT,
    previous_plan TEXT,
    new_plan TEXT,
    amount_cents INTEGER,
    metadata JSONB,
    
    -- Referências externas
    asaas_event_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 4. Tabela de faturas (invoices)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados da fatura
    invoice_number TEXT UNIQUE,
    asaas_invoice_id TEXT,
    
    -- Valores
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    
    -- Datas
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Referências
    payment_method TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 5. Tabela de pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados do pagamento
    asaas_payment_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'received', 'overdue', 'cancelled', 'refunded')),
    
    -- Método
    payment_method TEXT,
    
    -- Datas
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 6. Indexes para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_type);
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

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Super admin pode ver tudo, organization members veem só da sua org
CREATE POLICY "Super admin can manage all subscriptions"
    ON subscriptions FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own subscription"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- Subscription events
CREATE POLICY "Super admin can manage all subscription events"
    ON subscription_events FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own subscription events"
    ON subscription_events FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- Invoices
CREATE POLICY "Super admin can manage all invoices"
    ON invoices FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- Payments
CREATE POLICY "Super admin can manage all payments"
    ON payments FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own payments"
    ON payments FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- ============================================
-- 8. Function to update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Comment para documentação
-- ============================================
COMMENT ON TABLE subscriptions IS 'Assinaturas das organizações - integração ASAAS';
COMMENT ON TABLE subscription_events IS 'Histórico de eventos das assinaturas';
COMMENT ON TABLE invoices IS 'Faturas das assinaturas';
COMMENT ON TABLE payments IS 'Pagamentos realizados';

SELECT 'Migration 20260129000000_add_super_admin_role completed successfully' AS result;