-- =====================================================
-- ESTRUTURA DE DOMÍNIOS - SUBDOMÍNIOS (PADRÃO MERCADO)
-- Baseado em Shopify, Salesforce, GoHighLevel
-- =====================================================

-- 1. Adicionar type à organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client' 
  CHECK (type IN ('client', 'internal'));

COMMENT ON COLUMN public.organizations.type IS 
'client: cliente normal (Prisma, outros). internal: organização interna (ex: StudioOS para testes)';

-- Atualizar Prisma para type = 'client'
UPDATE public.organizations 
SET type = 'client' 
WHERE slug = 'prisma' AND (type IS NULL OR type != 'client');

-- 2. Criar tabela domains (hostname único por subdomínio)
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL, -- Cada subdomínio é único
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
  -- 'marketing': Landing page / marketing
  -- 'app': Sistema logado (ERP) - sempre com organization_id
  -- 'admin': Painel administrativo StudioOS - organization_id NULL
  -- 'supplier': Portal de fornecedores - organization_id NULL
  
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- NULL para role='admin' ou 'supplier' (plataforma)
  -- NOT NULL para role='marketing' ou 'app' (cliente)
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT domain_role_org_check CHECK (
    (role IN ('admin', 'supplier') AND organization_id IS NULL) OR
    (role IN ('marketing', 'app') AND organization_id IS NOT NULL)
  )
);

COMMENT ON TABLE public.domains IS 
'Tabela de domínios e subdomínios. Cada subdomínio é único (ex: app.prismadecorlab.com).';

COMMENT ON COLUMN public.domains.hostname IS 'Domínio completo (ex: prismadecorlab.com, app.prismadecorlab.com, panel.studioos.pro)';
COMMENT ON COLUMN public.domains.role IS 'Papel do domínio: marketing, app, admin ou supplier';
COMMENT ON COLUMN public.domains.organization_id IS 'ID da organização (NULL para admin/supplier, NOT NULL para marketing/app)';

-- Índices
-- ⚠️ NOTA: hostname já tem UNIQUE constraint na coluna, não precisamos de índice único adicional
-- O UNIQUE na coluna garante unicidade global (mesmo para active = false)
CREATE INDEX idx_domains_organization ON public.domains(organization_id) WHERE organization_id IS NOT NULL;

-- 3. Criar tabela suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  cnpj TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.suppliers IS 
'Fornecedores do sistema. Entidade separada de organizations (não são tenants do ERP).';

-- 4. Criar tabela supplier_users (AUTH CORRETA)
CREATE TABLE IF NOT EXISTS public.supplier_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'supplier' CHECK (role IN ('supplier', 'admin')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, user_id)
);

COMMENT ON TABLE public.supplier_users IS 
'Relacionamento fornecedor ↔ usuário. Auth baseada em auth.uid() (padrão Supabase).';

-- 5. Relacionamento supplier ↔ organization
CREATE TABLE IF NOT EXISTS public.supplier_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);

COMMENT ON TABLE public.supplier_organizations IS 
'Relacionamento muitos-para-muitos: fornecedor pode trabalhar com múltiplas organizações.';

-- 6. RLS para domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains"
  ON public.domains FOR SELECT
  USING (active = true);

-- 7. RLS para suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own data"
  ON public.suppliers FOR SELECT
  USING (
    id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid()
    )
  );

-- Organizations podem ver fornecedores vinculados
CREATE POLICY "Organizations can view linked suppliers"
  ON public.suppliers FOR SELECT
  USING (
    id IN (
      SELECT supplier_id 
      FROM public.supplier_organizations 
      WHERE organization_id = (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
        LIMIT 1
      )
      AND active = true
    )
  );

-- 8. RLS para supplier_users
ALTER TABLE public.supplier_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own users"
  ON public.supplier_users FOR SELECT
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid()
    )
  );

-- 9. RLS para supplier_organizations
ALTER TABLE public.supplier_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their suppliers"
  ON public.supplier_organizations FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- 10. Triggers para updated_at
DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Criar organização interna StudioOS (para vincular marketing)
-- 
-- ⚠️ IMPORTANTE: slug 'studioos' é RESERVADO para a plataforma.
-- Nenhuma organização cliente pode usar este slug.
-- 
-- Esta organização é usada para:
-- - Vincular domínio marketing StudioOS (studioos.pro)
-- - Manter constraint válida (marketing sempre tem organization_id)
-- - Não poluir lista de clientes (type='internal')
--
-- Validação futura: Criar constraint ou validação no admin para prevenir uso deste slug.
INSERT INTO public.organizations (id, name, slug, type, active)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- ID fixo para StudioOS
  'StudioOS',
  'studioos', -- ⚠️ SLUG RESERVADO - não pode ser usado por clientes
  'internal',
  true
)
ON CONFLICT (id) DO UPDATE SET type = 'internal';

-- Garantir que o slug 'studioos' não seja usado por outras organizações
-- (Validação futura: criar constraint ou trigger)

-- 12. Dados iniciais (exemplos)
-- StudioOS marketing (vinculado à org interna)
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'studioos.pro', 
  'marketing',
  '00000000-0000-0000-0000-000000000001' -- Org interna StudioOS
)
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS admin
INSERT INTO public.domains (hostname, role)
VALUES ('panel.studioos.pro', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Portal fornecedores
INSERT INTO public.domains (hostname, role)
VALUES ('fornecedores.studioos.pro', 'supplier')
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS app fallback (app.studioos.pro)
-- ⚠️ FALLBACK COMERCIAL: Permite onboarding de clientes antes de configurar DNS
-- Cliente pode usar app.studioos.pro enquanto não configura app.cliente.com.br
-- Vinculado à org interna StudioOS para permitir acesso ao sistema
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'app.studioos.pro',
  'app',
  '00000000-0000-0000-0000-000000000001' -- Org interna StudioOS
)
ON CONFLICT (hostname) DO NOTHING;

-- Prisma marketing (exemplo - ajustar hostname real quando configurado)
-- INSERT INTO public.domains (hostname, role, organization_id)
-- SELECT 
--   'prismadecorlab.com',
--   'marketing',
--   id
-- FROM public.organizations
-- WHERE slug = 'prisma'
-- ON CONFLICT (hostname) DO NOTHING;

-- Prisma app (exemplo - ajustar hostname real quando configurado)
-- INSERT INTO public.domains (hostname, role, organization_id)
-- SELECT 
--   'app.prismadecorlab.com',
--   'app',
--   id
-- FROM public.organizations
-- WHERE slug = 'prisma'
-- ON CONFLICT (hostname) DO NOTHING;

-- Comentário final
COMMENT ON SCHEMA public IS 
'Estrutura de domínios com subdomínios (padrão mercado). 
Cada subdomínio é único: seudominio.com (marketing) + app.seudominio.com (app).';
