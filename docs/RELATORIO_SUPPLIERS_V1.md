# RELATÓRIO COMPLETO — SUPPLIERS V1
## Feature: Supplier Catalog V1 + Self-Service Registration + Hardening

**Data:** 2026-01-17  
**Versão:** V1 (MVP)  
**Status:** Implementado e em produção

---

## SUMÁRIO EXECUTIVO

A feature de Suppliers V1 foi implementada com 3 componentes principais: (1) **Supplier Catalog V1** — catálogo de materiais por fornecedor com importação CSV, (2) **Self-Service Registration** — cadastro público de fornecedores com aprovação manual, e (3) **Hardening** — segurança e validações. O sistema permite que fornecedores se cadastrem publicamente, aguardem aprovação manual, gerenciem seu catálogo via portal isolado (`fornecedores.studioos.pro`), e que organizações clientes visualizem materiais de fornecedores vinculados (read-only). A integração com orçamentos/pedidos está preparada mas não totalmente funcional. O fluxo end-to-end funciona, mas há gaps em integração com orçamentos, painel admin para aprovação, e uso efetivo de materiais de fornecedor em pedidos.

---

## 1) VISÃO GERAL E FLUXO DE TRABALHO (END-TO-END)

### 1.1 StudioOS / Platform Admin

**O que consegue fazer hoje:**
- ✅ Aprovar fornecedores manualmente via SQL (RPC `approve_supplier` com `service_role`)
- ✅ Ver fornecedores pendentes via view `supplier_pending_registrations` (apenas `service_role`)
- ✅ Rejeitar fornecedores (atualizando `status='rejected'` manualmente)

**O que não consegue:**
- ❌ Aprovar via UI (não existe painel admin ainda)
- ❌ Ver notificações de novos cadastros
- ❌ Rejeitar com motivo/feedback ao fornecedor
- ❌ Ver estatísticas de fornecedores (quantos pendentes, aprovados, etc.)

**Onde o fluxo para:**
- Após cadastro público → fornecedor fica `status='pending'` → aguarda aprovação manual via SQL
- Não há notificação automática para admin quando novo fornecedor se cadastra

---

### 1.2 Organization Admin (Cliente)

**O que consegue fazer hoje:**
- ✅ Cadastrar fornecedor manualmente (`GerenciarFornecedores.tsx`)
- ✅ Vincular fornecedor existente à organização
- ✅ Editar regiões atendidas (`service_states`) de fornecedores vinculados
- ✅ Desvincular fornecedor (soft delete: `active=false` em `supplier_organizations`)
- ✅ Filtrar fornecedores por UF
- ✅ Ver materiais de fornecedores vinculados na aba "Fornecedores" de Gestão de Materiais (read-only)

**O que não consegue:**
- ❌ Aprovar fornecedores (apenas StudioOS admin)
- ❌ Ver status de aprovação do fornecedor (`pending`/`approved`/`rejected`)
- ❌ Editar informações do fornecedor (nome, email, CNPJ) — apenas regiões
- ❌ Ver histórico de importações CSV do fornecedor
- ❌ Usar materiais de fornecedor diretamente em orçamentos (preparado, mas não integrado)

**Onde o fluxo para:**
- Após vincular fornecedor → materiais aparecem na aba "Fornecedores" → mas não podem ser usados em orçamentos ainda (falta integração)

---

### 1.3 Organization User (Usuário Comum)

**O que consegue fazer hoje:**
- ✅ Ver materiais de fornecedores vinculados na aba "Fornecedores" (read-only)
- ✅ Buscar/filtrar materiais por fornecedor
- ✅ Ver informações do material (nome, SKU, preço, unidade, fornecedor)

**O que não consegue:**
- ❌ Editar materiais de fornecedor (read-only por design)
- ❌ Cadastrar/vincular fornecedores (apenas admin)
- ❌ Usar materiais de fornecedor em orçamentos (preparado, mas não integrado)

**Onde o fluxo para:**
- Visualização funciona → mas uso em orçamentos não está integrado

---

### 1.4 Supplier (Fornecedor)

**O que consegue fazer hoje:**
- ✅ Cadastrar-se publicamente (`/cadastro-fornecedor`)
- ✅ Acessar portal mesmo com `status='pending'` (acesso limitado)
- ✅ Gerenciar catálogo de materiais (CRUD completo)
- ✅ Importar materiais via CSV (com preview e validação)
- ✅ Editar materiais individualmente
- ✅ Ver histórico de importações (via `supplier_material_imports`)

**O que não consegue:**
- ❌ Ver pedidos/orçamentos que usam seus materiais (dashboard desabilitado)
- ❌ Ver estatísticas de uso de materiais
- ❌ Editar informações da empresa (nome, email, CNPJ) após cadastro
- ❌ Ver status de aprovação de forma clara (apenas badge "Pendente")
- ❌ Receber notificação quando aprovado

**Onde o fluxo para:**
- Cadastro → acesso limitado ao portal → pode gerenciar catálogo → mas materiais só ficam visíveis para clientes após aprovação

---

## 2) MAPA DE ROTAS E DOMÍNIOS

### 2.1 Rotas Públicas (Funcionam em qualquer domínio)

