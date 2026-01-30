-- Fix search_path for trigger function to prevent potential SQL injection
CREATE OR REPLACE FUNCTION public.trigger_gerar_codigo_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.gerar_codigo_orcamento();
  END IF;
  RETURN NEW;
END;
$$;