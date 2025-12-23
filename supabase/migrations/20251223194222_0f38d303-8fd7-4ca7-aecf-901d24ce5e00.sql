-- =============================================
-- SISTEMA FINANCEIRO - ESTRUTURA DO BANCO DE DADOS
-- =============================================

-- 1. CATEGORIAS FINANCEIRAS
-- Categorias para organizar receitas e despesas
CREATE TABLE public.categorias_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor TEXT DEFAULT '#6B7280',
  icone TEXT DEFAULT 'circle',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias
CREATE POLICY "Usuários autenticados podem ver categorias" 
ON public.categorias_financeiras 
FOR SELECT 
USING (true);

CREATE POLICY "Apenas admins podem gerenciar categorias" 
ON public.categorias_financeiras 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_categorias_financeiras_updated_at
BEFORE UPDATE ON public.categorias_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.categorias_financeiras (nome, tipo, cor, icone) VALUES
-- Receitas
('Vendas de Cortinas', 'receita', '#10B981', 'shopping-bag'),
('Vendas de Persianas', 'receita', '#10B981', 'blinds'),
('Serviços de Instalação', 'receita', '#3B82F6', 'wrench'),
('Serviços de Manutenção', 'receita', '#3B82F6', 'tool'),
('Outras Receitas', 'receita', '#6366F1', 'plus-circle'),
-- Despesas
('Materiais e Tecidos', 'despesa', '#EF4444', 'package'),
('Mão de Obra - Costura', 'despesa', '#F59E0B', 'scissors'),
('Mão de Obra - Instalação', 'despesa', '#F59E0B', 'hard-hat'),
('Fornecedores', 'despesa', '#8B5CF6', 'truck'),
('Aluguel', 'despesa', '#EC4899', 'home'),
('Energia Elétrica', 'despesa', '#F97316', 'zap'),
('Água', 'despesa', '#06B6D4', 'droplet'),
('Internet/Telefone', 'despesa', '#6366F1', 'wifi'),
('Combustível', 'despesa', '#84CC16', 'fuel'),
('Manutenção de Veículos', 'despesa', '#64748B', 'car'),
('Marketing', 'despesa', '#A855F7', 'megaphone'),
('Impostos', 'despesa', '#DC2626', 'file-text'),
('Salários', 'despesa', '#0EA5E9', 'users'),
('Comissões', 'despesa', '#14B8A6', 'percent'),
('Outras Despesas', 'despesa', '#6B7280', 'minus-circle');

-- 2. FORMAS DE PAGAMENTO
CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'cheque', 'outro')),
  permite_parcelamento BOOLEAN NOT NULL DEFAULT false,
  max_parcelas INTEGER DEFAULT 1,
  taxa_percentual NUMERIC DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver formas de pagamento" 
ON public.formas_pagamento 
FOR SELECT 
USING (true);

CREATE POLICY "Apenas admins podem gerenciar formas de pagamento" 
ON public.formas_pagamento 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_formas_pagamento_updated_at
BEFORE UPDATE ON public.formas_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir formas de pagamento padrão
INSERT INTO public.formas_pagamento (nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual) VALUES
('Dinheiro', 'dinheiro', false, 1, 0),
('PIX', 'pix', false, 1, 0),
('Cartão de Crédito', 'cartao_credito', true, 12, 0),
('Cartão de Débito', 'cartao_debito', false, 1, 0),
('Boleto Bancário', 'boleto', true, 6, 0),
('Transferência Bancária', 'transferencia', false, 1, 0),
('Cheque', 'cheque', true, 3, 0);

