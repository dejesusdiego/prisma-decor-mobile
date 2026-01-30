# 🏗️ INVESTIGAÇÃO ARQUITETURAL: MIGRAÇÃO V5 → MONOLITO MODULAR
## StudioOS - Relatório Técnico Completo + Decisões Arquiteturais

---

## 📋 RESUMO EXECUTIVO

Esta investigação analisou a arquitetura atual V5 ("The Clean Split") do StudioOS e propõe uma migração para uma arquitetura "Monolito Modular" que resolve os problemas críticos de múltiplos deploys, código duplicado e complexidade de desenvolvimento.

### Principais Descobertas

| Aspecto | Estado Atual (V5) | Proposta (Monolito Modular) |
|---------|-------------------|----------------------------|
| **Deploys** | 3 apps separados | 1 deploy único na Vercel |
| **Arquivos .env** | 4 diferentes | 1 único |
| **Código duplicado** | 12+ componentes/hooks | Consolidado em core/ |
| **Roteamento** | DomainRouter complexo (260 linhas) | Switch simples (30 linhas) |
| **Auth** | 3 implementações diferentes | 1 hook universal |
| **Hot reload** | Fragmentado | Unificado |

---

## 🎯 DECISÕES TÉCNICAS - IMPLEMENTAÇÃO

### DECISÃO 1: IMPLEMENTAÇÃO DE AUTH UNIFICADA

**❓ Problema:** As 3 versões atuais têm diferenças críticas:
- **Core (97 linhas):** Hook + Provider juntos, valida organization_members
- **Platform (69 linhas):** Hook separado, useState simples, valida super_admin
- **Portal (124 linhas):** Verifica se é supplier aprovado no suppliers table

**✅ RECOMENDAÇÃO: Opção A - Context completo com todas as verificações**

**Justificativa:**
- Mantém toda a lógica de auth em um só lugar
- Evita duplicação de queries ao Supabase
- Permite caching de roles/permissions
- Facilita manutenção e debugging

**Risco:** Context pode ficar grande → Mitigação: Lazy load das verificações específicas

```typescript
// core/auth/types.ts
export type UserRole = 'super_admin' | 'org_admin' | 'org_user' | 'supplier' | null;

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  organizationId: string | null;
  supplierId: string | null;
  isApprovedSupplier: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}
```

---

### DECISÃO 2: PROTECTED ROUTE - ESTRATÉGIA DE ROLES

**❓ Problema:** Como verificar permissões de acesso?

**✅ RECOMENDAÇÃO: Opção C - RoleGuard separado**

**Justificativa:**
- Separação de responsabilidades: ProtectedRoute = autenticação, RoleGuard = autorização
- Mais flexível para diferentes combinações de roles
- Facilita testes unitários
- Código mais legível

**Risco:** Nenhum significativo

```typescript
// core/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Verificando autenticação..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// core/auth/RoleGuard.tsx
interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { role, loading } = useAuth();

  if (loading) return <LoadingScreen message="Verificando permissões..." />;
  if (!role || !allowedRoles.includes(role)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
```

---

### DECISÃO 3: LOGIN PAGE - UNIFICAÇÃO OU ADAPTAÇÃO

**❓ Problema:** Cada app tem uma LoginPage com UI diferente

**✅ RECOMENDAÇÃO: Opção C - Uma base + componentes de branding injetáveis**

**Justificativa:**
- Mantém consistência de UX (mesmo fluxo de login)
- Permite personalização visual por módulo
- Evita duplicação de lógica de formulário
- Facilita manutenção (mudança em um só lugar)

**Risco:** Complexidade inicial maior → Mitigação: Começar simples, evoluir depois

```typescript
// core/auth/LoginPage.tsx
interface LoginPageProps {
  branding?: {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgGradient: string;
  };
  redirectAfterLogin?: string;
}

export function LoginPage({ branding, redirectAfterLogin = '/' }: LoginPageProps) {
  // Lógica de login unificada
}

// modules/admin/pages/LoginPage.tsx
import { Shield } from 'lucide-react';
import { LoginPage as BaseLoginPage } from '@/core/auth/LoginPage';

export function LoginPage() {
  return (
    <BaseLoginPage
      branding={{
        title: 'Studio OS Platform',
        subtitle: 'Acesso exclusivo para Super Admin',
        icon: Shield,
        accentColor: 'text-purple-600',
        bgGradient: 'from-slate-900 via-slate-800 to-slate-900',
      }}
      redirectAfterLogin="/dashboard"
    />
  );
}
```

