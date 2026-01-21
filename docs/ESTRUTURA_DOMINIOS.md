# 🌐 Estrutura de Domínios - Estado Atual e Planejamento

> ⚠️ **ATENÇÃO:** Este documento contém erros conceituais identificados. 
> **Versão corrigida:** Veja [`ESTRUTURA_DOMINIOS_V2.md`](./ESTRUTURA_DOMINIOS_V2.md)
> 
> **Principais correções:**
> - ❌ Removido: `domain_type` misturado com tipo de organização
> - ✅ Adicionado: Tabela `domains` separada
> - ✅ Corrigido: Fornecedor não é `organization`
> - ✅ Corrigido: Prisma é `type = 'client'`, não tipo especial

## 📊 Resumo Executivo

Este documento descreve a estrutura atual de domínios do sistema e o que precisa ser implementado para suportar:
1. **Domínio personalizado por cliente** (ex: `empresa.com.br`)
2. **Domínio Prisma** (LP + Sistema)
3. **Domínio StudioOS** (LP SaaS + Admin + Portal Fornecedores)

---

## 🔍 Estado Atual

### ✅ O que já está implementado

#### 1. **Landing Pages por Slug**
- **Rota:** `/lp/:slug`
- **Exemplo:** `https://prisma-decor-mobile.vercel.app/lp/prisma`
- **Funcionalidade:** Cada organização pode ter sua landing page personalizada
- **Campo no banco:** `organizations.slug` (único)
- **Status:** ✅ Funcionando

#### 2. **Landing Page StudioOS**
- **Rota:** `/studioos`
- **Exemplo:** `https://prisma-decor-mobile.vercel.app/studioos`
- **Funcionalidade:** Landing page de marketing do SaaS
- **Status:** ✅ Funcionando

#### 3. **Campo para Domínio Personalizado**
- **Campo no banco:** `organizations.lp_custom_domain` (TEXT)
- **Índice:** Criado para busca rápida
- **Status:** ✅ Campo existe, mas **não há lógica de roteamento**

#### 4. **Sistema Multi-tenant**
- **Tabela:** `organizations` com `slug` único
- **RLS:** Configurado para isolamento por organização
- **Status:** ✅ Funcionando

---

## ❌ O que NÃO está implementado

### 1. **Roteamento Baseado em Domínio**

**Problema:** Atualmente, o sistema só funciona via rotas (`/lp/:slug`), não há detecção de domínio/subdomínio.

**O que falta:**
- Middleware para detectar `window.location.hostname`
- Lógica para mapear domínio → organização
- Suporte a subdomínios (ex: `prisma.studioos.pro`)

### 2. **Domínio Personalizado por Cliente**

**Estado:** Campo existe, mas não é usado.

**O que falta:**
- Middleware para detectar domínio personalizado
- Query no banco: `SELECT * FROM organizations WHERE lp_custom_domain = ?`
- Redirecionamento ou roteamento baseado em domínio
- Configuração de DNS/SSL (Vercel)

### 3. **Domínio Prisma Dedicado**

**Estado:** Funciona apenas via `/lp/prisma`.

**O que falta:**
- Domínio próprio (ex: `prismadecor.com.br`)
- Roteamento automático:
  - `/` → Landing page Prisma
  - `/app` ou `/sistema` → Sistema logado
- Configuração de DNS

### 4. **Domínio StudioOS Completo**

**Estado:** Apenas `/studioos` funciona.

**O que falta:**

#### 4.1. **Domínio Principal** (`studioos.pro` ou `studioos.com.br`)
- `/` → Landing page SaaS (atual `/studioos`)
- `/admin` → Painel administrativo (superadmin)
- `/app` → Sistema para clientes (atual `/gerarorcamento`)

#### 4.2. **Portal de Fornecedores** (`fornecedores.studioos.pro`)
- Subdomínio dedicado
- Login separado
- Roteamento específico para fornecedores
- **Status:** ❌ Não existe ainda

