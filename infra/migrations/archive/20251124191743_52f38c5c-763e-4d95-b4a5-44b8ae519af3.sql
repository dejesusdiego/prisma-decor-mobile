-- Add fields for persianas (blinds) that depend on factory quotes
ALTER TABLE public.cortina_items
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS fabrica TEXT,
ADD COLUMN IF NOT EXISTS motorizada BOOLEAN DEFAULT false;