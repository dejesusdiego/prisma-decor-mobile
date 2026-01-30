-- Remover as foreign keys e alterar colunas de UUID para TEXT
ALTER TABLE public.cortina_items 
  DROP CONSTRAINT IF EXISTS cortina_items_tecido_id_fkey,
  DROP CONSTRAINT IF EXISTS cortina_items_forro_id_fkey,
  DROP CONSTRAINT IF EXISTS cortina_items_trilho_id_fkey,
  DROP CONSTRAINT IF EXISTS cortina_items_material_principal_id_fkey;

-- Alterar tipos das colunas para TEXT
ALTER TABLE public.cortina_items 
  ALTER COLUMN tecido_id TYPE TEXT USING tecido_id::TEXT,
  ALTER COLUMN forro_id TYPE TEXT USING forro_id::TEXT,
  ALTER COLUMN trilho_id TYPE TEXT USING trilho_id::TEXT,
  ALTER COLUMN material_principal_id TYPE TEXT USING material_principal_id::TEXT;