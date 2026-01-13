-- =====================================================
-- PRISMA ERP - SCHEMA BACKUP - TABELAS
-- Gerado em: 2026-01-13
-- =====================================================

-- =====================================================
-- TABELAS BASE (sem foreign keys para outras tabelas)
-- =====================================================

-- Organizations (multi-tenancy)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  cnpj TEXT,
  tagline TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plans (planos de assinatura)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  preco_mensal DECIMAL(10,2) NOT NULL,
  preco_implementacao DECIMAL(10,2) DEFAULT 0,
  max_usuarios INTEGER,
  max_usuarios_expansivel BOOLEAN DEFAULT true,
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90,
  max_orcamentos_mes INTEGER,
  max_storage_gb INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Super Admins (donos do ERP)
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Subscriptions (assinaturas)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  usuarios_adicionais INTEGER DEFAULT 0,
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90,
  custom_max_usuarios INTEGER,
  custom_preco_mensal DECIMAL(10,2),
  payment_method TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Subscription Payments
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  metodo_pagamento TEXT,
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Organization Usage
CREATE TABLE IF NOT EXISTS public.organization_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  orcamentos_criados INTEGER DEFAULT 0,
  usuarios_ativos INTEGER DEFAULT 0,
  storage_usado_mb DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, mes_referencia)
);

-- User Onboarding
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tours_completed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELAS DE CADASTROS BASE
-- =====================================================

-- Categorias Financeiras
CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  cor TEXT DEFAULT '#6B7280',
  icone TEXT DEFAULT 'circle',
  ativo BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Formas de Pagamento
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  permite_parcelamento BOOLEAN NOT NULL DEFAULT true,
  max_parcelas INTEGER DEFAULT 1,
  taxa_percentual DECIMAL(5,2) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materiais
CREATE TABLE IF NOT EXISTS public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT,
  cor TEXT,
  fornecedor TEXT,
  linha TEXT,
  codigo_item TEXT,
  preco_custo DECIMAL(10,2) NOT NULL,
  preco_tabela DECIMAL(10,2) NOT NULL,
  margem_tabela_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'm²',
  largura_metro DECIMAL(5,2),
  perda_percent DECIMAL(5,2),
  area_min_fat DECIMAL(10,2),
  potencia TEXT,
  aplicacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Serviços de Confecção
CREATE TABLE IF NOT EXISTS public.servicos_confeccao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_modelo TEXT NOT NULL,
  preco_custo DECIMAL(10,2) NOT NULL,
  preco_tabela DECIMAL(10,2) NOT NULL,
  margem_tabela_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'mt',
  codigo_item TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Serviços de Instalação
CREATE TABLE IF NOT EXISTS public.servicos_instalacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_custo_por_ponto DECIMAL(10,2) NOT NULL,
  preco_tabela_por_ponto DECIMAL(10,2) NOT NULL,
  margem_tabela_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  codigo_item TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELAS CRM
-- =====================================================

-- Contatos
CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  telefone_secundario TEXT,
  endereco TEXT,
  cidade TEXT,
  tipo TEXT NOT NULL DEFAULT 'lead',
  origem TEXT,
  tags TEXT[],
  observacoes TEXT,
  valor_total_gasto DECIMAL(12,2) DEFAULT 0,
  ultima_interacao_em TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orçamentos
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  endereco TEXT NOT NULL DEFAULT '',
  cidade TEXT DEFAULT 'Balneário Camboriú',
  observacoes TEXT,
  margem_percent DECIMAL(5,2) NOT NULL,
  margem_tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  status_updated_at TIMESTAMPTZ DEFAULT now(),
  validade_dias INTEGER DEFAULT 7,
  subtotal_materiais DECIMAL(12,2) DEFAULT 0,
  subtotal_mao_obra_costura DECIMAL(12,2) DEFAULT 0,
  subtotal_instalacao DECIMAL(12,2) DEFAULT 0,
  custo_total DECIMAL(12,2) DEFAULT 0,
  total_geral DECIMAL(12,2) DEFAULT 0,
  desconto_tipo TEXT,
  desconto_valor DECIMAL(12,2) DEFAULT 0,
  total_com_desconto DECIMAL(12,2),
  custos_gerados BOOLEAN DEFAULT false,
  contato_id UUID REFERENCES public.contatos(id),
  vendedor_id UUID,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cortina Items
