-- =====================================================
-- GARANTIR DOMÍNIO studioos.pro ESTÁ CONFIGURADO
-- =====================================================

-- Garantir que a organização interna StudioOS existe
INSERT INTO public.organizations (id, name, slug, type, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'StudioOS',
  'studioos',
  'internal',
  true
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = 'StudioOS',
  slug = 'studioos',
  type = 'internal',
  active = true;

-- Garantir que o domínio studioos.pro existe e está vinculado à org interna
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES (
  'studioos.pro',
  'marketing',
  '00000000-0000-0000-0000-000000000001',
  true
)
ON CONFLICT (hostname) DO UPDATE
SET
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true;

-- Garantir que www.studioos.pro também funciona (redireciona para studioos.pro)
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES (
  'www.studioos.pro',
  'marketing',
  '00000000-0000-0000-0000-000000000001',
  true
)
ON CONFLICT (hostname) DO UPDATE
SET
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true;