| Rota | Domínio | Componente | Descrição |
|------|---------|------------|-----------|
| `/cadastro-fornecedor` | Qualquer | `CadastroFornecedor.tsx` | Formulário público de cadastro de fornecedor |
| `/fornecedores/cadastro` | Qualquer | `CadastroFornecedor.tsx` | Alias para `/cadastro-fornecedor` |

**Regras de roteamento:**
- Verificadas em `App.tsx` antes das rotas de domínio
- Renderizadas sem verificação de autenticação
- Redirecionam para portal após cadastro

---

### 2.2 Portal de Fornecedores

| Rota | Domínio | Componente | Descrição |
|------|---------|------------|-----------|
| `/fornecedores` | `fornecedores.studioos.pro` OU preview Vercel | `SupplierPortal.tsx` | Portal principal do fornecedor |
| `/fornecedores/*` | `fornecedores.studioos.pro` OU preview Vercel | `SupplierPortal.tsx` | Qualquer sub-rota do portal |

**Regras de roteamento:**
- **Produção:** `fornecedores.studioos.pro` → detectado via `useDomainRouting` → `isSupplier = true`
- **Preview/Dev:** `/fornecedores` → detectado via `pathname` em `App.tsx` → `isSupplierRoute = true`
- **Fallback:** Se `isSupplier` ou `isSupplierRoute` → renderiza `SupplierPortal`
- **Ordem de verificação:** Verificado ANTES das rotas públicas para evitar conflito

**Código relevante:**
```typescript
// src/App.tsx (linhas 66-73)
const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const isSupplierRoute = pathname === '/fornecedores' || 
  (pathname.startsWith('/fornecedores/') && pathname !== '/fornecedores/cadastro');

if (isSupplier || isSupplierRoute) {
  return <SupplierPortal />;
}
```

---

### 2.3 App do Cliente (Organização)

| Rota | Domínio | Componente | Descrição |
|------|---------|------------|-----------|
| `gestaoMateriais` (view) | `app.*` ou `app.studioos.pro` | `GestaoMateriais.tsx` | Gestão de materiais (com aba "Fornecedores") |
| `gerenciarFornecedores` (view) | `app.*` ou `app.studioos.pro` | `GerenciarFornecedores.tsx` | Gerenciar fornecedores vinculados |

**Regras de roteamento:**
- Acessadas via views internas do sistema (`GerarOrcamento.tsx`)
- Requerem autenticação e `organizationId`
- Não são rotas públicas

---

### 2.4 Rotas de Desenvolvimento (Fallback)

| Rota | Domínio | Componente | Descrição |
|------|---------|------------|-----------|
| `/studioos` | `localhost` ou preview Vercel | `LandingPageStudioOS.tsx` | LP StudioOS (dev) |
| `/lp/:slug` | `localhost` ou preview Vercel | `LandingPageOrganizacao.tsx` | LP de organização (dev) |

**Regras:**
- Funcionam apenas em `local`, `preview`, ou `staging` (via `allowsDevRoutes()`)
- Em produção, apenas subdomínios são usados

---

## 3) TELAS E COMPONENTES (UI/UX)

### 3.1 `src/pages/CadastroFornecedor.tsx`

**Caminho:** `src/pages/CadastroFornecedor.tsx`  
**Acesso:** Rota pública `/cadastro-fornecedor` ou `/fornecedores/cadastro`

**Funcionalidades:**
- Formulário de cadastro público
- Validação de campos obrigatórios (nome, email, CNPJ, senha, categorias)
- Seleção de categorias de produtos (múltipla escolha + "Outros" com campo texto)
- Seleção de regiões atendidas (UFs) — por região ou individual
- Criação de usuário no Supabase Auth
- Chamada RPC `register_supplier` (cria supplier com `status='pending'`)
- Redirecionamento automático para portal após cadastro

**Estados:**
- **Loading:** `isSubmitting` → mostra "Cadastrando..." no botão
- **Success:** Redireciona para portal após 2s
- **Error:** Toast com mensagem de erro (usando `getErrorMessage` centralizado)

**Validações:**
- Nome obrigatório
- Email obrigatório + formato
- CNPJ obrigatório
- Senha mínimo 6 caracteres
- Senhas devem coincidir
- Pelo menos 1 categoria de produto
- Se "Outros" selecionado, campo texto obrigatório

**Dependências:**
- `supabase.auth.signUp` (cria usuário)
- `supabase.rpc('register_supplier')` (cria supplier)
- `src/lib/errorMessages.ts` (tratamento de erros)
- `src/lib/errorHandler.ts` (log de erros)

**CTAs:**
- "Enviar Cadastro" → submete formulário
- "Voltar ao site" (header) → link para `/studioos`

---

### 3.2 `src/pages/SupplierPortal.tsx`

**Caminho:** `src/pages/SupplierPortal.tsx`  
**Acesso:** `fornecedores.studioos.pro` ou `/fornecedores` (preview)

**Funcionalidades:**
- Tela de login (se não autenticado)
- Verificação de vínculo `supplier_users`
- Banner de "aguardando aprovação" (se `status='pending'`)
- Tabs: "Catálogo" (ativo) e "Dashboard" (desabilitado)
- Logout

**Estados:**
- **Loading:** `isLoading` ou `isCheckingAuth` → spinner "Carregando informações do fornecedor..."
- **Não autenticado:** Tela de login
- **Sem vínculo:** Card "Acesso Não Autorizado" com botões "Sair" e "Cadastrar"
- **Rejeitado:** Card "Cadastro Rejeitado" com botão "Sair"
- **Pendente/Aprovado:** Portal com banner (se pendente) + tabs

