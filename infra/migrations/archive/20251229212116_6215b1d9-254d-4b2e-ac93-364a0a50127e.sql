-- Tabela de regras de conciliação automática
CREATE TABLE public.regras_conciliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao_contem TEXT NOT NULL,
  acao TEXT NOT NULL DEFAULT 'ignorar',
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  tipo_lancamento TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coluna para rastrear regra aplicada nas movimentações
ALTER TABLE public.movimentacoes_extrato 
ADD COLUMN regra_aplicada_id UUID REFERENCES public.regras_conciliacao(id);

-- Enable RLS
ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regras_conciliacao
CREATE POLICY "Usuários podem ver suas regras"
ON public.regras_conciliacao
FOR SELECT
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar regras"
ON public.regras_conciliacao
FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas regras"
ON public.regras_conciliacao
FOR UPDATE
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar regras"
ON public.regras_conciliacao
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_regras_conciliacao_updated_at
BEFORE UPDATE ON public.regras_conciliacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas regras padrão (serão criadas pelo primeiro admin)
-- Não inserimos aqui pois precisa de user_id