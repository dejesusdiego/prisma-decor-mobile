# 🏗️ INVESTIGAÇÃO ARQUITETURAL: MIGRAÇÃO V5 → MONOLITO MODULAR
## StudioOS - Relatório Completo de Análise

---

## 📋 RESUMO EXECUTIVO

Esta investigação analisou a arquitetura atual V5 ("The Clean Split") do StudioOS e propõe uma migração para uma arquitetura "Monolito Modular" que resolve os problemas críticos de múltiplos deploys, código duplicado e complexidade de desenvolvimento.

### Principais Descobertas

| Aspecto | Estado Atual (V5) | Proposta (Monolito Modular) |
|---------|-------------------|----------------------------|
| **Deploys** | 3 apps separados | 1 deploy único na Vercel |
| **Arquivos .env** | 4 diferentes | 1 único |
| **Código duplicado** | 12+ componentes/hooks | Consolidado em core/ |
| **Roteamento** | DomainRouter complexo | Switch simples por hostname |
| **Auth** | 3 implementações diferentes | 1 hook universal |
| **Hot reload** | Fragmentado | Unificado |

---

## 1. INVENTÁRIO COMPLETO DE CÓDIGO

### 1.1 APP CORE (apps/core/src/) - ERP Principal

| Arquivo | Status | Destino Proposto | Observações |
|---------|--------|------------------|-------------|
| **Pages** |
| `pages/DashboardPage.tsx` | ✅ FUNCIONAL | `modules/org/pages/DashboardPage.tsx` | Métricas de orçamentos, ações rápidas |
| `pages/NovoOrcamentoPage.tsx` | ✅ FUNCIONAL | `modules/org/pages/NovoOrcamentoPage.tsx` | Wizard completo de orçamentos |
| `pages/OrcamentosPage.tsx` | ✅ FUNCIONAL | `modules/org/pages/OrcamentosPage.tsx` | Lista de orçamentos |
| `pages/LoginPage.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/LoginPage.tsx` | UI diferente mas lógica igual |
| **Components** |
| `components/AppLayout.tsx` | ✅ FUNCIONAL | `modules/org/components/OrgLayout.tsx` | Layout específico do ERP |
| `components/ProtectedRoute.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/ProtectedRoute.tsx` | Mesma lógica, importa de core |
| `components/Sidebar.tsx` | ✅ FUNCIONAL | `modules/org/components/Sidebar.tsx` | Navegação do ERP |
| `components/ErrorBoundary.tsx` | ✅ FUNCIONAL | `core/components/ErrorBoundary.tsx` | Reutilizável |
| `components/ui/*.tsx` | ✅ FUNCIONAL | `core/components/ui/*.tsx` | Button, Card, Input, etc. |
| `components/wizard/*.tsx` | ✅ FUNCIONAL | `modules/org/components/wizard/*.tsx` | Wizard de orçamentos |
| **Hooks** |
| `hooks/useAuth.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/useAuth.tsx` | Hook + Provider juntos |
| `hooks/useCriarOrcamento.ts` | ✅ FUNCIONAL | `modules/org/hooks/useCriarOrcamento.ts` | Específico do ERP |
| `hooks/useDashboardStats.ts` | ✅ FUNCIONAL | `modules/org/hooks/useDashboardStats.ts` | Específico do ERP |
| `hooks/useOrcamentoWizard.ts` | ✅ FUNCIONAL | `modules/org/hooks/useOrcamentoWizard.ts` | Específico do ERP |
| `hooks/useOrcamentos.ts` | ✅ FUNCIONAL | `modules/org/hooks/useOrcamentos.ts` | Específico do ERP |
| **Lib** |
| `lib/supabase.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/supabase.ts` | Mesmo cliente Supabase |
| `lib/utils.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/utils.ts` | Função cn() |
| `lib/calculations.ts` | ✅ FUNCIONAL | `modules/org/lib/calculations.ts` | Cálculos de orçamentos |
| **Config** |
| `router.tsx` | ✅ FUNCIONAL | `modules/org/router.tsx` | Rotas do ERP |
| `main.tsx` | 🔧 REFATORAR | `main.tsx` novo | Simplificar entry point |

