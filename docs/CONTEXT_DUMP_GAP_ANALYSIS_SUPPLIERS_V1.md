# CONTEXT DUMP + GAP ANALYSIS — SUPPLIERS V1
## Análise Completa da Feature: Supplier Catalog + Self-Service Registration + Hardening + Painel do Fornecedor

**Data:** 2026-01-21  
**Versão Analisada:** V1 (MVP)  
**Status:** Implementado e em produção (parcialmente funcional)

---

## 1) ONDE ESTAMOS AGORA

A feature **SUPPLIERS V1** foi implementada em 3 fases principais: (1) **Supplier Catalog V1** — catálogo de materiais por fornecedor com importação CSV, (2) **Self-Service Registration** — cadastro público de fornecedores com aprovação manual, e (3) **Hardening + Hotfix** — correções de segurança e RLS. O sistema permite que fornecedores se cadastrem publicamente (`/cadastro-fornecedor`), aguardem aprovação manual (via SQL com `service_role`), gerenciem seu catálogo via portal isolado (`fornecedores.studioos.pro`), e que organizações clientes visualizem materiais de fornecedores vinculados (read-only). **A integração com orçamentos/pedidos está preparada mas não totalmente funcional** — materiais de fornecedor não podem ser usados em orçamentos ainda. O fluxo end-to-end funciona até a visualização de materiais, mas para no uso efetivo em orçamentos/pedidos.

**Status geral:** ✅ **70% completo** (cadastro + catálogo funcionam, integração com orçamentos falta)

---

## 2) CHECKLIST DO QUE ESTÁ CONCLUÍDO

### ✅ BANCO DE DADOS / RLS / RPC

#### Tabelas Criadas
- ✅ **`suppliers`** — Dados do fornecedor
  - Campos: `id`, `name`, `slug`, `email`, `phone`, `cnpj`, `cnpj_normalized`, `service_states TEXT[]`, `product_categories TEXT[]`, `status` (`pending`/`approved`/`rejected`), `approved_at`, `rejected_at`, `active`, `created_at`, `updated_at`
  - Índices únicos: `cnpj_normalized` (parcial), `email` (parcial), `slug`
  - Trigger: `trigger_update_supplier_cnpj_normalized` (mantém `cnpj_normalized` atualizado)
  
- ✅ **`supplier_users`** — Vínculo fornecedor ↔ usuário Auth
  - Campos: `id`, `supplier_id`, `user_id`, `role`, `active`, `created_at`
  - ⚠️ **INCONSISTÊNCIA:** Não tem `updated_at`, mas migration `20260121000000` tenta atualizar (linha 119)
  - Constraint: `UNIQUE(supplier_id, user_id)`
  
- ✅ **`supplier_organizations`** — Vínculo fornecedor ↔ organização cliente
  - Campos: `id`, `supplier_id`, `organization_id`, `active`, `created_at`
  - Constraint: `UNIQUE(supplier_id, organization_id)`
  
- ✅ **`supplier_materials`** — Catálogo de materiais do fornecedor
  - Campos: `id`, `supplier_id`, `sku`, `name`, `description`, `unit`, `price`, `active`, `created_at`, `updated_at`
  - Constraint: `UNIQUE NULLS NOT DISTINCT (supplier_id, sku)`
  - Índices: `supplier_id + active`, `supplier_id + name`, `supplier_id + sku` (parcial)
  - Trigger: `update_supplier_materials_updated_at`
  
- ✅ **`supplier_material_imports`** — Histórico de importações CSV
  - Campos: `id`, `supplier_id`, `filename`, `status`, `total_rows`, `inserted`, `updated`, `deactivated`, `errors JSONB`, `created_at`, `updated_at`
  - Índice: `supplier_id + created_at DESC`
  - Trigger: `update_supplier_material_imports_updated_at`

#### Views Criadas
- ✅ **`supplier_pending_registrations`** — Lista fornecedores pendentes
  - Acesso: ❌ `anon` e `authenticated` → REVOKED (apenas `service_role`)
  - Campos: `id`, `name`, `slug`, `email`, `phone`, `cnpj`, `cnpj_normalized`, `service_states`, `product_categories`, `status`, `created_at`, `updated_at`, `user_id` (via subquery)

