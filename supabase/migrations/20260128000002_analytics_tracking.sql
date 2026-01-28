-- Migration: Analytics e Tracking para StudioOS
-- Data: 2026-01-28
-- Sprint 5: Analytics e Polimento

-- ===========================================
-- TABELA: Eventos de Analytics
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL, -- 'page_view', 'interaction', 'conversion', 'error'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Dados do evento
    properties JSONB DEFAULT '{}',
    
    -- Contexto
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_org ON analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- ===========================================
-- TABELA: Métricas Diárias Agregadas
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Métricas de Visitas
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    
    -- Métricas de Conversão
    orcamentos_criados INTEGER DEFAULT 0,
    orcamentos_convertidos INTEGER DEFAULT 0,
    visitas_solicitadas INTEGER DEFAULT 0,
    visitas_agendadas INTEGER DEFAULT 0,
    
    -- Métricas de Engajamento
    avg_session_duration INTEGER DEFAULT 0, -- em segundos
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Receita
    receita_total DECIMAL(12,2) DEFAULT 0,
    ticket_medio DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint única por organização e data
    UNIQUE(organization_id, metric_date)
);

-- Índices para analytics_daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_org_date ON analytics_daily_metrics(organization_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON analytics_daily_metrics(metric_date);

-- ===========================================
-- TABELA: Funil de Conversão
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    funnel_date DATE NOT NULL,
    
    -- Estágios do funil
    visitas_landing INTEGER DEFAULT 0,
    cliques_whatsapp INTEGER DEFAULT 0,
    solicitacoes_visita INTEGER DEFAULT 0,
    orcamentos_criados INTEGER DEFAULT 0,
    orcamentos_aprovados INTEGER DEFAULT 0,
    pedidos_gerados INTEGER DEFAULT 0,
    
    -- Taxas de conversão (calculadas)
    taxa_visitas_whatsapp DECIMAL(5,2) DEFAULT 0,
    taxa_whatsapp_orcamento DECIMAL(5,2) DEFAULT 0,
    taxa_orcamento_pedido DECIMAL(5,2) DEFAULT 0,
    taxa_geral DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, funnel_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_funnel_org_date ON analytics_funnel(organization_id, funnel_date);

-- ===========================================
-- TABELA: Performance de Vendedores
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_vendedor_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    
    -- Métricas
    orcamentos_atribuidos INTEGER DEFAULT 0,
    orcamentos_convertidos INTEGER DEFAULT 0,
    leads_whatsapp INTEGER DEFAULT 0,
    leads_convertidos INTEGER DEFAULT 0,
    
    -- Taxas
    taxa_conversao DECIMAL(5,2) DEFAULT 0,
    tempo_medio_resposta INTEGER DEFAULT 0, -- em minutos
    
    -- Valores
    valor_total_vendido DECIMAL(12,2) DEFAULT 0,
    ticket_medio DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, vendedor_id, metric_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vendedor_perf_org ON analytics_vendedor_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendedor_perf_vendedor ON analytics_vendedor_performance(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendedor_perf_date ON analytics_vendedor_performance(metric_date);

-- ===========================================
-- VIEW: Dashboard Analytics Consolidado
-- ===========================================
CREATE OR REPLACE VIEW vw_analytics_dashboard AS
SELECT 
    dm.organization_id,
    dm.metric_date,
    dm.page_views,
    dm.unique_visitors,
    dm.sessions,
    dm.orcamentos_criados,
    dm.orcamentos_convertidos,
    CASE 
        WHEN dm.orcamentos_criados > 0 
        THEN ROUND((dm.orcamentos_convertidos::DECIMAL / dm.orcamentos_criados) * 100, 2)
        ELSE 0 
    END as taxa_conversao_orcamentos,
    dm.visitas_solicitadas,
    dm.visitas_agendadas,
    dm.receita_total,
    dm.ticket_medio,
    f.visitas_landing,
    f.cliques_whatsapp,
    f.taxa_visitas_whatsapp,
    f.taxa_geral as taxa_conversao_geral
FROM analytics_daily_metrics dm
LEFT JOIN analytics_funnel f ON dm.organization_id = f.organization_id 
    AND dm.metric_date = f.funnel_date;

-- ===========================================
-- FUNÇÃO: Registrar Evento de Analytics
-- ===========================================
CREATE OR REPLACE FUNCTION track_analytics_event(
    p_organization_id UUID,
    p_event_type TEXT,
    p_event_category TEXT,
    p_properties JSONB DEFAULT '{}',
    p_page_url TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_user_id UUID;
BEGIN
    -- Pegar user_id da sessão atual
    v_user_id := auth.uid();
    
    INSERT INTO analytics_events (
        organization_id,
        event_type,
        event_category,
        user_id,
        properties,
        page_url,
        referrer
    ) VALUES (
        p_organization_id,
        p_event_type,
        p_event_category,
        v_user_id,
        p_properties,
        p_page_url,
        p_referrer
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- ===========================================
-- FUNÇÃO: Atualizar Métricas Diárias
-- ===========================================
CREATE OR REPLACE FUNCTION update_daily_metrics(
    p_organization_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Upsert métricas diárias
    INSERT INTO analytics_daily_metrics (
        organization_id,
        metric_date,
        orcamentos_criados,
        orcamentos_convertidos,
        visitas_solicitadas,
        receita_total
    )
    SELECT 
        p_organization_id,
        p_date,
        COUNT(*) FILTER (WHERE DATE(o.created_at) = p_date),
        COUNT(*) FILTER (WHERE DATE(o.created_at) = p_date AND o.status = 'aprovado'),
        COUNT(*) FILTER (WHERE DATE(sv.created_at) = p_date),
        COALESCE(SUM(o.valor_total) FILTER (WHERE DATE(o.created_at) = p_date AND o.status = 'aprovado'), 0)
    FROM orcamentos o
    LEFT JOIN solicitacoes_visita sv ON sv.organization_id = p_organization_id
    WHERE o.organization_id = p_organization_id
        AND (DATE(o.created_at) = p_date OR DATE(sv.created_at) = p_date)
    ON CONFLICT (organization_id, metric_date)
    DO UPDATE SET
        orcamentos_criados = EXCLUDED.orcamentos_criados,
        orcamentos_convertidos = EXCLUDED.orcamentos_convertidos,
        visitas_solicitadas = EXCLUDED.visitas_solicitadas,
        receita_total = EXCLUDED.receita_total,
        ticket_medio = CASE 
            WHEN EXCLUDED.orcamentos_convertidos > 0 
            THEN EXCLUDED.receita_total / EXCLUDED.orcamentos_convertidos 
            ELSE 0 
        END,
        updated_at = NOW();
END;
$$;

-- ===========================================
-- FUNÇÃO: Calcular Funil de Conversão
-- ===========================================
CREATE OR REPLACE FUNCTION calculate_funnel_metrics(
    p_organization_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    funnel_date DATE,
    visitas_landing INTEGER,
    cliques_whatsapp INTEGER,
    orcamentos_criados INTEGER,
    orcamentos_aprovados INTEGER,
    taxa_conversao DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH eventos AS (
        SELECT 
            DATE(created_at) as event_date,
            event_type,
            COUNT(*) as total
        FROM analytics_events
        WHERE organization_id = p_organization_id
            AND DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at), event_type
    ),
    orcamentos AS (
        SELECT 
            DATE(created_at) as orc_date,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'aprovado') as aprovados
        FROM orcamentos
        WHERE organization_id = p_organization_id
            AND DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at)
    )
    SELECT 
        gs.date::DATE as funnel_date,
        COALESCE(e.total, 0)::INTEGER as visitas_landing,
        COALESCE(ew.total, 0)::INTEGER as cliques_whatsapp,
        COALESCE(o.total, 0)::INTEGER as orcamentos_criados,
        COALESCE(o.aprovados, 0)::INTEGER as orcamentos_aprovados,
        CASE 
            WHEN COALESCE(e.total, 0) > 0 
            THEN ROUND((COALESCE(o.total, 0)::DECIMAL / e.total) * 100, 2)
            ELSE 0 
        END as taxa_conversao
    FROM generate_series(p_start_date, p_end_date, INTERVAL '1 day') gs
    LEFT JOIN eventos e ON gs.date = e.event_date AND e.event_type = 'page_view'
    LEFT JOIN eventos ew ON gs.date = ew.event_date AND ew.event_type = 'whatsapp_click'
    LEFT JOIN orcamentos o ON gs.date = o.orc_date
    ORDER BY gs.date;
END;
$$;

-- ===========================================
-- POLÍTICAS DE RLS
-- ===========================================

-- Habilitar RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_vendedor_performance ENABLE ROW LEVEL SECURITY;

-- Políticas para analytics_events
CREATE POLICY analytics_events_select_policy ON analytics_events
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY analytics_events_insert_policy ON analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- Políticas para analytics_daily_metrics
CREATE POLICY analytics_daily_metrics_select_policy ON analytics_daily_metrics
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- Políticas para analytics_funnel
CREATE POLICY analytics_funnel_select_policy ON analytics_funnel
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- Políticas para analytics_vendedor_performance
CREATE POLICY vendedor_perf_select_policy ON analytics_vendedor_performance
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- ===========================================
-- TRIGGER: Atualizar updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_daily_metrics_updated_at
    BEFORE UPDATE ON analytics_daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_updated_at();

-- ===========================================
-- COMENTÁRIOS
-- ===========================================
COMMENT ON TABLE analytics_events IS 'Eventos brutos de tracking (page views, cliques, conversões)';
COMMENT ON TABLE analytics_daily_metrics IS 'Métricas agregadas por dia para dashboard';
COMMENT ON TABLE analytics_funnel IS 'Dados do funil de conversão por dia';
COMMENT ON TABLE analytics_vendedor_performance IS 'Performance individual dos vendedores';

-- ===========================================
-- DADOS INICIAIS (Opcional)
-- ===========================================
-- Popular métricas iniciais para os últimos 7 dias
-- SELECT update_daily_metrics(org.id, CURRENT_DATE - i)
-- FROM organizations org
-- CROSS JOIN generate_series(0, 6) i;