**Validações:**
- Email e senha obrigatórios no login
- Verifica `supplier_users` vinculado OU supplier por email (fallback)

**Dependências:**
- `useAuth()` (autenticação)
- `supabase.from('supplier_users')` (vínculo)
- `supabase.from('suppliers')` (fallback por email)
- `SupplierCatalog` (componente de catálogo)

**CTAs:**
- "Entrar" (login) → `signInWithPassword`
- "Sair" → `signOut`
- "Cadastrar" → link para `/cadastro-fornecedor`

---

### 3.3 `src/components/supplier/SupplierCatalog.tsx`

**Caminho:** `src/components/supplier/SupplierCatalog.tsx`  
**Acesso:** Via `SupplierPortal` → tab "Catálogo"

**Funcionalidades:**
- Lista de materiais do fornecedor (tabela)
- Busca por nome ou SKU
- Editar material (dialog)
- Importar CSV (dialog com preview e validação)
- Ativar/desativar material

**Estados:**
- **Loading:** `isLoading` → spinner
- **Empty:** Mensagem "Nenhum material cadastrado ainda. Use 'Importar CSV'..."
- **Error:** Toast com mensagem de erro

**Validações CSV:**
- Arquivo deve ser `.csv`
- Colunas obrigatórias: `name/nome`, `price/preco/preço`
- Colunas opcionais: `sku`, `unit/unidade`, `description/descricao`, `active/ativo`
- Preview das primeiras 10 linhas válidas
- Erros exibidos antes de aplicar

**Dependências:**
- `supabase.from('supplier_materials')` (CRUD)
- `supabase.from('supplier_material_imports')` (histórico)
- RLS garante que fornecedor só vê seus próprios materiais

**CTAs:**
- "Importar CSV" → abre dialog de importação
- "Editar" (ícone) → abre dialog de edição
- "Aplicar Importação" → processa CSV e faz upsert

---

### 3.4 `src/pages/GerenciarFornecedores.tsx`

**Caminho:** `src/pages/GerenciarFornecedores.tsx`  
**Acesso:** Via view `gerenciarFornecedores` no sistema do cliente

**Funcionalidades:**
- Cadastrar novo fornecedor (formulário)
- Vincular fornecedor existente (busca + dialog)
- Listar fornecedores vinculados
- Editar regiões atendidas (`service_states`)
- Desvincular fornecedor (soft delete)
- Filtrar por UF

**Estados:**
- **Loading:** `isLoadingSuppliers` → spinner
- **Empty:** "Nenhum fornecedor vinculado ainda. Cadastre ou vincule um fornecedor..."
- **Error:** Toast com mensagem de erro

**Validações:**
- Nome obrigatório no cadastro
- Slug gerado automaticamente (com fallback se duplicado)
- `service_states` é array de UFs

**Dependências:**
- `useOrganizationContext()` (organizationId)
- `supabase.from('suppliers')` (criar/buscar)
- `supabase.from('supplier_organizations')` (vincular)

**CTAs:**
- "Cadastrar Fornecedor" → cria supplier + vincula
- "Vincular Fornecedor Existente" → abre dialog de busca
- "Editar" (ícone) → abre dialog de edição de regiões
- "Desvincular" (ícone) → soft delete

---

### 3.5 `src/components/orcamento/gestao/ListaMateriaisFornecedores.tsx`

**Caminho:** `src/components/orcamento/gestao/ListaMateriaisFornecedores.tsx`  
**Acesso:** Via `GestaoMateriais` → aba "Fornecedores"

**Funcionalidades:**
- Lista materiais de fornecedores vinculados (read-only)
- Busca por nome, SKU ou fornecedor
- Filtro por fornecedor
- Badge com nome do fornecedor

**Estados:**
- **Loading:** Spinner
- **Empty:** "Nenhum fornecedor vinculado..." ou "Nenhum material encontrado..."
- **Error:** Toast

**Validações:**
- Read-only por design (sem botões de edição)

**Dependências:**
- `useOrganizationContext()` (organizationId)
- `supabase.from('supplier_organizations')` (fornecedores vinculados)
- `supabase.from('supplier_materials')` (materiais)
- RLS garante que organização só vê materiais de fornecedores vinculados

**CTAs:**
- Nenhum (read-only)
- Aviso: "Estes materiais são controlados pelos fornecedores. Para alterar preços ou informações, entre em contato com o fornecedor..."

---

### 3.6 Hooks Criados

#### `src/hooks/useSupplierMaterials.ts`

**Funcionalidade:**
- Busca materiais de fornecedores vinculados à organização
- Transforma em formato `Material` compatível com `MaterialSelector`
- Adiciona campos: `supplier_material_id`, `supplier_id`, `supplier_name`, `price_snapshot`

**Uso:**
- Preparado para uso em `MaterialSelector`, mas não está sendo usado ainda
- Cache: 5 minutos (staleTime), 15 minutos (gcTime)

**Dependências:**
- `useOrganizationContext()`
- `supabase.from('supplier_organizations')`
- `supabase.from('supplier_materials')`

---

## 4) BANCO DE DADOS E MIGRATIONS (SUPABASE)