#### RPCs Criadas
- ✅ **`register_supplier(p_name, p_email, p_phone, p_cnpj, p_service_states, p_product_categories, p_user_id)`**
  - **SECURITY DEFINER:** ✅ Sim
  - **Autorização:** `anon` e `authenticated` podem executar (cadastro público)
  - **Validações:**
    - ✅ Nome obrigatório
    - ✅ Email obrigatório + formato válido
    - ✅ CNPJ: 14 dígitos (se fornecido)
    - ✅ Normaliza CNPJ (remove caracteres não numéricos)
    - ✅ Normaliza email (lowercase + trim)
    - ✅ Anti-duplicidade: CNPJ normalizado único
    - ✅ Anti-duplicidade: Email normalizado único
    - ✅ Gera slug único com sufixo incremental
  - **Status:** ✅ **SEMPRE** cria com `status='pending'` (ignora qualquer input)
  - **Ações:**
    - ✅ Cria/atualiza `supplier` (ON CONFLICT por slug)
    - ✅ Cria/atualiza `supplier_users` automaticamente
    - ✅ Tenta confirmar email automaticamente (MVP)
  - **Erros possíveis:** `name_required`, `email_required`, `email_invalid`, `cnpj_invalid`, `cnpj_already_registered`, `email_already_registered`, `slug_generation_failed`, `user_id_required`, `insert_failed`
  
- ✅ **`approve_supplier(p_supplier_id, p_user_id)`**
  - **SECURITY DEFINER:** ✅ Sim
  - **Autorização:** ❌ **APENAS `service_role`** pode executar (verifica JWT explicitamente)
  - **Validações:**
    - ✅ Verifica se JWT existe antes de ler `role`
    - ✅ Se JWT não existe ou `role != 'service_role'` → retorna `not_authorized`
    - ✅ `supplier_id` obrigatório
    - ✅ `user_id` obrigatório
    - ✅ Supplier deve existir
    - ✅ Supplier deve estar com `status='pending'`
  - **Ações:**
    - ✅ Atualiza `status='approved'`, `approved_at=now()`
    - ✅ Cria/atualiza `supplier_users` (ativa vínculo)
    - ⚠️ **INCONSISTÊNCIA:** Tenta atualizar `updated_at` em `supplier_users` (linha 119 de `20260121000000`), mas a tabela não tem essa coluna
  - **Erros possíveis:** `not_authorized`, `supplier_id_required`, `user_id_required`, `supplier_not_found`, `supplier_already_processed`
  
- ✅ **`get_organization_supplier_materials(p_organization_id)`**
  - **SECURITY DEFINER:** ✅ Sim
  - **Autorização:** Qualquer usuário autenticado
  - **Uso:** Função auxiliar (não está sendo usada no frontend ainda)
  - **Retorna:** Materiais de fornecedores vinculados e ativos

#### RLS Policies

**`suppliers`:**
- ✅ SELECT: Organizações veem apenas fornecedores vinculados (via `supplier_organizations`)
- ✅ INSERT: Apenas via RPC `register_supplier` (SECURITY DEFINER)
- ✅ UPDATE: Organizações podem atualizar apenas `service_states`
- ⚠️ **GAP:** Organizações não veem `status` (não está no SELECT), mas isso é OK para MVP

**`supplier_users`:**
- ✅ SELECT: 
  - Fornecedor vê apenas seu próprio vínculo (`user_id = auth.uid()`) — **sem recursão** (corrigido em `20260117000005`)
  - Organizações veem vínculos de fornecedores vinculados (via `supplier_organizations`) — **sem recursão**
- ✅ INSERT: Apenas via RPC `register_supplier` ou `approve_supplier` (SECURITY DEFINER)
- ✅ UPDATE: Apenas via RPC (SECURITY DEFINER)

