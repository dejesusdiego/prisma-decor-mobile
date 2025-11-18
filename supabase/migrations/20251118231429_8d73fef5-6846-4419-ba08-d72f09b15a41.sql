-- Criar tabela de materiais (tecidos, forros, trilhos, acessórios)
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('tecido', 'forro', 'trilho', 'acessorio', 'papel')),
  unidade TEXT NOT NULL DEFAULT 'M',
  largura_metro NUMERIC(10, 2),
  preco_custo NUMERIC(10, 2) NOT NULL,
  preco_tabela NUMERIC(10, 2) NOT NULL,
  margem_tabela_percent NUMERIC(5, 2) NOT NULL DEFAULT 61.5,
  perda_percent NUMERIC(5, 2) DEFAULT 10,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para busca eficiente
CREATE INDEX idx_materiais_categoria ON public.materiais(categoria);
CREATE INDEX idx_materiais_ativo ON public.materiais(ativo);
CREATE INDEX idx_materiais_nome ON public.materiais(nome);

-- Tabela de serviços de confecção
CREATE TABLE public.servicos_confeccao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_modelo TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'mt',
  preco_custo NUMERIC(10, 2) NOT NULL,
  preco_tabela NUMERIC(10, 2) NOT NULL,
  margem_tabela_percent NUMERIC(5, 2) NOT NULL DEFAULT 55,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_servicos_confeccao_ativo ON public.servicos_confeccao(ativo);

-- Tabela de serviços de instalação
CREATE TABLE public.servicos_instalacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_custo_por_ponto NUMERIC(10, 2) NOT NULL,
  preco_tabela_por_ponto NUMERIC(10, 2) NOT NULL,
  margem_tabela_percent NUMERIC(5, 2) NOT NULL DEFAULT 61.5,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de orçamentos
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  ambiente TEXT NOT NULL,
  observacoes TEXT,
  margem_tipo TEXT NOT NULL CHECK (margem_tipo IN ('baixa', 'padrao', 'premium', 'personalizada')),
  margem_percent NUMERIC(5, 2) NOT NULL,
  subtotal_materiais NUMERIC(10, 2) DEFAULT 0,
  subtotal_mao_obra_costura NUMERIC(10, 2) DEFAULT 0,
  subtotal_instalacao NUMERIC(10, 2) DEFAULT 0,
  custo_total NUMERIC(10, 2) DEFAULT 0,
  total_geral NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'perdido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_orcamentos_status ON public.orcamentos(status);
CREATE INDEX idx_orcamentos_created_by ON public.orcamentos(created_by_user_id);
CREATE INDEX idx_orcamentos_codigo ON public.orcamentos(codigo);

-- Tabela de cortinas (itens do orçamento)
CREATE TABLE public.cortina_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  nome_identificacao TEXT NOT NULL,
  largura NUMERIC(10, 2) NOT NULL,
  altura NUMERIC(10, 2) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  tipo_cortina TEXT NOT NULL CHECK (tipo_cortina IN ('wave', 'prega', 'painel', 'rolo')),
  tecido_id UUID NOT NULL REFERENCES public.materiais(id),
  forro_id UUID REFERENCES public.materiais(id),
  trilho_id UUID NOT NULL REFERENCES public.materiais(id),
  precisa_instalacao BOOLEAN NOT NULL DEFAULT false,
  pontos_instalacao INTEGER DEFAULT 1,
  custo_tecido NUMERIC(10, 2) DEFAULT 0,
  custo_forro NUMERIC(10, 2) DEFAULT 0,
  custo_trilho NUMERIC(10, 2) DEFAULT 0,
  custo_acessorios NUMERIC(10, 2) DEFAULT 0,
  custo_costura NUMERIC(10, 2) DEFAULT 0,
  custo_instalacao NUMERIC(10, 2) DEFAULT 0,
  custo_total NUMERIC(10, 2) DEFAULT 0,
  preco_venda NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cortina_items_orcamento ON public.cortina_items(orcamento_id);

-- Função para gerar código de orçamento automaticamente
CREATE OR REPLACE FUNCTION public.gerar_codigo_orcamento()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  novo_codigo TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Buscar a maior sequência do ano atual
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo ~ ('^ORC-' || ano || '-[0-9]+$')
      THEN CAST(SUBSTRING(codigo FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequencia
  FROM public.orcamentos
  WHERE codigo LIKE 'ORC-' || ano || '-%';
  
  novo_codigo := 'ORC-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN novo_codigo;
END;
$$;

-- Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION public.trigger_gerar_codigo_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.gerar_codigo_orcamento();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_insert_orcamento_codigo
BEFORE INSERT ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_gerar_codigo_orcamento();

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_materiais_updated_at
BEFORE UPDATE ON public.materiais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_confeccao_updated_at
BEFORE UPDATE ON public.servicos_confeccao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_instalacao_updated_at
BEFORE UPDATE ON public.servicos_instalacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at
BEFORE UPDATE ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cortina_items_updated_at
BEFORE UPDATE ON public.cortina_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_confeccao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_instalacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cortina_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - todos os usuários autenticados podem ver e editar
-- (como é um sistema interno, simplificamos as permissões)

CREATE POLICY "Usuários autenticados podem ver materiais" ON public.materiais
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar materiais" ON public.materiais
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ver serviços confecção" ON public.servicos_confeccao
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar serviços confecção" ON public.servicos_confeccao
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ver serviços instalação" ON public.servicos_instalacao
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar serviços instalação" ON public.servicos_instalacao
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Usuários podem ver seus orçamentos" ON public.orcamentos
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários podem criar orçamentos" ON public.orcamentos
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus orçamentos" ON public.orcamentos
FOR UPDATE TO authenticated USING (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem deletar seus orçamentos" ON public.orcamentos
FOR DELETE TO authenticated USING (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem ver cortinas de seus orçamentos" ON public.cortina_items
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos
    WHERE orcamentos.id = cortina_items.orcamento_id
    AND orcamentos.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar cortinas em seus orçamentos" ON public.cortina_items
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orcamentos
    WHERE orcamentos.id = cortina_items.orcamento_id
    AND orcamentos.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar cortinas de seus orçamentos" ON public.cortina_items
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos
    WHERE orcamentos.id = cortina_items.orcamento_id
    AND orcamentos.created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar cortinas de seus orçamentos" ON public.cortina_items
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos
    WHERE orcamentos.id = cortina_items.orcamento_id
    AND orcamentos.created_by_user_id = auth.uid()
  )
);