CREATE TABLE IF NOT EXISTS public.cortina_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  nome_identificacao TEXT NOT NULL,
  tipo_cortina TEXT NOT NULL,
  tipo_produto TEXT DEFAULT 'cortina',
  largura DECIMAL(6,2) NOT NULL,
  altura DECIMAL(6,2) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  ambiente TEXT,
  descricao TEXT,
  fabrica TEXT,
  observacoes_internas TEXT,
  precisa_instalacao BOOLEAN NOT NULL DEFAULT false,
  pontos_instalacao INTEGER DEFAULT 1,
  motorizada BOOLEAN DEFAULT false,
  motor_id UUID REFERENCES public.materiais(id),
  tecido_id TEXT,
  forro_id TEXT,
  trilho_id TEXT,
  material_principal_id TEXT,
  servicos_adicionais_ids TEXT[] DEFAULT '{}',
  barra_cm INTEGER DEFAULT 0,
  barra_forro_cm DECIMAL(5,2) DEFAULT 0,
  is_outro BOOLEAN DEFAULT false,
  custo_tecido DECIMAL(10,2) DEFAULT 0,
  custo_forro DECIMAL(10,2) DEFAULT 0,
  custo_trilho DECIMAL(10,2) DEFAULT 0,
  custo_acessorios DECIMAL(10,2) DEFAULT 0,
  custo_costura DECIMAL(10,2) DEFAULT 0,
  custo_instalacao DECIMAL(10,2) DEFAULT 0,
  custo_motor DECIMAL(10,2) DEFAULT 0,
  custo_total DECIMAL(10,2) DEFAULT 0,
  preco_unitario DECIMAL(10,2),
  preco_venda DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Oportunidades