**`supplier_materials`:**
- ✅ SELECT:
  - Fornecedor vê apenas seus próprios materiais (via `supplier_users`)
  - **Organizações veem apenas materiais de fornecedores `approved` e vinculados** (corrigido em `20260121000000` — filtra por `suppliers.status = 'approved'`)
- ✅ INSERT/UPDATE/DELETE: Apenas fornecedor (via `supplier_users`)
- ✅ Read-only para organizações (apenas SELECT)

**`supplier_material_imports`:**
- ✅ SELECT/INSERT/UPDATE: Apenas fornecedor (via `supplier_users`)
- ✅ Organizações não têm acesso (não há política para elas)

**`supplier_organizations`:**
- ✅ SELECT: Organizações veem apenas seus próprios vínculos (via `organization_members`)
- ✅ INSERT/UPDATE: Organizações podem gerenciar seus próprios vínculos

#### Hardening Implementado
- ✅ `approve_supplier` só roda com `service_role` (verificação explícita de JWT)
- ✅ View `supplier_pending_registrations` não é pública (REVOKED para `anon`/`authenticated`)
- ✅ CNPJ e email normalizados e com índices únicos (anti-duplicidade)
- ✅ RLS garante isolamento entre fornecedores
- ✅ RLS garante read-only de materiais para organizações
- ✅ RLS garante que organizações só veem materiais de fornecedores `approved`

---

### ✅ SUPPLIER PORTAL (Frontend)

#### Rotas e Roteamento
- ✅ **Rota pública:** `/cadastro-fornecedor` → `CadastroFornecedor.tsx`
- ✅ **Portal:** `fornecedores.studioos.pro` ou `/fornecedores` (preview) → `SupplierPortal.tsx`
- ✅ **Roteamento:** `App.tsx` detecta `isSupplier` via `useDomainRouting` ou `pathname === '/fornecedores'`
- ✅ **Proteção:** `ProtectedRoute` bloqueia fornecedores de acessar sistema normal (redireciona para portal)

#### Componentes Criados
- ✅ **`src/pages/CadastroFornecedor.tsx`**
  - Formulário público de cadastro
  - Validação: nome, email, CNPJ, senha, categorias, regiões
  - Seleção de categorias (múltipla + "Outros" com campo texto)
  - Seleção de regiões (UFs) — por região ou individual
  - Criação de usuário no Supabase Auth
  - Chamada RPC `register_supplier`
  - Redirecionamento automático para portal após cadastro
  - ✅ Mensagens de erro genéricas (anti-enumeração)
  
- ✅ **`src/pages/SupplierPortal.tsx`**
  - Tela de login (se não autenticado)
  - Verificação de vínculo `supplier_users`
  - Banner de "aguardando aprovação" (se `status='pending'`)
  - Tabs: "Dashboard" e "Catálogo"
  - Logout
  - Estados: loading, não autenticado, sem vínculo, rejeitado, pendente/aprovado
  
- ✅ **`src/components/supplier/SupplierCatalog.tsx`**
  - Lista de materiais do fornecedor (tabela)
  - Busca por nome ou SKU
  - Filtro por categoria (usando `unit` como proxy)
  - Ordenação: nome, preço, última atualização
  - Editar material (dialog)
  - Importar CSV (dialog com preview e validação)
  - Ativar/desativar material
  - ✅ Normalização de preço no CSV (remove espaços, trata vírgula)
  - ✅ Normalização de SKU vazio (`''` → `NULL`)
  - ✅ Garantia de `errors` sempre array válido
  
- ✅ **`src/pages/supplier/Dashboard.tsx`**
  - Cards métricos: Total, Ativos, Inativos
  - Gráfico simplificado: Materiais por categoria (lista, sem recharts)
  - Cards de valor percebido: "Catálogo Pronto" (se aprovado), "Complete seu Catálogo" (se poucos materiais)
  - Empty state explicativo
  
- ✅ **`src/components/supplier/SupplierStatusBadge.tsx`**
  - Badge visual de status (pending/approved/rejected)
  - Tooltip explicativo
  - Cores consistentes
  
