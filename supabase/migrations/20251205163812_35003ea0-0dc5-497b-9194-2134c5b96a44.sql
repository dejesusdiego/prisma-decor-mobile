-- Adicionar coluna para barra do forro separada da barra do tecido
ALTER TABLE public.cortina_items 
ADD COLUMN barra_forro_cm numeric DEFAULT 0;