### 1.2 APP PLATFORM (apps/platform/src/) - Admin da Plataforma

| Arquivo | Status | Destino Proposto | Observações |
|---------|--------|------------------|-------------|
| **Pages** |
| `pages/DashboardPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/DashboardPage.tsx` | Métricas da plataforma (MRR, orgs) |
| `pages/OrganizationsPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/OrganizationsPage.tsx` | Gestão de organizações |
| `pages/SuppliersPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/SuppliersPage.tsx` | Aprovação de fornecedores |
| `pages/UsersPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/UsersPage.tsx` | Gestão de usuários |
| `pages/PlansPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/PlansPage.tsx` | Gestão de planos |
| `pages/LoginPage.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/LoginPage.tsx` | UI diferente (Shield icon) |
| **Components** |
| `components/PlatformLayout.tsx` | ✅ FUNCIONAL | `modules/admin/components/AdminLayout.tsx` | Layout específico do admin |
| `components/ProtectedRoute.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/ProtectedRoute.tsx` | Verifica super_admin |
| `components/ConfigError.tsx` | ⚠️ DUPLICADO | Consolidar em `core/components/ConfigError.tsx` | Erro de configuração |
| **Hooks** |
| `hooks/useAuth.ts` | ⚠️ DUPLICADO | Consolidar em `core/auth/useAuth.ts` | Lógica diferente (useState) |
| `hooks/AuthProvider.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/AuthProvider.tsx` | Provider separado do hook |
| `hooks/usePlatformStats.ts` | ✅ FUNCIONAL | `modules/admin/hooks/usePlatformStats.ts` | Específico do admin |
| **Lib** |
| `lib/supabase.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/supabase.ts` | Com validação de env |
| `lib/utils.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/utils.ts` | Mesma função cn() |
| **Config** |
| `router.tsx` | ✅ FUNCIONAL | `modules/admin/router.tsx` | Rotas do admin |
| `main.tsx` | 🔧 REFATORAR | `main.tsx` novo | Com verificação de env |

### 1.3 APP PORTAL (apps/portal/src/) - Portal do Fornecedor

| Arquivo | Status | Destino Proposto | Observações |
|---------|--------|------------------|-------------|
| **Pages** |
| `pages/DashboardPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/DashboardPage.tsx` | Métricas do fornecedor |
| `pages/CatalogoPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/CatalogoPage.tsx` | Gestão de catálogo |
| `pages/PedidosPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/PedidosPage.tsx` | Pedidos recebidos |
| `pages/PerfilPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/PerfilPage.tsx` | Perfil do fornecedor |
| `pages/LoginPage.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/LoginPage.tsx` | UI diferente (Package icon) |
| **Components** |
| `components/PortalLayout.tsx` | ✅ FUNCIONAL | `modules/supplier/components/SupplierLayout.tsx` | Layout específico |
| `components/ProtectedRoute.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/ProtectedRoute.tsx` | Verifica supplier |
| `components/ConfigError.tsx` | ⚠️ DUPLICADO | Consolidar em `core/components/ConfigError.tsx` | Idêntico ao platform |
| **Hooks** |
| `hooks/useAuth.ts` | ⚠️ DUPLICADO | Consolidar em `core/auth/useAuth.ts` | Lógica diferente (verifica supplier) |
| `hooks/AuthProvider.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/AuthProvider.tsx` | Idêntico ao platform |
| `hooks/useSupplierStats.ts` | ✅ FUNCIONAL | `modules/supplier/hooks/useSupplierStats.ts` | Específico do portal |
| **Lib** |
| `lib/supabase.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/supabase.ts` | Com validação de env |
| `lib/utils.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/utils.ts` | Mesma função cn() |
| **Config** |
| `router.tsx` | ✅ FUNCIONAL | `modules/supplier/router.tsx` | Rotas do fornecedor |
| `main.tsx` | 🔧 REFATORAR | `main.tsx` novo | Com verificação de env |

### 1.4 CÓDIGO LEGADO V4 (src/) - Status

