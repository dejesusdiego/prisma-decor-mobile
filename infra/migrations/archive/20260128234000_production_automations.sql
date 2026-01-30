-- ============================================================
-- T8.7: Automações de Produção
-- ============================================================
-- Triggers para automatizar fluxo de produção:
-- 1. Quando pedido fica pronto → sugerir instalação
-- 2. Quando instalação concluída → criar registro de entrega

-- ============================================================
-- FUNCTION: Trigger quando item de pedido muda para "pronto"
-- ============================================================
CREATE OR REPLACE FUNCTION handle_item_pronto_sugerir_instalacao()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido_id UUID;
    v_orcamento_id UUID;
    v_cliente_nome TEXT;
    v_endereco TEXT;
    v_cidade TEXT;
    v_todos_prontos BOOLEAN;
    v_existe_instalacao_pendente BOOLEAN;
    v_organization_id UUID;
BEGIN
    -- Verificar se o status mudou para 'pronto'
    IF NEW.status_item = 'pronto' AND (OLD.status_item IS NULL OR OLD.status_item != 'pronto') THEN
        -- Pegar ID do pedido
        v_pedido_id := NEW.pedido_id;
        
        -- Verificar se todos os itens do pedido estão prontos
        SELECT 
            NOT EXISTS(
                SELECT 1 FROM itens_pedido 
                WHERE pedido_id = v_pedido_id 
                AND status_item NOT IN ('pronto', 'cancelado')
            )
        INTO v_todos_prontos;
        
        -- Se todos os itens estão prontos, verificar e criar sugestão de instalação
        IF v_todos_prontos THEN
            -- Buscar dados do pedido/orçamento
            SELECT 
                p.orcamento_id,
                p.organization_id,
                o.cliente_nome,
                o.endereco,
                o.cidade
            INTO 
                v_orcamento_id,
                v_organization_id,
                v_cliente_nome,
                v_endereco,
                v_cidade
            FROM pedidos p
            JOIN orcamentos o ON o.id = p.orcamento_id
            WHERE p.id = v_pedido_id;
            
            -- Verificar se já existe instalação pendente para este pedido
            SELECT EXISTS(
                SELECT 1 FROM instalacoes 
                WHERE pedido_id = v_pedido_id 
                AND status IN ('pendente', 'agendada', 'em_andamento')
            ) INTO v_existe_instalacao_pendente;
            
            -- Se não existe instalação pendente, criar sugestão
            IF NOT v_existe_instalacao_pendente THEN
                INSERT INTO instalacoes (
                    pedido_id,
                    orcamento_id,
                    organization_id,
                    cliente_nome,
                    endereco,
                    cidade,
                    status,
                    data_criacao,
                    data_sugerida,
                    observacoes,
                    origem_sugestao
                ) VALUES (
                    v_pedido_id,
                    v_orcamento_id,
                    v_organization_id,
                    v_cliente_nome,
                    v_endereco,
                    v_cidade,
                    'pendente',
                    NOW(),
                    CURRENT_DATE + INTERVAL '3 days',
                    'Sugerido automaticamente quando todos os itens ficaram prontos',
                    'automation_item_pronto'
                );
                
                -- Atualizar pedido com flag de instalação sugerida
                UPDATE pedidos 
                SET 
                    instalacao_sugerida = TRUE,
                    instalacao_sugerida_em = NOW()
                WHERE id = v_pedido_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar tabela de instalações se não existir
CREATE TABLE IF NOT EXISTS instalacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    cliente_nome TEXT,
    endereco TEXT,
    cidade TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendada', 'em_andamento', 'concluida', 'cancelada')),
    data_agendada DATE,
    data_sugerida DATE,
    hora_inicio TIME,
    hora_fim TIME,
    instalador_id UUID,
    observacoes TEXT,
    origem_sugestao TEXT,
    checkin_lat DECIMAL(10,8),
    checkin_lng DECIMAL(11,8),
    checkin_foto_url TEXT,
    conclusao_lat DECIMAL(10,8),
    conclusao_lng DECIMAL(11,8),
    conclusao_foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_instalacoes_updated_at ON instalacoes;
