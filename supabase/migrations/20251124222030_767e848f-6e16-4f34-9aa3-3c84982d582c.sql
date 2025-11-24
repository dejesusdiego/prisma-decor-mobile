-- Remover constraint antiga
ALTER TABLE cortina_items DROP CONSTRAINT IF EXISTS check_produto_materiais;

-- Criar nova constraint que permite:
-- - Cortinas: pelo menos tecido OU forro (trilho opcional)
-- - Persianas: material_principal OU preco_unitario
-- - Outros: preco_unitario obrigatório
ALTER TABLE cortina_items ADD CONSTRAINT check_produto_materiais CHECK (
  (
    tipo_produto = 'cortina' AND 
    (tecido_id IS NOT NULL OR forro_id IS NOT NULL)
  ) OR (
    tipo_produto = 'persiana' AND 
    (material_principal_id IS NOT NULL OR preco_unitario IS NOT NULL)
  ) OR (
    tipo_produto = 'outro' AND 
    preco_unitario IS NOT NULL
  )
);