- ✅ **`src/components/supplier/ImportHistory.tsx`**
  - Lista simples de importações
  - Data, arquivo, status, métricas (inseridos, atualizados, erros)
  - Ordenação por data desc

#### Hooks Criados
- ✅ **`src/hooks/useSupplierMaterials.ts`**
  - `useSupplierMaterials(supplierId)` — Busca materiais do fornecedor
  - `useSupplierMaterialsStats(supplierId)` — Estatísticas agregadas
  - `useInvalidateSupplierMaterials()` — Invalidação de cache

---

### ✅ ORGANIZAÇÃO CLIENTE (Frontend)

#### Componentes Criados/Modificados
- ✅ **`src/pages/GerenciarFornecedores.tsx`**
  - Cadastrar novo fornecedor (formulário)
  - Vincular fornecedor existente (busca + dialog)
  - Listar fornecedores vinculados
  - Editar regiões atendidas (`service_states`)
  - Desvincular fornecedor (soft delete)
  - Filtrar por UF
  - ⚠️ **GAP:** Não retorna `status` do fornecedor (mas isso é OK para MVP — não precisa exibir)
  
- ✅ **`src/components/orcamento/gestao/ListaMateriaisFornecedores.tsx`**
  - Lista materiais de fornecedores vinculados (read-only)
  - Busca por nome, SKU ou fornecedor
  - Filtro por fornecedor
  - Badge com nome do fornecedor
  - ✅ **CORRIGIDO:** Filtra por `suppliers.status = 'approved'` (linha 64 e 102)
  - ✅ Mensagem de fallback quando há vínculos mas 0 materiais

---

### ✅ DOCUMENTAÇÃO

#### Documentos Criados
- ✅ **`docs/SUPPLIER_CATALOG_V1.md`** — Especificação completa do catálogo
- ✅ **`docs/SUPPLIER_SELF_SERVICE_REGISTRATION.md`** — Fluxo de cadastro e aprovação
- ✅ **`docs/APROVAR_FORNECEDOR_MANUAL.md`** — Guia de aprovação manual (MVP)
- ✅ **`docs/QA_SUPPLIERS_V1_HOTFIX.md`** — Checklist de testes manuais (8 testes)
- ✅ **`docs/AUDIT_SUPPLIERS_V1_HOTFIX.md`** — Audit completo de queries, RLS, RPCs
- ✅ **`docs/RESUMO_HOTFIX_SUPPLIERS_V1.md`** — Resumo executivo das correções
- ✅ **`docs/RELATORIO_SUPPLIERS_V1.md`** — Relatório completo da feature
- ✅ **`docs/GUIA_TESTE_SUPPLIER_CATALOG.md`** — Guia de testes end-to-end

---

## 3) LISTA DE PENDÊNCIAS / GAPS

### 🔴 P0 — BLOQUEADORES DO MVP

#### 1. **Integração com Orçamentos/Pedidos — NÃO IMPLEMENTADA**

**O que falta:**
- ❌ `MaterialSelector` não busca materiais de fornecedor
- ❌ Tabelas `cortina_items` (e equivalentes) não têm campos para `supplier_material_id`, `supplier_id`, `price_snapshot`
- ❌ Seleção de material de fornecedor em orçamento não salva campos de supplier
- ❌ Não há snapshot de preço de fornecedor em itens de orçamento/pedido
- ❌ UI não exibe badge "Fornecedor" em itens que usam material de fornecedor

**Onde mexer:**
- **Migrations:**
  - Criar migration para adicionar campos em `cortina_items`: `supplier_material_id UUID`, `supplier_id UUID`, `price_snapshot NUMERIC(12,2)`
  - Criar migration para adicionar campos em `itens_pedido` (se aplicável): `supplier_material_id UUID`, `supplier_id UUID`, `price_snapshot NUMERIC(12,2)`