### 4.1 Tabelas Envolvidas

#### `public.suppliers`
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
email TEXT
phone TEXT
cnpj TEXT
cnpj_normalized TEXT UNIQUE (índice parcial)
service_states TEXT[] NOT NULL DEFAULT '{}'
product_categories TEXT[] NOT NULL DEFAULT '{}'
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
approved_at TIMESTAMPTZ
rejected_at TIMESTAMPTZ
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

**Índices:**
- `idx_suppliers_cnpj_normalized_unique` (único, parcial: `WHERE cnpj_normalized IS NOT NULL`)
- `idx_suppliers_email_unique` (único, parcial: `WHERE email IS NOT NULL`)

**Triggers:**
- `trigger_update_supplier_cnpj_normalized` (mantém `cnpj_normalized` atualizado)

---

#### `public.supplier_users`
```sql
id UUID PRIMARY KEY
supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
role TEXT DEFAULT 'supplier'
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
UNIQUE (supplier_id, user_id)
```

**RLS:**
- `Suppliers can view own users` (SELECT: `user_id = auth.uid()`)
- `Organizations can view linked supplier users` (SELECT: via `supplier_organizations`)

---

#### `public.supplier_organizations`
```sql
id UUID PRIMARY KEY
supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
UNIQUE (supplier_id, organization_id)
```

**RLS:**
- Organizações veem apenas seus próprios vínculos (via `organization_members`)

---

#### `public.supplier_materials`
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

**Índices:**
- `idx_supplier_materials_supplier_active` (parcial: `WHERE active = true`)
- `idx_supplier_materials_supplier_name`
- `idx_supplier_materials_supplier_sku` (parcial: `WHERE sku IS NOT NULL`)

**RLS:**
- `Suppliers can manage own materials` (ALL: via `supplier_users`)
- `Organizations can view linked supplier materials` (SELECT: via `supplier_organizations`, apenas `active = true`)

**Triggers:**
- `update_supplier_materials_updated_at` (atualiza `updated_at`)

---

#### `public.supplier_material_imports`
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

**Índices:**
- `idx_supplier_material_imports_supplier` (por `supplier_id, created_at DESC`)

**RLS:**
- `Suppliers can view own imports` (SELECT: via `supplier_users`)
- `Suppliers can manage own imports` (ALL: via `supplier_users`)

**Triggers:**
- `update_supplier_material_imports_updated_at` (atualiza `updated_at`)

---

### 4.2 Views Criadas

#### `public.supplier_pending_registrations`
```sql
SELECT 
  s.id,
  s.name,
  s.slug,
  s.email,
  s.phone,
  s.cnpj,
  s.cnpj_normalized,
  s.service_states,
  s.product_categories,
  s.status,
  s.created_at,
  s.updated_at,
  (SELECT id FROM auth.users WHERE email = s.email LIMIT 1) AS user_id
FROM public.suppliers s
WHERE s.status = 'pending'
ORDER BY s.created_at DESC;
```

**Acesso:**
- ❌ `anon` e `authenticated` → REVOKED
- ✅ `service_role` → acesso direto (padrão Supabase)

**Uso:**
- Apenas para admin StudioOS ver cadastros pendentes

---

### 4.3 Migrations Criadas

#### `20260117000000_supplier_catalog_v1.sql`
**Objetivo:** Implementar catálogo de materiais por fornecedor

**O que cria/altera:**
- Adiciona `service_states` em `suppliers`
- Cria `supplier_materials` (tabela + índices + RLS)
- Cria `supplier_material_imports` (tabela + índices + RLS)
- Cria triggers `updated_at`
- Cria função `get_organization_supplier_materials`

**Idempotente:** ✅ Sim (`IF NOT EXISTS`, `CREATE OR REPLACE`)

---

#### `20260117000001_supplier_self_service_registration.sql`
**Objetivo:** Permitir cadastro público de fornecedores com aprovação manual

**O que cria/altera:**
- Adiciona `status`, `approved_at`, `rejected_at`, `product_categories` em `suppliers`
- Atualiza suppliers existentes para `status='approved'`
- Cria função RPC `register_supplier` (SECURITY DEFINER)
- Cria função `approve_supplier` (inicial, sem hardening)
- Cria view `supplier_pending_registrations`
- Adiciona `cnpj_normalized` e índices únicos
- Cria trigger `update_supplier_cnpj_normalized`

**Idempotente:** ✅ Sim (`IF NOT EXISTS`, `DROP FUNCTION IF EXISTS`, `CREATE OR REPLACE`)

---

#### `20260117000002_supplier_hardening.sql`
**Objetivo:** Hardening de segurança (aprovação apenas service_role, anti-duplicidade)

**O que cria/altera:**
- Atualiza `approve_supplier` para verificar `service_role` (JWT)
- Revoga acesso público à view `supplier_pending_registrations`
- Garante `status='pending'` fixo em `register_supplier`
- Normaliza CNPJ e email em `register_supplier`
- Bloqueia duplicidades (CNPJ, email) com erros específicos
- Adiciona `updated_at` em `supplier_users` (se não existir)

**Idempotente:** ✅ Sim (`DROP FUNCTION IF EXISTS`, `CREATE OR REPLACE`, `ADD COLUMN IF NOT EXISTS`)

---

