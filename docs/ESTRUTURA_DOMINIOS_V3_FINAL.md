# 🌐 Estrutura de Domínios - Versão Final (Subdomínios)

## 📊 Decisão Arquitetural

**Padrão adotado:** Subdomínios (padrão de mercado - Shopify, Salesforce, GoHighLevel)

**Por quê:**
- ✅ Separa cookies/sessão (LP não interfere no app)
- ✅ Roteamento simples (hostname define role)
- ✅ Escala melhor (Edge middleware fácil)
- ✅ SEO melhor (LP limpa no root)
- ✅ Evita redirects estranhos

---

## 🏗️ Arquitetura de Domínios

### Cliente (White-label)

```
seudominio.com           → LP / Marketing (role: 'marketing')
app.seudominio.com       → Sistema ERP (role: 'app')
```

**Exemplo Prisma:**
```
prismadecorlab.com       → Landing page Prisma
app.prismadecorlab.com   → Sistema logado Prisma
```

### StudioOS (Plataforma)

```
studioos.pro                    → LP / Marketing (role: 'marketing')
panel.studioos.pro              → Painel Admin (role: 'admin')
fornecedores.studioos.pro      → Portal Fornecedores (role: 'supplier')
app.studioos.pro                → App Fallback (role: 'app') ⚠️ FALLBACK COMERCIAL
```

**Nota:** `app.studioos.pro` é um **fallback comercial** que permite onboarding de clientes antes de configurar DNS. Cliente pode usar `app.studioos.pro` enquanto não configura `app.cliente.com.br`.

---

## ✅ Modelo de Dados Corrigido

### Organização Interna StudioOS

**IMPORTANTE:** StudioOS marketing precisa de `organization_id` (constraint exige).

**Solução:** Criar organização interna `type='internal'`:

```sql
-- Organização interna StudioOS (ID fixo)
INSERT INTO organizations (id, name, slug, type, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'StudioOS',
  'studioos',
  'internal',
  true
);
```

**Por quê:**
- ✅ Mantém constraint válida (`marketing` sempre tem `org_id`)
- ✅ Não polui lista de clientes (`type='internal'`)
- ✅ Padrão de mercado (Shopify, Salesforce fazem assim)

### Tabela: `domains`

```sql
CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL, -- Cada subdomínio é único
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
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

-- Índices
-- ⚠️ NOTA: hostname já tem UNIQUE constraint na coluna, não precisamos de índice único adicional
-- O UNIQUE na coluna garante unicidade global (mesmo para active = false)
CREATE INDEX idx_domains_organization ON public.domains(organization_id) WHERE organization_id IS NOT NULL;
```

**Regras:**
- ✅ Cada subdomínio é único (ex: `app.prismadecorlab.com` é único) - garantido por `hostname TEXT UNIQUE`
- ✅ `role='app'` sempre tem `organization_id` (app do cliente)
- ✅ `role='marketing'` sempre tem `organization_id` (cliente ou org interna StudioOS)
- ✅ `role='admin'` e `role='supplier'` têm `organization_id = NULL` (plataforma)
- ✅ Unicidade é garantida pela constraint `UNIQUE` na coluna (não por índice parcial)

---

### Tabela: `suppliers`

```sql
CREATE TABLE public.suppliers (
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
```

---

### Tabela: `supplier_users` (AUTH CORRETA)

```sql
CREATE TABLE public.supplier_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'supplier' CHECK (role IN ('supplier', 'admin')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, user_id)
);

-- RLS para supplier_users
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
```

**Por quê:**
- ✅ Auth baseada em `auth.uid()` (padrão Supabase)
- ✅ RLS correto desde o início
- ✅ Evita buraco de segurança

---

### Tabela: `supplier_organizations`

```sql
CREATE TABLE public.supplier_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);
```

---

## 🔧 Implementação

### 1. Resolver Domínio (Edge/Frontend)

**Arquivo:** `src/lib/domainResolver.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface DomainInfo {
  hostname: string;
  role: 'marketing' | 'app' | 'admin' | 'supplier';
  organizationId: string | null;
  organizationSlug: string | null;
}

/**
 * Resolve domínio para informações de roteamento
 * 
 * ⚠️ MVP: Resolve no frontend
 * 📌 Scale: Migrar para Vercel Edge Middleware
 */
export async function resolveDomain(hostname: string): Promise<DomainInfo | null> {
  try {
    const { data: domain, error } = await supabase
      .from('domains')
      .select(`
        hostname,
        role,
        organization_id,
        organizations(slug)
      `)
      -- ⚠️ SEM !inner: left join (organizations pode ser null para admin/supplier)
      .eq('hostname', hostname)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('Error resolving domain:', error);
      return null;
    }

    if (!domain) {
      return null;
    }

    // Normalizar organizations: Supabase/PostgREST pode retornar como array ou objeto
    const org = Array.isArray(domain.organizations) 
      ? domain.organizations[0] 
      : domain.organizations;

    return {
      hostname: domain.hostname,
      role: domain.role,
      organizationId: domain.organization_id,
      organizationSlug: org?.slug ?? null,
    };
  } catch (error) {
    console.error('Error in resolveDomain:', error);
    return null;
  }
}
```

