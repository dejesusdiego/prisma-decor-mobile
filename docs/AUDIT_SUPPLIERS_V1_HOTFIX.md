# AUDIT COMPLETO — SUPPLIERS V1 HOTFIX
## Análise de Queries, RLS, RPCs e Frontend

**Data:** 2026-01-21  
**Objetivo:** Identificar todos os pontos que precisam de correção/hardening

---

## 1) AUDIT DE RLS (Row Level Security)

### 1.1 `supplier_materials` — Policy para Organizações

**Arquivo:** `supabase/migrations/20260117000000_supplier_catalog_v1.sql` (linhas 129-142)

**Problema identificado:**
```sql
CREATE POLICY "Organizations can view linked supplier materials"
  ON public.supplier_materials
  FOR SELECT
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND so.active = true
    )
    AND active = true
  );
```

**Gap:** ❌ **NÃO verifica `suppliers.status = 'approved'`**

**Risco:** Organização pode ver materiais de fornecedor `pending` ou `rejected`

**Correção necessária:** Adicionar join com `suppliers` e filtrar `status = 'approved'`

---

### 1.2 `suppliers` — Policy para Organizações

**Arquivo:** `supabase/migrations/20260116000002_domains_subdomains.sql` (linhas 119-134)

**Problema identificado:**
- Policy "Organizations can view linked suppliers" não filtra por `status`
- Organização pode ver `suppliers.status` mesmo que não deva

**Gap:** ❌ **Status pode ser exposto para organização**

**Risco:** Organização vê status de aprovação (não deveria)

**Correção necessária:** Não expor `status` no SELECT OU filtrar apenas `approved` (mas não expor o campo)

---

### 1.3 `supplier_pending_registrations` — Acesso Público

**Arquivo:** `supabase/migrations/20260117000001_supplier_self_service_registration.sql` (linhas 223-240)

**Status atual:**
- View criada
- `REVOKE SELECT` aplicado para `anon` e `authenticated` (linha 240)

**Verificação:** ✅ **Já está correto** (não há acesso público)

**Observação:** Se houver consumo via frontend, substituir por RPC que exige `service_role`

---

## 2) AUDIT DE RPCs

### 2.1 `register_supplier`

**Arquivo:** `supabase/migrations/20260117000001_supplier_self_service_registration.sql` (linhas 54-162)

**Problemas identificados:**

1. **Status não é forçado:**
   - Linha 114: `status = 'pending'` (correto no INSERT)
   - Linha 123-126: `ON CONFLICT` pode manter `status='approved'` se já existir
   - **Gap:** Se supplier já existe com `status='approved'`, não reverte para `pending`

2. **Normalização:**
   - Linha 109: `trim(lower(p_email))` ✅ Correto
   - Linha 111: `trim(p_cnpj)` ⚠️ Não normaliza (remove caracteres não numéricos)
   - **Gap:** CNPJ não é normalizado antes de verificar duplicidade

3. **Anti-duplicidade:**
   - Linhas 159-160: Verifica duplicidade de CNPJ e email
   - **Gap:** Erros não são específicos (usa mensagens genéricas)

4. **Permissões:**
   - Linha 169: `GRANT EXECUTE ... TO anon, authenticated` ✅ Correto (cadastro público)

**Correções necessárias:**
- Forçar `status='pending'` sempre (mesmo em ON CONFLICT)
- Normalizar CNPJ antes de verificar duplicidade
- Melhorar mensagens de erro (mas manter genéricas na UI)

---

### 2.2 `approve_supplier`

**Arquivo:** `supabase/migrations/20260117000002_supplier_hardening.sql` (linhas 17-108)

**Problemas identificados:**

1. **Verificação de JWT:**
   - Linhas 33-38: Tenta ler `request.jwt.claims` com `EXCEPTION`
   - Linha 45: Se `NULL`, assume `'authenticated'` (nega)
   - **Gap:** Se `request.jwt.claims` não existir (erro de configuração), pode permitir acesso indevido

