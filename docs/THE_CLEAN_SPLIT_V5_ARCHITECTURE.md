# 🏗️ THE CLEAN SPLIT V5 - Arquitetura de Resgate

## 📋 Visão Geral

**Objetivo**: Separar o monolito em 3 aplicações independentes, cada uma com seu próprio deploy, build e domínio.

**Benefícios**:
- ✅ Admin quebra → ERP continua funcionando
- ✅ Bundle otimizado (cada app carrega só o que precisa)
- ✅ Manutenção isolada
- ✅ Times podem trabalhar em paralelo
- ✅ Deploy independente

---

## 🗂️ Estrutura do Monorepo

```
studioos-v5/
├── README.md
├── package.json                    # Workspaces config
├── turbo.json                      # Turborepo para builds paralelos
├── shared/                         # Código compartilhado
│   ├── ui/                         # shadcn/ui components puros
│   ├── types/                      # Typescript interfaces
│   ├── lib/                        # Utils, formatters, hooks genéricos
│   └── supabase/                   # Cliente Supabase + types
│
├── apps/
│   ├── marketing/                  # Next.js - LP estática
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── src/
│   │   │   ├── app/               # App router Next.js
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── vercel.json
│   │
│   ├── core/                       # Vite + React - ERP Principal
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx            # Router simples
│   │   │   ├── router.tsx         # Rotas do ERP
│   │   │   ├── components/        # ERP-specific
│   │   │   ├── pages/             # GerarOrcamento, Produção, etc
│   │   │   └── hooks/             # ERP-specific hooks
│   │   └── vercel.json
│   │
│   ├── platform/                   # Vite + React - Super Admin
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx         # Rotas admin simples
│   │   │   ├── components/
│   │   │   └── pages/             # AdminSupremo, GerenciarUsuarios
│   │   └── vercel.json
│   │
│   └── portal/                     # Vite + React - Fornecedores
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── router.tsx
│       │   ├── components/
│       │   └── pages/             # SupplierPortal
│       └── vercel.json
│
└── infra/
    ├── migrations/
    │   ├── 00000000000000_baseline_schema.sql
    │   └── 00000000000001_seed_data.sql
    └── vercel-configs/            # Configs para cada deploy
```

---

## 🌐 Mapeamento de Domínios

| Domínio | App | Vercel Project | Branch |
|---------|-----|----------------|--------|
| `studioos.pro` | marketing | studioos-marketing | main |
| `app.studioos.pro` | core | studioos-core | main |
| `{slug}-app.studioos.pro` | core | studioos-core | main |
| `panel.studioos.pro` | platform | studioos-platform | main |
| `fornecedores.studioos.pro` | portal | studioos-portal | main |

---

## 📦 Shared Package

### Estrutura
```typescript
// shared/types/index.ts
export * from './user';
export * from './organization';
export * from './orcamento';

// shared/lib/index.ts
export { formatCurrency } from './formatters';
export { cn } from './utils';
export { supabase } from './supabase';

// shared/ui/index.ts
export { Button } from './button';
export { Input } from './input';
// ... shadcn components

// shared/hooks/index.ts
export { useAuth } from './useAuth';
export { useOrganization } from './useOrganization';
```

### Uso nos Apps
```json
// apps/core/package.json
{
  "dependencies": {
    "@studioos/shared": "workspace:*",
    "@studioos/ui": "workspace:*"
  }
}
```

---

## 🔧 Apps Específicos

### 1. Marketing (Next.js)
```typescript
// apps/marketing/src/app/page.tsx
export default function HomePage() {
  return <LandingPageStudioOS />;
}

// apps/marketing/src/app/login/page.tsx
export default function LoginPage() {
  return <LoginGateway />;
}
```

### 2. Core (Vite + ERP)
```typescript
// apps/core/src/router.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutERP />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'orcamentos', element: <OrcamentosList /> },
      { path: 'orcamentos/novo', element: <NovoOrcamento /> },
      { path: 'orcamentos/:id', element: <VisualizarOrcamento /> },
      { path: 'producao', element: <Producao /> },
      { path: 'financeiro/*', element: <Financeiro /> },
      { path: 'configuracoes/*', element: <Configuracoes /> },
    ]
  }
]);
```

### 3. Platform (Admin)
```typescript
// apps/platform/src/router.tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute requireAdmin><LayoutAdmin /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminSupremo /> },
      { path: 'usuarios', element: <GerenciarUsuarios /> },
      { path: 'fornecedores', element: <SupplierApprovalList /> },
      { path: 'organizacoes', element: <OrganizationsList /> },
    ]
  }
]);
```

