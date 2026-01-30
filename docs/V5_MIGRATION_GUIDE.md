# StudioOS V5 - Guia de Migração de Código

Guia passo-a-passo para migrar código do legado para o monorepo V5.

## 🎯 Princípios

1. **Copiar, não mover** - Mantenha o legado funcional até validar
2. **Um módulo por vez** - Não migre tudo de uma vez
3. **Testar isoladamente** - Cada app deve funcionar independentemente
4. **Atualizar imports** - Use os pacotes shared

## 📋 Checklist de Migração

### FASE 1: Setup (Dia 1-2)

- [ ] Executar scripts de automação
- [ ] Validar que todos os apps iniciam (`pnpm core:dev`, etc.)
- [ ] Configurar variáveis de ambiente em cada app

### FASE 2: Shared Packages (Dia 2)

- [ ] Migrar tipos do Supabase para `shared/types`
- [ ] Migrar cliente Supabase para `shared/lib`
- [ ] Migrar componentes UI base para `shared/ui`

### FASE 3: Core ERP (Dia 3-4)

- [ ] Layout principal (sidebar, header)
- [ ] Páginas: Dashboard, Orçamentos, Produção
- [ ] Hooks: useOrcamentos, useProducao
- [ ] Contexts: Auth, Organization

### FASE 4: Platform Admin (Dia 5)

- [ ] Layout admin
- [ ] Páginas: GerenciarUsuarios, OrganizationsList
- [ ] Hooks: useAdmin

### FASE 5: Portal Fornecedores (Dia 6)

- [ ] Layout portal
- [ ] Páginas: SupplierPortal
- [ ] Hooks: useSupplier

### FASE 6: Marketing (Dia 7)

- [ ] Landing pages
- [ ] Site institucional

## 🔧 Exemplos de Migração

### 1. Migração de Tipos

**Origem**: `src/types/orcamento.ts`
**Destino**: `shared/types/src/orcamento.ts`

```typescript
// shared/types/src/orcamento.ts
export interface DadosOrcamento {
  id?: string;
  clienteId: string;
  dataCriacao?: string;
  status?: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado';
  valorTotal?: number;
  itens: Cortina[];
}

export interface Cortina {
  id?: string;
  tipoProduto: 'cortina' | 'persiana' | 'acessorio';
  ambiente?: string;
  dimensoes: {
    largura: number;
    altura: number;
  };
  // ... resto
}
```

**Exportar no index**:
```typescript
// shared/types/src/index.ts
export * from './orcamento';
export * from './cliente';
export * from './producao';
// ... outros
```

### 2. Migração de Cliente Supabase

**Origem**: `src/integrations/supabase/client.ts`
**Destino**: `shared/lib/src/supabase/client.ts`

```typescript
// shared/lib/src/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@studioos/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Helper para RLS
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentOrganization() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
    
  return data?.organization_id;
}
```

### 3. Migração de Componente

**Origem**: `src/components/orcamento/DashboardContent.tsx`
**Destino**: `apps/core/src/components/DashboardContent.tsx`

```typescript
// Antes (legado)
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { Card } from '@/components/ui/card';

// Depois (V5)
import { useOrcamentos } from '../hooks/useOrcamentos'; // local
import { Card } from '@studioos/ui'; // shared
```

### 4. Migração de Hook

**Origem**: `src/hooks/useOrcamentos.ts`
**Destino**: `apps/core/src/hooks/useOrcamentos.ts`

```typescript
// apps/core/src/hooks/useOrcamentos.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@studioos/lib';
import type { DadosOrcamento } from '@studioos/types';

export function useOrcamentos(organizationId: string | null) {
  return useQuery({
    queryKey: ['orcamentos', organizationId],
    queryFn: async (): Promise<DadosOrcamento[]> => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}
```

### 5. Migração de Página

**Origem**: `src/pages/GerarOrcamento.tsx`
**Destino**: `apps/core/src/pages/GerarOrcamento.tsx`

Passos:
1. Copiar arquivo
2. Atualizar imports:
   - `@/components/*` → `@studioos/ui` ou caminho relativo
   - `@/hooks/*` → caminho relativo ou `@studioos/lib`
   - `@/types/*` → `@studioos/types`
   - `@/lib/supabase` → `@studioos/lib`

3. Adicionar ao router:

```typescript
// apps/core/src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { OrcamentosPage } from './pages/OrcamentosPage';
import { NovoOrcamentoPage } from './pages/NovoOrcamentoPage';
import { ProducaoPage } from './pages/ProducaoPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'orcamentos', element: <OrcamentosPage /> },
      { path: 'orcamentos/novo', element: <NovoOrcamentoPage /> },
      { path: 'orcamentos/:id', element: <VisualizarOrcamentoPage /> },
      { path: 'producao', element: <ProducaoPage /> },
      { path: 'producao/pedidos/:id', element: <FichaPedidoPage /> },
      { path: 'financeiro', element: <FinanceiroPage /> },
      { path: 'crm', element: <CRMPage /> },
      { path: 'calendario', element: <CalendarioPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
    ],
  },
]);
```

### 6. Migração de Context

