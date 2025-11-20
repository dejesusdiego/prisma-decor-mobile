-- Expandir tipos de produtos para incluir persianas
-- Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.cortina_items IS 'Armazena itens de orçamento (cortinas e persianas)';

-- Adicionar campo para diferenciar cortinas de persianas
ALTER TABLE public.cortina_items 
ADD COLUMN IF NOT EXISTS tipo_produto TEXT DEFAULT 'cortina';

-- Adicionar comentário no campo tipo_cortina
COMMENT ON COLUMN public.cortina_items.tipo_cortina IS 'Subtipo do produto: wave, prega, painel, rolo (cortinas) ou horizontal, vertical, romana, celular, madeira (persianas)';

-- Adicionar campo para material principal de persianas (quando não for tecido)
ALTER TABLE public.cortina_items
ADD COLUMN IF NOT EXISTS material_principal_id UUID REFERENCES public.materiais(id);

COMMENT ON COLUMN public.cortina_items.material_principal_id IS 'Material principal para persianas (quando não usa tecido)';