- **Frontend:**
  - `src/components/orcamento/wizard/MaterialSelector.tsx` — Integrar `useSupplierMaterials` para buscar materiais de fornecedor
  - `src/components/orcamento/wizard/EtapaProdutos.tsx` — Salvar campos de supplier ao criar/editar item
  - `src/types/orcamento.ts` — Adicionar campos `supplier_material_id`, `supplier_id`, `price_snapshot` em `Cortina`
  - Componentes de visualização de orçamento — Exibir badge "Fornecedor" em itens

**Risco/Impacto:** Feature não é funcional end-to-end. Fornecedores podem gerenciar catálogo, mas clientes não podem usar em orçamentos.

**Esforço estimado:** 2-3 dias

---

#### 2. **Inconsistência: `supplier_users.updated_at` não existe**

**Problema:**
- Migration `20260121000000_suppliers_hotfix_rls.sql` (linha 119) tenta atualizar `updated_at` em `supplier_users`
- Mas a tabela `supplier_users` **não tem** coluna `updated_at` (criada em `20260116000002_domains_subdomains.sql` linha 79 — apenas `created_at`)

**Onde mexer:**
- **Migration:**
  - Opção A: Adicionar `updated_at` em `supplier_users` (migration incremental)
  - Opção B: Remover referência a `updated_at` em `approve_supplier` (já foi feito em `20260117000003`, mas `20260121000000` reintroduziu o erro)

**Risco/Impacto:** Migration `20260121000000` pode falhar ao executar `approve_supplier` se tentar atualizar `updated_at`.

**Esforço estimado:** 15 minutos

**Arquivo:** `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` (linha 119)

---

#### 3. **Painel Admin para Aprovação — NÃO IMPLEMENTADO**

**O que falta:**
- ❌ Painel admin (`panel.studioos.pro`) não existe
- ❌ Aprovação é manual via SQL (não escalável)
- ❌ Não há notificação automática para admin quando novo fornecedor se cadastra
- ❌ Não há notificação para fornecedor quando aprovado/rejeitado

**Onde mexer:**
- **Frontend:**
  - Criar `src/pages/admin/SupplierApproval.tsx` (ou similar)
  - Listar fornecedores pendentes (via RPC ou view com `service_role`)
  - Botões "Aprovar" / "Rejeitar"
- **Backend:**
  - Edge Function ou RPC para notificar fornecedor por email (opcional)
  - Dashboard de métricas (quantos pendentes, aprovados, etc.)

**Risco/Impacto:** Operacional (admin precisa saber SQL). Não escalável para múltiplos fornecedores.

**Esforço estimado:** 5-7 dias (painel completo)

---

### 🟡 P1 — IMPORTANTE, MAS NÃO BLOQUEADOR

#### 4. **Dashboard de Fornecedor — Parcialmente Implementado**

**O que está:**
- ✅ Cards métricos (Total, Ativos, Inativos)
- ✅ Gráfico simplificado (lista, sem recharts)
- ✅ Cards de valor percebido

**O que falta:**
- ❌ Estatísticas de uso de materiais (pedidos que usam materiais do fornecedor)
- ❌ Gráficos mais elaborados (recharts foi removido temporariamente)
- ❌ Histórico de pedidos recentes

**Onde mexer:**
- `src/pages/supplier/Dashboard.tsx` — Adicionar queries para pedidos que usam materiais do fornecedor
- Reintegrar recharts ou usar alternativa (Chart.js, Victory, etc.)

**Risco/Impacto:** Fornecedor não vê uso de materiais. Impacta percepção de valor.

**Esforço estimado:** 3-4 dias

---

#### 5. **Notificações — NÃO IMPLEMENTADO**

**O que falta:**
- ❌ Email ao aprovar fornecedor
- ❌ Email ao rejeitar fornecedor (com motivo opcional)
- ❌ Notificação para admin quando novo fornecedor se cadastra

**Onde mexer:**
- **Backend:**
  - Edge Function ou RPC para enviar emails (Resend, SendGrid, etc.)
  - Trigger ou webhook para detectar novo cadastro
- **Frontend:**
  - Opcional: Sistema de notificações in-app

**Risco/Impacto:** UX (fornecedor não sabe quando pode começar a vender). Operacional (admin não sabe quando há novos cadastros).

