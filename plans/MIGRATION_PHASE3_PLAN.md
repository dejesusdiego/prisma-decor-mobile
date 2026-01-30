# Fase 3: Plano de Migração dos Módulos

## Resumo

Migração de 60+ arquivos dos apps legados (apps/core, apps/platform, apps/portal) para a nova estrutura Monolito Modular (src/modules/).

## Estrutura de Destino

```
src/
├── core/
│   ├── components/ui/     # Componentes UI compartilhados
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Label.tsx
│   │   ├── Badge.tsx
│   │   └── Select.tsx
│   └── lib/
│       ├── utils.ts       # cn() e utilitários
│       └── calculations.ts # Funções de cálculo
├── modules/
│   ├── org/               # ERP Principal (ex-apps/core)
│   │   ├── hooks/
│   │   ├── components/
│   │   └── pages/
│   ├── admin/             # Plataforma Admin (ex-apps/platform)
│   │   ├── hooks/
│   │   └── pages/
│   ├── supplier/          # Portal Fornecedor (ex-apps/portal)
│   │   ├── hooks/
│   │   └── pages/
│   └── marketing/         # Landing Pages
│       └── pages/
```

## Mapeamento de Arquivos

### 1. Core UI Components (src/core/components/ui/)

| Origem | Destino | Status |
|--------|---------|--------|
| apps/core/src/components/ui/Button.tsx | src/core/components/ui/Button.tsx | ✅ |
| apps/core/src/components/ui/Card.tsx | src/core/components/ui/Card.tsx | ⏳ |
| apps/core/src/components/ui/Input.tsx | src/core/components/ui/Input.tsx | ⏳ |
| apps/core/src/components/ui/Label.tsx | src/core/components/ui/Label.tsx | ⏳ |
| apps/core/src/components/ui/Badge.tsx | src/core/components/ui/Badge.tsx | ⏳ |
| apps/core/src/components/ui/Select.tsx | src/core/components/ui/Select.tsx | ⏳ |

**Atualizações de import necessárias:**
- `@/lib/utils` → `@core/lib/utils`

### 2. Core Lib (src/core/lib/)

| Origem | Destino | Status |
|--------|---------|--------|
| apps/core/src/lib/utils.ts | src/core/lib/utils.ts | ✅ (já existe) |
| apps/core/src/lib/calculations.ts | src/core/lib/calculations.ts | ⏳ |

### 3. Org Module (ERP Principal)

**Hooks:**
| Origem | Destino |
|--------|---------|
| apps/core/src/hooks/useOrcamentos.ts | src/modules/org/hooks/useOrcamentos.ts |
| apps/core/src/hooks/useOrcamentoWizard.ts | src/modules/org/hooks/useOrcamentoWizard.ts |
| apps/core/src/hooks/useDashboardStats.ts | src/modules/org/hooks/useDashboardStats.ts |
| apps/core/src/hooks/useCriarOrcamento.ts | src/modules/org/hooks/useCriarOrcamento.ts |

**Components:**
| Origem | Destino |
|--------|---------|
| apps/core/src/components/AppLayout.tsx | src/modules/org/components/OrgLayout.tsx |
| apps/core/src/components/Sidebar.tsx | src/modules/org/components/Sidebar.tsx |
| apps/core/src/components/ProtectedRoute.tsx | src/modules/org/components/ProtectedRoute.tsx |
| apps/core/src/components/wizard/WizardProgress.tsx | src/modules/org/components/wizard/WizardProgress.tsx |
| apps/core/src/components/wizard/StepIndicator.tsx | src/modules/org/components/wizard/StepIndicator.tsx |
| apps/core/src/components/wizard/steps/StepCliente.tsx | src/modules/org/components/wizard/steps/StepCliente.tsx |
| apps/core/src/components/wizard/steps/StepProdutos.tsx | src/modules/org/components/wizard/steps/StepProdutos.tsx |
| apps/core/src/components/wizard/steps/StepServicos.tsx | src/modules/org/components/wizard/steps/StepServicos.tsx |
| apps/core/src/components/wizard/steps/StepResumo.tsx | src/modules/org/components/wizard/steps/StepResumo.tsx |

**Pages:**
| Origem | Destino |
|--------|---------|
| apps/core/src/pages/DashboardPage.tsx | src/modules/org/pages/DashboardPage.tsx |
| apps/core/src/pages/LoginPage.tsx | src/modules/org/pages/LoginPage.tsx |
| apps/core/src/pages/OrcamentosPage.tsx | src/modules/org/pages/OrcamentosPage.tsx |
| apps/core/src/pages/NovoOrcamentoPage.tsx | src/modules/org/pages/NovoOrcamentoPage.tsx |

**Atualizações de import para Org Module:**
- `@/components/ui/*` → `@core/components/ui/*`
- `@/hooks/*` → `@modules/org/hooks/*`
- `@/lib/utils` → `@core/lib/utils`
- `@/lib/calculations` → `@core/lib/calculations`
- `@/lib/supabase` → `@core/lib/supabase`
- `@/components/*` → `@modules/org/components/*`

