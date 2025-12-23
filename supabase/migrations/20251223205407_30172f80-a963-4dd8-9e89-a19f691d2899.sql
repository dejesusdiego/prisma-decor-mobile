-- Adicionar coluna orcamento_id na tabela contas_pagar
ALTER TABLE public.contas_pagar
ADD COLUMN orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de buscas
CREATE INDEX idx_contas_pagar_orcamento_id ON public.contas_pagar(orcamento_id);