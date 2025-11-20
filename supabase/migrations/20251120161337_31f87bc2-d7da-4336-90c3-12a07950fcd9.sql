-- Tornar tecido_id e trilho_id opcionais para suportar persianas
-- Persianas usam material_principal_id ao invés de tecido_id
ALTER TABLE public.cortina_items 
  ALTER COLUMN tecido_id DROP NOT NULL,
  ALTER COLUMN trilho_id DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.cortina_items.tecido_id IS 'Obrigatório para cortinas, opcional para persianas';
COMMENT ON COLUMN public.cortina_items.trilho_id IS 'Obrigatório para cortinas, opcional para persianas';
COMMENT ON COLUMN public.cortina_items.material_principal_id IS 'Usado para persianas (tecido, papel, etc.)';

-- Adicionar constraint de validação
ALTER TABLE public.cortina_items 
  ADD CONSTRAINT check_produto_materiais 
  CHECK (
    (tipo_produto = 'cortina' AND tecido_id IS NOT NULL AND trilho_id IS NOT NULL) OR
    (tipo_produto = 'persiana' AND material_principal_id IS NOT NULL)
  );