### 4. Admin Module (Plataforma)

**Hooks:**
| Origem | Destino |
|--------|---------|
| apps/platform/src/hooks/usePlatformStats.ts | src/modules/admin/hooks/usePlatformStats.ts |

**Pages:**
| Origem | Destino |
|--------|---------|
| apps/platform/src/pages/DashboardPage.tsx | src/modules/admin/pages/DashboardPage.tsx |
| apps/platform/src/pages/LoginPage.tsx | src/modules/admin/pages/LoginPage.tsx |
| apps/platform/src/pages/OrganizationsPage.tsx | src/modules/admin/pages/OrganizationsPage.tsx |
| apps/platform/src/pages/PlansPage.tsx | src/modules/admin/pages/PlansPage.tsx |
| apps/platform/src/pages/UsersPage.tsx | src/modules/admin/pages/UsersPage.tsx |
| apps/platform/src/pages/SuppliersPage.tsx | src/modules/admin/pages/SuppliersPage.tsx |

**Atualizações de import para Admin Module:**
- `@/hooks/usePlatformStats` → `@modules/admin/hooks/usePlatformStats`
- `@/lib/utils` → `@core/lib/utils` (formatCurrency)
- `@/lib/supabase` → `@core/lib/supabase`

### 5. Supplier Module (Portal Fornecedor)

**Hooks:**
| Origem | Destino |
|--------|---------|
| apps/portal/src/hooks/useSupplierStats.ts | src/modules/supplier/hooks/useSupplierStats.ts |

**Pages:**
| Origem | Destino |
|--------|---------|
| apps/portal/src/pages/DashboardPage.tsx | src/modules/supplier/pages/DashboardPage.tsx |
| apps/portal/src/pages/LoginPage.tsx | src/modules/supplier/pages/LoginPage.tsx |
| apps/portal/src/pages/CatalogoPage.tsx | src/modules/supplier/pages/CatalogoPage.tsx |
| apps/portal/src/pages/PedidosPage.tsx | src/modules/supplier/pages/PedidosPage.tsx |
| apps/portal/src/pages/PerfilPage.tsx | src/modules/supplier/pages/PerfilPage.tsx |

**Atualizações de import para Supplier Module:**
- `@/hooks/useAuth` → `@core/auth` (useAuth)
- `@/hooks/useSupplierStats` → `@modules/supplier/hooks/useSupplierStats`
- `@/lib/utils` → `@core/lib/utils` (formatCurrency)
- `@/lib/supabase` → `@core/lib/supabase`

### 6. Marketing Module

**Pages:**
| Origem | Destino | Nota |
|--------|---------|------|
| - | src/modules/marketing/pages/LandingPage.tsx | Criar placeholder |

## Checklist de Migração

### Passo 1: Core Components e Lib
- [ ] Migrar Card.tsx
- [ ] Migrar Input.tsx
- [ ] Migrar Label.tsx
- [ ] Migrar Badge.tsx
- [ ] Migrar Select.tsx
- [ ] Migrar calculations.ts

### Passo 2: Org Module
- [ ] Migrar hooks (4 arquivos)
- [ ] Migrar components (9 arquivos)
- [ ] Migrar pages (4 arquivos)
- [ ] Atualizar imports

### Passo 3: Admin Module
- [ ] Migrar hooks (1 arquivo)
- [ ] Migrar pages (6 arquivos)
- [ ] Atualizar imports

### Passo 4: Supplier Module
- [ ] Migrar hooks (1 arquivo)
- [ ] Migrar pages (5 arquivos)
- [ ] Atualizar imports

### Passo 5: Marketing Module
- [ ] Criar LandingPage placeholder

### Passo 6: Routers
- [ ] Atualizar src/modules/org/router.tsx
- [ ] Atualizar src/modules/admin/router.tsx
- [ ] Atualizar src/modules/supplier/router.tsx
- [ ] Atualizar src/modules/marketing/router.tsx

## Notas Importantes

1. **useAuth**: Usar `@core/auth` (AuthProvider unificado) em vez dos hooks locais
2. **Supabase**: Usar `@core/lib/supabase` (cliente unificado)
3. **UI Components**: Usar `@core/components/ui/*` (componentes compartilhados)
4. **formatCurrency**: Mover para `@core/lib/calculations` e importar de lá
5. **Tipos**: Manter tipos locais nos hooks até criar types compartilhados

## Estimativa

- Core UI + Lib: ~10 minutos
- Org Module: ~20 minutos
- Admin Module: ~15 minutos
- Supplier Module: ~10 minutos
- Marketing Module: ~5 minutos
- Routers: ~10 minutos
- Testes/Fixes: ~10 minutos

**Total estimado: ~80 minutos**