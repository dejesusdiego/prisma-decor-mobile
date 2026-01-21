# 🌐 Estrutura de Domínios - Versão 2 (DEPRECADA)

> ⚠️ **ATENÇÃO:** Esta versão foi **DEPRECADA**.
> 
> **Problemas identificados:**
> - ❌ `hostname UNIQUE` não permite múltiplos roles no mesmo domínio
> - ❌ Roteamento por path (`/app`, `/admin`) é mais complexo
> - ❌ Supplier auth incompleto
> - ❌ Redirect marketing → `/lp/:slug` é ruim para SEO
> 
> **✅ Versão final:** Veja [`ESTRUTURA_DOMINIOS_V3_FINAL.md`](./ESTRUTURA_DOMINIOS_V3_FINAL.md)
> 
> **Mudança principal:** Subdomínios ao invés de paths (padrão mercado)

# 🌐 Estrutura de Domínios - Versão 2 (DEPRECADA)

## 📊 Análise e Correções Aplicadas

Este documento corrige os erros conceituais identificados na versão anterior, seguindo padrões de mercado (Shopify, Salesforce, GoHighLevel).

---

## 🔴 Erros Conceituais Corrigidos

### ❌ Erro 1: Misturar `domain_type` com tipo de organização

**Problema anterior:**
```sql
domain_type TEXT CHECK ('studioos' | 'prisma' | 'client' | 'supplier')
```

**Por que está errado:**
- Domínio não define tipo de organização
- Prisma é `client`, não um tipo especial
- Fornecedor não é `organization`
- StudioOS não é `organization`, é plataforma

**✅ Correção:**
- Separar **domínio** de **tipo de organização**
- Criar tabela `domains` dedicada
- `organizations.type` apenas: `'client' | 'internal'`

---

### ❌ Erro 2: Tratar fornecedor como organization

**Problema anterior:**
- Fornecedor como variação de `organization`

**Por que está errado:**
- Fornecedor não vende
- Fornecedor não tem CRM
- Fornecedor não é tenant do ERP

**✅ Correção:**
- `suppliers` como entidade própria
- Auth separada
- RLS separado
- Domínio separado (`fornecedores.studioos.pro`)

---

## ✅ Modelo de Dados Corrigido

### Tabela: `organizations`

```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'client' CHECK (type IN ('client', 'internal')),
  -- 'client': cliente normal (Prisma, outros)
  -- 'internal': organização interna (ex: StudioOS para testes)
  
  -- Campos comerciais
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  cnpj TEXT,
  tagline TEXT,
  address TEXT,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Nota:** Prisma é `type = 'client'`, não um tipo especial.

---

### Tabela: `domains` (NOVA)

```sql
CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL, -- ex: 'prismadecor.com.br', 'studioos.pro'
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
  -- 'marketing': Landing page / marketing
  -- 'app': Sistema logado (ERP)
  -- 'admin': Painel administrativo StudioOS
  -- 'supplier': Portal de fornecedores
  
  -- Relacionamentos
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- NULL se role = 'admin' ou 'supplier' (não pertence a organização)
  
  -- Configuração
  app_path TEXT DEFAULT '/app', -- Caminho para sistema (ex: '/app', '/sistema')
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT domain_role_org_check CHECK (
    (role IN ('admin', 'supplier') AND organization_id IS NULL) OR
    (role IN ('marketing', 'app') AND organization_id IS NOT NULL)
  )
);

CREATE INDEX idx_domains_hostname ON public.domains(hostname) WHERE active = true;
CREATE INDEX idx_domains_organization ON public.domains(organization_id) WHERE organization_id IS NOT NULL;
```

**Exemplos de uso:**

```sql
-- StudioOS marketing
INSERT INTO domains (hostname, role, app_path) 
VALUES ('studioos.pro', 'marketing', '/app');

-- StudioOS admin
INSERT INTO domains (hostname, role) 
VALUES ('studioos.pro', 'admin');

-- Portal fornecedores
INSERT INTO domains (hostname, role) 
VALUES ('fornecedores.studioos.pro', 'supplier');

-- Prisma marketing
INSERT INTO domains (hostname, role, organization_id, app_path) 
VALUES ('prismadecor.com.br', 'marketing', 
  (SELECT id FROM organizations WHERE slug = 'prisma'), 
  '/app');

