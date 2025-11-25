-- Drop and recreate the truncate function to ensure it works correctly
DROP FUNCTION IF EXISTS public.truncate_materials_and_services();

CREATE OR REPLACE FUNCTION public.truncate_materials_and_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all data explicitly (TRUNCATE might have transaction issues)
  DELETE FROM public.materiais;
  DELETE FROM public.servicos_confeccao;
  DELETE FROM public.servicos_instalacao;
  
  -- Reset sequences
  ALTER SEQUENCE IF EXISTS materiais_id_seq RESTART WITH 1;
  ALTER SEQUENCE IF EXISTS servicos_confeccao_id_seq RESTART WITH 1;
  ALTER SEQUENCE IF EXISTS servicos_instalacao_id_seq RESTART WITH 1;
  
  RAISE NOTICE 'All materials and services data cleared successfully';
END;
$$;