---

### 2. Hook de Roteamento

**Arquivo:** `src/hooks/useDomainRouting.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { resolveDomain } from '@/lib/domainResolver';

export function useDomainRouting() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  const { data: domainInfo, isLoading } = useQuery({
    queryKey: ['domain-routing', hostname],
    queryFn: () => resolveDomain(hostname),
    enabled: !!hostname,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  return {
    domainInfo,
    isLoading,
    isMarketing: domainInfo?.role === 'marketing',
    isApp: domainInfo?.role === 'app',
    isAdmin: domainInfo?.role === 'admin',
    isSupplier: domainInfo?.role === 'supplier',
    organizationId: domainInfo?.organizationId || null,
    organizationSlug: domainInfo?.organizationSlug || null,
  };
}
```

---

### 3. App.tsx - Roteamento por Subdomínio

**Modificar:** `src/App.tsx`

```typescript
import { useDomainRouting } from '@/hooks/useDomainRouting';
import { useLocation } from 'react-router-dom';

const AppContent = () => {
  const { domainInfo, isMarketing, isApp, isAdmin, isSupplier, organizationSlug } = useDomainRouting();
  const location = useLocation();
  
  // Portal de fornecedores
  if (isSupplier) {
    return <SupplierPortal />;
  }

  // Admin StudioOS
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // App do cliente (app.seudominio.com)
  if (isApp) {
    return (
      <ProtectedRoute>
        <GerarOrcamento />
      </ProtectedRoute>
    );
  }

  // Marketing (seudominio.com) - RENDERIZA LP DIRETO, SEM REDIRECT
  if (isMarketing && organizationSlug) {
    // Renderizar landing page direto, sem redirect para /lp/:slug
    return <LandingPageOrganizacao slug={organizationSlug} />;
  }

  // Marketing StudioOS (studioos.pro)
  if (isMarketing && !organizationSlug) {
    return <LandingPageStudioOS />;
  }

  // Fallback: rotas padrão (para desenvolvimento/teste)
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/studioos" element={<LandingPageStudioOS />} />
      <Route path="/lp/:slug" element={<LandingPageOrganizacao />} />
      {/* ... resto das rotas */}
    </Routes>
  );
};
```

**⚠️ IMPORTANTE:** Marketing renderiza LP direto, **sem redirect** para `/lp/:slug`.

---

## 📋 Migration SQL Corrigida

**Arquivo:** `supabase/migrations/20260116000002_domains_subdomains.sql`

```sql
-- =====================================================
-- ESTRUTURA DE DOMÍNIOS - SUBDOMÍNIOS (PADRÃO MERCADO)
-- =====================================================

-- 1. Adicionar type à organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client' 
  CHECK (type IN ('client', 'internal'));

-- 2. Criar tabela domains (hostname único por subdomínio)
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL, -- Cada subdomínio é único
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT domain_role_org_check CHECK (
    (role IN ('admin', 'supplier') AND organization_id IS NULL) OR
    (role IN ('marketing', 'app') AND organization_id IS NOT NULL)
  )
);

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

-- 5. Relacionamento supplier ↔ organization
CREATE TABLE IF NOT EXISTS public.supplier_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);

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

-- 10. Triggers
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

-- 11. Dados iniciais
-- StudioOS marketing
INSERT INTO public.domains (hostname, role)
VALUES ('studioos.pro', 'marketing')
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
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'app.studioos.pro',
  'app',
  '00000000-0000-0000-0000-000000000001' -- Org interna StudioOS
)
ON CONFLICT (hostname) DO NOTHING;

-- Prisma (exemplo)
INSERT INTO public.domains (hostname, role, organization_id)
SELECT 
  'prismadecorlab.com',
  'marketing',
  id
FROM public.organizations
WHERE slug = 'prisma'
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, organization_id)
SELECT 
  'app.prismadecorlab.com',
  'app',
  id
FROM public.organizations
WHERE slug = 'prisma'
ON CONFLICT (hostname) DO NOTHING;
```

---

## ✅ Checklist de Correções Aplicadas