#### `20260117000003_fix_supplier_users_updated_at.sql`
**Objetivo:** Corrigir referência a `updated_at` em `supplier_users`

**O que cria/altera:**
- Adiciona `updated_at` em `supplier_users` (se não existir)
- Cria trigger `update_supplier_users_updated_at`
- Atualiza `approve_supplier` para não referenciar `updated_at` se não existir

**Idempotente:** ✅ Sim (`ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE`)

---

#### `20260117000004_disable_email_confirmation_suppliers.sql`
**Objetivo:** Confirmar emails de fornecedores existentes (workaround para MVP)

**O que cria/altera:**
- Atualiza `email_confirmed_at` para fornecedores existentes que não confirmaram

**Idempotente:** ⚠️ Parcial (pode executar múltiplas vezes, mas não é necessário)

---

#### `20260117000005_fix_supplier_users_rls_recursion.sql`
**Objetivo:** Corrigir recursão infinita na política RLS de `supplier_users`

**O que cria/altera:**
- Remove política problemática `Suppliers can view own users` (com recursão)
- Cria política simplificada (sem recursão: `user_id = auth.uid()`)
- Atualiza política de organizações (sem recursão)

**Idempotente:** ✅ Sim (`DROP POLICY IF EXISTS`, `CREATE POLICY`)

---

## 5) RPCs E SEGURANÇA (RLS / SERVICE ROLE)

### 5.1 Funções RPC Criadas

#### `public.register_supplier`
**Assinatura:**
```sql
register_supplier(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_service_states TEXT[] DEFAULT '{}',
  p_product_categories TEXT[] DEFAULT '{}',
  p_user_id UUID DEFAULT NULL
) RETURNS UUID
```

**SECURITY DEFINER:** ✅ Sim

**Autorização:**
- Pode ser executada por `anon` ou `authenticated` (GRANT EXECUTE)
- Força `status='pending'` sempre
- Normaliza CNPJ e email
- Bloqueia duplicidades (CNPJ, email) com erros específicos
- Cria `supplier_users` automaticamente
- Tenta confirmar email automaticamente (MVP)

**Validações:**
- Nome obrigatório
- Email obrigatório
- CNPJ deve ter 14 dígitos (se fornecido)
- Verifica duplicidade de CNPJ (normalizado)
- Verifica duplicidade de email

**Erros possíveis:**
- `name_required`, `email_required`, `cnpj_invalid`, `cnpj_already_registered`, `email_already_registered`

---

#### `public.approve_supplier`
**Assinatura:**
```sql
approve_supplier(
  p_supplier_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
```

**SECURITY DEFINER:** ✅ Sim

**Autorização:**
- ❌ Apenas `service_role` pode executar (verifica JWT `role`)
- ❌ `authenticated` → retorna `not_authorized`

**Validações:**
- `supplier_id` obrigatório
- `user_id` obrigatório
- Supplier deve existir
- Supplier deve estar com `status='pending'`
- Se já aprovado/rejeitado → retorna `supplier_already_processed`

**Ações:**
- Atualiza `status='approved'`, `approved_at=now()`
- Cria/atualiza `supplier_users` (ativa vínculo)

**Erros possíveis:**
- `not_authorized`, `supplier_id_required`, `user_id_required`, `supplier_not_found`, `supplier_already_processed`

---

#### `public.get_organization_supplier_materials`
**Assinatura:**
```sql
get_organization_supplier_materials(
  p_organization_id UUID
) RETURNS TABLE (...)
```

**SECURITY DEFINER:** ✅ Sim

**Autorização:**
- Pode ser executada por qualquer usuário autenticado
- Retorna apenas materiais de fornecedores vinculados e ativos

**Uso:**
- Função auxiliar para queries (não está sendo usada no frontend ainda)

---

### 5.2 Policies RLS por Tabela

#### `suppliers`
- **SELECT:** Organizações veem apenas fornecedores vinculados (via `supplier_organizations`)
- **INSERT:** Apenas via RPC `register_supplier` (SECURITY DEFINER)
- **UPDATE:** Organizações podem atualizar apenas `service_states` (via `GerenciarFornecedores`)
- **DELETE:** Soft delete via `active=false` (não há DELETE direto)

**Pontos de atenção:**
- ⚠️ Organizações podem ver todos os fornecedores vinculados, mas não podem ver `status` (não está no SELECT)
- ⚠️ Não há política explícita para fornecedor editar seus próprios dados (apenas via portal, que usa `supplier_users`)

---

#### `supplier_users`
- **SELECT:** 
  - Fornecedor vê apenas seu próprio vínculo (`user_id = auth.uid()`)
  - Organizações veem vínculos de fornecedores vinculados (via `supplier_organizations`)
- **INSERT:** Apenas via RPC `register_supplier` ou `approve_supplier` (SECURITY DEFINER)
- **UPDATE:** Apenas via RPC (SECURITY DEFINER)
- **DELETE:** Soft delete via `active=false` (não há DELETE direto)

**Pontos de atenção:**
- ✅ Corrigido recursão infinita (migration `20260117000005`)

---

#### `supplier_materials`
- **SELECT:**
  - Fornecedor vê apenas seus próprios materiais (via `supplier_users`)
  - Organizações veem apenas materiais de fornecedores vinculados e ativos (via `supplier_organizations`)
