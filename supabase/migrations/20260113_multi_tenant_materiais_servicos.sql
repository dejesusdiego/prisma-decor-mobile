-- ============================================================
-- FASE 1: MULTI-TENANCY PARA MATERIAIS E SERVIÇOS
-- Prisma ERP - Correções para replicabilidade
-- ============================================================

-- IMPORTANTE: Esta migration converte tabelas globais para multi-tenant
-- Todos os registros existentes serão associados à organização Prisma

-- ID fixo da organização Prisma (padrão)
-- Você pode ajustar este ID conforme necessário
DO $$
DECLARE
  v_prisma_org_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Garantir que a organização Prisma existe
  INSERT INTO organizations (id, name, slug, active)
  VALUES (v_prisma_org_id, 'Prisma Interiores', 'prisma', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- 1. MATERIAIS
-- ============================================================

-- Adicionar coluna organization_id
ALTER TABLE materiais 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Atualizar registros existentes para a organização Prisma
UPDATE materiais 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_materiais_org ON materiais(organization_id);

-- Habilitar RLS
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "materiais_select_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_insert_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_update_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_delete_policy" ON materiais;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver materiais" ON materiais;
DROP POLICY IF EXISTS "Admins podem gerenciar materiais" ON materiais;

-- Criar novas policies
CREATE POLICY "materiais_select_org" ON materiais
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL -- Compatibilidade temporária
  );

CREATE POLICY "materiais_insert_org" ON materiais
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_update_org" ON materiais
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_delete_org" ON materiais
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 2. SERVIÇOS DE CONFECÇÃO
-- ============================================================

ALTER TABLE servicos_confeccao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE servicos_confeccao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_confeccao_org ON servicos_confeccao(organization_id);

ALTER TABLE servicos_confeccao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos_confeccao_select" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_insert" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_update" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_delete" ON servicos_confeccao;

CREATE POLICY "servicos_confeccao_select_org" ON servicos_confeccao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_confeccao_insert_org" ON servicos_confeccao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_confeccao_update_org" ON servicos_confeccao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_confeccao_delete_org" ON servicos_confeccao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 3. SERVIÇOS DE INSTALAÇÃO
-- ============================================================

ALTER TABLE servicos_instalacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE servicos_instalacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_instalacao_org ON servicos_instalacao(organization_id);

ALTER TABLE servicos_instalacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos_instalacao_select" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_insert" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_update" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_delete" ON servicos_instalacao;

CREATE POLICY "servicos_instalacao_select_org" ON servicos_instalacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_instalacao_insert_org" ON servicos_instalacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_update_org" ON servicos_instalacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_delete_org" ON servicos_instalacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 4. CONFIGURAÇÕES DE COMISSÃO
-- ============================================================

ALTER TABLE configuracoes_comissao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE configuracoes_comissao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_configuracoes_comissao_org ON configuracoes_comissao(organization_id);

ALTER TABLE configuracoes_comissao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracoes_comissao_select" ON configuracoes_comissao;
DROP POLICY IF EXISTS "configuracoes_comissao_all" ON configuracoes_comissao;

CREATE POLICY "configuracoes_comissao_select_org" ON configuracoes_comissao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "configuracoes_comissao_insert_org" ON configuracoes_comissao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "configuracoes_comissao_update_org" ON configuracoes_comissao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "configuracoes_comissao_delete_org" ON configuracoes_comissao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 5. PADRÕES DE CONCILIAÇÃO
-- ============================================================

ALTER TABLE padroes_conciliacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE padroes_conciliacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_padroes_conciliacao_org ON padroes_conciliacao(organization_id);

ALTER TABLE padroes_conciliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "padroes_conciliacao_select" ON padroes_conciliacao;
DROP POLICY IF EXISTS "padroes_conciliacao_all" ON padroes_conciliacao;

