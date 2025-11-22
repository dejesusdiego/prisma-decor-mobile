-- Adicionar coluna barra_cm para armazenar o tamanho da barra em centímetros
ALTER TABLE public.cortina_items 
ADD COLUMN barra_cm integer DEFAULT 0;