| Arquivo | Status | Destino | Observações |
|---------|--------|---------|-------------|
| **Routing** |
| `routing/DomainRouter.tsx` | ❌ OBSOLETO | Não migrar | 260 linhas de complexidade desnecessária |
| `routing/RouteValidator.tsx` | ❌ OBSOLETO | Não migrar | Validação no backend |
| `routing/RedirectHandler.tsx` | ❌ OBSOLETO | Não migrar | Redirecionamento nativo |
| **Pages** |
| `pages/LoginGateway.tsx` | 🔧 REFATORAR | Simplificar | 344 linhas - pode ser reduzido |
| `pages/GerarOrcamento.tsx` | ✅ REAPROVEITÁVEL | `modules/org/pages/` | Funcionalidade do wizard |
| `pages/AdminSupremo.tsx` | ✅ REAPROVEITÁVEL | `modules/admin/pages/` | Painel admin |
| `pages/LandingPage*.tsx` | ✅ REAPROVEITÁVEL | `modules/marketing/pages/` | Landing pages |
| **Hooks** |
| `hooks/useAuth.tsx` | ⚠️ PARCIAL | Referência | Versão antiga com redirectAfterLogin |
| `hooks/useDomainRouting.ts` | ❌ OBSOLETO | Não migrar | Resolução complexa de domínio |
| **Lib** |
| `lib/redirectAfterLogin.ts` | ❌ OBSOLETO | Não migrar | Lógica excessivamente complexa |
| `domains/index.ts` | ⚠️ PARCIAL | Referência | Configurações de domínio |
| `domains/types.ts` | ✅ REAPROVEITÁVEL | `core/types/` | Tipos bem definidos |

---

## 2. ANÁLISE DE DEPENDÊNCIAS

### 2.1 Conflitos de Versão Encontrados

| Pacote | Core | Platform | Portal | Recomendação Unificada |
|--------|------|----------|--------|------------------------|
| react | ^18.2.0 | ^18.3.1 | ^18.2.0 | **^18.3.1** |
| react-dom | ^18.2.0 | ^18.3.1 | ^18.2.0 | **^18.3.1** |
| react-router-dom | ^6.20.0 | ^6.21.0 | ^6.20.1 | **^6.21.0** |
| @tanstack/react-query | ^5.12.0 | ^5.17.0 | ^5.8.0 | **^5.17.0** |
| vite | ^5.0.0 | ^5.0.10 | ^5.0.8 | **^5.0.10** |
| typescript | ^5.3.0 | ^5.3.3 | ^5.2.2 | **^5.3.3** |
| tailwindcss | ^3.3.6 | ^3.4.0 | ^3.3.5 | **^3.4.0** |

### 2.2 Dependências Únicas por App

| App | Dependências Únicas | Ação |
|-----|---------------------|------|
| **Core** | `lodash`, `uuid` | Manter no package unificado |
| **Platform** | `@monaco-editor/react`, `monaco-editor`, `socket.io-client`, `zod`, `react-hook-form` | Manter (admin avançado) |
| **Portal** | `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `framer-motion` | Consolidar/mesclar |

### 2.3 Package.json Unificado Proposto

```json
{
  "name": "studioos-unified",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.0",
    "@supabase/supabase-js": "^2.39.0",
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.0.0",
    "axios": "^1.6.5",
    "recharts": "^2.10.0",
    "lodash": "^4.17.21",
    "uuid": "^9.0.0",
    "@monaco-editor/react": "^4.6.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/lodash": "^4.14.202",
    "@types/uuid": "^9.0.7",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  }
}
```

---

## 3. SISTEMA DE AUTENTICAÇÃO ATUAL

### 3.1 Problemas Identificados

1. **3 implementações diferentes de useAuth:**
   - `apps/core/src/hooks/useAuth.tsx` - Hook + Provider juntos (97 linhas)
   - `apps/platform/src/hooks/useAuth.ts` - Hook separado do Provider (69 linhas)
   - `apps/portal/src/hooks/useAuth.ts` - Hook com verificação de supplier (124 linhas)

2. **3 ProtectedRoute diferentes:**
   - Core: Verifica apenas autenticação
   - Platform: Verifica super_admin + redireciona cross-domain
   - Portal: Verifica se é supplier aprovado

3. **3 AuthProvider diferentes:**
   - Core: useAuth integrado
   - Platform/Portal: Provider separado que usa useAuth

### 3.2 Proposta de Auth Unificada

```typescript
// core/auth/types.ts
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: 'super_admin' | 'org_admin' | 'org_user' | 'supplier' | null;
  organizationId: string | null;
  supplierId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