---

## 🏗️ Arquitetura Proposta

### Estrutura de Domínios

```
┌─────────────────────────────────────────────────────────────┐
│                    DOMÍNIOS PRINCIPAIS                       │
└─────────────────────────────────────────────────────────────┘

1. STUDIOOS (SaaS)
   ├── studioos.pro (ou studioos.com.br)
   │   ├── / → Landing page SaaS
   │   ├── /admin → Painel administrativo
   │   └── /app → Sistema para clientes
   │
   └── fornecedores.studioos.pro
       └── / → Portal de fornecedores

2. PRISMA (Cliente Multi-tenant)
   └── prismadecor.com.br (ou prisma.studioos.pro)
       ├── / → Landing page Prisma
       └── /app → Sistema logado

3. CLIENTES (Domínios Personalizados)
   ├── cliente1.com.br
   │   ├── / → Landing page cliente1
   │   └── /app → Sistema logado
   │
   ├── cliente2.com.br
   │   ├── / → Landing page cliente2
   │   └── /app → Sistema logado
   │
   └── ... (N clientes)
```

---

## 🔧 Implementação Necessária

### Fase 1: Detecção de Domínio (Middleware)

**Arquivo:** `src/middleware/domainRouter.ts` (criar)

```typescript
// Detectar organização baseado em domínio
export function getOrganizationByDomain(hostname: string): {
  type: 'studioos' | 'prisma' | 'client' | 'supplier' | 'default';
  slug?: string;
  customDomain?: string;
} {
  // StudioOS principal
  if (hostname === 'studioos.pro' || hostname === 'studioos.com.br') {
    return { type: 'studioos' };
  }

  // Portal de fornecedores
  if (hostname === 'fornecedores.studioos.pro') {
    return { type: 'supplier' };
  }

  // Prisma (domínio próprio ou subdomínio)
  if (hostname === 'prismadecor.com.br' || hostname === 'prisma.studioos.pro') {
    return { type: 'prisma', slug: 'prisma' };
  }

  // Cliente com domínio personalizado
  // Buscar no banco: SELECT slug FROM organizations WHERE lp_custom_domain = hostname
  
  // Default: usar rota /lp/:slug
  return { type: 'default' };
}
```

### Fase 2: Hook para Detecção de Domínio

**Arquivo:** `src/hooks/useDomainRouting.ts` (criar)

```typescript
export function useDomainRouting() {
  const hostname = window.location.hostname;
  const domainInfo = getOrganizationByDomain(hostname);
  
  // Se for domínio personalizado, buscar organização
  const { data: org } = useQuery({
    queryKey: ['organization-by-domain', hostname],
    queryFn: async () => {
      if (domainInfo.type === 'client') {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .eq('lp_custom_domain', hostname)
          .eq('lp_enabled', true)
          .maybeSingle();
        return data;
      }
      return null;
    },
    enabled: domainInfo.type === 'client',
  });

  return { domainInfo, organization: org };
}
```

### Fase 3: Atualizar App.tsx para Roteamento por Domínio

**Modificar:** `src/App.tsx`

```typescript
// Adicionar lógica de roteamento baseado em domínio
const AppContent = () => {
  const { domainInfo, organization } = useDomainRouting();
  const location = useLocation();

  // Portal de fornecedores
  if (domainInfo.type === 'supplier') {
    return <SupplierPortal />;
  }

  // StudioOS admin
  if (domainInfo.type === 'studioos' && location.pathname.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  // Cliente com domínio personalizado
  if (domainInfo.type === 'client' && organization) {
    // Redirecionar / para landing page
    if (location.pathname === '/') {
      return <Navigate to={`/lp/${organization.slug}`} replace />;
    }
  }

  // ... resto das rotas
};
```

### Fase 4: Configuração de Domínios no Vercel