CREATE TRIGGER update_instalacoes_updated_at
    BEFORE UPDATE ON instalacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para sugerir instalação quando item fica pronto
DROP TRIGGER IF EXISTS trg_item_pronto_sugerir_instalacao ON itens_pedido;
CREATE TRIGGER trg_item_pronto_sugerir_instalacao
    AFTER UPDATE ON itens_pedido
    FOR EACH ROW
    WHEN (NEW.status_item = 'pronto')
    EXECUTE FUNCTION handle_item_pronto_sugerir_instalacao();

-- ============================================================
-- FUNCTION: Trigger quando instalação é concluída
-- ============================================================
CREATE OR REPLACE FUNCTION handle_instalacao_concluida_entrega()
RETURNS TRIGGER AS $$
DECLARE
    v_orcamento_id UUID;
    v_cliente_nome TEXT;
    v_endereco TEXT;
    v_cidade TEXT;
    v_organization_id UUID;
    v_valor_total DECIMAL(10,2);
BEGIN
    -- Verificar se a instalação foi concluída
    IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
        -- Buscar dados do orçamento
        SELECT 
            o.id,
            o.organization_id,
            o.cliente_nome,
            o.endereco,
            o.cidade,
            o.valor_total
        INTO 
            v_orcamento_id,
            v_organization_id,
            v_cliente_nome,
            v_endereco,
            v_cidade,
            v_valor_total
        FROM orcamentos o
        JOIN pedidos p ON p.orcamento_id = o.id
        WHERE p.id = NEW.pedido_id;
        
        -- Criar registro de entrega
        INSERT INTO entregas (
            instalacao_id,
            pedido_id,
            orcamento_id,
            organization_id,
            cliente_nome,
            endereco,
            cidade,
            status,
            data_entrega,
            observacoes,
            origem_sugestao
        ) VALUES (
            NEW.id,
            NEW.pedido_id,
            v_orcamento_id,
            v_organization_id,
            v_cliente_nome,
            v_endereco,
            v_cidade,
            'pendente',
            CURRENT_DATE,
            'Gerado automaticamente após conclusão da instalação',
            'automation_instalacao_concluida'
        );
        
        -- Atualizar pedido
        UPDATE pedidos 
        SET 
            status_producao = 'instalacao_concluida',
            instalacao_concluida_em = NOW(),
            entrega_sugerida = TRUE,
            entrega_sugerida_em = NOW()
        WHERE id = NEW.pedido_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar tabela de entregas se não existir