-- Cliente com domínio próprio
INSERT INTO domains (hostname, role, organization_id, app_path) 
VALUES ('cliente.com.br', 'marketing', 
  (SELECT id FROM organizations WHERE slug = 'cliente'), 
  '/app');
```

---

### Tabela: `suppliers` (NOVA - para portal de fornecedores)

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

-- Tabela de relacionamento: fornecedor → organização
CREATE TABLE public.supplier_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);
```

**Nota:** Fornecedor é entidade separada, não organization.

---

## 🏗️ Arquitetura de Domínios Corrigida

```
┌─────────────────────────────────────────────────────────────┐
│                    DOMÍNIOS PRINCIPAIS                       │
└─────────────────────────────────────────────────────────────┘

1. STUDIOOS (Plataforma SaaS)
   ├── studioos.pro
   │   ├── / → Marketing (role: 'marketing')
   │   ├── /app → Sistema clientes (role: 'app', org_id: NULL)
   │   └── /admin → Admin (role: 'admin')
   │
   └── fornecedores.studioos.pro
       └── / → Portal fornecedores (role: 'supplier')

2. PRISMA (Cliente - type: 'client')
   └── prismadecor.com.br
       ├── / → Marketing (role: 'marketing', org_id: prisma)
       └── /app → Sistema logado (role: 'app', org_id: prisma)

3. CLIENTES (type: 'client')
   ├── cliente1.com.br
   │   ├── / → Marketing (role: 'marketing', org_id: cliente1)
   │   └── /app → Sistema logado (role: 'app', org_id: cliente1)
   │
   └── cliente2.com.br
       ├── / → Marketing (role: 'marketing', org_id: cliente2)
       └── /app → Sistema logado (role: 'app', org_id: cliente2)
```

---

## 🔧 Implementação - Middleware de Domínio

### Fase 1: Função de Resolução de Domínio (Backend/Edge)

**Arquivo:** `src/lib/domainResolver.ts` (criar)

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface DomainInfo {
  hostname: string;
  role: 'marketing' | 'app' | 'admin' | 'supplier';
  organizationId: string | null;
  appPath: string;
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
    // Buscar domínio no banco
    const { data: domain, error } = await supabase
      .from('domains')
      .select(`
        hostname,
        role,
        organization_id,
        app_path,
        organizations!inner(slug)
      `)
      .eq('hostname', hostname)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('Error resolving domain:', error);
      return null;
    }

    if (!domain) {
      // Fallback: verificar se é subdomínio conhecido
      return resolveSubdomain(hostname);
    }

    return {
      hostname: domain.hostname,
      role: domain.role,
      organizationId: domain.organization_id,
      appPath: domain.app_path || '/app',
      organizationSlug: domain.organizations?.slug || null,
    };
  } catch (error) {
    console.error('Error in resolveDomain:', error);
    return null;
  }
}

/**
 * Resolve subdomínios conhecidos (fallback)
 */
function resolveSubdomain(hostname: string): DomainInfo | null {
  // Portal de fornecedores
  if (hostname === 'fornecedores.studioos.pro') {
    return {
      hostname,
      role: 'supplier',
      organizationId: null,
      appPath: '/',
      organizationSlug: null,
    };
  }

  // Admin (futuro: admin.studioos.pro)
  if (hostname.startsWith('admin.')) {
    return {
      hostname,
      role: 'admin',
      organizationId: null,
      appPath: '/',
      organizationSlug: null,
    };
  }

  return null;
}
```

---

### Fase 2: Hook para Roteamento por Domínio

**Arquivo:** `src/hooks/useDomainRouting.ts` (criar)

```typescript
import { useQuery } from '@tanstack/react-query';
import { resolveDomain } from '@/lib/domainResolver';
import { useMemo } from 'react';