// core/auth/useAuth.ts - Hook universal
// core/auth/AuthProvider.tsx - Provider único
// core/auth/ProtectedRoute.tsx - Guard com role check
// core/auth/RoleGuard.tsx - Guard específico por role
```

---

## 4. SISTEMA DE ROTEAMENTO ATUAL

### 4.1 DomainRouter V4 (Legado) - PROBLEMA PRINCIPAL

**Arquivo:** `src/routing/DomainRouter.tsx` (260 linhas)

**Problemas:**
- Detecção de hostname com múltiplas condições aninhadas
- Fallbacks complexos para localhost
- Rotas espalhadas em múltiplos blocos if
- Lógica de slug extraction duplicada

```typescript
// Código problemático atual:
if (currentDomain?.id === 'super-admin' || hostname.startsWith('admin.')) {
  return (<Routes>...</Routes>); // 15 rotas
}
if (currentDomain?.id === 'supplier' || hostname.startsWith('fornecedores.')) {
  return (<Routes>...</Routes>); // 5 rotas
}
// ... mais 4 blocos if
```

### 4.2 Proposta: DomainRouter Simplificado

```typescript
// core/router/DomainRouter.tsx - 30 linhas
import { Suspense, lazy } from 'react';

const AdminRouter = lazy(() => import('@/modules/admin/router'));
const OrgRouter = lazy(() => import('@/modules/org/router'));
const SupplierRouter = lazy(() => import('@/modules/supplier/router'));
const MarketingRouter = lazy(() => import('@/modules/marketing/router'));

export function DomainRouter() {
  const hostname = window.location.hostname;
  
  switch (true) {
    case hostname.startsWith('admin.'):
      return <AdminRouter />;
    case hostname.startsWith('fornecedores.'):
      return <SupplierRouter />;
    case hostname === 'studioos.pro' || hostname === 'www.studioos.pro':
      return <MarketingRouter />;
    case hostname.startsWith('app.'):
    default:
      return <OrgRouter />;
  }
}
```

---

## 5. PLANO DE MIGRAÇÃO STEP-BY-STEP

### FASE 1: Fundação (Dia 1-2)

```bash
# PASSO 1: Criar estrutura de pastas
mkdir -p studioos-unified/src/{modules/{admin,org,supplier,marketing},core/{auth,components,lib,router}}

# PASSO 2: Criar package.json unificado
# (ver seção 2.3)