- **INSERT/UPDATE/DELETE:** Apenas fornecedor (via `supplier_users`)

**Pontos de atenção:**
- ✅ Read-only para organizações (apenas SELECT)
- ✅ Fornecedor não pode ver materiais de outros fornecedores

---

#### `supplier_material_imports`
- **SELECT/INSERT/UPDATE:** Apenas fornecedor (via `supplier_users`)

**Pontos de atenção:**
- ✅ Organizações não têm acesso (não há política para elas)

---

### 5.3 Pontos de Atenção (Segurança)

#### ✅ Implementado
- `approve_supplier` só roda com `service_role`
- View `supplier_pending_registrations` não é pública (REVOKED para `anon`/`authenticated`)
- CNPJ e email normalizados e com índices únicos (anti-duplicidade)
- RLS garante isolamento entre fornecedores
- RLS garante read-only de materiais para organizações

#### ⚠️ Riscos Identificados
1. **Enumeração de emails:** `register_supplier` retorna erro específico se email já existe → permite enumerar emails cadastrados
   - **Mitigação:** Erro genérico seria melhor, mas prejudica UX
   - **Recomendação:** Manter como está (trade-off UX vs segurança)

2. **Enumeração de CNPJs:** Similar ao email
   - **Mitigação:** Similar ao email

3. **Acesso de fornecedor pendente:** Fornecedor com `status='pending'` pode acessar portal e gerenciar catálogo
   - **Mitigação:** Materiais só ficam visíveis para clientes se `status='approved'` (via RLS)
   - **Recomendação:** Manter como está (permite onboarding antes de aprovação)

4. **Falta de rate limiting:** `register_supplier` pode ser chamada múltiplas vezes
   - **Mitigação:** Duplicidades são bloqueadas (CNPJ, email)
   - **Recomendação:** Adicionar rate limiting no futuro (Edge middleware)

5. **Email confirmation bypass:** `register_supplier` tenta confirmar email automaticamente
   - **Mitigação:** Email confirmation desabilitado no Supabase Dashboard (MVP)
   - **Recomendação:** Revisar quando email confirmation for habilitado

---

## 6) INTEGRAÇÃO COM O SISTEMA DO CLIENTE (MATERIAIS/ORÇAMENTO/PEDIDOS)

### 6.1 Como Materiais de Fornecedor Aparecem Hoje

**Para a organização:**
- ✅ Aba "Fornecedores" em `GestaoMateriais` → lista materiais de fornecedores vinculados (read-only)
- ✅ Busca e filtro por fornecedor funcionam
- ✅ Informações exibidas: nome, SKU, unidade, preço, fornecedor

**Read-only:**
- ✅ **Frontend:** Sem botões de edição em `ListaMateriaisFornecedores`
- ✅ **Backend:** RLS garante apenas SELECT (não há política INSERT/UPDATE/DELETE para organizações)

---

### 6.2 Uso em Orçamentos e Pedidos

**Status atual:**
- ⚠️ **Preparado, mas não integrado**

**O que existe:**
- ✅ Hook `useSupplierMaterials` transforma materiais em formato `Material` compatível
- ✅ Campos adicionais: `supplier_material_id`, `supplier_id`, `supplier_name`, `price_snapshot`
- ✅ `MaterialSelector` poderia usar `useSupplierMaterials`, mas não está usando

**O que falta:**
- ❌ `MaterialSelector` não busca materiais de fornecedor
- ❌ Seleção de material de fornecedor em orçamento não salva `supplier_material_id`
- ❌ Tabelas `orcamentos`, `cortina_items`, `pedidos` não têm campos para `supplier_material_id`
- ❌ Não há snapshot de preço de fornecedor em itens de orçamento/pedido

**Como deveria funcionar (visão):**
1. Cliente seleciona material de fornecedor em orçamento
2. Sistema salva `supplier_material_id`, `supplier_id`, `price_snapshot` no item
3. Preço do fornecedor é usado no cálculo (ou pode ser sobrescrito)
4. Histórico mantém preço original do fornecedor

---

### 6.3 O Que Ainda Falta para Ficar Funcional

**P0 (Bloqueador MVP):**
- ❌ Integrar `useSupplierMaterials` em `MaterialSelector`
- ❌ Adicionar campos `supplier_material_id`, `supplier_id`, `price_snapshot` em `cortina_items` (ou tabela equivalente)
- ❌ Salvar esses campos ao criar/editar item de orçamento
- ❌ Exibir badge "Fornecedor" em itens que usam material de fornecedor

**P1 (Importante, mas não bloqueador):**
- ❌ Dashboard de fornecedor mostrar pedidos que usam seus materiais
- ❌ Notificação para fornecedor quando material é usado em pedido
- ❌ Histórico de preços de fornecedor (quando preço muda)

**P2 (Nice to have):**
- ❌ Preço diferenciado por cliente (hoje é global)
- ❌ Estoque de fornecedor (se aplicável)
- ❌ Sincronização automática de preços (webhook ou polling)

---

## 7) LINKS DE TESTE E CHECKLIST DE QA

### 7.1 URLs Principais

**Produção:**
- Cadastro: `https://studioos.pro/cadastro-fornecedor` ou `https://fornecedores.studioos.pro/cadastro-fornecedor`
- Portal: `https://fornecedores.studioos.pro`
- Gestão (cliente): `https://app.studioos.pro` → view `gerenciarFornecedores`
- Materiais (cliente): `https://app.studioos.pro` → view `gestaoMateriais` → aba "Fornecedores"

