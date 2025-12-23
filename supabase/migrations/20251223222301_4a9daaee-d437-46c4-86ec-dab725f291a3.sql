
-- =============================================
-- TABELA: contatos
-- Armazena todos os contatos/leads do CRM
-- =============================================
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  telefone_secundario TEXT,
  cidade TEXT,
  endereco TEXT,
  tipo TEXT NOT NULL DEFAULT 'lead', -- 'lead', 'cliente', 'inativo'
  origem TEXT, -- 'site', 'indicacao', 'instagram', 'whatsapp', 'outro'
  observacoes TEXT,
  tags TEXT[] DEFAULT '{}',
  valor_total_gasto NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para buscas frequentes
CREATE INDEX idx_contatos_telefone ON public.contatos(telefone);
CREATE INDEX idx_contatos_email ON public.contatos(email);
CREATE INDEX idx_contatos_tipo ON public.contatos(tipo);
CREATE INDEX idx_contatos_created_by ON public.contatos(created_by_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contatos_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- Policies para contatos
CREATE POLICY "Usuários podem ver contatos que criaram"
  ON public.contatos FOR SELECT
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar contatos"
  ON public.contatos FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus contatos"
  ON public.contatos FOR UPDATE
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar contatos"
  ON public.contatos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- TABELA: oportunidades
-- Pipeline de vendas do CRM
-- =============================================
CREATE TABLE public.oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID REFERENCES public.contatos(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  valor_estimado NUMERIC DEFAULT 0,
  etapa TEXT NOT NULL DEFAULT 'prospeccao', -- 'prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'
  temperatura TEXT DEFAULT 'morno', -- 'frio', 'morno', 'quente'
  motivo_perda TEXT,
  data_previsao_fechamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_oportunidades_contato ON public.oportunidades(contato_id);
CREATE INDEX idx_oportunidades_orcamento ON public.oportunidades(orcamento_id);
CREATE INDEX idx_oportunidades_etapa ON public.oportunidades(etapa);
CREATE INDEX idx_oportunidades_created_by ON public.oportunidades(created_by_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_oportunidades_updated_at
  BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

-- Policies para oportunidades
CREATE POLICY "Usuários podem ver oportunidades que criaram"
  ON public.oportunidades FOR SELECT
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar oportunidades"
  ON public.oportunidades FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas oportunidades"
  ON public.oportunidades FOR UPDATE
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar oportunidades"
  ON public.oportunidades FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- TABELA: atividades_crm
-- Registro de interações e follow-ups
-- =============================================
CREATE TABLE public.atividades_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID REFERENCES public.contatos(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL, -- 'ligacao', 'email', 'reuniao', 'visita', 'whatsapp', 'nota', 'outro'
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_atividade TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_lembrete TIMESTAMPTZ,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_atividades_contato ON public.atividades_crm(contato_id);
CREATE INDEX idx_atividades_oportunidade ON public.atividades_crm(oportunidade_id);
CREATE INDEX idx_atividades_orcamento ON public.atividades_crm(orcamento_id);
CREATE INDEX idx_atividades_data ON public.atividades_crm(data_atividade);
CREATE INDEX idx_atividades_lembrete ON public.atividades_crm(data_lembrete) WHERE data_lembrete IS NOT NULL AND concluida = false;
CREATE INDEX idx_atividades_created_by ON public.atividades_crm(created_by_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_atividades_crm_updated_at
  BEFORE UPDATE ON public.atividades_crm
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.atividades_crm ENABLE ROW LEVEL SECURITY;

-- Policies para atividades_crm
CREATE POLICY "Usuários podem ver atividades que criaram"
  ON public.atividades_crm FOR SELECT
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar atividades"
  ON public.atividades_crm FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas atividades"
  ON public.atividades_crm FOR UPDATE
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar atividades"
  ON public.atividades_crm FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- Adicionar campo contato_id na tabela orcamentos
-- para vincular orçamentos a contatos do CRM
-- =============================================
ALTER TABLE public.orcamentos 
ADD COLUMN contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL;

CREATE INDEX idx_orcamentos_contato ON public.orcamentos(contato_id);
