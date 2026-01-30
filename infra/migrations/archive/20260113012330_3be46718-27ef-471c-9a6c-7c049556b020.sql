-- Add motor columns to cortina_items for motorized curtains
ALTER TABLE public.cortina_items 
ADD COLUMN IF NOT EXISTS motor_id UUID REFERENCES public.materiais(id),
ADD COLUMN IF NOT EXISTS custo_motor NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.cortina_items.motor_id IS 'ID do motor/sistema de motorização selecionado';
COMMENT ON COLUMN public.cortina_items.custo_motor IS 'Custo do motor/sistema de motorização';