-- Remover constraint antiga de tipo_cortina se existir
ALTER TABLE public.cortina_items 
  DROP CONSTRAINT IF EXISTS cortina_items_tipo_cortina_check;

-- Adicionar nova constraint que aceita todos os tipos de cortina e persiana
ALTER TABLE public.cortina_items 
  ADD CONSTRAINT cortina_items_tipo_cortina_check 
  CHECK (
    tipo_cortina IN (
      'wave', 'prega', 'painel', 'rolo', 
      'horizontal', 'vertical', 'romana', 'celular', 'madeira', 
      'outro'
    )
  );