# PASSO 3: Configurar Vite, TypeScript, Tailwind
```

### FASE 2: Core Compartilhado (Dia 3-4)

- [ ] **PASSO 4:** Migrar `core/lib/supabase.ts` (baseado no portal/platform)
- [ ] **PASSO 5:** Migrar `core/lib/utils.ts` (função cn())
- [ ] **PASSO 6:** Migrar componentes UI (`core/components/ui/`)
- [ ] **PASSO 7:** Criar auth unificada (`core/auth/`)

### FASE 3: Módulos (Dia 5-7)

- [ ] **PASSO 8:** Módulo Admin completo
- [ ] **PASSO 9:** Módulo Org completo
- [ ] **PASSO 10:** Módulo Supplier completo
- [ ] **PASSO 11:** Módulo Marketing (placeholder)

### FASE 4: Integração (Dia 8)

- [ ] **PASSO 12:** Criar `App.tsx` novo (30 linhas)
- [ ] **PASSO 13:** Criar `main.tsx`
- [ ] **PASSO 14:** Implementar `DomainRouter` simplificado

### FASE 5: Deploy (Dia 9-10)

- [ ] **PASSO 15:** Configurar `vercel.json`
- [ ] **PASSO 16:** Unificar `.env`
- [ ] **PASSO 17:** Testes em staging
- [ ] **PASSO 18:** Deploy em produção

---

## 6. ESTRUTURA FINAL PROPOSTA

```
studioos-unified/
├── src/
│   ├── modules/
│   │   ├── marketing/         # studioos.pro
│   │   │   ├── pages/
│   │   │   └── router.tsx
│   │   ├── admin/             # admin.studioos.pro
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── OrganizationsPage.tsx
│   │   │   │   ├── SuppliersPage.tsx
│   │   │   │   ├── UsersPage.tsx
│   │   │   │   └── PlansPage.tsx
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── router.tsx
│   │   ├── org/               # app.studioos.pro
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── OrcamentosPage.tsx
│   │   │   │   └── NovoOrcamentoPage.tsx
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   │   └── wizard/
│   │   │   └── router.tsx
│   │   ├── supplier/          # fornecedores.studioos.pro
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── CatalogoPage.tsx
│   │   │   │   ├── PedidosPage.tsx
│   │   │   │   └── PerfilPage.tsx
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── router.tsx
│   │   └── affiliate/         # afiliados.studioos.pro (placeholder)
│   │
│   ├── core/
│   │   ├── auth/
│   │   │   ├── types.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   ├── router/
│   │   │   └── DomainRouter.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── ConfigError.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── lib/
│   │       ├── supabase.ts
│   │       └── utils.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── vercel.json
```

---

## 7. CHECKLIST DE IMPLEMENTAÇÃO

### Preparação
- [ ] Backup do código atual
- [ ] Criar branch `monolito-modular`
- [ ] Configurar ambiente de staging

### Fase 1: Fundação
- [ ] Criar estrutura de pastas
- [ ] Criar package.json unificado
- [ ] Configurar Vite
- [ ] Configurar TypeScript
- [ ] Configurar Tailwind

### Fase 2: Core
- [ ] Migrar supabase.ts
- [ ] Migrar utils.ts
- [ ] Migrar componentes UI
- [ ] Criar auth unificada
- [ ] Criar ProtectedRoute com roles
- [ ] Testar auth isoladamente

### Fase 3: Módulos
- [ ] Módulo Admin completo
- [ ] Módulo Org completo
- [ ] Módulo Supplier completo
- [ ] Módulo Marketing (placeholder)

### Fase 4: Integração
- [ ] Criar App.tsx
- [ ] Criar main.tsx
- [ ] Implementar DomainRouter
- [ ] Configurar lazy loading

### Fase 5: Deploy
- [ ] Configurar vercel.json
- [ ] Unificar .env
- [ ] Deploy em staging
- [ ] Testar todos os domínios
- [ ] Testar auth cross-domain
- [ ] Deploy em produção

### Pós-Deploy
- [ ] Deletar apps/ antigos
- [ ] Arquivar src/ V4
- [ ] Atualizar documentação
- [ ] Treinar equipe

---

## 8. RISCOS IDENTIFICADOS E MITIGAÇÃO

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Conflitos de CSS | Média | Médio | Usar Tailwind scopes |
| Dados compartilhados | Baixa | Alto | Context global |
| Bundle muito grande | Média | Médio | Lazy load por módulo |
| Problemas de auth | Baixa | Alto | Testes extensivos |
| Regressão funcional | Média | Alto | Testes manuais |

---

## 9. ESTIMATIVA DE ESFORÇO

| Fase | Dias | Esforço |
|------|------|---------|
| Fundação | 2 | 16h |
| Core compartilhado | 2 | 16h |
| Módulos | 3 | 24h |
| Integração | 1 | 8h |
| Configuração/Deploy | 2 | 16h |
| **Total** | **10 dias** | **80h** |

---

## 10. CONCLUSÃO

A migração para Monolito Modular resolve os problemas críticos da arquitetura V5:

1. **Elimina múltiplos deploys** - Um único deploy na Vercel
2. **Unifica código duplicado** - Auth, UI, Supabase em um só lugar
3. **Simplifica roteamento** - DomainRouter de 260 linhas → 30 linhas
4. **Melhora DX** - Um servidor de dev, hot reload unificado
5. **Mantém escalabilidade** - Módulos podem virar apps separados no futuro

---

**Relatório gerado em:** 2026-01-31  
**Status:** ✅ Completo - Pronto para implementação