---

### DECISÃO 4: LAZY LOADING - GRANULARIDADE

**❓ Problema:** Como dividir o bundle para otimizar carregamento?

**✅ RECOMENDAÇÃO: Opção A - Lazy por módulo inteiro**

**Justificativa:**
- Balanceamento ideal entre performance e simplicidade
- Cada módulo é uma unidade lógica completa
- Reduz complexidade de roteamento
- Bundle splitting automático pelo Vite

**Risco:** Primeiro carregamento do módulo pode ser lento → Mitigação: Preload do módulo atual após login

```typescript
// core/router/DomainRouter.tsx
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
    default:
      return <OrgRouter />;
  }
}
```

---

### DECISÃO 5: CONFIGURAÇÃO DE SUPABASE

**❓ Problema:** Cada app tem sua própria configuração do Supabase

**✅ RECOMENDAÇÃO: Opção A - Um único core/lib/supabase.ts**

**Justificativa:**
- Todas as apps usam as mesmas variáveis de ambiente
- Cliente Supabase é stateless (apenas configuração)
- Facilita manutenção (mudança em um só lugar)

**Risco:** Se no futuro precisar de configs diferentes → Mitigação: Criar factory function quando necessário

```typescript
// core/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

---

### DECISÃO 6: LANDING PAGES DINÂMICAS ({slug}.studioos.pro)

**❓ Problema:** Como resolver o slug da organização no domínio dinâmico?

**✅ RECOMENDAÇÃO: Opção A - Resolver no DomainRouter e passar como prop**

**Justificativa:**
- Mais simples de implementar
- Não requer configuração extra no Vercel
- Query ao Supabase é feita apenas uma vez
- Fácil de testar em desenvolvimento

**Risco:** Query adicional ao carregar → Mitigação: Cache do resultado

```typescript
// core/router/DomainRouter.tsx
function extractOrgSlug(hostname: string): string | null {
  if (hostname.endsWith('.studioos.pro')) {
    const subdomain = hostname.split('.')[0];
    const reserved = ['admin', 'fornecedores', 'app', 'www'];
    if (reserved.includes(subdomain)) return null;
    return subdomain.replace(/-app$/, '');
  }
  return null;
}

export function DomainRouter() {
  const hostname = window.location.hostname;
  const orgSlug = extractOrgSlug(hostname);
  
  // ... query ao Supabase para buscar organização
  
  if (orgSlug && organization) {
    return <MarketingRouter organization={organization} />;
  }
  
  // ... resto do switch
}
```

---

### DECISÃO 7: ORDEM DE IMPLEMENTAÇÃO

**❓ Problema:** Qual ordem seguir para minimizar riscos?

**✅ RECOMENDAÇÃO: Opção A - Fundação → Core → Módulos → Integração → Deploy**

**Justificativa:**
- Permite testar cada camada antes de prosseguir
- Facilita debugging (problemas isolados)
- Permite paralelização após a fundação estar pronta
- Reduz risco de regressão

**Risco:** Parece mais lento → Mitigação: Fundação + Core são rápidos (2-3 dias)

```
📅 CRONOGRAMA DETALHADO

DIA 1-2: Fundação
├── Criar estrutura de pastas
├── Configurar package.json unificado
├── Configurar Vite + TypeScript + Tailwind
└── Testar build básico

DIA 3-4: Core Compartilhado
├── Migrar supabase.ts
├── Migrar componentes UI
├── Criar auth unificada
└── Testar auth isoladamente

DIA 5-7: Módulos
├── Módulo Admin completo
├── Módulo Org completo
└── Módulo Supplier completo

DIA 8: Integração
├── Criar App.tsx e main.tsx
├── Implementar DomainRouter
└── Testar integração completa

