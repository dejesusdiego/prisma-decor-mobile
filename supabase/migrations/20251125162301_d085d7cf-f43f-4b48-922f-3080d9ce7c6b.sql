-- Create a function to clean all material and service data
-- This function uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.truncate_materials_and_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Truncate all tables (cascade to handle foreign keys if any)
  TRUNCATE TABLE public.materiais RESTART IDENTITY CASCADE;
  TRUNCATE TABLE public.servicos_confeccao RESTART IDENTITY CASCADE;
  TRUNCATE TABLE public.servicos_instalacao RESTART IDENTITY CASCADE;
  
  RAISE NOTICE 'All materials and services data cleared successfully';
END;
$$;