2. **Permissões:**
   - Linha 111: `REVOKE EXECUTE ... FROM anon, authenticated` ✅ Correto
   - **Gap:** Não há verificação explícita se JWT existe antes de ler

**Correções necessárias:**
- Verificar se `request.jwt.claims` existe antes de ler
- Se não existir, negar acesso imediatamente
- Adicionar comentário explicando que apenas `service_role` pode executar

---

## 3) AUDIT DE QUERIES NO FRONTEND

### 3.1 `ListaMateriaisFornecedores.tsx`

**Arquivo:** `src/components/orcamento/gestao/ListaMateriaisFornecedores.tsx`

**Queries identificadas:**

1. **fetchSuppliers (linhas 44-69):**
   ```typescript
   .from('supplier_organizations')
   .select(`
     supplier_id,
     suppliers (id, name)
   `)
   .eq('organization_id', organizationId)
   .eq('active', true);
   ```
   **Gap:** ❌ **NÃO filtra por `suppliers.status = 'approved'`**
   **Risco:** Lista fornecedores `pending` ou `rejected`

2. **fetchMaterials (linhas 71-122):**
   ```typescript
   .from('supplier_materials')
   .select(`...`)
   .eq('active', true)
   .in('supplier_id', supplierIds)
   ```
   **Gap:** ❌ **NÃO filtra por `suppliers.status = 'approved'`**
   **Risco:** Mostra materiais de fornecedor `pending`

**Correções necessárias:**
- Adicionar filtro `suppliers.status = 'approved'` nas queries
- Adicionar mensagem de fallback se houver vínculos mas 0 materiais (fornecedor pendente)

---

### 3.2 `GerenciarFornecedores.tsx`

**Arquivo:** `src/pages/GerenciarFornecedores.tsx`

**Queries identificadas:**

1. **fetchSuppliers (linhas 78-132):**
   ```typescript
   .from('supplier_organizations')
   .select(`suppliers (id, name, slug, email, phone, cnpj, active, service_states, created_at)`)
   ```
   **Gap:** ❌ **NÃO retorna `status`**
   **Risco:** Admin não vê status (mas isso é OK para MVP, não precisa exibir)

2. **handleSearchSuppliers (linhas 233-257):**
   ```typescript
   .from('suppliers')
   .select('id, name, slug, email, phone, cnpj, active, service_states, created_at')
   ```
   **Gap:** ❌ **NÃO retorna `status`**
   **Observação:** OK para MVP (não precisa exibir status para organização)

**Correções necessárias:**
- Nenhuma (status não precisa ser exposto para organização)

---

### 3.3 `SupplierCatalog.tsx` — Import CSV

**Arquivo:** `src/components/supplier/SupplierCatalog.tsx`

**Problemas identificados:**

1. **Normalização de preço (linha 289):**
   ```typescript
   dados.price = parseFloat(value.replace(',', '.'));
   ```
   **Gap:** ⚠️ **Não valida NaN, não remove espaços, não valida negativo antes de parseFloat**

2. **Validação de preço (linha 302):**
   ```typescript
   if (!dados.name || isNaN(dados.price) || dados.price < 0) {
   ```
   **Gap:** ⚠️ **Valida após parseFloat, mas não normaliza espaços antes**

3. **Upsert por SKU (linha 308):**
   ```typescript
   const matchKey = dados.sku ? { supplier_id: supplierId, sku: dados.sku } : { supplier_id: supplierId, name: dados.name };
   ```
   **Gap:** ⚠️ **Se `sku` for string vazia `''`, trata como truthy e tenta match por SKU**
   **Risco:** Pode criar duplicados se SKU vazio

4. **JSON errors (linha 361):**
   ```typescript
   errors: errors,
   ```
   **Gap:** ⚠️ **Se `errors` não for array válido, pode quebrar JSON**

**Correções necessárias:**
- Normalizar preço: remover espaços, validar formato, tratar vírgula
- Validar SKU vazio: tratar `''` como `null`
- Garantir `errors` sempre seja array válido

---

### 3.4 `CadastroFornecedor.tsx`

**Arquivo:** `src/pages/CadastroFornecedor.tsx`

