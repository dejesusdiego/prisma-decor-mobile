-- =====================================================
-- ESTRUTURA DE DOMÍNIOS CORRIGIDA
-- Separa domínio de tipo de organização
-- Baseado em padrões de mercado (Shopify, Salesforce)
-- =====================================================

-- 1. Adicionar type à organizations (se não existir)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client' 
  CHECK (type IN ('client', 'internal'));

-- Comentário explicativo
COMMENT ON COLUMN public.organizations.type IS 
'client: cliente normal (Prisma, outros). internal: organização interna (ex: StudioOS para testes)';

-- Atualizar Prisma para type = 'client' (não é tipo especial)
UPDATE public.organizations 
SET type = 'client' 
WHERE slug = 'prisma' AND (type IS NULL OR type != 'client');

-- 2. Criar tabela domains
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
  -- 'marketing': Landing page / marketing
  -- 'app': Sistema logado (ERP)
  -- 'admin': Painel administrativo StudioOS
  -- 'supplier': Portal de fornecedores
  
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- NULL se role = 'admin' ou 'supplier' (não pertence a organização)
  
  app_path TEXT DEFAULT '/app', -- Caminho para sistema (ex: '/app', '/sistema')
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT domain_role_org_check CHECK (
    (role IN ('admin', 'supplier') AND organization_id IS NULL) OR
    (role IN ('marketing', 'app') AND organization_id IS NOT NULL)
  )
);

-- Comentários
COMMENT ON TABLE public.domains IS 
'Tabela de domínios e subdomínios. Separa responsabilidade de domínio do tipo de organização.';

COMMENT ON COLUMN public.domains.hostname IS 'Domínio completo (ex: prismadecor.com.br, studioos.pro)';
COMMENT ON COLUMN public.domains.role IS 'Papel do domínio: marketing, app, admin ou supplier';
COMMENT ON COLUMN public.domains.organization_id IS 'ID da organização (NULL para admin/supplier)';
COMMENT ON COLUMN public.domains.app_path IS 'Caminho para sistema logado (padrão: /app)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_domains_hostname ON public.domains(hostname) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_domains_organization ON public.domains(organization_id) WHERE organization_id IS NOT NULL;

-- 3. Criar tabela suppliers (portal de fornecedores)
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

-- 4. Relacionamento supplier ↔ organization
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

-- 5. RLS para domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains"
  ON public.domains FOR SELECT
  USING (active = true);

-- 6. RLS para suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Suppliers podem ver seus próprios dados
CREATE POLICY "Suppliers can view own data"
  ON public.suppliers FOR SELECT
  USING (
    -- Futuro: vincular com auth.users quando implementar login de fornecedores
    active = true
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

-- 7. RLS para supplier_organizations
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

-- 8. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- 9. Dados iniciais (exemplos)
-- StudioOS marketing
INSERT INTO public.domains (hostname, role, app_path)
VALUES ('studioos.pro', 'marketing', '/app')
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS admin (mesmo domínio, role diferente)
INSERT INTO public.domains (hostname, role)
VALUES ('studioos.pro', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Portal fornecedores
INSERT INTO public.domains (hostname, role)
VALUES ('fornecedores.studioos.pro', 'supplier')
ON CONFLICT (hostname) DO NOTHING;

-- Prisma (se existir)
INSERT INTO public.domains (hostname, role, organization_id, app_path)
SELECT 
  'prismadecor.com.br',
  'marketing',
  id,
  '/app'
FROM public.organizations
WHERE slug = 'prisma'
ON CONFLICT (hostname) DO NOTHING;

-- Comentário final
COMMENT ON SCHEMA public IS 
'Estrutura de domínios corrigida: separa responsabilidade de domínio do tipo de organização. 
Baseado em padrões de mercado (Shopify, Salesforce, GoHighLevel).';
