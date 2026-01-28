-- Migration: Sistema de Rodízio de Vendedores no WhatsApp
-- Data: 2026-01-28
-- Sprint 4

-- ============================================================
-- 1. ADICIONAR COLUNAS NA TABELA ORGANIZATIONS
-- ============================================================

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
    -- Coluna para ativar/desativar rodízio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'whatsapp_rotation_enabled'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN whatsapp_rotation_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Coluna para armazenar array de vendedores (user_ids)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'whatsapp_vendedores'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN whatsapp_vendedores UUID[] DEFAULT '{}';
    END IF;

    -- Coluna para índice do último vendedor atendido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'whatsapp_last_vendedor_index'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN whatsapp_last_vendedor_index INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- 2. CRIAR FUNÇÃO PARA OBTER PRÓXIMO VENDEDOR
-- ============================================================

CREATE OR REPLACE FUNCTION get_next_vendedor_whatsapp(p_org_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_whatsapp TEXT,
    index_position INTEGER
) AS $$
DECLARE
    v_vendedores UUID[];
    v_last_index INTEGER;
    v_next_index INTEGER;
    v_selected_user_id UUID;
BEGIN
    -- Buscar configuração da organização
    SELECT 
        o.whatsapp_vendedores,
        o.whatsapp_last_vendedor_index
    INTO 
        v_vendedores,
        v_last_index
    FROM organizations o
    WHERE o.id = p_org_id;

    -- Verificar se há vendedores configurados
    IF v_vendedores IS NULL OR array_length(v_vendedores, 1) IS NULL THEN
        RETURN;
    END IF;

    -- Calcular próximo índice (rodízio circular)
    v_next_index := (v_last_index + 1) % array_length(v_vendedores, 1);
    
    -- Se o array está vazio, retornar vazio
    IF array_length(v_vendedores, 1) = 0 THEN
        RETURN;
    END IF;

    -- Ajustar índice para base 1 (arrays em PostgreSQL são base 1)
    v_selected_user_id := v_vendedores[v_next_index + 1];

    -- Atualizar o índice na organização
    UPDATE organizations 
    SET whatsapp_last_vendedor_index = v_next_index
    WHERE id = p_org_id;

    -- Retornar dados do vendedor selecionado
    RETURN QUERY
    SELECT 
        u.id,
        COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
        COALESCE(u.raw_user_meta_data->>'whatsapp', '') as user_whatsapp,
        v_next_index as index_position
    FROM auth.users u
    WHERE u.id = v_selected_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION get_next_vendedor_whatsapp(UUID) IS 
'Retorna o próximo vendedor do rodízio de WhatsApp para uma organização.
Implementa algoritmo round-robin circular.
Atualiza automaticamente o índice do último vendedor atendido.';

-- ============================================================
-- 3. CRIAR VIEW PARA LISTAR VENDEDORES COM WHATSAPP
-- ============================================================

CREATE OR REPLACE VIEW organization_whatsapp_vendedores AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.whatsapp_rotation_enabled,
    o.whatsapp_vendedores,
    o.whatsapp_last_vendedor_index,
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
    u.email as user_email,
    COALESCE(u.raw_user_meta_data->>'whatsapp', '') as user_whatsapp,
    COALESCE(u.raw_user_meta_data->>'phone', '') as user_phone
FROM organizations o
LEFT JOIN LATERAL unnest(o.whatsapp_vendedores) AS vendedor_id ON true
LEFT JOIN auth.users u ON u.id = vendedor_id
WHERE o.whatsapp_rotation_enabled = true;

-- Comentário da view
COMMENT ON VIEW organization_whatsapp_vendedores IS 
'Lista todos os vendedores configurados para rodízio de WhatsApp por organização.';

-- ============================================================
-- 4. CRIAR TABELA DE HISTÓRICO DE ATRIBUIÇÕES (OPCIONAL)
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_name TEXT,
    lead_phone TEXT,
    lead_source TEXT DEFAULT 'landing_page',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_assignments_org 
ON whatsapp_lead_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_assignments_vendedor 
ON whatsapp_lead_assignments(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_assignments_assigned_at 
ON whatsapp_lead_assignments(assigned_at);

-- Comentário da tabela
COMMENT ON TABLE whatsapp_lead_assignments IS 
'Histórico de atribuições de leads via WhatsApp para vendedores.';

-- ============================================================
-- 5. FUNÇÃO PARA REGISTRAR ATRIBUIÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION assign_whatsapp_lead(
    p_org_id UUID,
    p_vendedor_id UUID,
    p_lead_name TEXT DEFAULT NULL,
    p_lead_phone TEXT DEFAULT NULL,
    p_lead_source TEXT DEFAULT 'landing_page'
)
RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    INSERT INTO whatsapp_lead_assignments (
        organization_id,
        vendedor_id,
        lead_name,
        lead_phone,
        lead_source
    ) VALUES (
        p_org_id,
        p_vendedor_id,
        p_lead_name,
        p_lead_phone,
        p_lead_source
    )
    RETURNING id INTO v_assignment_id;

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION assign_whatsapp_lead(UUID, UUID, TEXT, TEXT, TEXT) IS 
'Registra uma atribuição de lead via WhatsApp para um vendedor.';

-- ============================================================
-- 6. POLÍTICAS RLS (SE RLS ESTIVER ATIVADO)
-- ============================================================

-- Habilitar RLS na tabela de histórico
ALTER TABLE whatsapp_lead_assignments ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas atribuições da sua organização
CREATE POLICY whatsapp_lead_assignments_select_org
ON whatsapp_lead_assignments
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Política: Administradores podem inserir atribuições
CREATE POLICY whatsapp_lead_assignments_insert_admin
ON whatsapp_lead_assignments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = whatsapp_lead_assignments.organization_id
        AND role = 'admin'
    )
);

-- ============================================================
-- 7. DADOS INICIAIS (PARA ORGANIZAÇÕES EXISTENTES)
-- ============================================================

-- Atualizar organizações existentes com valores padrão
UPDATE organizations 
SET 
    whatsapp_rotation_enabled = COALESCE(whatsapp_rotation_enabled, false),
    whatsapp_vendedores = COALESCE(whatsapp_vendedores, '{}'),
    whatsapp_last_vendedor_index = COALESCE(whatsapp_last_vendedor_index, 0)
WHERE whatsapp_rotation_enabled IS NULL;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