**Passos:**
1. Acessar Vercel Dashboard
2. Project Settings → Domains
3. Adicionar domínios:
   - `studioos.pro` (ou `.com.br`)
   - `fornecedores.studioos.pro`
   - `prismadecor.com.br`
   - Domínios de clientes (conforme solicitado)

**Configuração DNS:**
- A records ou CNAME apontando para Vercel
- SSL automático via Vercel

---

## 📋 Tabela de Organizações - Campos Necessários

### Campos Existentes ✅
- `slug` (TEXT UNIQUE) - Identificador único
- `lp_custom_domain` (TEXT) - Domínio personalizado
- `lp_enabled` (BOOLEAN) - Se LP está habilitada

### Campos a Adicionar ❌

```sql
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS domain_type TEXT DEFAULT 'client' 
  CHECK (domain_type IN ('studioos', 'prisma', 'client', 'supplier')),
ADD COLUMN IF NOT EXISTS subdomain TEXT, -- ex: 'prisma' para prisma.studioos.pro
ADD COLUMN IF NOT EXISTS app_path TEXT DEFAULT '/app'; -- Caminho para sistema logado
```

---

## 🎯 Priorização de Implementação

### **Prioridade ALTA** 🔴
1. ✅ **Detecção de domínio** (middleware)
2. ✅ **Roteamento para domínios personalizados**
3. ✅ **Configuração StudioOS principal** (`studioos.pro`)

### **Prioridade MÉDIA** 🟡
4. ✅ **Portal de fornecedores** (`fornecedores.studioos.pro`)
5. ✅ **Domínio Prisma dedicado** (`prismadecor.com.br`)

### **Prioridade BAIXA** 🟢
6. ✅ **Subdomínios para clientes** (ex: `cliente.studioos.pro`)
7. ✅ **Interface admin para configurar domínios**

---

## 🔐 Segurança e RLS

### Considerações Importantes

1. **RLS por Domínio:**
   - Usuários só veem dados da organização do domínio atual
   - Portal de fornecedores: acesso apenas a dados de fornecedores

2. **Validação de Domínio:**
   - Verificar se domínio está ativo (`lp_enabled = true`)
   - Verificar se organização está ativa (`active = true`)

3. **CORS:**
   - Configurar CORS para domínios permitidos
   - Bloquear requisições de domínios não autorizados

---

## 📝 Exemplos de Uso

### Exemplo 1: Cliente com Domínio Próprio

```sql
-- Configurar domínio personalizado
UPDATE organizations 
SET 
  lp_custom_domain = 'minhaempresa.com.br',
  lp_enabled = true
WHERE slug = 'minha-empresa';
```

**Resultado:**
- `https://minhaempresa.com.br/` → Landing page
- `https://minhaempresa.com.br/app` → Sistema logado

### Exemplo 2: Prisma com Subdomínio

```sql
-- Configurar subdomínio
UPDATE organizations 
SET 
  subdomain = 'prisma',
  domain_type = 'prisma'
WHERE slug = 'prisma';
```

**Resultado:**
- `https://prisma.studioos.pro/` → Landing page Prisma
- `https://prisma.studioos.pro/app` → Sistema logado

### Exemplo 3: StudioOS Admin

**Roteamento automático:**
- `https://studioos.pro/` → Landing page SaaS
- `https://studioos.pro/admin` → Painel administrativo
- `https://studioos.pro/app` → Sistema para clientes

---

## 🚀 Próximos Passos

1. **Criar middleware de detecção de domínio**
2. **Implementar hook `useDomainRouting`**
3. **Atualizar `App.tsx` com roteamento por domínio**
4. **Criar componente `SupplierPortal`**
5. **Adicionar campos no banco (se necessário)**
6. **Configurar domínios no Vercel**
7. **Testar com domínios reais**

---

## 📚 Referências

- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [React Router Domain-based Routing](https://reactrouter.com/en/main)
- [Supabase RLS Multi-tenant](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última atualização:** 2025-01-16
**Status:** 📋 Planejamento - Aguardando implementação
