-- Adicionar colunas de desconto na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS desconto_tipo text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desconto_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_com_desconto numeric DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.orcamentos.desconto_tipo IS 'Tipo de desconto: percentual ou valor_fixo';
COMMENT ON COLUMN public.orcamentos.desconto_valor IS 'Valor do desconto (percentual ou valor absoluto em R$)';
COMMENT ON COLUMN public.orcamentos.total_com_desconto IS 'Valor final do orçamento após aplicar o desconto';