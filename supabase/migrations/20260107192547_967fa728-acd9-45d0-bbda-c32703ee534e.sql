-- =============================================
-- FASE 1: Remover políticas RLS duplicadas (antigas baseadas em created_by_user_id)
-- =============================================

-- Orçamentos - manter apenas políticas baseadas em organization_id
DROP POLICY IF EXISTS "Usuários podem ver seus orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Usuários podem deletar seus orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Usuários podem criar orçamentos" ON orcamentos;

-- Contatos - manter apenas políticas baseadas em organization_id
DROP POLICY IF EXISTS "Usuários podem ver seus contatos" ON contatos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus contatos" ON contatos;
DROP POLICY IF EXISTS "Usuários podem deletar seus contatos" ON contatos;
DROP POLICY IF EXISTS "Usuários podem criar contatos" ON contatos;

-- Contas a Receber
DROP POLICY IF EXISTS "Usuários podem ver suas contas a receber" ON contas_receber;
DROP POLICY IF EXISTS "Usuários podem atualizar suas contas a receber" ON contas_receber;
DROP POLICY IF EXISTS "Usuários podem criar contas a receber" ON contas_receber;

-- Contas a Pagar
DROP POLICY IF EXISTS "Usuários podem ver suas contas a pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Usuários podem atualizar suas contas a pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Usuários podem criar contas a pagar" ON contas_pagar;

-- Lançamentos Financeiros
DROP POLICY IF EXISTS "Usuários podem ver seus lançamentos" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Usuários podem atualizar seus lançamentos" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Usuários podem criar lançamentos" ON lancamentos_financeiros;

-- Oportunidades
DROP POLICY IF EXISTS "Usuários podem ver oportunidades que criaram" ON oportunidades;
DROP POLICY IF EXISTS "Usuários podem atualizar suas oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuários podem criar oportunidades" ON oportunidades;

-- Atividades CRM
DROP POLICY IF EXISTS "Usuários podem ver atividades que criaram" ON atividades_crm;
DROP POLICY IF EXISTS "Usuários podem atualizar suas atividades" ON atividades_crm;
DROP POLICY IF EXISTS "Usuários podem criar atividades" ON atividades_crm;

-- Comissões
DROP POLICY IF EXISTS "Usuários podem ver comissões relacionadas a eles" ON comissoes;
DROP POLICY IF EXISTS "Usuários podem criar comissões" ON comissoes;

-- Pedidos
DROP POLICY IF EXISTS "Usuários podem ver pedidos de seus orçamentos" ON pedidos;
DROP POLICY IF EXISTS "Usuários podem atualizar pedidos de seus orçamentos" ON pedidos;
DROP POLICY IF EXISTS "Usuários podem criar pedidos de seus orçamentos" ON pedidos;

-- Notificações
DROP POLICY IF EXISTS "Users can view their own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can create notifications" ON notificacoes;

-- =============================================
-- FASE 2: Adicionar organization_id nas tabelas de configuração
-- =============================================

-- 2.1 Adicionar coluna organization_id em configuracoes_sistema
ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2.2 Adicionar coluna organization_id em categorias_financeiras
ALTER TABLE categorias_financeiras 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2.3 Adicionar coluna organization_id em formas_pagamento
ALTER TABLE formas_pagamento 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- =============================================
-- FASE 2.4: Atualizar RLS para tabelas de configuração
-- =============================================

-- Configurações Sistema - políticas por organização
DROP POLICY IF EXISTS "Authenticated users can view configs" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Only admins can modify configs" ON configuracoes_sistema;

CREATE POLICY "Org users can view their configs" 
ON configuracoes_sistema FOR SELECT 
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org admins can manage their configs" 
ON configuracoes_sistema FOR ALL 
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- Categorias Financeiras - políticas por organização
DROP POLICY IF EXISTS "Usuários autenticados podem ver categorias" ON categorias_financeiras;
DROP POLICY IF EXISTS "Apenas admins podem gerenciar categorias" ON categorias_financeiras;

CREATE POLICY "Org users can view their categories" 
ON categorias_financeiras FOR SELECT 
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org admins can manage their categories" 
ON categorias_financeiras FOR ALL 
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- Formas de Pagamento - políticas por organização
DROP POLICY IF EXISTS "Usuários autenticados podem ver formas" ON formas_pagamento;
DROP POLICY IF EXISTS "Apenas admins podem gerenciar formas" ON formas_pagamento;

CREATE POLICY "Org users can view their payment methods" 
ON formas_pagamento FOR SELECT 
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org admins can manage their payment methods" 
ON formas_pagamento FOR ALL 
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- =============================================
-- FASE 2.5: Migrar dados existentes para Prisma
-- =============================================

-- Atribuir configurações existentes à organização Prisma
UPDATE configuracoes_sistema 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
WHERE organization_id IS NULL;

-- Atribuir categorias existentes à organização Prisma
UPDATE categorias_financeiras 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
WHERE organization_id IS NULL;

-- Atribuir formas de pagamento existentes à organização Prisma
UPDATE formas_pagamento 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
WHERE organization_id IS NULL;

-- =============================================
-- FASE 2.6: Criar configurações padrão para Andreia Weber
-- =============================================

-- Clonar configurações do sistema
INSERT INTO configuracoes_sistema (chave, valor, descricao, organization_id)
SELECT chave, valor, descricao, (SELECT id FROM organizations WHERE slug = 'andreia-weber' LIMIT 1)
FROM configuracoes_sistema
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Clonar categorias financeiras
INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo, organization_id)
SELECT nome, tipo, cor, icone, ativo, (SELECT id FROM organizations WHERE slug = 'andreia-weber' LIMIT 1)
FROM categorias_financeiras
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Clonar formas de pagamento
INSERT INTO formas_pagamento (nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, organization_id)
SELECT nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, (SELECT id FROM organizations WHERE slug = 'andreia-weber' LIMIT 1)
FROM formas_pagamento
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
ON CONFLICT DO NOTHING;

-- =============================================
-- FASE 2.7: Preencher dados comerciais da Andreia
-- =============================================

UPDATE organizations SET
  email = 'andreiawebermartins@outlook.com',
  tagline = 'Decoração com Estilo e Elegância',
  primary_color = '#D4AF37'
WHERE slug = 'andreia-weber';