-- 3. CONTAS A PAGAR
CREATE TABLE public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  fornecedor TEXT,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  observacoes TEXT,
  numero_documento TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  frequencia_recorrencia TEXT CHECK (frequencia_recorrencia IN ('mensal', 'quinzenal', 'semanal', 'anual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas contas a pagar" 
ON public.contas_pagar 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar contas a pagar" 
ON public.contas_pagar 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas contas a pagar" 
ON public.contas_pagar 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar contas a pagar" 
ON public.contas_pagar 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_contas_pagar_updated_at
BEFORE UPDATE ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. CONTAS A RECEBER
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  descricao TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  numero_parcelas INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado')),
  data_vencimento DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas contas a receber" 
ON public.contas_receber 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar contas a receber" 
ON public.contas_receber 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas contas a receber" 
ON public.contas_receber 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar contas a receber" 
ON public.contas_receber 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_contas_receber_updated_at
BEFORE UPDATE ON public.contas_receber
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. PARCELAS DE CONTAS A RECEBER
CREATE TABLE public.parcelas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.parcelas_receber ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (herda do conta_receber)
CREATE POLICY "Usuários podem ver parcelas de suas contas" 
ON public.parcelas_receber 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contas_receber cr 
  WHERE cr.id = parcelas_receber.conta_receber_id 
  AND (cr.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Usuários podem criar parcelas em suas contas" 
ON public.parcelas_receber 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contas_receber cr 
  WHERE cr.id = parcelas_receber.conta_receber_id 
  AND cr.created_by_user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar parcelas de suas contas" 
ON public.parcelas_receber 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contas_receber cr 
  WHERE cr.id = parcelas_receber.conta_receber_id 
  AND (cr.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Apenas admins podem deletar parcelas" 
ON public.parcelas_receber 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_parcelas_receber_updated_at
BEFORE UPDATE ON public.parcelas_receber
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. LANÇAMENTOS FINANCEIROS (Fluxo de Caixa)
CREATE TABLE public.lancamentos_financeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  parcela_receber_id UUID REFERENCES public.parcelas_receber(id) ON DELETE SET NULL,
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus lançamentos" 
ON public.lancamentos_financeiros 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar lançamentos" 
ON public.lancamentos_financeiros 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus lançamentos" 
ON public.lancamentos_financeiros 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar lançamentos" 
ON public.lancamentos_financeiros 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_lancamentos_financeiros_updated_at
BEFORE UPDATE ON public.lancamentos_financeiros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. COMISSÕES
CREATE TABLE public.comissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  vendedor_nome TEXT NOT NULL,
  vendedor_user_id UUID,
  percentual NUMERIC NOT NULL DEFAULT 0,
  valor_base NUMERIC NOT NULL,
  valor_comissao NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'pago', 'cancelado')),
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver comissões relacionadas a eles" 
ON public.comissoes 
FOR SELECT 
USING (
  auth.uid() = created_by_user_id 
  OR auth.uid() = vendedor_user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Usuários podem criar comissões" 
ON public.comissoes 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Apenas admins podem atualizar comissões" 
ON public.comissoes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar comissões" 
ON public.comissoes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_comissoes_updated_at
BEFORE UPDATE ON public.comissoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. COMPROVANTES DE PAGAMENTO (referência aos arquivos no storage)
CREATE TABLE public.comprovantes_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID REFERENCES public.lancamentos_financeiros(id) ON DELETE SET NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  parcela_receber_id UUID REFERENCES public.parcelas_receber(id) ON DELETE SET NULL,
  arquivo_url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.comprovantes_pagamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver comprovantes que enviaram" 
ON public.comprovantes_pagamento 
FOR SELECT 
USING (auth.uid() = uploaded_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem enviar comprovantes" 
ON public.comprovantes_pagamento 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by_user_id);

CREATE POLICY "Apenas admins podem deletar comprovantes" 
ON public.comprovantes_pagamento 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. CRIAR BUCKET PARA COMPROVANTES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', false);

-- Políticas de storage para comprovantes
CREATE POLICY "Usuários podem fazer upload de comprovantes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem ver seus comprovantes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'comprovantes' AND (
  auth.uid()::text = (storage.foldername(name))[1] 
  OR has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Usuários podem deletar seus comprovantes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'comprovantes' AND (
  auth.uid()::text = (storage.foldername(name))[1] 
  OR has_role(auth.uid(), 'admin'::app_role)
));

-- 10. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX idx_contas_pagar_categoria ON public.contas_pagar(categoria_id);

CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_contas_receber_orcamento ON public.contas_receber(orcamento_id);

CREATE INDEX idx_parcelas_vencimento ON public.parcelas_receber(data_vencimento);
CREATE INDEX idx_parcelas_status ON public.parcelas_receber(status);

CREATE INDEX idx_lancamentos_data ON public.lancamentos_financeiros(data_lancamento);
CREATE INDEX idx_lancamentos_tipo ON public.lancamentos_financeiros(tipo);
CREATE INDEX idx_lancamentos_categoria ON public.lancamentos_financeiros(categoria_id);

CREATE INDEX idx_comissoes_status ON public.comissoes(status);
CREATE INDEX idx_comissoes_orcamento ON public.comissoes(orcamento_id);

-- 11. FUNÇÃO PARA ATUALIZAR STATUS DE CONTAS ATRASADAS
CREATE OR REPLACE FUNCTION public.atualizar_contas_atrasadas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar contas a pagar atrasadas
  UPDATE public.contas_pagar
  SET status = 'atrasado'
  WHERE status = 'pendente' 
  AND data_vencimento < CURRENT_DATE;

  -- Atualizar contas a receber atrasadas
  UPDATE public.contas_receber
  SET status = 'atrasado'
  WHERE status IN ('pendente', 'parcial') 
  AND data_vencimento < CURRENT_DATE;

  -- Atualizar parcelas atrasadas
  UPDATE public.parcelas_receber
  SET status = 'atrasado'
  WHERE status = 'pendente' 
  AND data_vencimento < CURRENT_DATE;
END;
$$;