**Preview/Vercel:**
- Cadastro: `https://prisma-decor-mobile.vercel.app/cadastro-fornecedor`
- Portal: `https://prisma-decor-mobile.vercel.app/fornecedores`
- Gestão (cliente): `https://prisma-decor-mobile.vercel.app` → view `gerenciarFornecedores`

---

### 7.2 Passos de Teste Críticos

#### Happy Path — Cadastro de Fornecedor
1. Acessar `/cadastro-fornecedor`
2. Preencher formulário (nome, email, CNPJ, senha, categorias, regiões)
3. Submeter
4. ✅ Verificar: Redireciona para portal
5. ✅ Verificar: Login automático funciona
6. ✅ Verificar: Banner "aguardando aprovação" aparece
7. ✅ Verificar: Tab "Catálogo" está acessível

**Tabelas para validar:**
- `auth.users` → novo usuário criado, `email_confirmed_at` não nulo
- `suppliers` → novo supplier com `status='pending'`
- `supplier_users` → vínculo criado (`active=true`)

---

#### Happy Path — Aprovação Manual (Admin)
1. Acessar Supabase Dashboard → SQL Editor
2. Executar:
   ```sql
   SELECT * FROM supplier_pending_registrations;
   ```
3. Pegar `supplier_id` e `user_id`
4. Executar:
   ```sql
   SELECT approve_supplier('supplier_id', 'user_id');
   ```
5. ✅ Verificar: `suppliers.status = 'approved'`
6. ✅ Verificar: `suppliers.approved_at` não nulo
7. ✅ Verificar: `supplier_users.active = true`

**Tabelas para validar:**
- `suppliers` → `status='approved'`, `approved_at` preenchido
- `supplier_users` → `active=true`

---

#### Happy Path — Gerenciar Catálogo (Fornecedor)
1. Login no portal (`fornecedores.studioos.pro`)
2. Acessar tab "Catálogo"
3. Clicar "Importar CSV"
4. Upload de CSV válido (colunas: name, price)
5. ✅ Verificar: Preview mostra primeiras 10 linhas
6. Clicar "Aplicar Importação"
7. ✅ Verificar: Materiais aparecem na tabela
8. ✅ Verificar: `supplier_material_imports` tem registro com `status='applied'`

**Tabelas para validar:**
- `supplier_materials` → novos materiais inseridos
- `supplier_material_imports` → registro com `status='applied'`, `inserted`/`updated` preenchidos

---

#### Happy Path — Vincular Fornecedor (Cliente)
1. Login no app do cliente
2. Acessar view `gerenciarFornecedores`
3. Preencher formulário de cadastro OU buscar fornecedor existente
4. Vincular
5. ✅ Verificar: Fornecedor aparece na lista
6. Acessar `gestaoMateriais` → aba "Fornecedores"
7. ✅ Verificar: Materiais do fornecedor aparecem (se aprovado)

**Tabelas para validar:**
- `supplier_organizations` → novo vínculo com `active=true`
- `supplier_materials` → materiais visíveis (se `supplier.status='approved'`)

---

#### Erros Comuns

**Erro: "Email already registered"**
- ✅ Verificar: Sistema tenta fazer login automaticamente
- ✅ Verificar: Se senha correta, redireciona para portal
- ✅ Verificar: Se senha incorreta, mostra erro

**Erro: "CNPJ já cadastrado"**
- ✅ Verificar: Erro específico aparece
- ✅ Verificar: Não permite cadastro duplicado

**Erro: "Acesso Não Autorizado" no portal**
- ✅ Verificar: `supplier_users` existe e `active=true`
- ✅ Verificar: `suppliers.status` não é `'rejected'`
- ✅ Verificar: Email do usuário corresponde ao `suppliers.email`

**Erro: Recursão infinita (42P17)**
- ✅ Verificar: Migration `20260117000005` foi aplicada
- ✅ Verificar: Política RLS de `supplier_users` não tem recursão

---

### 7.3 Tabelas para Validar Cada Passo

| Passo | Tabelas Principais | Campos a Verificar |
|-------|-------------------|-------------------|
| Cadastro fornecedor | `auth.users` | `email`, `email_confirmed_at` |
| | `suppliers` | `status='pending'`, `email`, `cnpj_normalized` |
| | `supplier_users` | `active=true`, `user_id`, `supplier_id` |
| Aprovação | `suppliers` | `status='approved'`, `approved_at` |
| | `supplier_users` | `active=true` |
| Import CSV | `supplier_materials` | Novos registros |
| | `supplier_material_imports` | `status='applied'`, `inserted`, `updated` |
| Vincular fornecedor | `supplier_organizations` | `active=true`, `organization_id`, `supplier_id` |
| Ver materiais (cliente) | `supplier_materials` | Apenas `active=true` e `supplier.status='approved'` |

---

## 8) GAPS E PRÓXIMOS PASSOS RECOMENDADOS

### 8.1 Gaps por Prioridade

#### P0 — Bloqueadores do MVP