### 4. Portal (Fornecedores)
```typescript
// apps/portal/src/router.tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute requireSupplier><LayoutPortal /></ProtectedRoute>,
    children: [
      { index: true, element: <SupplierDashboard /> },
      { path: 'materiais', element: <SupplierMaterials /> },
      { path: 'pedidos', element: <SupplierOrders /> },
    ]
  },
  { path: '/login', element: <LoginGateway /> },
  { path: '/cadastro', element: <CadastroFornecedor /> },
]);
```

---

## 🗄️ Banco de Dados - Migration Squash

### Schema Final Único
```sql
-- 00000000000000_baseline_schema.sql
-- TUDO em um arquivo: schema completo e limpo

-- Auth (Supabase)
-- Organizations
-- Users & Roles
-- Orçamentos & Pedidos
-- Financeiro
-- Produção
-- Fornecedores
-- CRM
-- Configurações

-- Sem ALTER TABLE, sem migrações incrementais
-- Schema puro, perfeito, documentado
```

### Seed Data
```sql
-- 00000000000001_seed_data.sql
-- Dados iniciais necessários:
-- - Plano free
-- - Organização StudioOS interna
-- - Domínios base
-- - Feature flags defaults
```

---

## 🚀 Deploy Pipeline

### 1. Vercel Projects
```
studioos-marketing → apps/marketing/ → studioos.pro
studioos-core      → apps/core/      → app.studioos.pro + *.studioos.pro
studioos-platform  → apps/platform/  → panel.studioos.pro
studioos-portal    → apps/portal/    → fornecedores.studioos.pro
```

### 2. Build Commands
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### 3. Comandos
```bash
# Build tudo
npm run build

# Build específico
npm run build -- --filter=core

# Dev paralelo
npm run dev
```

---

## 🔐 Auth Cross-App

### Redirecionamento Pós-Login
```typescript
// shared/lib/auth-redirect.ts
export function getRedirectUrl(user: User): string {
  const roles = user.roles || [];
  
  if (roles.includes('super_admin')) {
    return 'https://panel.studioos.pro';
  }
  
  if (roles.includes('supplier')) {
    return 'https://fornecedores.studioos.pro';
  }
  
  // Usuário normal - redireciona para app da org
  const orgSlug = user.organization?.slug;
  return `https://${orgSlug}-app.studioos.pro`;
}
```

### Session Compartilhada
```typescript
// shared/lib/supabase.ts
// Mesmo cliente Supabase em todos os apps
// Session persiste via cookies no domínio .studioos.pro
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
```

---

## 📋 Plano de Execução (7 Dias)

### DIA 1: Fundação
- [ ] Setup monorepo com pnpm workspaces
- [ ] Criar shared package
- [ ] Migration squash (2 arquivos: schema + seed)
- [ ] Limpeza: mover docs legados para archive/

### DIA 2: Marketing App
- [ ] Criar apps/marketing/ com Next.js
- [ ] Mover LandingPageStudioOS
- [ ] Mover páginas de marketing
- [ ] Configurar deploy Vercel

### DIA 3: Core App (ERP)
- [ ] Criar apps/core/ com Vite
- [ ] Mover todas páginas ERP
- [ ] Setup router simples
- [ ] Testar build

### DIA 4: Platform App (Admin)
- [ ] Criar apps/platform/ com Vite
- [ ] Mover páginas admin
- [ ] Configurar auth de admin
- [ ] Testar build

### DIA 5: Portal App (Fornecedores)
- [ ] Criar apps/portal/ com Vite
- [ ] Mover SupplierPortal
- [ ] Configurar auth de fornecedor
- [ ] Testar build

### DIA 6: Integração
- [ ] Configurar redirects cross-app
- [ ] Testar auth entre apps
- [ ] DNS e domínios

### DIA 7: Go Live
- [ ] Deploy produção
- [ ] Testes finais
- [ ] Delete código legado
- [ ] Celebrar! 🎉

---

## 🎯 Sucesso = Zero "DomainRouter"

Cada app tem seu próprio App.tsx simples:

```typescript
// apps/core/src/App.tsx
function App() {
  return <RouterProvider router={router} />;
}

// Nada de:
// ❌ if (hostname.includes('admin'))
// ❌ DomainRouter
// ❌ useDomainRouting complexo
```

O domínio aponta para o app correto via **DNS**, não via código.

---

## 📚 Documentação Nova

Manter apenas:
- `README.md` - Setup e comandos
- `ARCHITECTURE.md` - Decisões arquiteturais
- `DEPLOY.md` - Como fazer deploy
- `shared/README.md` - Como usar shared

Deletar:
- Todos os docs/ legados (mover para archive/)
- Múltiplos guias de dominios
- QA guides obsoletos
