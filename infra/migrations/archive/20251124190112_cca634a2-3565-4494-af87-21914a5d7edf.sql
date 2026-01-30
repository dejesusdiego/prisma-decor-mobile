-- Adicionar coluna de ambiente em cortina_items
ALTER TABLE public.cortina_items ADD COLUMN ambiente TEXT;

-- Remover coluna de ambiente de orcamentos e adicionar endereco
ALTER TABLE public.orcamentos DROP COLUMN ambiente;
ALTER TABLE public.orcamentos ADD COLUMN endereco TEXT NOT NULL DEFAULT '';

-- Adicionar campos para produtos "Outros"
ALTER TABLE public.cortina_items ADD COLUMN preco_unitario NUMERIC;
ALTER TABLE public.cortina_items ADD COLUMN is_outro BOOLEAN DEFAULT false;