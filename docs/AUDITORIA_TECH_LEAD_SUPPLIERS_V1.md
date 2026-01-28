# 🔍 AUDITORIA TÉCNICA — SUPPLIERS V1
## Tech Lead / Auditor — Módulo Completo

**Data:** 2026-01-21  
**Auditor:** Cursor (Tech Lead)  
**Escopo:** Supplier Catalog V1 + Self-Service Registration + Hardening + Supplier Portal

---

## 📋 PASSO 1 — INVENTÁRIO COMPLETO

### A) Frontend / Rotas / Domínio

#### ✅ Arquivos Existentes

**Roteamento Principal:**
- ✅ `src/App.tsx` (linhas 66-73, 120-136, 221-223) — Roteamento por domínio e rotas públicas
- ✅ `src/hooks/useDomainRouting.ts` — Hook para resolver domínio atual
- ✅ `src/lib/domainResolver.ts` — Função `resolveDomain()` que consulta tabela `domains`
- ✅ `src/lib/environment.ts` — Função `allowsDevRoutes()` para detectar ambiente
- ✅ `src/lib/constants.ts` — Constante `RESERVED_PLATFORM_SLUG = 'studioos'`

**Autenticação e Proteção:**
- ✅ `src/hooks/useAuth.tsx` — Provider de autenticação (linhas 44-66: redirecionamento pós-login)
- ✅ `src/components/ProtectedRoute.tsx` — Proteção de rotas + redirecionamento de fornecedores (linhas 68-83)
- ✅ `src/components/AdminRoute.tsx` — Proteção de rotas admin (verifica `user_roles`)

**Páginas Públicas:**
- ✅ `src/pages/CadastroFornecedor.tsx` — Formulário público de cadastro (linhas 46-200: submit + redirecionamento)

**Portal do Fornecedor:**
- ✅ `src/pages/SupplierPortal.tsx` — Shell do portal (linhas 28-439: auth, status, tabs)
- ✅ `src/pages/supplier/Dashboard.tsx` — Dashboard com métricas (linhas 16-154)
- ✅ `src/components/supplier/SupplierCatalog.tsx` — Gestão de catálogo (CRUD + CSV import)
- ✅ `src/components/supplier/SupplierStatusBadge.tsx` — Badge de status visual
- ✅ `src/components/supplier/ImportHistory.tsx` — Histórico de importações CSV

**App do Cliente (Organização):**
- ✅ `src/pages/GerenciarFornecedores.tsx` — Gerenciar fornecedores vinculados (linhas 78-132: queries)
- ✅ `src/components/orcamento/gestao/ListaMateriaisFornecedores.tsx` — Lista read-only de materiais (linhas 44-127: queries com filtro `status='approved'`)

**Hooks:**
- ✅ `src/hooks/useSupplierMaterials.ts` — Hook para buscar materiais do fornecedor
  - `useSupplierMaterials(supplierId)` — Busca materiais
  - `useSupplierMaterialsStats(supplierId)` — Estatísticas agregadas
  - `useInvalidateSupplierMaterials()` — Invalidação de cache

**Seleção de Materiais (Orçamentos):**
- ✅ `src/components/orcamento/wizard/MaterialSelector.tsx` — Seletor de materiais (linhas 1-283)
- ✅ `src/components/orcamento/wizard/EtapaProdutos.tsx` — Etapa de produtos do orçamento (linhas 164-742)
- ✅ `src/components/orcamento/wizard/CortinaCard.tsx` — Card de cortina (usa `MaterialSelector`)

**Tipos:**
- ✅ `src/types/orcamento.ts` — Tipos `Cortina` e `Material` (linhas 11-75)
  - ⚠️ **GAP:** `Cortina` não tem campos `supplier_material_id`, `supplier_id`, `price_snapshot`
  - ⚠️ **GAP:** `Material` não tem campos `supplier_material_id`, `supplier_id`, `supplier_name`

**Tratamento de Erros:**
- ✅ `src/lib/errorMessages.ts` — Sistema centralizado (linhas 95-105: mensagens genéricas para `cnpj_already_registered` e `email_already_registered`)

#### ❌ Arquivos NÃO Encontrados (Esperados mas Não Existem)

- ❌ `src/pages/admin/SupplierApproval.tsx` — Painel admin para aprovação (não existe)
- ❌ `src/components/admin/SupplierPendingList.tsx` — Lista de fornecedores pendentes (não existe)
- ❌ Edge Function para aprovação via UI (não existe)

---

### B) Supabase / Banco

#### ✅ Migrations Relacionadas a Suppliers

**Estrutura Base:**
- ✅ `supabase/migrations/20260116000001_domains_structure.sql` — Estrutura inicial de domínios
- ✅ `supabase/migrations/20260116000002_domains_subdomains.sql` (linhas 72-80) — Cria `supplier_users` **SEM `updated_at`**

**Supplier Catalog V1:**
- ✅ `supabase/migrations/20260117000000_supplier_catalog_v1.sql` — Cria `supplier_materials`, `supplier_material_imports`, RLS, função `get_organization_supplier_materials`

**Self-Service Registration:**
- ✅ `supabase/migrations/20260117000001_supplier_self_service_registration.sql` — Adiciona `status`, `approved_at`, `rejected_at`, `product_categories` em `suppliers`, cria `register_supplier`, `approve_supplier`, view `supplier_pending_registrations` (linhas 148-158: confirma email automaticamente)

**Hardening:**
- ✅ `supabase/migrations/20260117000002_supplier_hardening.sql` — Hardening de `approve_supplier` (verifica `service_role`), revoga acesso público à view, normaliza CNPJ/email em `register_supplier`

**Fixes:**
- ✅ `supabase/migrations/20260117000003_fix_supplier_users_updated_at.sql` — Remove referência a `updated_at` em `approve_supplier` (linha 96: comentário "Removido: updated_at = now()")
- ✅ `supabase/migrations/20260117000004_disable_email_confirmation_suppliers.sql` — Confirma emails de fornecedores existentes
- ✅ `supabase/migrations/20260117000005_fix_supplier_users_rls_recursion.sql` — Corrige recursão infinita em RLS de `supplier_users`

**Hotfix RLS:**
- ✅ `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` — Corrige RLS `supplier_materials` (filtra por `suppliers.status = 'approved'`), hardening `approve_supplier` (verificação explícita de JWT), hardening `register_supplier` (força `status='pending'` sempre)
  - 🔴 **BUG CRÍTICO:** Linha 119 tenta atualizar `updated_at` em `supplier_users`, mas a tabela **não tem** essa coluna

#### ✅ Tabelas Criadas

**`public.suppliers`:**
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
email TEXT
phone TEXT
cnpj TEXT
cnpj_normalized TEXT (índice único parcial)
service_states TEXT[] NOT NULL DEFAULT '{}'
product_categories TEXT[] NOT NULL DEFAULT '{}'
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
approved_at TIMESTAMPTZ
rejected_at TIMESTAMPTZ
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

**`public.supplier_users`:**
```sql
id UUID PRIMARY KEY
supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
role TEXT DEFAULT 'supplier' CHECK (role IN ('supplier', 'admin'))
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
UNIQUE(supplier_id, user_id)
```
⚠️ **CONFIRMADO:** Não tem `updated_at` (criada em `20260116000002` linha 78 — apenas `created_at`)