CREATE TABLE IF NOT EXISTS entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instalacao_id UUID REFERENCES instalacoes(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    cliente_nome TEXT,
    endereco TEXT,
    cidade TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendada', 'em_andamento', 'concluida', 'cancelada')),
    data_entrega DATE,
    hora_entrega TIME,
    entregador_id UUID,
    observacoes TEXT,
    origem_sugestao TEXT,
    comprovante_foto_url TEXT,
    assinatura_cliente_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_entregas_updated_at ON entregas;
CREATE TRIGGER update_entregas_updated_at
    BEFORE UPDATE ON entregas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar entrega quando instalação é concluída
DROP TRIGGER IF EXISTS trg_instalacao_concluida_entrega ON instalacoes;
CREATE TRIGGER trg_instalacao_concluida_entrega
    AFTER UPDATE ON instalacoes
    FOR EACH ROW
    WHEN (NEW.status = 'concluida')
    EXECUTE FUNCTION handle_instalacao_concluida_entrega();

-- ============================================================
-- Adicionar campos ao pedidos para tracking
-- ============================================================
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS instalacao_sugerida BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instalacao_sugerida_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS instalacao_concluida_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS entrega_sugerida BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS entrega_sugerida_em TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- RLS Policies para novas tabelas
-- ============================================================

-- Ensure organization_id column exists in instalacoes
ALTER TABLE instalacoes
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Ensure organization_id column exists in entregas
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- RLS para instalacoes
ALTER TABLE instalacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instalacoes_select_org ON instalacoes;
CREATE POLICY instalacoes_select_org ON instalacoes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = instalacoes.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS instalacoes_insert_org ON instalacoes;
CREATE POLICY instalacoes_insert_org ON instalacoes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = instalacoes.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS instalacoes_update_org ON instalacoes;
CREATE POLICY instalacoes_update_org ON instalacoes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = instalacoes.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- RLS para entregas
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entregas_select_org ON entregas;
CREATE POLICY entregas_select_org ON entregas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = entregas.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS entregas_insert_org ON entregas;
CREATE POLICY entregas_insert_org ON entregas
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = entregas.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS entregas_update_org ON entregas;
CREATE POLICY entregas_update_org ON entregas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = entregas.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- ============================================================
-- INDEXES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_instalacoes_pedido_id ON instalacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_instalacoes_organization_id ON instalacoes(organization_id);
CREATE INDEX IF NOT EXISTS idx_instalacoes_status ON instalacoes(status);
CREATE INDEX IF NOT EXISTS idx_entregas_pedido_id ON entregas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_entregas_organization_id ON entregas(organization_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);

-- ============================================================
-- FUNCTION: Notificação quando pedido fica pronto
-- ============================================================
CREATE OR REPLACE FUNCTION notify_pedido_pronto()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido_id UUID;
    v_todos_prontos BOOLEAN;
    v_organization_id UUID;
    v_numero_pedido TEXT;
BEGIN
    -- Verificar se o status mudou para 'pronto'
    IF NEW.status_item = 'pronto' AND (OLD.status_item IS NULL OR OLD.status_item != 'pronto') THEN
        v_pedido_id := NEW.pedido_id;
        
        -- Buscar organization_id e numero_pedido
        SELECT 
            p.organization_id,
            p.numero_pedido
        INTO 
            v_organization_id,
            v_numero_pedido
        FROM pedidos p
        WHERE p.id = v_pedido_id;
        
        -- Verificar se todos os itens estão prontos
        SELECT 
            NOT EXISTS(
                SELECT 1 FROM itens_pedido 
                WHERE pedido_id = v_pedido_id 
                AND status_item NOT IN ('pronto', 'cancelado')
            )
        INTO v_todos_prontos;
        
        -- Se todos os itens estão prontos, criar notificação
        IF v_todos_prontos THEN
            INSERT INTO notifications (
                organization_id,
                type,
                title,
                message,
                entity_type,
                entity_id,
                created_at
            ) VALUES (
                v_organization_id,
                'pedido_pronto',
                'Pedido Pronto para Instalação',
                'O pedido ' || v_numero_pedido || ' está pronto para agendamento de instalação',
                'pedido',
                v_pedido_id,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificação
DROP TRIGGER IF EXISTS trg_notify_pedido_pronto ON itens_pedido;
CREATE TRIGGER trg_notify_pedido_pronto
    AFTER UPDATE ON itens_pedido
    FOR EACH ROW
    WHEN (NEW.status_item = 'pronto')
    EXECUTE FUNCTION notify_pedido_pronto();

-- Criar tabela de notificações se não existir
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_user ON notifications;
CREATE POLICY notifications_select_user ON notifications
    FOR SELECT USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = notifications.organization_id
            AND organization_members.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS notifications_update_user ON notifications;
CREATE POLICY notifications_update_user ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Indexes para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

COMMENT ON TABLE instalacoes IS 'Registro de instalações sugeridas automaticamente ou criadas manualmente';
COMMENT ON TABLE entregas IS 'Registro de entregas sugeridas automaticamente após instalação';
COMMENT ON TABLE notifications IS 'Notificações do sistema para usuários';