CREATE TABLE IF NOT EXISTS public.oportunidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contato_id UUID REFERENCES public.contatos(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  valor_estimado DECIMAL(12,2) DEFAULT 0,
  etapa TEXT NOT NULL DEFAULT 'prospeccao',
  temperatura TEXT DEFAULT 'morno',
  origem TEXT,
  data_previsao_fechamento DATE,
  motivo_perda TEXT,
  observacoes TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atividades CRM
CREATE TABLE IF NOT EXISTS public.atividades_crm (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  contato_id UUID REFERENCES public.contatos(id),
  oportunidade_id UUID REFERENCES public.oportunidades(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  data_atividade TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_lembrete TIMESTAMPTZ,
  concluida BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solicitações de Visita
CREATE TABLE IF NOT EXISTS public.solicitacoes_visita (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cidade TEXT NOT NULL,
  endereco TEXT,
  complemento TEXT,
  mensagem TEXT,
  data_agendada DATE NOT NULL,
  horario_agendado TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  status_updated_at TIMESTAMPTZ DEFAULT now(),
  observacoes_internas TEXT,
  visualizada BOOLEAN NOT NULL DEFAULT false,
  visualizada_em TIMESTAMPTZ,
  visualizada_por UUID,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS FINANCEIRAS
-- =====================================================

-- Contas a Pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  fornecedor TEXT,
  numero_documento TEXT,
  observacoes TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  frequencia_recorrencia TEXT,
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  conta_origem_id UUID REFERENCES public.contas_pagar(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contas a Receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  descricao TEXT NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  valor_pago DECIMAL(12,2) NOT NULL DEFAULT 0,
  numero_parcelas INTEGER NOT NULL DEFAULT 1,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  orcamento_id UUID REFERENCES public.orcamentos(id),
  lancamento_origem_id UUID,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parcelas a Receber
CREATE TABLE IF NOT EXISTS public.parcelas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lançamentos Financeiros
CREATE TABLE IF NOT EXISTS public.lancamentos_financeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE,
  observacoes TEXT,
  ignorado BOOLEAN DEFAULT false,
  motivo_ignorado TEXT,
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  parcela_receber_id UUID REFERENCES public.parcelas_receber(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar FK depois para evitar ciclo
ALTER TABLE public.contas_receber 
  ADD CONSTRAINT fk_lancamento_origem 
  FOREIGN KEY (lancamento_origem_id) 
  REFERENCES public.lancamentos_financeiros(id);

-- Extratos Bancários
CREATE TABLE IF NOT EXISTS public.extratos_bancarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_arquivo TEXT NOT NULL,
  banco TEXT,
  conta TEXT,
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'processando',
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Regras de Conciliação
CREATE TABLE IF NOT EXISTS public.regras_conciliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  padrao_descricao TEXT NOT NULL,
  tipo_lancamento TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  ativa BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 0,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Movimentações do Extrato
CREATE TABLE IF NOT EXISTS public.movimentacoes_extrato (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extrato_id UUID REFERENCES public.extratos_bancarios(id),
  descricao TEXT NOT NULL,
  tipo TEXT,
  valor DECIMAL(12,2) NOT NULL,
  data_movimentacao DATE NOT NULL,
  numero_documento TEXT,
  conciliado BOOLEAN DEFAULT false,
  ignorado BOOLEAN DEFAULT false,
  lancamento_id UUID REFERENCES public.lancamentos_financeiros(id),
  regra_aplicada_id UUID REFERENCES public.regras_conciliacao(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Padrões de Conciliação
CREATE TABLE IF NOT EXISTS public.padroes_conciliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  padrao_descricao TEXT NOT NULL,
  tipo_conciliacao TEXT NOT NULL,
  tipo_lancamento TEXT,
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  confianca INTEGER DEFAULT 80,
  vezes_usado INTEGER DEFAULT 1,
  ultima_utilizacao TIMESTAMPTZ DEFAULT now(),
  ativo BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comprovantes de Pagamento
CREATE TABLE IF NOT EXISTS public.comprovantes_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arquivo_url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes INTEGER,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  lancamento_id UUID REFERENCES public.lancamentos_financeiros(id),
  parcela_receber_id UUID REFERENCES public.parcelas_receber(id),
  uploaded_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comissões
CREATE TABLE IF NOT EXISTS public.comissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_nome TEXT NOT NULL,
  vendedor_user_id UUID,
  orcamento_id UUID REFERENCES public.orcamentos(id),
  percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  valor_base DECIMAL(12,2) NOT NULL,
  valor_comissao DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_pagamento DATE,
  observacoes TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações de Comissão
CREATE TABLE IF NOT EXISTS public.configuracoes_comissao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_user_id UUID NOT NULL UNIQUE,
  vendedor_nome TEXT NOT NULL,
  percentual_padrao DECIMAL(5,2) NOT NULL DEFAULT 5,
  ativo BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS PRODUÇÃO
-- =====================================================

-- Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT NOT NULL UNIQUE,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id),
  status_producao TEXT NOT NULL DEFAULT 'aguardando_materiais',
  prioridade TEXT NOT NULL DEFAULT 'normal',
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  previsao_entrega DATE,
  data_pronto TIMESTAMPTZ,
  observacoes_producao TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens do Pedido
CREATE TABLE IF NOT EXISTS public.itens_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cortina_item_id UUID NOT NULL REFERENCES public.cortina_items(id),
  status_item TEXT NOT NULL DEFAULT 'fila',
  responsavel TEXT,
  observacoes TEXT,
  data_inicio_corte TIMESTAMPTZ,
  data_fim_corte TIMESTAMPTZ,
  data_inicio_costura TIMESTAMPTZ,
  data_fim_costura TIMESTAMPTZ,
  data_finalizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materiais do Pedido
CREATE TABLE IF NOT EXISTS public.materiais_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL,
  nome_material TEXT NOT NULL,
  categoria TEXT NOT NULL,
  quantidade_necessaria DECIMAL(10,2) NOT NULL DEFAULT 1,
  unidade TEXT DEFAULT 'm',
  recebido BOOLEAN DEFAULT false,
  data_recebimento TIMESTAMPTZ,
  recebido_por UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Instalações
CREATE TABLE IF NOT EXISTS public.instalacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id),
  data_agendada DATE NOT NULL,
  turno TEXT NOT NULL DEFAULT 'manha',
  instalador TEXT,
  endereco TEXT NOT NULL,
  cidade TEXT,
  status TEXT NOT NULL DEFAULT 'agendada',
  data_realizada TIMESTAMPTZ,
  observacoes TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de Produção
CREATE TABLE IF NOT EXISTS public.historico_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id),
  item_pedido_id UUID REFERENCES public.itens_pedido(id),
  tipo_evento TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  descricao TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELAS AUXILIARES
-- =====================================================

-- Histórico de Descontos
CREATE TABLE IF NOT EXISTS public.historico_descontos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id),
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  desconto_tipo_anterior TEXT,
  desconto_valor_anterior DECIMAL(12,2),
  desconto_tipo_novo TEXT,
  desconto_valor_novo DECIMAL(12,2),
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log de Alterações de Status
CREATE TABLE IF NOT EXISTS public.log_alteracoes_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id),
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  origem TEXT DEFAULT 'trigger',
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  prioridade TEXT DEFAULT 'normal',
  lida BOOLEAN NOT NULL DEFAULT false,
  data_lembrete TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  link_acao TEXT,
  referencia_tipo TEXT,
  referencia_id UUID,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Organization Members
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- Materiais
CREATE INDEX IF NOT EXISTS idx_materiais_categoria ON public.materiais(categoria);
CREATE INDEX IF NOT EXISTS idx_materiais_org ON public.materiais(organization_id);
CREATE INDEX IF NOT EXISTS idx_materiais_ativo ON public.materiais(ativo);

-- Orçamentos
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON public.orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON public.orcamentos(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_orcamentos_org ON public.orcamentos(organization_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON public.orcamentos(created_at);

-- Contatos
CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON public.contatos(telefone);
CREATE INDEX IF NOT EXISTS idx_contatos_org ON public.contatos(organization_id);
CREATE INDEX IF NOT EXISTS idx_contatos_tipo ON public.contatos(tipo);

-- Oportunidades
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa ON public.oportunidades(etapa);
CREATE INDEX IF NOT EXISTS idx_oportunidades_contato ON public.oportunidades(contato_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_org ON public.oportunidades(organization_id);

-- Atividades
CREATE INDEX IF NOT EXISTS idx_atividades_contato ON public.atividades_crm(contato_id);
CREATE INDEX IF NOT EXISTS idx_atividades_data ON public.atividades_crm(data_atividade);
CREATE INDEX IF NOT EXISTS idx_atividades_crm_org ON public.atividades_crm(organization_id);

-- Lançamentos
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON public.lancamentos_financeiros(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON public.lancamentos_financeiros(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_org ON public.lancamentos_financeiros(organization_id);

-- Contas a Pagar
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_org ON public.contas_pagar(organization_id);

-- Contas a Receber
CREATE INDEX IF NOT EXISTS idx_contas_receber_org ON public.contas_receber(organization_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);

-- Pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status_producao);
CREATE INDEX IF NOT EXISTS idx_pedidos_org ON public.pedidos(organization_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_orcamento ON public.pedidos(orcamento_id);

-- =====================================================
-- HABILITAR RLS
-- =====================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_confeccao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_instalacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cortina_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_extrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padroes_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprovantes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_comissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_descontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_alteracoes_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
