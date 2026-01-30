-- Fix the truncate function to include WHERE clauses
CREATE OR REPLACE FUNCTION public.truncate_materials_and_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all data explicitly with WHERE clauses (required by PostgreSQL)
  DELETE FROM public.materiais WHERE TRUE;
  DELETE FROM public.servicos_confeccao WHERE TRUE;
  DELETE FROM public.servicos_instalacao WHERE TRUE;
  
  RAISE NOTICE 'All materials and services data cleared successfully';
END;
$$;