CREATE POLICY "padroes_conciliacao_select_org" ON padroes_conciliacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "padroes_conciliacao_insert_org" ON padroes_conciliacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "padroes_conciliacao_update_org" ON padroes_conciliacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "padroes_conciliacao_delete_org" ON padroes_conciliacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 6. REGRAS DE CONCILIAÇÃO
-- ============================================================

ALTER TABLE regras_conciliacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE regras_conciliacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_regras_conciliacao_org ON regras_conciliacao(organization_id);

ALTER TABLE regras_conciliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regras_conciliacao_select" ON regras_conciliacao;
DROP POLICY IF EXISTS "regras_conciliacao_all" ON regras_conciliacao;

CREATE POLICY "regras_conciliacao_select_org" ON regras_conciliacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "regras_conciliacao_insert_org" ON regras_conciliacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "regras_conciliacao_update_org" ON regras_conciliacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "regras_conciliacao_delete_org" ON regras_conciliacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 7. EXTRATOS BANCÁRIOS
-- ============================================================

ALTER TABLE extratos_bancarios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE extratos_bancarios 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_org ON extratos_bancarios(organization_id);

ALTER TABLE extratos_bancarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extratos_bancarios_select" ON extratos_bancarios;

CREATE POLICY "extratos_bancarios_select_org" ON extratos_bancarios
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "extratos_bancarios_insert_org" ON extratos_bancarios
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "extratos_bancarios_update_org" ON extratos_bancarios
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "extratos_bancarios_delete_org" ON extratos_bancarios
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 8. MOVIMENTAÇÕES EXTRATO
-- ============================================================

ALTER TABLE movimentacoes_extrato 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Atualizar baseado no extrato
UPDATE movimentacoes_extrato me
SET organization_id = e.organization_id
FROM extratos_bancarios e
WHERE me.extrato_id = e.id AND me.organization_id IS NULL;

-- Fallback para Prisma
UPDATE movimentacoes_extrato 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_movimentacoes_extrato_org ON movimentacoes_extrato(organization_id);

ALTER TABLE movimentacoes_extrato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movimentacoes_extrato_select" ON movimentacoes_extrato;

CREATE POLICY "movimentacoes_extrato_select_org" ON movimentacoes_extrato
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "movimentacoes_extrato_insert_org" ON movimentacoes_extrato
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "movimentacoes_extrato_update_org" ON movimentacoes_extrato
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "movimentacoes_extrato_delete_org" ON movimentacoes_extrato
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- FUNÇÃO AUXILIAR PARA ONBOARDING DE NOVA ORGANIZAÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION setup_new_organization(
  p_org_id UUID,
  p_template_org_id UUID DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copiar materiais template para nova organização
  INSERT INTO materiais (
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, ativo,
    organization_id
  )
  SELECT 
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, true,
    p_org_id
  FROM materiais
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de confecção
  INSERT INTO servicos_confeccao (
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, ativo, organization_id
  )
  SELECT 
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, true, p_org_id
  FROM servicos_confeccao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de instalação
  INSERT INTO servicos_instalacao (
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, ativo, organization_id
  )
  SELECT 
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, true, p_org_id
  FROM servicos_instalacao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar categorias financeiras padrão
  INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo, organization_id)
  SELECT nome, tipo, cor, icone, true, p_org_id
  FROM categorias_financeiras
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar formas de pagamento padrão
  INSERT INTO formas_pagamento (
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, organization_id
  )
  SELECT 
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, true, p_org_id
  FROM formas_pagamento
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar configurações do sistema
  INSERT INTO configuracoes_sistema (chave, valor, descricao, organization_id)
  SELECT chave, valor, descricao, p_org_id
  FROM configuracoes_sistema
  WHERE organization_id = p_template_org_id;
  
END;
$$;

-- Comentário de documentação
COMMENT ON FUNCTION setup_new_organization IS 
'Configura uma nova organização copiando materiais, serviços e configurações de um template (padrão: Prisma).
Uso: SELECT setup_new_organization(''uuid-da-nova-org'');';
