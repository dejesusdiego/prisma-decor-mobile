-- Adicionar categorias 'motorizado' e 'persiana' à constraint de materiais
ALTER TABLE public.materiais 
DROP CONSTRAINT materiais_categoria_check;

ALTER TABLE public.materiais 
ADD CONSTRAINT materiais_categoria_check 
CHECK (categoria = ANY (ARRAY['tecido'::text, 'forro'::text, 'trilho'::text, 'acessorio'::text, 'papel'::text, 'motorizado'::text, 'persiana'::text]));