export function useDomainRouting() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  const { data: domainInfo, isLoading } = useQuery({
    queryKey: ['domain-routing', hostname],
    queryFn: () => resolveDomain(hostname),
    enabled: !!hostname,
    staleTime: 1000 * 60 * 60, // 1 hora (domínios mudam pouco)
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  const isSupplierPortal = domainInfo?.role === 'supplier';
  const isAdminPortal = domainInfo?.role === 'admin';
  const isMarketing = domainInfo?.role === 'marketing';
  const isApp = domainInfo?.role === 'app';

  return {
    domainInfo,
    isLoading,
    isSupplierPortal,
    isAdminPortal,
    isMarketing,
    isApp,
    organizationId: domainInfo?.organizationId || null,
    organizationSlug: domainInfo?.organizationSlug || null,
    appPath: domainInfo?.appPath || '/app',
  };
}
```

---

### Fase 3: Atualizar App.tsx

**Modificar:** `src/App.tsx`

```typescript
import { useDomainRouting } from '@/hooks/useDomainRouting';
import { useLocation, Navigate } from 'react-router-dom';

const AppContent = () => {
  const { domainInfo, isSupplierPortal, isAdminPortal, organizationSlug } = useDomainRouting();
  const location = useLocation();
  
  // Portal de fornecedores
  if (isSupplierPortal) {
    return <SupplierPortal />;
  }

  // Admin StudioOS
  if (isAdminPortal && location.pathname.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  // Marketing: redirecionar / para landing page
  if (domainInfo?.role === 'marketing' && organizationSlug && location.pathname === '/') {
    return <Navigate to={`/lp/${organizationSlug}`} replace />;
  }

  // ... resto das rotas existentes
};
```

---

## 📋 Migration SQL

**Arquivo:** `supabase/migrations/20260116000001_domains_structure.sql`

```sql
-- =====================================================
-- ESTRUTURA DE DOMÍNIOS CORRIGIDA
-- Separa domínio de tipo de organização
-- =====================================================

-- 1. Adicionar type à organizations (se não existir)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client' 
  CHECK (type IN ('client', 'internal'));

-- Atualizar Prisma para type = 'client' (não é tipo especial)
UPDATE public.organizations 
SET type = 'client' 
WHERE slug = 'prisma' AND type IS NULL;

-- 2. Criar tabela domains
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  app_path TEXT DEFAULT '/app',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT domain_role_org_check CHECK (
    (role IN ('admin', 'supplier') AND organization_id IS NULL) OR
    (role IN ('marketing', 'app') AND organization_id IS NOT NULL)
  )
);

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

-- 4. Relacionamento supplier ↔ organization
CREATE TABLE IF NOT EXISTS public.supplier_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);

-- 5. RLS para domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains"
  ON public.domains FOR SELECT
  USING (active = true);

-- 6. RLS para suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own data"
  ON public.suppliers FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM auth.users WHERE email = suppliers.email
  ));

-- 7. Dados iniciais (exemplos)
-- StudioOS marketing
INSERT INTO public.domains (hostname, role, app_path)
VALUES ('studioos.pro', 'marketing', '/app')
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS admin
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
```

---

## 🎯 Decisões MVP vs Scale

### ✅ MVP (Agora)

1. **Roteamento no frontend**
   - ✅ Funciona para MVP
   - ⚠️ Documentar que migra para edge no futuro

2. **Caminho `/app` fixo**
   - ✅ Simples e consistente
   - ⚠️ Documentar limitações de SEO

3. **Domínios no banco**
   - ✅ Flexível e configurável
   - ✅ Permite evolução

### 📈 Scale (Futuro - 12 meses)

1. **Vercel Edge Middleware**
   - Resolver domínio antes do frontend
   - Melhor SEO e performance

2. **Subdomínios dinâmicos**
   - `app.cliente.com.br` (melhor SEO)
   - `admin.studioos.pro` (separação clara)

3. **CDN + Cache**
   - Cache de resolução de domínio
   - Redução de queries ao banco

---

## 📚 Referências de Mercado

- **Shopify Plus:** `cliente.com` + `cliente.com/admin`
- **GoHighLevel:** `cliente.com` + `app.gohighlevel.com`
- **Salesforce Experience Cloud:** `cliente.com` + subdomínios
- **Vercel:** Edge middleware para roteamento

---

## ✅ Checklist de Implementação

- [ ] Criar migration `20260116000001_domains_structure.sql`
- [ ] Aplicar migration no Supabase
- [ ] Criar `src/lib/domainResolver.ts`
- [ ] Criar `src/hooks/useDomainRouting.ts`
- [ ] Atualizar `src/App.tsx` com roteamento
- [ ] Criar componente `SupplierPortal`
- [ ] Testar com domínios reais
- [ ] Documentar decisões MVP vs Scale

---

**Última atualização:** 2025-01-16
**Status:** ✅ Modelo corrigido - Pronto para implementação
