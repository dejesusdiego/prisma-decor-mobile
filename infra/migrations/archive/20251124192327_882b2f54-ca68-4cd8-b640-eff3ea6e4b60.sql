-- Remover a constraint antiga
ALTER TABLE public.cortina_items 
  DROP CONSTRAINT IF EXISTS check_produto_materiais;

-- Adicionar nova constraint que suporta persianas com orçamento de fábrica
ALTER TABLE public.cortina_items 
  ADD CONSTRAINT check_produto_materiais 
  CHECK (
    (tipo_produto = 'cortina' AND tecido_id IS NOT NULL AND trilho_id IS NOT NULL) OR
    (tipo_produto = 'persiana' AND (material_principal_id IS NOT NULL OR preco_unitario IS NOT NULL)) OR
    (tipo_produto = 'outro' AND preco_unitario IS NOT NULL)
  );