**Esforço estimado:** 1-2 dias

---

#### 6. **Validação de CNPJ — Parcialmente Implementada**

**O que está:**
- ✅ Validação de formato (14 dígitos)

**O que falta:**
- ❌ Validação de dígitos verificadores (algoritmo CNPJ)

**Onde mexer:**
- `src/pages/CadastroFornecedor.tsx` — Adicionar validação de dígitos verificadores (frontend)
- `supabase/migrations/...register_supplier` — Adicionar validação no RPC (backend)

**Risco/Impacto:** Pode aceitar CNPJs inválidos.

**Esforço estimado:** 1 dia

---

### 🟢 P2 — NICE TO HAVE

#### 7. **Histórico de Preços — NÃO IMPLEMENTADO**

**O que falta:**
- ❌ Tabela `supplier_material_price_history`
- ❌ Trigger ao atualizar preço
- ❌ UI para ver histórico

**Esforço estimado:** 2-3 dias

---

#### 8. **Preço Diferenciado por Cliente — NÃO IMPLEMENTADO**

**O que falta:**
- ❌ Tabela `supplier_material_prices` (supplier_id, organization_id, price)
- ❌ UI para fornecedor definir preços por cliente
- ❌ Lógica de fallback (preço global se não houver específico)

**Esforço estimado:** 5-7 dias

---

#### 9. **Sincronização Automática de Preços — NÃO IMPLEMENTADO**

**O que falta:**
- ❌ Webhook ou polling para sincronizar preços
- ❌ Notificação para cliente quando preço muda
- ❌ Opção de aceitar/rejeitar novo preço

**Esforço estimado:** 7-10 dias

---

## 4) INCONSISTÊNCIAS ENCONTRADAS (DOCS X IMPLEMENTAÇÃO)

### ❌ Inconsistência 1: `supplier_users.updated_at` não existe

**Documentação:**
- `docs/SUPPLIER_SELF_SERVICE_REGISTRATION.md` (linha 222) menciona `updated_at` em `supplier_users`
- `docs/RELATORIO_SUPPLIERS_V1.md` (linha 409) menciona `updated_at` em `supplier_users`

**Implementação:**
- `supabase/migrations/20260116000002_domains_subdomains.sql` (linha 79) — `supplier_users` **não tem** `updated_at` (apenas `created_at`)
- `supabase/migrations/20260117000003_fix_supplier_users_updated_at.sql` — Corrige `approve_supplier` para não referenciar `updated_at`
- `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` (linha 119) — **Reintroduz** referência a `updated_at` em `approve_supplier`

**Correção necessária:**
- Opção A: Adicionar `updated_at` em `supplier_users` (migration incremental)
- Opção B: Remover referência a `updated_at` em `20260121000000` (linha 119)

**Arquivos:**
- `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` (linha 119)
- `docs/SUPPLIER_SELF_SERVICE_REGISTRATION.md` (linha 222)
- `docs/RELATORIO_SUPPLIERS_V1.md` (linha 409)

---

### ⚠️ Inconsistência 2: Integração com Orçamentos — Docs dizem "Parcialmente Implementado"

**Documentação:**
- `docs/SUPPLIER_CATALOG_V1.md` (linha 104) — Status: "⚠️ PARCIALMENTE IMPLEMENTADO"
- Lista o que está e o que falta (linhas 106-118)

**Implementação:**
- ❌ **Nada foi implementado** — `MaterialSelector` não usa `useSupplierMaterials`
- ❌ Tabelas não têm campos de supplier
- ✅ Hook `useSupplierMaterials` existe e está preparado, mas não está sendo usado

**Correção necessária:**
- Atualizar docs para refletir que integração **não está implementada** (não "parcialmente")
- Ou implementar a integração conforme docs

**Arquivos:**
- `docs/SUPPLIER_CATALOG_V1.md` (linha 104)

---

### ✅ Inconsistência 3: RLS `supplier_materials` — Docs vs Implementação (CORRIGIDO)

**Documentação:**
- `docs/AUDIT_SUPPLIERS_V1_HOTFIX.md` (linha 33) — Identifica gap: RLS não filtra por `suppliers.status = 'approved'`