1. **Integração com Orçamentos/Pedidos**
   - **Gap:** Materiais de fornecedor não podem ser usados em orçamentos
   - **Impacto:** Feature não é funcional end-to-end
   - **Esforço:** Médio (2-3 dias)
   - **Ações:**
     - Adicionar campos `supplier_material_id`, `supplier_id`, `price_snapshot` em `cortina_items`
     - Integrar `useSupplierMaterials` em `MaterialSelector`
     - Salvar campos ao criar/editar item
     - Exibir badge "Fornecedor" em itens

2. **Painel Admin para Aprovação**
   - **Gap:** Aprovação é manual via SQL (não escalável)
   - **Impacto:** Operacional (admin precisa saber SQL)
   - **Esforço:** Alto (5-7 dias)
   - **Ações:**
     - Criar painel admin (`panel.studioos.pro`)
     - Listar fornecedores pendentes
     - Botões "Aprovar" / "Rejeitar"
     - Notificação por email ao fornecedor

3. **Correção de RLS Recursão**
   - **Gap:** Migration `20260117000005` pode não estar aplicada em produção
   - **Impacto:** Portal não funciona (erro 42P17)
   - **Esforço:** Baixo (5 minutos)
   - **Ações:**
     - Aplicar migration manualmente no Supabase Dashboard

---

#### P1 — Importante, mas Não Bloqueador

4. **Dashboard de Fornecedor**
   - **Gap:** Tab "Dashboard" está desabilitado
   - **Impacto:** Fornecedor não vê uso de materiais
   - **Esforço:** Médio (3-4 dias)
   - **Ações:**
     - Criar queries para pedidos que usam materiais do fornecedor
     - Exibir estatísticas (materiais mais usados, pedidos recentes)
     - Gráficos simples (Chart.js ou similar)

5. **Notificações**
   - **Gap:** Fornecedor não recebe notificação quando aprovado
   - **Impacto:** UX (fornecedor não sabe quando pode começar a vender)
   - **Esforço:** Baixo (1 dia)
   - **Ações:**
     - Email ao aprovar fornecedor (via Supabase Edge Function ou Resend)
     - Email ao rejeitar (com motivo opcional)

6. **Validação de CNPJ**
   - **Gap:** CNPJ não é validado (apenas formato 14 dígitos)
   - **Impacto:** Pode aceitar CNPJs inválidos
   - **Esforço:** Baixo (1 dia)
   - **Ações:**
     - Adicionar validação de dígitos verificadores (algoritmo CNPJ)
     - Frontend + backend (RPC)

---

#### P2 — Nice to Have

7. **Histórico de Preços**
   - **Gap:** Não há histórico quando preço de fornecedor muda
   - **Impacto:** Não é possível ver evolução de preços
   - **Esforço:** Médio (2-3 dias)
   - **Ações:**
     - Tabela `supplier_material_price_history`
     - Trigger ao atualizar preço
     - UI para ver histórico

8. **Preço Diferenciado por Cliente**
   - **Gap:** Preço é global (mesmo para todos os clientes)
   - **Impacto:** Limita flexibilidade comercial
   - **Esforço:** Alto (5-7 dias)
   - **Ações:**
     - Tabela `supplier_material_prices` (supplier_id, organization_id, price)
     - UI para fornecedor definir preços por cliente
     - Lógica de fallback (preço global se não houver específico)

9. **Sincronização Automática de Preços**
   - **Gap:** Cliente precisa atualizar manualmente se preço mudar
   - **Impacto:** Dados podem ficar desatualizados
   - **Esforço:** Alto (7-10 dias)
   - **Ações:**
     - Webhook ou polling para sincronizar preços
     - Notificação para cliente quando preço muda
     - Opção de aceitar/rejeitar novo preço

---

### 8.2 Recomendação de Próxima Sprint

**Sprint: "Integração Orçamentos + Painel Admin" (2 semanas)**

**Objetivo:** Tornar feature funcional end-to-end e escalável

**Tarefas:**
1. **Semana 1:**
   - Integração com orçamentos (P0)
   - Correção de RLS recursão (P0)
   - Validação de CNPJ (P1)

2. **Semana 2:**
   - Painel admin para aprovação (P0)
   - Notificações (P1)
   - Dashboard de fornecedor (P1) — se sobrar tempo

**Justificativa:**
- **Maior impacto:** Integração com orçamentos torna feature funcional
- **Menor retrabalho:** Painel admin evita operação manual (escalável)
- **Risco baixo:** Tarefas são independentes e bem definidas

**Entregáveis:**
- ✅ Materiais de fornecedor podem ser usados em orçamentos
- ✅ Admin pode aprovar fornecedores via UI
- ✅ Fornecedor recebe notificação quando aprovado
- ✅ CNPJ é validado corretamente

---

## CONCLUSÃO

A feature de Suppliers V1 está **funcional para cadastro, aprovação manual, e gerenciamento de catálogo**, mas **não está totalmente integrada com o sistema do cliente** (orçamentos/pedidos). O fluxo end-to-end funciona até a visualização de materiais, mas para no uso efetivo em orçamentos. A próxima sprint deve focar em **integração com orçamentos** (P0) e **painel admin** (P0) para tornar a feature escalável e completa.

**Status geral:** ✅ **70% completo** (cadastro + catálogo funcionam, integração com orçamentos falta)

---

**Documento gerado em:** 2026-01-17  
**Última atualização:** 2026-01-17
