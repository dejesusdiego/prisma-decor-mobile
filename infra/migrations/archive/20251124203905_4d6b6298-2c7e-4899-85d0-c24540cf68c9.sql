-- Adicionar campo validadeDias na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS validade_dias integer DEFAULT 7;