**Implementação:**
- ✅ **CORRIGIDO** em `supabase/migrations/20260121000000_suppliers_hotfix_rls.sql` (linha 31)
- ✅ RLS agora filtra por `suppliers.status = 'approved'`

**Status:** ✅ Resolvido

---

### ✅ Inconsistência 4: Queries Frontend — Docs vs Implementação (CORRIGIDO)

**Documentação:**
- `docs/AUDIT_SUPPLIERS_V1_HOTFIX.md` (linha 143) — Identifica gap: Queries não filtram por `suppliers.status = 'approved'`

**Implementação:**
- ✅ **CORRIGIDO** em `src/components/orcamento/gestao/ListaMateriaisFornecedores.tsx` (linhas 64 e 102)
- ✅ Queries agora filtram por `suppliers.status = 'approved'`

**Status:** ✅ Resolvido

---

## 5) RISCOS DE SEGURANÇA E RECOMENDAÇÕES

### ✅ Riscos Mitigados

1. **✅ `approve_supplier` só roda com `service_role`**
   - Verificação explícita de JWT (linha 73 de `20260121000000`)
   - Se JWT não existe ou `role != 'service_role'` → retorna `not_authorized`
   - `REVOKE EXECUTE` de `anon` e `authenticated`

2. **✅ View `supplier_pending_registrations` não é pública**
   - `REVOKE SELECT` de `anon` e `authenticated` (linha 312 de `20260121000000`)
   - Apenas `service_role` pode acessar

3. **✅ RLS garante isolamento entre fornecedores**
   - Fornecedor só vê seus próprios materiais (via `supplier_users`)
   - Organizações só veem materiais de fornecedores vinculados e `approved`

4. **✅ CNPJ e email normalizados e com índices únicos**
   - Anti-duplicidade implementada
   - Normalização garante consistência

5. **✅ Mensagens de erro genéricas (anti-enumeração)**
   - `src/lib/errorMessages.ts` (linhas 95-105) — Mensagens genéricas para `cnpj_already_registered` e `email_already_registered`
   - Logs internos mantêm códigos específicos para debugging

---

### ⚠️ Riscos Identificados (Não Críticos)

1. **⚠️ Falta de rate limiting em `register_supplier`**
   - **Risco:** Pode ser chamada múltiplas vezes (spam/DoS)
   - **Mitigação atual:** Duplicidades são bloqueadas (CNPJ, email)
   - **Recomendação:** Adicionar rate limiting no futuro (Edge middleware ou Supabase Edge Function)

2. **⚠️ Email confirmation bypass**
   - **Risco:** `register_supplier` tenta confirmar email automaticamente (linha 284-295 de `20260121000000`)
   - **Mitigação atual:** Email confirmation desabilitado no Supabase Dashboard (MVP)
   - **Recomendação:** Revisar quando email confirmation for habilitado

3. **⚠️ Acesso de fornecedor pendente**
   - **Risco:** Fornecedor com `status='pending'` pode acessar portal e gerenciar catálogo
   - **Mitigação atual:** Materiais só ficam visíveis para clientes se `status='approved'` (via RLS)
   - **Recomendação:** Manter como está (permite onboarding antes de aprovação) — **não é risco de segurança**

4. **⚠️ Enumeração de emails/CNPJs (parcialmente mitigado)**
   - **Risco:** Mensagens de erro podem expor se email/CNPJ já existe
   - **Mitigação atual:** Mensagens genéricas na UI (`src/lib/errorMessages.ts`)
   - **Recomendação:** Manter como está (trade-off UX vs segurança)

---

### 🔒 Recomendações de Hardening (Futuro)

1. **Rate limiting:**
   - Implementar rate limiting em `register_supplier` (Edge middleware ou Supabase Edge Function)
   - Limite sugerido: 5 cadastros por IP por hora

2. **Validação de CNPJ:**
   - Adicionar validação de dígitos verificadores (algoritmo CNPJ)
   - Frontend + backend (RPC)