**Problemas identificados:**

1. **Mensagens de erro (linhas 161-169):**
   ```typescript
   const { message, action } = getErrorMessage(supplierError);
   ```
   **Gap:** ⚠️ **Mensagens podem expor "email já cadastrado" ou "CNPJ já cadastrado"**
   **Risco:** Enumeração de emails/CNPJs

2. **Redirect pós-cadastro (linhas 176-191):**
   ```typescript
   if (hostname.includes('vercel.app')) {
     window.location.href = window.location.origin + '/fornecedores';
   }
   ```
   **Gap:** ✅ **Correto** (redireciona para portal, não para `/gerarorcamento`)

**Correções necessárias:**
- Tornar mensagens de erro genéricas na UI (manter códigos internos para log)

---

## 4) AUDIT DE CONSTRAINTS E ÍNDICES

### 4.1 `supplier_materials` — UNIQUE NULLS NOT DISTINCT

**Arquivo:** `supabase/migrations/20260117000000_supplier_catalog_v1.sql` (linha 31-32)

**Constraint:**
```sql
CONSTRAINT supplier_materials_supplier_sku_unique 
  UNIQUE NULLS NOT DISTINCT (supplier_id, sku)
```

**Comportamento:**
- `NULL` valores são tratados como iguais (não podem ter múltiplos `NULL`)
- Se `sku = NULL`, apenas 1 registro por `supplier_id` pode ter `sku = NULL`

**Gap:** ⚠️ **Upsert no código pode tentar criar duplicado se `sku = ''` (string vazia)**

**Correção necessária:**
- Normalizar `sku = ''` para `sku = NULL` antes de upsert

---

## 5) RESUMO DE GAPS CRÍTICOS

### P0 — Bloqueadores de Segurança

1. ❌ **RLS `supplier_materials` não filtra por `suppliers.status = 'approved'`**
   - Organização pode ver materiais de fornecedor `pending`
   - **Arquivo:** `20260117000000_supplier_catalog_v1.sql` (linha 129)

2. ❌ **Queries frontend não filtram por `suppliers.status = 'approved'`**
   - `ListaMateriaisFornecedores.tsx` lista fornecedores `pending`
   - **Arquivo:** `src/components/orcamento/gestao/ListaMateriaisFornecedores.tsx`

3. ⚠️ **`approve_supplier` pode falhar se JWT não existir**
   - Verificação de `request.jwt.claims` pode falhar silenciosamente
   - **Arquivo:** `20260117000002_supplier_hardening.sql` (linha 33)

### P1 — Importante (Não Bloqueador)

4. ⚠️ **Import CSV não normaliza preço corretamente**
   - Não remove espaços, não valida formato antes de parseFloat
   - **Arquivo:** `src/components/supplier/SupplierCatalog.tsx` (linha 289)

5. ⚠️ **SKU vazio pode causar duplicados**
   - `sku = ''` é tratado como truthy no upsert
   - **Arquivo:** `src/components/supplier/SupplierCatalog.tsx` (linha 308)

6. ⚠️ **Mensagens de erro expõem enumeração**
   - "Email já cadastrado" permite enumerar emails
   - **Arquivo:** `src/pages/CadastroFornecedor.tsx` (linha 161)

---

## 6) PLANO DE CORREÇÃO

### Migration SQL (1 arquivo)
- Corrigir RLS `supplier_materials` (adicionar filtro `suppliers.status = 'approved'`)
- Hardening `approve_supplier` (verificação explícita de JWT)
- Garantir `register_supplier` força `status='pending'` sempre

### Frontend (3 arquivos)
- `ListaMateriaisFornecedores.tsx`: Adicionar filtro `suppliers.status = 'approved'` + fallback message
- `SupplierCatalog.tsx`: Normalizar preço, SKU vazio, JSON errors
- `CadastroFornecedor.tsx`: Mensagens de erro genéricas

### Docs (1 arquivo)
- `QA_SUPPLIERS_V1_HOTFIX.md`: Checklist de testes manuais

---

**Próximo passo:** Implementar correções