DIA 9-10: Deploy
├── Configurar vercel.json
├── Testes em staging
└── Deploy em produção
```

---

## 1. INVENTÁRIO COMPLETO DE CÓDIGO

### 1.1 APP CORE (apps/core/src/) - ERP Principal

| Arquivo | Status | Destino Proposto | Observações |
|---------|--------|------------------|-------------|
| **Pages** |
| `pages/DashboardPage.tsx` | ✅ FUNCIONAL | `modules/org/pages/DashboardPage.tsx` | Métricas de orçamentos |
| `pages/NovoOrcamentoPage.tsx` | ✅ FUNCIONAL | `modules/org/pages/NovoOrcamentoPage.tsx` | Wizard completo (4 passos) |
| `pages/OrcamentosPage.tsx` | ✅ FUNCIONAL | `modules/org/pages/OrcamentosPage.tsx` | Lista de orçamentos |
| `pages/LoginPage.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/LoginPage.tsx` | UI diferente |
| **Components** |
| `components/AppLayout.tsx` | ✅ FUNCIONAL | `modules/org/components/OrgLayout.tsx` | Layout com Sidebar |
| `components/Sidebar.tsx` | ✅ FUNCIONAL | `modules/org/components/Sidebar.tsx` | Navegação do ERP |
| `components/ProtectedRoute.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/ProtectedRoute.tsx` | Mesma lógica |
| `components/ui/*.tsx` | ✅ FUNCIONAL | `core/components/ui/*.tsx` | Button, Card, Input, etc. |
| `components/wizard/*.tsx` | ✅ FUNCIONAL | `modules/org/components/wizard/*.tsx` | Wizard de orçamentos |
| **Hooks** |
| `hooks/useAuth.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/useAuth.tsx` | Hook + Provider |
| `hooks/useOrcamentoWizard.ts` | ✅ FUNCIONAL | `modules/org/hooks/useOrcamentoWizard.ts` | 251 linhas |
| `hooks/useCriarOrcamento.ts` | ✅ FUNCIONAL | `modules/org/hooks/useCriarOrcamento.ts` | Mutation |
| `hooks/useDashboardStats.ts` | ✅ FUNCIONAL | `modules/org/hooks/useDashboardStats.ts` | Estatísticas |
| `hooks/useOrcamentos.ts` | ✅ FUNCIONAL | `modules/org/hooks/useOrcamentos.ts` | Lista |
| **Lib** |
| `lib/supabase.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/supabase.ts` | Cliente Supabase |
| `lib/utils.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/utils.ts` | Função cn() |
| `lib/calculations.ts` | ✅ FUNCIONAL | `modules/org/lib/calculations.ts` | 150 linhas |
| **Config** |
| `router.tsx` | ✅ FUNCIONAL | `modules/org/router.tsx` | Rotas do ERP |
| `main.tsx` | 🔧 REFATORAR | `main.tsx` novo | Simplificar |

### 1.2 APP PLATFORM (apps/platform/src/) - Admin da Plataforma

| Arquivo | Status | Destino Proposto | Observações |
|---------|--------|------------------|-------------|
| **Pages** |
| `pages/DashboardPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/DashboardPage.tsx` | Métricas: MRR, orgs |
| `pages/OrganizationsPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/OrganizationsPage.tsx` | Lista de orgs |
| `pages/SuppliersPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/SuppliersPage.tsx` | Aprovação |
| `pages/UsersPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/UsersPage.tsx` | Gestão de users |
| `pages/PlansPage.tsx` | ✅ FUNCIONAL | `modules/admin/pages/PlansPage.tsx` | Planos |
| `pages/LoginPage.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/LoginPage.tsx` | Shield icon |
| **Components** |
| `components/PlatformLayout.tsx` | ✅ FUNCIONAL | `modules/admin/components/AdminLayout.tsx` | Sidebar com logout |
| `components/ProtectedRoute.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/ProtectedRoute.tsx` | Verifica super_admin |
| `components/ConfigError.tsx` | ⚠️ DUPLICADO | Consolidar em `core/components/ConfigError.tsx` | Erro de config |
| **Hooks** |
| `hooks/useAuth.ts` | ⚠️ DUPLICADO | Consolidar em `core/auth/useAuth.ts` | useState simples |
| `hooks/AuthProvider.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/AuthProvider.tsx` | Provider separado |
| `hooks/usePlatformStats.ts` | ✅ FUNCIONAL | `modules/admin/hooks/usePlatformStats.ts` | Stats da plataforma |
| **Lib** |
| `lib/supabase.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/supabase.ts` | Com validação |
| `lib/utils.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/utils.ts` | cn() |
| **Config** |
| `router.tsx` | ✅ FUNCIONAL | `modules/admin/router.tsx` | Rotas do admin |
| `main.tsx` | 🔧 REFATORAR | `main.tsx` novo | Com verificação |

### 1.3 APP PORTAL (apps/portal/src/) - Portal do Fornecedor

| Arquivo | Status | Destino Proposto | Observações |
|---------|--------|------------------|-------------|
| **Pages** |
| `pages/DashboardPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/DashboardPage.tsx` | Métricas |
| `pages/CatalogoPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/CatalogoPage.tsx` | Catálogo |
| `pages/PedidosPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/PedidosPage.tsx` | Pedidos |
| `pages/PerfilPage.tsx` | ✅ FUNCIONAL | `modules/supplier/pages/PerfilPage.tsx` | Perfil |
| `pages/LoginPage.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/LoginPage.tsx` | Package icon |
| **Components** |
| `components/PortalLayout.tsx` | ✅ FUNCIONAL | `modules/supplier/components/SupplierLayout.tsx` | Sidebar |
| `components/ProtectedRoute.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/ProtectedRoute.tsx` | Verifica supplier |
| `components/ConfigError.tsx` | ⚠️ DUPLICADO | Consolidar em `core/components/ConfigError.tsx` | Idêntico |
| **Hooks** |
| `hooks/useAuth.ts` | ⚠️ DUPLICADO | Consolidar em `core/auth/useAuth.ts` | Verifica supplier |
| `hooks/AuthProvider.tsx` | ⚠️ DUPLICADO | Consolidar em `core/auth/AuthProvider.tsx` | Idêntico |
| `hooks/useSupplierStats.ts` | ✅ FUNCIONAL | `modules/supplier/hooks/useSupplierStats.ts` | Stats |
| **Lib** |
| `lib/supabase.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/supabase.ts` | Com validação |
| `lib/utils.ts` | ⚠️ DUPLICADO | Consolidar em `core/lib/utils.ts` | cn() |
| **Config** |
| `router.tsx` | ✅ FUNCIONAL | `modules/supplier/router.tsx` | Rotas |
| `main.tsx` | 🔧 REFATORAR | `main.tsx` novo | Com verificação |

### 1.4 CÓDIGO LEGADO V4 (src/) - Status

| Arquivo | Status | Destino | Observações |
|---------|--------|---------|-------------|
| **Routing** |
| `routing/DomainRouter.tsx` | ❌ OBSOLETO | Não migrar | 260 linhas |
| `routing/RouteValidator.tsx` | ❌ OBSOLETO | Não migrar | Validação backend |
| `routing/RedirectHandler.tsx` | ❌ OBSOLETO | Não migrar | Redirecionamento nativo |
| **Pages** |
| `pages/LoginGateway.tsx` | 🔧 REFATORAR | Simplificar | 344 linhas |
| `pages/GerarOrcamento.tsx` | ✅ REAPROVEITÁVEL | `modules/org/pages/` | Wizard |
| `pages/AdminSupremo.tsx` | ✅ REAPROVEITÁVEL | `modules/admin/pages/` | Painel |
| `pages/LandingPage*.tsx` | ✅ REAPROVEITÁVEL | `modules/marketing/pages/` | Landing |
| **Hooks** |
| `hooks/useAuth.tsx` | ⚠️ PARCIAL | Referência | redirectAfterLogin |
| `hooks/useDomainRouting.ts` | ❌ OBSOLETO | Não migrar | Complexo |
| **Lib** |
| `lib/redirectAfterLogin.ts` | ❌ OBSOLETO | Não migrar | 147 linhas |
| `lib/environment.ts` | ✅ REAPROVEITÁVEL | `core/lib/environment.ts` | Detecção |
| `domains/index.ts` | ⚠️ PARCIAL | Referência | Configs |
| `domains/types.ts` | ✅ REAPROVEITÁVEL | `core/types/` | Tipos |
| **Components** |
| `components/ProtectedRoute.tsx` | ⚠️ PARCIAL | Referência | Versão antiga |
| `components/AdminRoute.tsx` | ⚠️ PARCIAL | Referência | Verifica super_admin |

---

## 2. ANÁLISE DE DEPENDÊNCIAS

### 2.1 Conflitos de Versão

| Pacote | Core | Platform | Portal | Unificado |
|--------|------|----------|--------|-----------|
| react | ^18.2.0 | ^18.3.1 | ^18.2.0 | **^18.3.1** |
| react-router-dom | ^6.20.0 | ^6.21.0 | ^6.20.1 | **^6.21.0** |
| vite | ^5.0.0 | ^5.0.10 | ^5.0.8 | **^5.0.10** |
| typescript | ^5.3.0 | ^5.3.3 | ^5.2.2 | **^5.3.3** |
| tailwindcss | ^3.3.6 | ^3.4.0 | ^3.3.5 | **^3.4.0** |

### 2.2 Package.json Unificado

```json
{
  "name": "studioos-unified",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
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
    "date-fns": "^3.0.0",
    "recharts": "^2.10.0",
    "lodash": "^4.17.21",
    "uuid": "^9.0.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 3. ESTRUTURA FINAL PROPOSTA

```
studioos-unified/
├── src/
│   ├── modules/
│   │   ├── marketing/         # studioos.pro
│   │   ├── admin/             # admin.studioos.pro
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── OrganizationsPage.tsx
│   │   │   │   ├── SuppliersPage.tsx
│   │   │   │   ├── UsersPage.tsx
│   │   │   │   └── PlansPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePlatformStats.ts
│   │   │   ├── components/
│   │   │   │   └── AdminLayout.tsx
│   │   │   └── router.tsx
│   │   │
│   │   ├── org/               # app.studioos.pro
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── OrcamentosPage.tsx
│   │   │   │   └── NovoOrcamentoPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useOrcamentoWizard.ts
│   │   │   │   ├── useCriarOrcamento.ts
│   │   │   │   └── useDashboardStats.ts
│   │   │   ├── components/
│   │   │   │   ├── OrgLayout.tsx
│   │   │   │   └── wizard/
│   │   │   ├── lib/
│   │   │   │   └── calculations.ts
│   │   │   └── router.tsx
│   │   │
│   │   ├── supplier/          # fornecedores.studioos.pro
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── CatalogoPage.tsx
│   │   │   │   ├── PedidosPage.tsx
│   │   │   │   └── PerfilPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSupplierStats.ts
│   │   │   ├── components/
│   │   │   │   └── SupplierLayout.tsx
│   │   │   └── router.tsx
│   │   │
│   │   └── affiliate/         # placeholder
│   │
│   ├── core/
│   │   ├── auth/
│   │   │   ├── types.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── RoleGuard.tsx
│   │   │   └── LoginPage.tsx
│   │   │
│   │   ├── router/
│   │   │   └── DomainRouter.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Label.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   └── Badge.tsx
│   │   │   ├── ConfigError.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── utils.ts
│   │   │
│   │   └── types/
│   │       └── index.ts
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

## 4. CHECKLIST DE IMPLEMENTAÇÃO

### Preparação
- [ ] Backup do código atual
- [ ] Criar branch `monolito-modular`
- [ ] Configurar ambiente de staging

### Fase 1: Fundação (Dia 1-2)
- [ ] Criar estrutura de pastas
- [ ] Criar package.json unificado
- [ ] Configurar Vite
- [ ] Configurar TypeScript
- [ ] Configurar Tailwind

### Fase 2: Core (Dia 3-4)
- [ ] Migrar supabase.ts
- [ ] Migrar utils.ts
- [ ] Migrar componentes UI
- [ ] Criar auth unificada
- [ ] Criar ProtectedRoute com roles
- [ ] Testar auth isoladamente

### Fase 3: Módulos (Dia 5-7)
- [ ] Módulo Admin completo
- [ ] Módulo Org completo
- [ ] Módulo Supplier completo
- [ ] Módulo Marketing (placeholder)

### Fase 4: Integração (Dia 8)
- [ ] Criar App.tsx
- [ ] Criar main.tsx
- [ ] Implementar DomainRouter
- [ ] Configurar lazy loading

### Fase 5: Deploy (Dia 9-10)
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

## 5. RISCOS E MITIGAÇÃO

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Conflitos de CSS | Média | Médio | Tailwind scopes |
| Dados compartilhados | Baixa | Alto | Context global |
| Bundle grande | Média | Médio | Lazy load |
| Problemas de auth | Baixa | Alto | Testes extensivos |
| Regressão | Média | Alto | Testes manuais |

---

## 6. ESTIMATIVA DE ESFORÇO

| Fase | Dias | Esforço |
|------|------|---------|
| Fundação | 2 | 16h |
| Core | 2 | 16h |
| Módulos | 3 | 24h |
| Integração | 1 | 8h |
| Deploy | 2 | 16h |
| **Total** | **10 dias** | **80h** |

---

## 7. CONCLUSÃO

A migração para Monolito Modular resolve os problemas críticos da arquitetura V5:

1. **Elimina múltiplos deploys** - Um único deploy na Vercel
2. **Unifica código duplicado** - Auth, UI, Supabase em um só lugar
3. **Simplifica roteamento** - DomainRouter de 260 linhas → 30 linhas
4. **Melhora DX** - Um servidor de dev, hot reload unificado
5. **Mantém escalabilidade** - Módulos podem virar apps separados no futuro

---

**Relatório gerado em:** 2026-01-31  
**Status:** ✅ Completo - Pronto para implementação pelo Kimi Code