3. **Auditoria:**
   - Tabela `supplier_registrations` para histórico completo de cadastros
   - Logs de aprovação/rejeição

4. **Notificações seguras:**
   - Emails de notificação via Edge Function (não expor service key no frontend)
   - Templates de email profissional

---

## 6) PRÓXIMOS PASSOS RECOMENDADOS (ORDEM DE EXECUÇÃO)

### Sprint 1: Correções Críticas (1-2 dias)

**Objetivo:** Corrigir inconsistências e tornar feature funcional end-to-end

1. **Corrigir `supplier_users.updated_at` (P0)**
   - Criar migration incremental: `20260122000000_fix_supplier_users_updated_at_final.sql`
   - Opção A: Adicionar `updated_at` em `supplier_users` + trigger
   - Opção B: Remover referência a `updated_at` em `approve_supplier` (linha 119 de `20260121000000`)
   - **Recomendação:** Opção A (adicionar coluna) — mais consistente com outras tabelas

2. **Integração com Orçamentos (P0)**
   - Migration: Adicionar campos `supplier_material_id`, `supplier_id`, `price_snapshot` em `cortina_items`
   - Frontend: Integrar `useSupplierMaterials` em `MaterialSelector`
   - Frontend: Salvar campos de supplier ao criar/editar item
   - Frontend: Exibir badge "Fornecedor" em itens

3. **Atualizar documentação**
   - Corrigir referências a `supplier_users.updated_at`
   - Atualizar status de integração com orçamentos

---

### Sprint 2: Painel Admin (5-7 dias)

**Objetivo:** Tornar aprovação escalável

1. **Criar painel admin básico**
   - Rota: `panel.studioos.pro` ou `/admin` (preview)
   - Tela: Lista de fornecedores pendentes
   - Botões: "Aprovar" / "Rejeitar"
   - Integração: Chamar `approve_supplier` via Edge Function (service role)

2. **Notificações (P1)**
   - Edge Function para enviar email ao aprovar/rejeitar
   - Template de email profissional

---

### Sprint 3: Melhorias de UX (3-4 dias)

**Objetivo:** Melhorar percepção de valor

1. **Dashboard de fornecedor (P1)**
   - Estatísticas de uso de materiais
   - Histórico de pedidos recentes
   - Reintegrar recharts ou alternativa

2. **Validação de CNPJ (P1)**
   - Algoritmo de dígitos verificadores
   - Frontend + backend

---

## 7) RESUMO EXECUTIVO

### ✅ O Que Está Funcionando

- ✅ Cadastro público de fornecedores (`/cadastro-fornecedor`)
- ✅ Aprovação manual via SQL (RPC `approve_supplier` com `service_role`)
- ✅ Portal do fornecedor (`fornecedores.studioos.pro`)
- ✅ Gerenciamento de catálogo (CRUD completo)
- ✅ Importação CSV com preview e validação
- ✅ Visualização read-only de materiais para organizações
- ✅ RLS garante segurança e isolamento
- ✅ Hardening implementado (anti-duplicidade, verificação de JWT, etc.)

### ❌ O Que Não Está Funcionando

- ❌ Materiais de fornecedor não podem ser usados em orçamentos/pedidos
- ❌ Painel admin para aprovação (apenas SQL manual)
- ❌ Notificações (email ao aprovar/rejeitar)
- ❌ Dashboard de fornecedor com estatísticas de uso

### 🔴 Bloqueadores Críticos

1. **Integração com orçamentos** — Feature não é funcional end-to-end
2. **Inconsistência `supplier_users.updated_at`** — Migration pode falhar

### 📊 Status Geral

**Completude:** ✅ **70%** (cadastro + catálogo funcionam, integração com orçamentos falta)

**Próximo PR/Sprint Recomendado:** **Sprint 1 — Correções Críticas** (1-2 dias)
- Corrigir `supplier_users.updated_at`
- Implementar integração com orçamentos
- Atualizar documentação

---

**Documento gerado em:** 2026-01-21  
**Última atualização:** 2026-01-21
