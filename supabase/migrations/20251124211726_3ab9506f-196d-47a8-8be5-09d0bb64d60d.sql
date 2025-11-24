-- Adicionar campo cidade na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN cidade text DEFAULT 'Balneário Camboriú';