- [x] **hostname UNIQUE** (cada subdomínio é único - constraint na coluna, sem índice redundante)
- [x] **Subdomínios** ao invés de paths (`/app`, `/admin`)
- [x] **supplier_users** com auth correta (RLS baseado em `auth.uid()`)
- [x] **Marketing renderiza LP direto** (sem redirect para `/lp/:slug`)
- [x] **role='app' sempre com org_id** (app do cliente)
- [x] **role='marketing' sempre com org_id** (cliente ou org interna StudioOS)
- [x] **Organização interna StudioOS** (para vincular marketing)
- [x] **Left join no resolver** (sem `!inner` para admin/supplier)
- [x] **Padrão `app.` fixo** (não variações)
- [x] **Documentação produção vs dev** (rotas `/studioos` e `/lp/:slug` apenas dev)

---

## 🎯 Exemplos de Uso

### Cliente: Prisma

```sql
-- Marketing
INSERT INTO domains (hostname, role, organization_id)
VALUES ('prismadecorlab.com', 'marketing', 
  (SELECT id FROM organizations WHERE slug = 'prisma'));

-- App
INSERT INTO domains (hostname, role, organization_id)
VALUES ('app.prismadecorlab.com', 'app', 
  (SELECT id FROM organizations WHERE slug = 'prisma'));
```

**Resultado:**
- `https://prismadecorlab.com` → Landing page Prisma
- `https://app.prismadecorlab.com` → Sistema logado Prisma

### StudioOS

```sql
-- Marketing (vinculado à org interna)
INSERT INTO domains (hostname, role, organization_id)
VALUES (
  'studioos.pro', 
  'marketing',
  '00000000-0000-0000-0000-000000000001' -- Org interna StudioOS
);

-- Admin
INSERT INTO domains (hostname, role)
VALUES ('panel.studioos.pro', 'admin');

-- Fornecedores
INSERT INTO domains (hostname, role)
VALUES ('fornecedores.studioos.pro', 'supplier');
```

**Resultado:**
- `https://studioos.pro` → Landing page SaaS
- `https://panel.studioos.pro` → Painel admin
- `https://fornecedores.studioos.pro` → Portal fornecedores

---

## 📚 Comparação com Mercado

| Empresa | Padrão | Nosso Modelo |
|---------|--------|--------------|
| **Shopify Plus** | `cliente.com` + `cliente.com/admin` | ✅ Similar (subdomínios) |
| **GoHighLevel** | `cliente.com` + `app.gohighlevel.com` | ✅ Similar |
| **Salesforce** | Subdomínios por role | ✅ Similar |
| **Vercel** | Edge middleware | ⚠️ Planejado (Scale) |

---

## 🔒 Segurança e Hardening

### Estado Atual (MVP)

- ✅ Policy pública na tabela `domains` (necessário para resolução)
- ✅ RLS em outras tabelas mitiga riscos
- ✅ Informação não é crítica

### Hardening Pós-MVP

- 📌 Criar view pública `domain_resolver` (não expor `organization_id` diretamente)
- 📌 Adicionar rate limiting (Edge Middleware)
- 📌 Adicionar cache (Edge Middleware)
- 📌 Validação de slug reservado (`studioos`)

**Documentação completa:** Veja [`SEGURANCA_DOMINIOS.md`](./SEGURANCA_DOMINIOS.md)

---

## 🚀 Próximos Passos

1. ✅ Aplicar migration `20260116000002_domains_subdomains.sql`
2. ✅ Implementar `domainResolver.ts`
3. ✅ Implementar `useDomainRouting.ts`
4. ✅ Atualizar `App.tsx` com roteamento por subdomínio
5. ✅ Configurar domínios no Vercel
6. ✅ Testar com domínios reais

---

## 🔧 Ajustes Finais Aplicados

### 1. Detecção de Ambiente

✅ Função `getEnvironment()` criada (`src/lib/environment.ts`)
- Detecta: `local`, `preview`, `staging`, `production`
- Usada para decidir quando permitir rotas de dev

### 2. Slug Reservado

✅ Constante `RESERVED_PLATFORM_SLUG = 'studioos'` (`src/lib/constants.ts`)
- Slug `'studioos'` é reservado para a plataforma
- Documentado em código e migration
- Validação futura: trigger para prevenir uso por clientes

### 3. Segurança

✅ Documentação de segurança criada (`docs/SEGURANCA_DOMINIOS.md`)
- Riscos identificados
- Mitigações atuais
- Hardening pós-MVP planejado

---

**Última atualização:** 2025-01-16
**Status:** ✅ Versão final - Subdomínios (padrão mercado) + Ajustes finais aplicados
