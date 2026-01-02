-- Adicionar campo vendedor_id na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN vendedor_id uuid REFERENCES auth.users(id);

-- Criar índice para performance
CREATE INDEX idx_orcamentos_vendedor_id ON public.orcamentos(vendedor_id);

-- Criar tabela de configurações de comissão por vendedor
CREATE TABLE public.configuracoes_comissao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_user_id uuid NOT NULL UNIQUE,
  vendedor_nome text NOT NULL,
  percentual_padrao numeric NOT NULL DEFAULT 5,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_comissao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver configurações de comissão"
ON public.configuracoes_comissao
FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem gerenciar configurações de comissão"
ON public.configuracoes_comissao
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_comissao_updated_at
BEFORE UPDATE ON public.configuracoes_comissao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();