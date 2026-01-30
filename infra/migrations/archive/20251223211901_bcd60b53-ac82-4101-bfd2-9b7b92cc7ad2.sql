-- Criar tabela de histórico de descontos
CREATE TABLE public.historico_descontos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  desconto_tipo_anterior TEXT,
  desconto_valor_anterior NUMERIC DEFAULT 0,
  desconto_tipo_novo TEXT,
  desconto_valor_novo NUMERIC DEFAULT 0,
  motivo TEXT,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_descontos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver histórico de seus orçamentos"
ON public.historico_descontos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos o 
    WHERE o.id = historico_descontos.orcamento_id 
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Usuários podem criar histórico em seus orçamentos"
ON public.historico_descontos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orcamentos o 
    WHERE o.id = historico_descontos.orcamento_id 
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Índice para consultas por orçamento
CREATE INDEX idx_historico_descontos_orcamento_id ON public.historico_descontos(orcamento_id);

-- Comentários
COMMENT ON TABLE public.historico_descontos IS 'Histórico de alterações de desconto em orçamentos';
COMMENT ON COLUMN public.historico_descontos.motivo IS 'Motivo opcional da alteração do desconto';