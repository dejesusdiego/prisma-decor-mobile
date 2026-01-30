-- =====================================================
-- CONFIGURAÇÃO DOMÍNIOS studioos.com.br
-- Sprint 2: Domínios e Subdomínios Personalizados
-- =====================================================

-- 1. Adicionar domínios studioos.com.br
-- Admin
INSERT INTO public.domains (hostname, role)
VALUES ('admin.studioos.com.br', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Panel (redireciona para admin)
INSERT INTO public.domains (hostname, role)
VALUES ('panel.studioos.com.br', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Portal fornecedores
INSERT INTO public.domains (hostname, role)
VALUES ('fornecedores.studioos.com.br', 'supplier')
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS marketing (vinculado à org interna)
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'studioos.com.br', 
  'marketing',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (hostname) DO NOTHING;

-- App fallback (app.studioos.com.br)
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'app.studioos.com.br',
  'app',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (hostname) DO NOTHING;

-- 2. Criar função para resolver domínio com suporte a subdomínios wildcard
-- Esta função pode ser usada em Edge Functions ou no backend
CREATE OR REPLACE FUNCTION public.resolve_domain(p_hostname TEXT)
RETURNS TABLE (
  hostname TEXT,
  role TEXT,
  organization_id UUID,
  organization_slug TEXT
) AS $$
DECLARE
  v_slug TEXT;
  v_reserved_slugs TEXT[] := ARRAY['admin', 'panel', 'fornecedores', 'fornecedor', 'app', 'api', 'www', 'mail', 'ftp', 'studioos'];
BEGIN
  -- Verificar domínio exato na tabela
  RETURN QUERY
  SELECT 
    d.hostname,
    d.role,
    d.organization_id,
    o.slug::TEXT as organization_slug
  FROM public.domains d
  LEFT JOIN public.organizations o ON o.id = d.organization_id
  WHERE d.hostname = p_hostname
    AND d.active = true;
  
  -- Se não encontrou, verificar subdomínio {slug}.studioos.com.br
  IF NOT FOUND THEN
    -- Extrair slug do padrão {slug}.studioos.com.br
    v_slug := regexp_replace(p_hostname, '\.studioos\.(com\.br|pro)$', '');
    
    -- Verificar se é um subdomínio de landing page válido
    IF p_hostname ~ '^[a-z0-9-]+\.studioos\.(com\.br|pro)$' 
       AND NOT v_slug = ANY(v_reserved_slugs) THEN
      
      RETURN QUERY
      SELECT 
        p_hostname::TEXT as hostname,
        'marketing'::TEXT as role,
        o.id as organization_id,
        o.slug::TEXT as organization_slug
      FROM public.organizations o
      WHERE o.slug = v_slug
        AND o.active = true;
    END IF;
    
    -- Verificar subdomínio de app {slug}-app.studioos.com.br
    IF p_hostname ~ '^[a-z0-9-]+-app\.studioos\.(com\.br|pro)$' THEN
      v_slug := regexp_replace(p_hostname, '-app\.studioos\.(com\.br|pro)$', '');
      
      IF v_slug != 'studioos' THEN
        RETURN QUERY
        SELECT 
          p_hostname::TEXT as hostname,
          'app'::TEXT as role,
          o.id as organization_id,
          o.slug::TEXT as organization_slug
        FROM public.organizations o
        WHERE o.slug = v_slug
          AND o.active = true;
      END IF;
    END IF;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Comentário da função
COMMENT ON FUNCTION public.resolve_domain IS 
'Resolve um hostname para informações de domínio.
Suporta:
- Domínios exatos na tabela domains
- Subdomínios wildcard {slug}.studioos.com.br (landing pages)
- Subdomínios app {slug}-app.studioos.com.br (apps de organização)';

-- 4. Adicionar índice para busca por slug (melhora performance)
CREATE INDEX IF NOT EXISTS idx_organizations_slug_active ON public.organizations(slug) WHERE active = true;

-- 5. Configurar Prisma Decor com subdomínio exemplo (opcional)
-- Descomentar quando quiser ativar o subdomínio para Prisma
-- INSERT INTO public.domains (hostname, role, organization_id)
-- SELECT 
--   'prisma.studioos.com.br',
--   'marketing',
--   id
-- FROM public.organizations
-- WHERE slug = 'prisma'
-- ON CONFLICT (hostname) DO NOTHING;

-- Comentário final
COMMENT ON SCHEMA public IS 
'Sprint 2: Suporte a subdomínios wildcard {slug}.studioos.com.br para landing pages personalizadas';
