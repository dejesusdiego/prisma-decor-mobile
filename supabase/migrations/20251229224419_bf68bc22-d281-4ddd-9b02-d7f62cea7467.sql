-- Tabela para armazenar padrões de conciliação aprendidos
CREATE TABLE public.padroes_conciliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  
  -- Padrão identificado na descrição do extrato
  padrao_descricao TEXT NOT NULL,
  
  -- Tipo de conciliação: 'lancamento', 'conta_pagar', 'parcela_receber'
  tipo_conciliacao TEXT NOT NULL,
  
  -- Referência para onde conciliar (categoria, conta, etc)
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  tipo_lancamento TEXT, -- 'entrada' ou 'saida'
  
  -- Estatísticas de uso
  vezes_usado INTEGER NOT NULL DEFAULT 1,
  ultima_utilizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Confiança do padrão (aumenta com uso)
  confianca INTEGER NOT NULL DEFAULT 50, -- 0-100
  
  -- Status
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Índices para busca eficiente
CREATE INDEX idx_padroes_conciliacao_padrao ON public.padroes_conciliacao USING gin (to_tsvector('portuguese', padrao_descricao));
CREATE INDEX idx_padroes_conciliacao_user ON public.padroes_conciliacao (created_by_user_id, ativo);

-- Enable RLS
ALTER TABLE public.padroes_conciliacao ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver seus padrões" 
ON public.padroes_conciliacao 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar padrões" 
ON public.padroes_conciliacao 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus padrões" 
ON public.padroes_conciliacao 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar padrões" 
ON public.padroes_conciliacao 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));