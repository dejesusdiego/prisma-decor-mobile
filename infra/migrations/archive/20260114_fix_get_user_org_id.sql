-- =============================================
-- FIX: Corrigir get_user_organization_id() que está retornando NULL
-- =============================================

-- A função atual pode estar falhando por problemas de RLS ou busca
-- Vamos criar uma versão mais robusta

DROP FUNCTION IF EXISTS public.get_user_organization_id();

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Buscar organization_id do usuário atual
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Se não encontrou, retornar NULL (não fallback para evitar problemas)
  RETURN v_org_id;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.get_user_organization_id() IS 
  'Retorna o organization_id do usuário autenticado. Retorna NULL se o usuário não estiver em nenhuma organização.';