**Origem**: `src/contexts/OrganizationContext.tsx`
**Destino**: `apps/core/src/contexts/OrganizationContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentOrganization } from '@studioos/lib';
import type { Organization } from '@studioos/types';

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  isLoading: true,
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const orgId = await getCurrentOrganization();
      if (orgId) {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();
        setOrganization(data);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organization, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => useContext(OrganizationContext);
```

## 🧪 Testando Após Migração

### Teste Local

```bash
# Terminal 1 - Core ERP
cd apps/core
pnpm dev
# http://localhost:5173

# Terminal 2 - Platform
cd apps/platform
pnpm dev
# http://localhost:5174

# Terminal 3 - Portal
cd apps/portal
pnpm dev
# http://localhost:5175
```

### Build de Produção

```bash
# Build todos
pnpm build

# Build específico
pnpm core:build
```

## 🗺️ Mapa de Componentes por App

### apps/core (ERP)

| Componente | Origem | Destino |
|------------|--------|---------|
| DashboardContent | `src/components/orcamento/DashboardContent.tsx` | `apps/core/src/components/DashboardContent.tsx` |
| OrcamentoSidebar | `src/components/orcamento/OrcamentoSidebar.tsx` | `apps/core/src/components/AppSidebar.tsx` |
| EtapaProdutos | `src/components/orcamento/wizard/EtapaProdutos.tsx` | `apps/core/src/components/orcamento/EtapaProdutos.tsx` |
| ContasReceber | `src/components/financeiro/ContasReceber.tsx` | `apps/core/src/components/financeiro/ContasReceber.tsx` |
| PipelineCRM | `src/components/crm/PipelineCRM.tsx` | `apps/core/src/components/crm/PipelineCRM.tsx` |
| CalendarioGeral | `src/components/calendario/CalendarioGeral.tsx` | `apps/core/src/components/calendario/CalendarioGeral.tsx` |

### apps/platform (Admin)

| Componente | Origem | Destino |
|------------|--------|---------|
| GerenciarUsuarios | `src/pages/GerenciarUsuarios.tsx` | `apps/platform/src/pages/GerenciarUsuarios.tsx` |
| OrganizationsList | `src/components/admin/OrganizationsList.tsx` | `apps/platform/src/components/OrganizationsList.tsx` |
| SuperAdminDashboard | `src/components/admin/SuperAdminDashboard.tsx` | `apps/platform/src/components/Dashboard.tsx` |
| SupplierApprovalList | `src/components/admin/SupplierApprovalList.tsx` | `apps/platform/src/components/SupplierApprovalList.tsx` |

### apps/portal (Fornecedores)

| Componente | Origem | Destino |
|------------|--------|---------|
| SupplierPortal | `src/pages/SupplierPortal.tsx` | `apps/portal/src/pages/SupplierPortal.tsx` |
| SupplierMaterials | `src/components/supplier/SupplierMaterials.tsx` | `apps/portal/src/components/MaterialsManager.tsx` |

### shared/ui

| Componente | Origem | Destino |
|------------|--------|---------|
| Button | `src/components/ui/button.tsx` | `shared/ui/src/components/Button.tsx` |
| Card | `src/components/ui/card.tsx` | `shared/ui/src/components/Card.tsx` |
| Dialog | `src/components/ui/dialog.tsx` | `shared/ui/src/components/Dialog.tsx` |
| Table | `src/components/ui/table.tsx` | `shared/ui/src/components/Table.tsx` |
| Input | `src/components/ui/input.tsx` | `shared/ui/src/components/Input.tsx` |
| Select | `src/components/ui/select.tsx` | `shared/ui/src/components/Select.tsx` |
| Badge | `src/components/ui/badge.tsx` | `shared/ui/src/components/Badge.tsx` |

## ⚠️ Armadilhas Comuns

### 1. Imports Circulares

```typescript
// ❌ ERRADO - import circular
// apps/core/src/hooks/useOrcamento.ts
import { useCliente } from './useCliente';

// apps/core/src/hooks/useCliente.ts
import { useOrcamento } from './useOrcamento';

// ✅ CORRETO - extraia lógica comum
// shared/lib/src/queries/orcamento.ts
export async function fetchOrcamentos() { ... }
```

### 2. Dependências de Runtime

```typescript
// ❌ ERRADO - acesso a window/document no server
const hostname = window.location.hostname;

// ✅ CORRETO - use hook ou lazy
import { useEffect, useState } from 'react';

function useHostname() {
  const [hostname, setHostname] = useState('');
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);
  return hostname;
}
```

### 3. Variáveis de Ambiente

Cada app tem seu próprio `.env`:

```bash
# apps/core/.env
VITE_SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_APP_NAME=StudioOS ERP

# apps/platform/.env
VITE_SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_APP_NAME=StudioOS Platform
```

## 📚 Recursos

- [Arquitetura V5](THE_CLEAN_SPLIT_V5_ARCHITECTURE.md)
- [Scripts de Automação](V5_AUTOMATION_SCRIPTS.md)
- [Documentação Turbo](https://turbo.build/repo/docs)
- [Documentação Vite](https://vitejs.dev/guide/)