**`public.supplier_organizations`:**
```sql
id UUID PRIMARY KEY
supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE
organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
UNIQUE(supplier_id, organization_id)
```

**`public.supplier_materials`:**
```sql
id UUID PRIMARY KEY
supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE
sku TEXT
name TEXT NOT NULL
description TEXT
unit TEXT
price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0)
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
UNIQUE NULLS NOT DISTINCT (supplier_id, sku)
```

**`public.supplier_material_imports`:**
```sql
id UUID PRIMARY KEY
supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE
filename TEXT NOT NULL
status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'applied', 'failed'))
total_rows INT DEFAULT 0
inserted INT DEFAULT 0
updated INT DEFAULT 0
deactivated INT DEFAULT 0
errors JSONB DEFAULT '[]'::jsonb
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

#### ✅ Views Criadas

**`public.supplier_pending_registrations`:**
- SELECT: `id`, `name`, `slug`, `email`, `phone`, `cnpj`, `cnpj_normalized`, `service_states`, `product_categories`, `status`, `created_at`, `updated_at`, `user_id` (via subquery)
- WHERE: `status = 'pending'`
- Acesso: ❌ `anon` e `authenticated` → REVOKED (apenas `service_role`)

#### ✅ RPCs Criadas

**`public.register_supplier(p_name, p_email, p_phone, p_cnpj, p_service_states, p_product_categories, p_user_id)`:**
- SECURITY DEFINER: ✅ Sim
- Autorização: `anon` e `authenticated` podem executar
- Validações: nome, email, CNPJ (14 dígitos), normalização CNPJ/email, anti-duplicidade
- Status: ✅ **SEMPRE** cria com `status='pending'` (ignora qualquer input)
- Ações: Cria/atualiza `supplier`, cria/atualiza `supplier_users`, tenta confirmar email (linhas 284-295 de `20260121000000`)
- Erros: `name_required`, `email_required`, `email_invalid`, `cnpj_invalid`, `cnpj_already_registered`, `email_already_registered`, `slug_generation_failed`, `user_id_required`, `insert_failed`

**`public.approve_supplier(p_supplier_id, p_user_id)`:**
- SECURITY DEFINER: ✅ Sim
- Autorização: ❌ **APENAS `service_role`** (verifica JWT explicitamente — linhas 60-75 de `20260121000000`)
- Validações: JWT existe, `role = 'service_role'`, `supplier_id` obrigatório, `user_id` obrigatório, supplier existe, supplier está `pending`
- Ações: Atualiza `status='approved'`, `approved_at=now()`, cria/atualiza `supplier_users`
- 🔴 **BUG CRÍTICO:** Linha 119 tenta atualizar `updated_at` em `supplier_users`, mas a tabela não tem essa coluna
- Erros: `not_authorized`, `supplier_id_required`, `user_id_required`, `supplier_not_found`, `supplier_already_processed`

**`public.get_organization_supplier_materials(p_organization_id)`:**
- SECURITY DEFINER: ✅ Sim
- Autorização: Qualquer usuário autenticado
- Uso: Função auxiliar (não está sendo usada no frontend ainda)

#### ✅ Triggers Criados

- ✅ `trigger_update_supplier_cnpj_normalized` — Mantém `cnpj_normalized` atualizado quando `cnpj` é inserido/atualizado
- ✅ `update_supplier_materials_updated_at` — Atualiza `updated_at` em `supplier_materials`
- ✅ `update_supplier_material_imports_updated_at` — Atualiza `updated_at` em `supplier_material_imports`

#### ✅ RLS Policies

**`suppliers`:**
- SELECT: Organizações veem apenas fornecedores vinculados (via `supplier_organizations`)
- INSERT: Apenas via RPC `register_supplier` (SECURITY DEFINER)
- UPDATE: Organizações podem atualizar apenas `service_states`

**`supplier_users`:**
- SELECT: 
  - Fornecedor vê apenas seu próprio vínculo (`user_id = auth.uid()`) — **sem recursão** (corrigido em `20260117000005`)
  - Organizações veem vínculos de fornecedores vinculados (via `supplier_organizations`) — **sem recursão**
- INSERT: Apenas via RPC `register_supplier` ou `approve_supplier` (SECURITY DEFINER)
- UPDATE: Apenas via RPC (SECURITY DEFINER)

**`supplier_materials`:**
- SELECT:
  - Fornecedor vê apenas seus próprios materiais (via `supplier_users`)
  - **Organizações veem apenas materiais de fornecedores `approved` e vinculados** (corrigido em `20260121000000` — linha 31: filtra por `suppliers.status = 'approved'`)
- INSERT/UPDATE/DELETE: Apenas fornecedor (via `supplier_users`)

**`supplier_material_imports`:**
- SELECT/INSERT/UPDATE: Apenas fornecedor (via `supplier_users`)
- Organizações não têm acesso

**`supplier_organizations`:**
- SELECT: Organizações veem apenas seus próprios vínculos (via `organization_members`)
- INSERT/UPDATE: Organizações podem gerenciar seus próprios vínculos

---

### C) Documentação

#### ✅ Documentos Existentes

- ✅ `docs/SUPPLIER_CATALOG_V1.md` — Especificação completa do catálogo (linha 104: status "⚠️ PARCIALMENTE IMPLEMENTADO" — **INCONSISTENTE**, deveria ser "❌ NÃO IMPLEMENTADO")
- ✅ `docs/SUPPLIER_SELF_SERVICE_REGISTRATION.md` — Fluxo de cadastro e aprovação (linha 222: menciona `updated_at` em `supplier_users` — **INCONSISTENTE**)
- ✅ `docs/APROVAR_FORNECEDOR_MANUAL.md` — Guia de aprovação manual (MVP)
- ✅ `docs/QA_SUPPLIERS_V1_HOTFIX.md` — Checklist de testes manuais (8 testes)
- ✅ `docs/AUDIT_SUPPLIERS_V1_HOTFIX.md` — Audit completo de queries, RLS, RPCs
- ✅ `docs/RESUMO_HOTFIX_SUPPLIERS_V1.md` — Resumo executivo das correções
- ✅ `docs/RELATORIO_SUPPLIERS_V1.md` — Relatório completo da feature (linha 409: menciona `updated_at` em `supplier_users` — **INCONSISTENTE**)
- ✅ `docs/GUIA_TESTE_SUPPLIER_CATALOG.md` — Guia de testes end-to-end
- ✅ `docs/CONTEXT_DUMP_GAP_ANALYSIS_SUPPLIERS_V1.md` — Análise de gaps (gerado anteriormente)

---

## 🗺️ PASSO 2 — MAPA DE DOMÍNIOS E ROTAS

### Contrato Oficial vs Implementação Atual

#### ✅ Contrato Proposto

**STUDIOOS (plataforma):**
- `studioos.pro` → Landing (LP) — ✅ **IMPLEMENTADO** (linha 106 de `App.tsx`)
- `app.studioos.pro` → App principal (login/auth/formulários globais) — ✅ **IMPLEMENTADO** (fallback comercial, linha 88 de `App.tsx`)
- `admin.studioos.pro` ou `panel.studioos.pro` → Painel admin — ⚠️ **PARCIAL** (linha 76 de `App.tsx` detecta `isAdmin`, mas não há painel completo)

**CLIENTES (organizações):**
- `{slug}-app.studioos.pro` → App da organização — ⚠️ **NÃO IMPLEMENTADO** (não há lógica para `{slug}-app.studioos.pro`)
- `app.{slug}.com` → App da organização (domínio custom) — ✅ **IMPLEMENTADO** (linha 96 de `domainResolver.ts`: fallback para `app.*`)
- Domínio custom do cliente → LP + app — ✅ **IMPLEMENTADO** (linha 111 de `App.tsx`: `isMarketing && organizationSlug`)

**FORNECEDORES:**
- `fornecedores.studioos.pro` → Supplier Portal — ✅ **IMPLEMENTADO** (linha 71 de `App.tsx`)
- `/fornecedores/*` (preview/dev) — ✅ **IMPLEMENTADO** (linha 69 de `App.tsx`: `isSupplierRoute`)

#### ⚠️ Gaps no Contrato

1. **`{slug}-app.studioos.pro` não está implementado**
   - Atual: Apenas `app.studioos.pro` (fallback) e `app.{slug}.com` (custom)
   - Proposta: Adicionar lógica para `{slug}-app.studioos.pro` em `domainResolver.ts`

2. **`admin.studioos.pro` vs `panel.studioos.pro`**
   - Atual: `domainResolver.ts` (linha 86) detecta `panel.studioos.pro`
   - Proposta: Padronizar para `admin.studioos.pro` OU `panel.studioos.pro` (escolher um)

3. **Roteamento pós-login por role**
   - Atual: `useAuth.tsx` (linha 63) redireciona para `/gerarorcamento` sempre (exceto fornecedor)
   - Proposta: Implementar redirecionamento baseado em role:
     - Supplier → `fornecedores.studioos.pro`
     - Platform Admin → `admin.studioos.pro` (ou `panel.studioos.pro`)
     - Organization Admin/User → `app.{slug}.com` ou `{slug}-app.studioos.pro`

---

### Tabela: DOMÍNIO x ROTAS x Componente

| Domínio | Rota | Componente | Auth | Status |
|---------|------|-----------|------|--------|
| **Produção** |
| `studioos.pro` | `/` | `LandingPageStudioOS` | ❌ Público | ✅ |
| `studioos.pro` | `/cadastro-fornecedor` | `CadastroFornecedor` | ❌ Público | ✅ |
| `studioos.pro` | `/fornecedores/cadastro` | `CadastroFornecedor` | ❌ Público | ✅ |
| `app.studioos.pro` | `/` | `GerarOrcamento` (via `ProtectedRoute`) | ✅ Auth | ✅ |
| `panel.studioos.pro` | `/` | `GerenciarUsuarios` (via `AdminRoute`) | ✅ Auth + Admin | ⚠️ Parcial |
| `fornecedores.studioos.pro` | `/` | `SupplierPortal` | ✅ Auth | ✅ |
| `fornecedores.studioos.pro` | `/dashboard` | `SupplierDashboard` (via tab) | ✅ Auth | ✅ |
| `fornecedores.studioos.pro` | `/catalogo` | `SupplierCatalog` (via tab) | ✅ Auth | ✅ |
| `{slug}.com` | `/` | `LandingPageOrganizacao` | ❌ Público | ✅ |
| `app.{slug}.com` | `/` | `GerarOrcamento` (via `ProtectedRoute`) | ✅ Auth | ✅ |
| **Preview/Dev** |
| `localhost` ou `*.vercel.app` | `/cadastro-fornecedor` | `CadastroFornecedor` | ❌ Público | ✅ |
| `localhost` ou `*.vercel.app` | `/fornecedores/cadastro` | `CadastroFornecedor` | ❌ Público | ✅ |
| `localhost` ou `*.vercel.app` | `/fornecedores` | `SupplierPortal` | ✅ Auth | ✅ |
| `localhost` ou `*.vercel.app` | `/fornecedores/*` (exceto `/cadastro`) | `SupplierPortal` | ✅ Auth | ✅ |
| `localhost` ou `*.vercel.app` | `/studioos` | `LandingPageStudioOS` | ❌ Público | ✅ |
| `localhost` ou `*.vercel.app` | `/lp/:slug` | `LandingPageOrganizacao` | ❌ Público | ✅ |
| `localhost` ou `*.vercel.app` | `/gerarorcamento` | `GerarOrcamento` (via `ProtectedRoute`) | ✅ Auth | ✅ |

---

### Diagrama Textual: Fluxo de Login/Redirecionamento

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO FAZ LOGIN                         │
│              (useAuth.signIn() em Auth.tsx)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Verificar domínio atual      │
        │  (useDomainRouting)           │
        └───────────────┬───────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                                │
        ▼                                ▼
┌───────────────┐              ┌───────────────┐
│ isSupplier    │              │ !isSupplier   │
│ (fornecedores │              │ (app/admin)   │
│ .studioos.pro)│              │               │
└───────┬───────┘              └───────┬───────┘
        │                                │
        │                                │
        ▼                                ▼
┌───────────────┐              ┌──────────────────────────┐
│ SupplierPortal│              │ ProtectedRoute           │
│ já renderizado│              │ verifica supplier_users  │
│ (App.tsx:71)  │              │                          │
└───────────────┘              └───────────┬──────────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │ Se isSupplier = true     │
                              │ → Redirect para          │
                              │   fornecedores.studioos  │
                              │   .pro                   │
                              │                          │
                              │ Se isSupplier = false    │
                              │ → Renderiza children     │
                              │   (GerarOrcamento)       │
                              └──────────────────────────┘
```

**⚠️ GAP:** Não há redirecionamento baseado em role após login. `useAuth.tsx` (linha 63) sempre redireciona para `/gerarorcamento`, exceto se já estiver no domínio de fornecedor.

**Proposta de Correção:**
1. Após login bem-sucedido, verificar role do usuário:
   - Se `supplier_users.active = true` → redirecionar para `fornecedores.studioos.pro`
   - Se `user_roles.role = 'admin'` → redirecionar para `admin.studioos.pro` (ou `panel.studioos.pro`)
   - Caso contrário → redirecionar para app da organização (`app.{slug}.com` ou fallback `app.studioos.pro`)

---

### Regras de Roteamento (Validação)

#### ✅ Regra 1: Rotas Públicas SEM Auth

**Implementação:**
- ✅ `App.tsx` (linhas 120-136): Verifica `isPublicRoute` antes de renderizar rotas protegidas
- ✅ Rotas públicas: `/cadastro-fornecedor`, `/fornecedores/cadastro`
- ✅ Renderização: Sem `ProtectedRoute`, sem verificação de auth

**Status:** ✅ **CORRETO**

---

#### ✅ Regra 2: Roteamento por Role Pós-Login

**Implementação Atual:**
- ⚠️ `useAuth.tsx` (linha 63): Redireciona para `/gerarorcamento` sempre (exceto se `isSupplierDomain`)
- ⚠️ `ProtectedRoute.tsx` (linhas 68-83): Redireciona fornecedor para `fornecedores.studioos.pro` se não estiver no domínio correto
- ❌ Não há verificação de Platform Admin
- ❌ Não há redirecionamento para app da organização baseado em `organizationSlug`

**Status:** ⚠️ **PARCIAL** — Funciona para fornecedores, mas não para admins e organizações

**Proposta:**
```typescript
// Em useAuth.tsx, após signIn bem-sucedido:
const checkUserRole = async () => {
  // 1. Verificar se é fornecedor
  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('id')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  
  if (supplierUser) {
    window.location.href = 'https://fornecedores.studioos.pro';
    return;
  }
  
  // 2. Verificar se é platform admin
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  
  if (adminRole) {
    window.location.href = 'https://admin.studioos.pro'; // ou panel.studioos.pro
    return;
  }
  
  // 3. Redirecionar para app da organização
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organizations(slug)')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (orgMember?.organizations?.slug) {
    // Tentar app.{slug}.com primeiro, depois {slug}-app.studioos.pro
    window.location.href = `https://app.${orgMember.organizations.slug}.com` || 
                          `https://${orgMember.organizations.slug}-app.studioos.pro` ||
                          'https://app.studioos.pro'; // fallback
  } else {
    // Fallback
    navigate('/gerarorcamento');
  }
};
```

---

#### ✅ Regra 3: Evitar Colisão `/fornecedores/cadastro`

**Implementação:**
- ✅ `App.tsx` (linha 69): `isSupplierRoute` exclui `/fornecedores/cadastro` explicitamente
- ✅ `App.tsx` (linha 120): Rotas públicas são verificadas ANTES de `isSupplierRoute`

**Status:** ✅ **CORRETO** — Não há colisão

**Ordem de Matching (App.tsx):**
1. Linha 66-73: Verifica `isSupplier || isSupplierRoute` (exceto `/fornecedores/cadastro`)
2. Linha 75-82: Verifica `isAdmin`
3. Linha 84-94: Verifica `isApp`
4. Linha 106-108: Verifica `isMarketing && organizationSlug === 'studioos'`
5. Linha 111-115: Verifica `isMarketing && organizationSlug` (cliente)
6. Linha 120-136: Verifica rotas públicas (`/cadastro-fornecedor`, `/fornecedores/cadastro`)
7. Linha 189-231: Fallback para dev (rotas padrão)

**Status:** ✅ **CORRETO** — Ordem evita colisões

---

## 🔒 PASSO 3 — AUDITORIA DE RLS/RPC/SEGURANÇA

### A) Isolamento entre Fornecedores

#### ✅ Teste 1: Um fornecedor consegue ver/alterar materiais de outro?

**RLS Policy (`supplier_materials`):**
```sql
-- Policy: "Suppliers can manage own materials"
USING (
  supplier_id IN (
    SELECT supplier_id 
    FROM public.supplier_users 
    WHERE user_id = auth.uid() 
      AND active = true
  )
)
```

**Análise:**
- ✅ Fornecedor A (`user_id = 'user-a'`) só vê materiais onde `supplier_id IN (SELECT supplier_id FROM supplier_users WHERE user_id = 'user-a')`
- ✅ Fornecedor B (`user_id = 'user-b'`) não consegue ver materiais de Fornecedor A
- ✅ Isolamento garantido por `auth.uid()` e `supplier_users`

**Status:** ✅ **SEGURO** — Isolamento correto

**Como Reproduzir:**
1. Login como Fornecedor A
2. Tentar acessar `supplier_materials` com `supplier_id` de Fornecedor B
3. Resultado esperado: 0 registros retornados (RLS bloqueia)

---

#### ✅ Teste 2: Um fornecedor consegue ver dados de outros suppliers?

**RLS Policy (`suppliers`):**
- Não há política SELECT para fornecedores (apenas para organizações)
- Fornecedor não consegue fazer SELECT direto em `suppliers` (RLS bloqueia)

**RLS Policy (`supplier_users`):**
```sql
-- Policy: "Suppliers can view own users"
USING (user_id = auth.uid())
```

**Análise:**
- ✅ Fornecedor A só vê seu próprio vínculo (`user_id = auth.uid()`)
- ✅ Fornecedor B não consegue ver `supplier_users` de Fornecedor A
- ✅ Isolamento garantido

**Status:** ✅ **SEGURO** — Isolamento correto

**Como Reproduzir:**
1. Login como Fornecedor A
2. Tentar acessar `supplier_users` com `user_id` de Fornecedor B
3. Resultado esperado: 0 registros retornados (RLS bloqueia)

---

#### ✅ Teste 3: Uma organização consegue ver materiais de supplier pending/rejected?

**RLS Policy (`supplier_materials` — corrigida em `20260121000000`):**
```sql
-- Policy: "Organizations can view linked supplier materials"
USING (
  supplier_id IN (
    SELECT so.supplier_id
    FROM public.supplier_organizations so
    INNER JOIN public.organization_members om 
      ON so.organization_id = om.organization_id
    INNER JOIN public.suppliers s
      ON so.supplier_id = s.id
    WHERE om.user_id = auth.uid()
      AND so.active = true
      AND s.active = true
      AND s.status = 'approved'  -- OBRIGATÓRIO
  )
  AND active = true
)
```

**Análise:**
- ✅ Organização só vê materiais onde `suppliers.status = 'approved'`
- ✅ Fornecedor `pending` ou `rejected` não aparece
- ✅ Filtro explícito na RLS (linha 31 de `20260121000000`)

**Frontend (`ListaMateriaisFornecedores.tsx`):**
- ✅ Linha 64: Filtra fornecedores por `status === 'approved'`
- ✅ Linha 102: Filtro explícito `suppliers.status = 'approved'` na query

**Status:** ✅ **SEGURO** — Dupla proteção (RLS + Frontend)

**Como Reproduzir:**
1. Criar fornecedor com `status='pending'`
2. Vincular à organização
3. Fornecedor cadastra materiais
4. Login como organização
5. Acessar "Gestão de Materiais → Aba Fornecedores"
6. Resultado esperado: 0 materiais (RLS bloqueia)

---

### B) Hardening

#### ✅ Teste 4: `approve_supplier` está realmente travada para service_role?

**Implementação (`20260121000000` linhas 60-75):**
```sql
BEGIN
  v_jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  v_jwt_exists := true;
EXCEPTION
  WHEN OTHERS THEN
    v_jwt_exists := false;
    v_jwt_role := NULL;
END;

IF NOT v_jwt_exists OR v_jwt_role IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'not_authorized: Apenas service_role pode aprovar fornecedores. JWT inválido ou ausente.';
END IF;
```

**Permissões:**
- ✅ Linha 129: `REVOKE EXECUTE ON FUNCTION public.approve_supplier(UUID, UUID) FROM anon, authenticated;`

**Análise:**
- ✅ Verifica se JWT existe antes de ler `role`
- ✅ Se JWT não existe ou `role != 'service_role'` → retorna `not_authorized`
- ✅ Permissões públicas revogadas

**Status:** ✅ **SEGURO** — Hardening correto

**Como Reproduzir:**
1. Tentar executar `approve_supplier` como `authenticated` (via frontend ou SQL Editor sem service key)
2. Resultado esperado: Erro `not_authorized`

---

#### ✅ Teste 5: A view `supplier_pending_registrations` realmente sem acesso público?

**Implementação (`20260121000000` linha 312):**
```sql
REVOKE SELECT ON public.supplier_pending_registrations FROM anon, authenticated;
```

**Análise:**
- ✅ `REVOKE SELECT` aplicado para `anon` e `authenticated`
- ✅ Apenas `service_role` pode acessar (padrão Supabase)

**Status:** ✅ **SEGURO** — Acesso público revogado

**Como Reproduzir:**
1. Tentar fazer SELECT em `supplier_pending_registrations` como `authenticated` (via frontend)
2. Resultado esperado: Erro de permissão

---

#### ✅ Teste 6: `register_supplier` força status pending SEM exceção?

**Implementação (`20260121000000` linhas 250, 260):**
```sql
-- INSERT
status,  -- SEMPRE 'pending' (não aceitar input)
'pending',  -- FORÇAR status 'pending' (ignorar qualquer input)

-- ON CONFLICT
status = 'pending', -- FORÇAR pending mesmo em ON CONFLICT (não manter approved)
```

**Análise:**
- ✅ INSERT sempre usa `'pending'` (linha 250)
- ✅ ON CONFLICT força `status='pending'` (linha 260) — não mantém `approved` se já existir
- ✅ Não aceita parâmetro de status

**Status:** ✅ **SEGURO** — Status sempre `pending`

**Como Reproduzir:**
1. Tentar cadastrar fornecedor com `status='approved'` (se houver parâmetro)
2. Verificar no banco: `suppliers.status = 'pending'`
3. Resultado esperado: Sempre `pending`

---

### C) Bug Crítico: `supplier_users.updated_at`

#### 🔴 BUG CONFIRMADO

**Evidência 1: Tabela não tem `updated_at`**
- Arquivo: `supabase/migrations/20260116000002_domains_subdomains.sql` (linha 78)
- Schema: `created_at TIMESTAMPTZ DEFAULT now()` — **apenas `created_at`**

**Evidência 2: Migration tenta atualizar `updated_at`**
- Arquivo: `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` (linha 119)
- Código: `updated_at = now();` em `ON CONFLICT` de `approve_supplier`

**Evidência 3: Migration anterior já corrigiu**
- Arquivo: `supabase/migrations/20260117000003_fix_supplier_users_updated_at.sql` (linha 96)
- Comentário: "Removido: updated_at = now() (coluna não existe)"

**Conclusão:** Migration `20260121000000` **reintroduziu** o bug que já havia sido corrigido em `20260117000003`.

**Impacto:**
- ⚠️ Se `approve_supplier` for executada, pode falhar com erro `column "updated_at" does not exist`
- ⚠️ Aprovação de fornecedor pode quebrar

**Correção Proposta:**
- **Opção A (Recomendada):** Adicionar `updated_at` em `supplier_users` + trigger
  - Migration: `20260122000000_add_supplier_users_updated_at.sql`
  - Adicionar coluna: `ALTER TABLE public.supplier_users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();`
  - Criar trigger: `CREATE TRIGGER update_supplier_users_updated_at BEFORE UPDATE ON public.supplier_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`
  - Padronizar todas as migrations/funções para usar `updated_at`
- **Opção B:** Remover referência a `updated_at` em `approve_supplier` (linha 119 de `20260121000000`)

**Arquivos Afetados:**
- `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` (linha 119)
- `supabase/migrations/20260117000002_supplier_hardening.sql` (linha 101 — também tenta atualizar)
- `supabase/migrations/20260117000001_supplier_self_service_registration.sql` (linha 214 — também tenta atualizar)

---

### D) Email Confirmation Bypass

#### ⚠️ Implementação Atual

**`register_supplier` (linhas 284-295 de `20260121000000`):**
```sql
-- Confirmar email automaticamente (MVP - não exigir confirmação manual)
IF v_user_id_final IS NOT NULL THEN
  BEGIN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = v_user_id_final
      AND email_confirmed_at IS NULL;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se falhar, apenas logar (não quebrar o cadastro)
      RAISE WARNING 'Não foi possível confirmar email automaticamente: %', SQLERRM;
  END;
END IF;
```

**`CadastroFornecedor.tsx` (linhas 89-96):**
```typescript
// NOTA: Não configuramos emailRedirectTo porque não enviamos email de confirmação
// Como temos aprovação manual de fornecedores, não precisamos de confirmação por email
// O email será confirmado automaticamente pela função register_supplier
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: email.trim().toLowerCase(),
  password
  // Sem emailRedirectTo - confirmação de email desabilitada no Supabase Dashboard
  // A função register_supplier confirma o email automaticamente via SQL
});
```

**Análise:**
- ✅ Email é confirmado automaticamente via SQL (SECURITY DEFINER)
- ✅ `signUp` não envia email de confirmação (sem `emailRedirectTo`)
- ⚠️ **Risco:** Se Supabase Dashboard tiver email confirmation habilitado, pode haver conflito
- ⚠️ **Risco:** Se `UPDATE auth.users` falhar (permissões), email não é confirmado

**Documentação:**
- ✅ `docs/SUPPLIER_SELF_SERVICE_REGISTRATION.md` (linha 29): Menciona confirmação automática
- ✅ `docs/DESABILITAR_CONFIRMACAO_EMAIL.md` (se existir): Instruções para desabilitar no Dashboard

**Status:** ⚠️ **FUNCIONAL NO MVP, MAS PRECISA DOCUMENTAÇÃO CLARA**

**Recomendações:**
1. ✅ Manter como está (MVP)
2. ⚠️ Documentar claramente que email confirmation deve estar **desabilitado** no Supabase Dashboard
3. ⚠️ Adicionar verificação no código: Se `email_confirmed_at` não foi atualizado, mostrar aviso ao usuário
4. 🔮 Futuro: Migrar para Edge Function que usa Admin API (mais seguro)

---

## 📊 PASSO 4 — GAP ANALYSIS

### 🔴 P0 — BLOQUEADORES DO MVP

#### 1. Integração com Orçamentos/Pedidos — NÃO IMPLEMENTADA

**O que falta:**
- ❌ `MaterialSelector` não busca materiais de fornecedor
- ❌ Tabelas `cortina_items` não têm campos `supplier_material_id`, `supplier_id`, `price_snapshot`
- ❌ Seleção de material de fornecedor não salva campos de supplier
- ❌ UI não exibe badge "Fornecedor" em itens

**Arquivos a mexer:**
- **Migrations:**
  - Criar: `supabase/migrations/20260122000001_add_supplier_fields_cortina_items.sql`
  - Adicionar: `supplier_material_id UUID`, `supplier_id UUID`, `price_snapshot NUMERIC(12,2)` em `cortina_items`
- **Frontend:**
  - `src/components/orcamento/wizard/MaterialSelector.tsx` — Integrar `useSupplierMaterials`
  - `src/components/orcamento/wizard/EtapaProdutos.tsx` — Salvar campos de supplier
  - `src/components/orcamento/wizard/CortinaCard.tsx` — Exibir badge "Fornecedor"
  - `src/types/orcamento.ts` — Adicionar campos em `Cortina`

**Risco/Impacto:** Feature não é funcional end-to-end

**Esforço:** 2-3 dias

---

#### 2. Bug Crítico: `supplier_users.updated_at` não existe

**O que falta:**
- ❌ Tabela `supplier_users` não tem `updated_at`
- ❌ Migration `20260121000000` tenta atualizar coluna inexistente

**Arquivos a mexer:**
- **Migrations:**
  - Criar: `supabase/migrations/20260122000000_add_supplier_users_updated_at.sql`
  - Adicionar: `updated_at TIMESTAMPTZ DEFAULT now()` em `supplier_users`
  - Criar trigger: `update_supplier_users_updated_at`
  - Corrigir: `20260121000000` (linha 119) — manter referência a `updated_at` (agora existe)
  - Corrigir: `20260117000002` (linha 101) — manter referência a `updated_at`
  - Corrigir: `20260117000001` (linha 214) — manter referência a `updated_at`

**Risco/Impacto:** `approve_supplier` pode falhar

**Esforço:** 15 minutos

---

#### 3. Painel Admin para Aprovação — NÃO IMPLEMENTADO

**O que falta:**
- ❌ Painel admin (`admin.studioos.pro` ou `panel.studioos.pro`) não existe
- ❌ Aprovação é manual via SQL (não escalável)
- ❌ Não há notificação automática para admin

**Arquivos a mexer:**
- **Frontend:**
  - Criar: `src/pages/admin/SupplierApproval.tsx`
  - Criar: `src/components/admin/SupplierPendingList.tsx`
- **Backend:**
  - Criar: `supabase/functions/approve-supplier/index.ts` (Edge Function com service role)
  - Criar: `supabase/functions/reject-supplier/index.ts` (Edge Function com service role)

**Risco/Impacto:** Operacional (admin precisa saber SQL)

**Esforço:** 5-7 dias

---

### 🟡 P1 — IMPORTANTE, MAS NÃO BLOQUEADOR

#### 4. Notificações — NÃO IMPLEMENTADO

**O que falta:**
- ❌ Email ao aprovar fornecedor
- ❌ Email ao rejeitar fornecedor
- ❌ Notificação para admin quando novo fornecedor se cadastra

**Esforço:** 1-2 dias

---

#### 5. Dashboard de Fornecedor — Parcialmente Implementado

**O que está:**
- ✅ Cards métricos (Total, Ativos, Inativos)
- ✅ Gráfico simplificado (lista)

**O que falta:**
- ❌ Estatísticas de uso de materiais (pedidos que usam materiais do fornecedor)
- ❌ Histórico de pedidos recentes

**Esforço:** 3-4 dias

---

#### 6. Validação de CNPJ — Parcialmente Implementada

**O que está:**
- ✅ Validação de formato (14 dígitos)

**O que falta:**
- ❌ Validação de dígitos verificadores (algoritmo CNPJ)

**Esforço:** 1 dia

---

### 🟢 P2 — NICE TO HAVE

#### 7. Histórico de Preços — NÃO IMPLEMENTADO
#### 8. Preço Diferenciado por Cliente — NÃO IMPLEMENTADO
#### 9. Sincronização Automática de Preços — NÃO IMPLEMENTADO

---

## 🚀 PASSO 5 — PLANO DE EXECUÇÃO (PRs)

### Estado Atual em 10 Bullets

1. ✅ Cadastro público de fornecedores funciona (`/cadastro-fornecedor`)
2. ✅ Aprovação manual via SQL funciona (RPC `approve_supplier` com `service_role`)
3. ✅ Portal do fornecedor funciona (`fornecedores.studioos.pro`)
4. ✅ Gerenciamento de catálogo funciona (CRUD completo + CSV import)
5. ✅ Visualização read-only de materiais para organizações funciona
6. ✅ RLS garante segurança e isolamento
7. 🔴 **BUG:** `supplier_users.updated_at` não existe, mas migration tenta atualizar
8. ❌ Materiais de fornecedor não podem ser usados em orçamentos/pedidos
9. ❌ Painel admin para aprovação não existe (apenas SQL manual)
10. ⚠️ Roteamento pós-login não considera role (sempre redireciona para `/gerarorcamento`)

---

### Pendências em 10 Bullets

1. 🔴 Corrigir bug `supplier_users.updated_at` (migration tenta atualizar coluna inexistente)
2. 🔴 Implementar integração com orçamentos (campos + MaterialSelector + badge)
3. 🔴 Implementar painel admin para aprovação (UI + Edge Function)
4. 🟡 Implementar notificações (email ao aprovar/rejeitar)
5. 🟡 Melhorar dashboard de fornecedor (estatísticas de uso)
6. 🟡 Implementar validação de CNPJ (dígitos verificadores)
7. 🟡 Corrigir roteamento pós-login (redirecionar baseado em role)
8. 🟡 Adicionar suporte para `{slug}-app.studioos.pro` (padronizar domínios)
9. 🟢 Implementar histórico de preços
10. 🟢 Implementar preço diferenciado por cliente

---

### Plano de PRs

#### PR1: Fix Crítico — `supplier_users.updated_at` + Consistência Migrations

**Objetivo:** Corrigir bug crítico e padronizar todas as migrations

**Arquivos a mexer:**
- `supabase/migrations/20260122000000_add_supplier_users_updated_at.sql` (NOVO)
  - Adicionar `updated_at` em `supplier_users`
  - Criar trigger `update_supplier_users_updated_at`
- `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` (linha 119)
  - Manter referência a `updated_at` (agora existe)
- `supabase/migrations/20260117000002_supplier_hardening.sql` (linha 101)
  - Adicionar referência a `updated_at` (se não tiver)
- `supabase/migrations/20260117000001_supplier_self_service_registration.sql` (linha 214)
  - Adicionar referência a `updated_at` (se não tiver)
- `docs/SUPPLIER_SELF_SERVICE_REGISTRATION.md` (linha 222)
  - Atualizar para refletir que `updated_at` existe
- `docs/RELATORIO_SUPPLIERS_V1.md` (linha 409)
  - Atualizar para refletir que `updated_at` existe

**Riscos:**
- ⚠️ Migration pode falhar se `updated_at` já existir (usar `ADD COLUMN IF NOT EXISTS`)
- ⚠️ Trigger pode falhar se já existir (usar `CREATE TRIGGER IF NOT EXISTS`)

**Como Testar:**
1. Aplicar migration `20260122000000`
2. Verificar: `SELECT column_name FROM information_schema.columns WHERE table_name = 'supplier_users' AND column_name = 'updated_at';` → deve retornar 1 linha
3. Executar `approve_supplier` via service role
4. Verificar: `SELECT updated_at FROM supplier_users WHERE ...` → deve ter valor atualizado
5. Atualizar `supplier_users` manualmente
6. Verificar: `updated_at` deve ser atualizado automaticamente pelo trigger

**QA Checklist:**
- [ ] Migration aplicada sem erros
- [ ] Coluna `updated_at` existe em `supplier_users`
- [ ] Trigger `update_supplier_users_updated_at` existe
- [ ] `approve_supplier` funciona sem erros
- [ ] `updated_at` é atualizado automaticamente ao atualizar `supplier_users`

---

#### PR2: Domínios/Rotas/Redirect Roles (Sem Quebrar Produção)

**Objetivo:** Implementar roteamento correto pós-login e suporte para `{slug}-app.studioos.pro`

**Arquivos a mexer:**
- `src/lib/domainResolver.ts` (linha 70-115)
  - Adicionar lógica para `{slug}-app.studioos.pro` no fallback
- `src/hooks/useAuth.tsx` (linhas 44-66)
  - Implementar `checkUserRoleAndRedirect()` após login bem-sucedido
  - Verificar `supplier_users` → redirecionar para `fornecedores.studioos.pro`
  - Verificar `user_roles` → redirecionar para `admin.studioos.pro` (ou `panel.studioos.pro`)
  - Verificar `organization_members` → redirecionar para `app.{slug}.com` ou `{slug}-app.studioos.pro`
- `src/components/ProtectedRoute.tsx` (linhas 68-83)
  - Melhorar lógica de redirecionamento (usar `checkUserRoleAndRedirect()`)
- `supabase/migrations/20260122000002_add_slug_app_studioos_domains.sql` (NOVO)
  - Adicionar seeds para `{slug}-app.studioos.pro` (se necessário)

**Riscos:**
- ⚠️ Redirecionamento pode quebrar fluxo existente
- ⚠️ `{slug}-app.studioos.pro` pode não estar configurado no DNS

**Como Testar:**
1. Login como fornecedor → deve redirecionar para `fornecedores.studioos.pro`
2. Login como platform admin → deve redirecionar para `admin.studioos.pro` (ou `panel.studioos.pro`)
3. Login como organization user → deve redirecionar para `app.{slug}.com` ou `{slug}-app.studioos.pro`
4. Verificar que rotas públicas ainda funcionam
5. Verificar que `/fornecedores/cadastro` não é capturada pelo portal

**QA Checklist:**
- [ ] Fornecedor redireciona para `fornecedores.studioos.pro` após login
- [ ] Platform admin redireciona para `admin.studioos.pro` após login
- [ ] Organization user redireciona para app da organização após login
- [ ] Rotas públicas ainda funcionam
- [ ] `/fornecedores/cadastro` não é capturada pelo portal

---

#### PR3: Integração Orçamentos (Schema + MaterialSelector + Snapshot + Badge)

**Objetivo:** Permitir uso de materiais de fornecedor em orçamentos/pedidos

**Arquivos a mexer:**
- `supabase/migrations/20260122000001_add_supplier_fields_cortina_items.sql` (NOVO)
  - Adicionar: `supplier_material_id UUID`, `supplier_id UUID`, `price_snapshot NUMERIC(12,2)` em `cortina_items`
  - Adicionar índices: `idx_cortina_items_supplier_material`, `idx_cortina_items_supplier`
- `src/types/orcamento.ts` (linhas 11-55)
  - Adicionar em `Cortina`: `supplierMaterialId?: string`, `supplierId?: string`, `priceSnapshot?: number`
- `src/components/orcamento/wizard/MaterialSelector.tsx` (linhas 1-283)
  - Integrar `useSupplierMaterials` para buscar materiais de fornecedor
  - Combinar materiais próprios + materiais de fornecedor
  - Adicionar badge "Fornecedor" em materiais de fornecedor
- `src/components/orcamento/wizard/EtapaProdutos.tsx` (linhas 164-742)
  - Passar materiais de fornecedor para `CortinaCard`
- `src/components/orcamento/wizard/CortinaCard.tsx` (linhas 1-750)
  - Salvar `supplier_material_id`, `supplier_id`, `price_snapshot` ao salvar item
  - Exibir badge "Fornecedor" se item usa material de fornecedor
- `src/hooks/useSupplierMaterials.ts` (linhas 1-98)
  - Adicionar função para transformar `supplier_materials` em formato `Material` compatível
  - Adicionar campos: `supplier_material_id`, `supplier_id`, `supplier_name`, `price_snapshot`

**Riscos:**
- ⚠️ Migration pode falhar se `cortina_items` já tiver dados (usar `ADD COLUMN IF NOT EXISTS`)
- ⚠️ `MaterialSelector` pode ficar lento com muitos materiais (adicionar paginação/virtualização se necessário)

**Como Testar:**
1. Vincular fornecedor aprovado à organização
2. Fornecedor cadastra materiais
3. Criar orçamento → selecionar material de fornecedor
4. Verificar: Badge "Fornecedor" aparece no item
5. Salvar orçamento
6. Verificar no banco: `cortina_items` tem `supplier_material_id`, `supplier_id`, `price_snapshot`
7. Alterar preço do material no catálogo do fornecedor
8. Verificar: Preço no orçamento não muda (snapshot mantido)

**QA Checklist:**
- [ ] Migration aplicada sem erros
- [ ] Campos `supplier_material_id`, `supplier_id`, `price_snapshot` existem em `cortina_items`
- [ ] `MaterialSelector` mostra materiais de fornecedor
- [ ] Badge "Fornecedor" aparece em materiais de fornecedor
- [ ] Ao salvar item, campos de supplier são persistidos
- [ ] Snapshot de preço é mantido mesmo se fornecedor alterar preço depois

---

#### PR4: Admin Panel MVP (Listar Pendentes + Aprovar/Rejeitar via Edge Function)

**Objetivo:** Tornar aprovação escalável (UI + Edge Function)

**Arquivos a mexer:**
- `supabase/functions/approve-supplier/index.ts` (NOVO)
  - Edge Function que chama `approve_supplier` com service role
  - Validação: Verificar se usuário é platform admin (via `user_roles`)
- `supabase/functions/reject-supplier/index.ts` (NOVO)
  - Edge Function que atualiza `status='rejected'` com service role
  - Validação: Verificar se usuário é platform admin
- `src/pages/admin/SupplierApproval.tsx` (NOVO)
  - Lista fornecedores pendentes (via RPC ou Edge Function)
  - Botões "Aprovar" / "Rejeitar"
  - Integração com Edge Functions
- `src/components/admin/SupplierPendingList.tsx` (NOVO)
  - Componente de lista (tabela com ações)
- `src/App.tsx` (linha 76-82)
  - Adicionar rota `/admin/fornecedores` (se necessário)
- `src/components/AdminRoute.tsx` (linhas 10-72)
  - Verificar se usuário é platform admin (já implementado)

**Riscos:**
- ⚠️ Edge Function precisa de service role key (não expor no frontend)
- ⚠️ Validação de platform admin pode falhar se `user_roles` não estiver configurado

**Como Testar:**
1. Login como platform admin
2. Acessar `/admin/fornecedores` (ou rota equivalente)
3. Ver lista de fornecedores pendentes
4. Clicar "Aprovar" → deve chamar Edge Function → deve atualizar `status='approved'`
5. Clicar "Rejeitar" → deve chamar Edge Function → deve atualizar `status='rejected'`
6. Tentar aprovar como usuário não-admin → deve falhar

**QA Checklist:**
- [ ] Edge Function `approve-supplier` funciona
- [ ] Edge Function `reject-supplier` funciona
- [ ] Platform admin vê lista de pendentes
- [ ] Botão "Aprovar" funciona
- [ ] Botão "Rejeitar" funciona
- [ ] Usuário não-admin não consegue aprovar/rejeitar

---

#### PR5: Notificações (Email ao Aprovar/Rejeitar + Aviso Admin)

**Objetivo:** Melhorar UX com notificações

**Arquivos a mexer:**
- `supabase/functions/approve-supplier/index.ts`
  - Adicionar envio de email (Resend, SendGrid, etc.)
- `supabase/functions/reject-supplier/index.ts`
  - Adicionar envio de email
- `supabase/functions/notify-admin-new-supplier/index.ts` (NOVO)
  - Webhook ou trigger para notificar admin quando novo fornecedor se cadastra
- Templates de email (opcional)

**Riscos:**
- ⚠️ Requer configuração de serviço de email (Resend, SendGrid, etc.)
- ⚠️ Rate limiting pode ser necessário

**Como Testar:**
1. Aprovar fornecedor → deve receber email
2. Rejeitar fornecedor → deve receber email
3. Cadastrar novo fornecedor → admin deve receber notificação

**QA Checklist:**
- [ ] Email de aprovação é enviado
- [ ] Email de rejeição é enviado
- [ ] Admin recebe notificação de novo cadastro

---

## ✅ PASSO 6 — CHECKLIST DE TESTE AUTOMÁTICO/MANUAL

### Rotas em Cada Domínio

#### Produção

- [ ] `studioos.pro/` → Renderiza `LandingPageStudioOS`
- [ ] `studioos.pro/cadastro-fornecedor` → Renderiza `CadastroFornecedor` (público)
- [ ] `app.studioos.pro/` → Renderiza `GerarOrcamento` (requer auth)
- [ ] `panel.studioos.pro/` → Renderiza `GerenciarUsuarios` (requer auth + admin)
- [ ] `fornecedores.studioos.pro/` → Renderiza `SupplierPortal` (requer auth)
- [ ] `{slug}.com/` → Renderiza `LandingPageOrganizacao` (público)
- [ ] `app.{slug}.com/` → Renderiza `GerarOrcamento` (requer auth)

#### Preview/Dev

- [ ] `localhost/cadastro-fornecedor` → Renderiza `CadastroFornecedor` (público)
- [ ] `localhost/fornecedores/cadastro` → Renderiza `CadastroFornecedor` (público)
- [ ] `localhost/fornecedores` → Renderiza `SupplierPortal` (requer auth)
- [ ] `localhost/fornecedores/catalogo` → Renderiza `SupplierCatalog` (requer auth)
- [ ] `localhost/studioos` → Renderiza `LandingPageStudioOS` (público)
- [ ] `localhost/lp/:slug` → Renderiza `LandingPageOrganizacao` (público)
- [ ] `localhost/gerarorcamento` → Renderiza `GerarOrcamento` (requer auth)

---

### Cadastro Supplier

- [ ] Acessar `/cadastro-fornecedor`
- [ ] Preencher formulário (nome, email, CNPJ, senha, categorias, regiões)
- [ ] Submeter
- [ ] Verificar: Redireciona para portal
- [ ] Verificar: Login automático funciona
- [ ] Verificar no banco: `suppliers.status = 'pending'`
- [ ] Verificar no banco: `supplier_users` criado com `active=true`
- [ ] Verificar no banco: `email_confirmed_at` não nulo (confirmação automática)

---

### Aprovação

- [ ] Acessar Supabase Dashboard → SQL Editor
- [ ] Executar: `SELECT * FROM supplier_pending_registrations;` (deve funcionar com service role)
- [ ] Executar: `SELECT approve_supplier('supplier_id', 'user_id');` (deve funcionar com service role)
- [ ] Verificar: `suppliers.status = 'approved'`
- [ ] Verificar: `suppliers.approved_at` não nulo
- [ ] Verificar: `supplier_users.active = true`
- [ ] Tentar executar `approve_supplier` como `authenticated` → deve falhar com `not_authorized`

---

### RLS Pending vs Approved

- [ ] Criar fornecedor com `status='pending'`
- [ ] Vincular à organização
- [ ] Fornecedor cadastra materiais
- [ ] Login como organização
- [ ] Acessar "Gestão de Materiais → Aba Fornecedores"
- [ ] Verificar: 0 materiais aparecem (RLS bloqueia)
- [ ] Aprovar fornecedor (via SQL)
- [ ] Recarregar página
- [ ] Verificar: Materiais aparecem

---

### Import CSV

- [ ] Login como fornecedor
- [ ] Acessar "Catálogo → Importar CSV"
- [ ] Upload de CSV válido (colunas: name, price)
- [ ] Verificar: Preview mostra primeiras 10 linhas
- [ ] Verificar: Preços são normalizados (espaços removidos, vírgula → ponto)
- [ ] Clicar "Aplicar Importação"
- [ ] Verificar: Materiais aparecem na tabela
- [ ] Verificar no banco: `supplier_material_imports` tem registro com `status='applied'`
- [ ] Verificar: SKU vazio (`''`) vira `NULL` (evita duplicados)

---

### Organização Visualiza Materiais Approved

- [ ] Vincular fornecedor aprovado à organização
- [ ] Fornecedor cadastra 3 materiais
- [ ] Login como organização
- [ ] Acessar "Gestão de Materiais → Aba Fornecedores"
- [ ] Verificar: 3 materiais aparecem
- [ ] Verificar: Badge com nome do fornecedor aparece
- [ ] Verificar: Não há botões de edição (read-only)
- [ ] Tentar editar material via SQL (como organização) → deve falhar (RLS bloqueia)

---

### Nenhuma Quebra no App da Organização

- [ ] Login como organização
- [ ] Acessar `/gerarorcamento`
- [ ] Verificar: Dashboard carrega normalmente
- [ ] Verificar: Criar orçamento funciona
- [ ] Verificar: Selecionar materiais funciona (materiais próprios)
- [ ] Verificar: Salvar orçamento funciona
- [ ] Verificar: Visualizar orçamento funciona
- [ ] Verificar: Nenhum erro no console

---

## 🎯 RESUMO FINAL

### Achados Críticos

1. 🔴 **BUG:** `supplier_users.updated_at` não existe, mas migration `20260121000000` tenta atualizar (linha 119)
2. 🔴 **GAP:** Integração com orçamentos não está implementada (MaterialSelector não usa supplier materials)
3. 🔴 **GAP:** Painel admin para aprovação não existe (apenas SQL manual)
4. ⚠️ **INCONSISTÊNCIA:** Docs mencionam `supplier_users.updated_at`, mas tabela não tem
5. ⚠️ **INCONSISTÊNCIA:** Docs dizem "parcialmente implementado" para integração com orçamentos, mas nada foi implementado

### Gaps P0/P1/P2

**P0 (Bloqueadores):**
1. Integração com orçamentos (2-3 dias)
2. Bug `supplier_users.updated_at` (15 minutos)
3. Painel admin (5-7 dias)

**P1 (Importante):**
4. Notificações (1-2 dias)
5. Dashboard supplier com uso (3-4 dias)
6. Validação CNPJ (1 dia)
7. Roteamento pós-login por role (1 dia)

**P2 (Nice to Have):**
8. Histórico de preços (2-3 dias)
9. Preço por organização (5-7 dias)
10. Sync automático (7-10 dias)

### Plano de PRs

1. **PR1:** Fix `supplier_users.updated_at` + Consistência (15 minutos)
2. **PR2:** Domínios/Rotas/Redirect Roles (1 dia)
3. **PR3:** Integração Orçamentos (2-3 dias)
4. **PR4:** Admin Panel MVP (5-7 dias)
5. **PR5:** Notificações (1-2 dias)

**Total estimado:** 9-13 dias

---

**Documento gerado em:** 2026-01-21  
**Última atualização:** 2026-01-21
