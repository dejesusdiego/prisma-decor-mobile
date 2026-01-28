# 📋 Supplier Self-Service Registration + Manual Approval

## 📖 Visão Geral

Sistema de cadastro público de fornecedores com aprovação manual. Fornecedores podem se cadastrar via rota pública (`/cadastro-fornecedor`), mas precisam de aprovação manual (via Supabase Dashboard ou service_role) para ter acesso completo ao portal.

---

## 🔄 Fluxo de Trabalho

### 1. Cadastro Público (Self-Service)

**Rota:** `/cadastro-fornecedor` (pública)

**Processo:**
1. Fornecedor preenche formulário:
   - Nome da empresa (obrigatório)
   - CNPJ (obrigatório)
   - Email (obrigatório)
   - Telefone (opcional)
   - UFs atendidas (multiselect)
   - Categorias de produtos (multiselect + "Outros")
2. Sistema cria usuário no Supabase Auth
3. Sistema chama RPC `register_supplier()` que:
   - Valida e normaliza dados
   - Verifica duplicidade (CNPJ e email)
   - Cria `supplier` com `status='pending'`
   - Cria vínculo `supplier_users` automaticamente
   - Tenta confirmar email automaticamente
4. Fornecedor é redirecionado para o portal (acesso limitado)

**Status após cadastro:** `pending`

---

### 2. Acesso Limitado (Pending)

Fornecedores com `status='pending'` podem:
- ✅ Acessar o portal
- ✅ Gerenciar catálogo de materiais
- ❌ Materiais não aparecem para clientes até aprovação

**UI:**
- Banner amarelo: "Cadastro aguardando aprovação"
- Badge "Pendente" ao lado do nome da empresa

---

### 3. Aprovação Manual (MVP)

**Método atual:** Via Supabase Dashboard (SQL/Table Editor)

**Passo a passo:**
1. Acesse `supplier_pending_registrations` view (apenas service_role)
2. Encontre o fornecedor pendente
3. Execute SQL:

```sql
-- Aprovar fornecedor
SELECT public.approve_supplier(
  'supplier_id_aqui'::UUID,
  'user_id_aqui'::UUID
);
```

**Ou via Table Editor:**
1. Abra tabela `suppliers`
2. Encontre o fornecedor pendente
3. Atualize `status` para `'approved'`
4. Atualize `approved_at` para `now()`
5. Verifique se existe `supplier_users` vinculado (criar se não existir)

**Status após aprovação:** `approved`

---

### 4. Acesso Completo (Approved)

Fornecedores com `status='approved'` têm:
- ✅ Acesso completo ao portal
- ✅ Catálogo visível para clientes vinculados
- ✅ Todas as funcionalidades disponíveis

---

## 🛡️ Hardening

### 1. Travar `approve_supplier` (Service Role Only)

A função `approve_supplier()` **só pode ser executada por `service_role`** (service key do Supabase).

**Regras:**
- Verifica `request.jwt.claims->>'role'` = `'service_role'`
- Retorna erro `'not_authorized'` se não for service_role
- Permissões públicas (`anon`, `authenticated`) foram revogadas

**Uso:**
```sql
-- Apenas via service key (Supabase Dashboard ou Edge Function)
SELECT public.approve_supplier(
  'supplier_id'::UUID,
  'user_id'::UUID
);
```

**Futuro:** Pode ser estendido para verificar "platform admin" se houver tabela de admins.

---

### 2. Remover Acesso Público à View `supplier_pending_registrations`

A view `supplier_pending_registrations` **não é mais acessível publicamente**.

**Regras:**
- `REVOKE SELECT` de `anon` e `authenticated`
- Apenas `service_role` pode consultar
- Frontend **não usa** essa view (apenas admin manual)

**Uso:**
```sql
-- Apenas via service key
SELECT * FROM public.supplier_pending_registrations;
```

---

### 3. Sanity-Check no `register_supplier`

A função `register_supplier()` implementa múltiplas validações e proteções:

**Status Fixo 'pending':**
- Status **sempre** é `'pending'` (ignora qualquer input)
- Não aceita parâmetro de status
- Garante que todos os cadastros precisam de aprovação

**Normalização:**
- **CNPJ:** Remove caracteres não numéricos, armazena em `cnpj_normalized`
- **Email:** `lowercase` + `trim`
- **Slug:** Geração automática com sufixo incremental em caso de colisão

**Anti-Duplicidade:**
- **CNPJ:** Verifica `cnpj_normalized` único (índice único)
  - Erro: `'cnpj_already_registered'`
- **Email:** Verifica email normalizado único (índice único)
  - Erro: `'email_already_registered'`
- **Slug:** Resolve colisão com sufixo incremental (até 100 tentativas)
  - Erro: `'slug_generation_failed'` se exceder tentativas

**Índices Únicos:**
- `idx_suppliers_cnpj_normalized_unique` (CNPJ normalizado)
- `idx_suppliers_email_unique` (email normalizado)

**Trigger Automático:**
- `trigger_update_supplier_cnpj_normalized` mantém `cnpj_normalized` atualizado quando `cnpj` é inserido/atualizado

**Validações:**
- Nome obrigatório
- Email obrigatório + formato válido
- CNPJ: 14 dígitos (se fornecido)
- User ID obrigatório (via parâmetro ou `auth.uid()`)

---

## 🔧 Tratamento de Erros

### Erros do `register_supplier`:

| Código | Descrição | Ação |
|--------|-----------|------|
| `name_required` | Nome da empresa é obrigatório | Preencher nome |
| `email_required` | E-mail é obrigatório | Preencher email |
| `email_invalid` | Formato de e-mail inválido | Corrigir formato |
| `cnpj_invalid` | CNPJ deve ter 14 dígitos | Corrigir CNPJ |
| `cnpj_already_registered` | CNPJ já cadastrado | Verificar se já existe cadastro |
| `email_already_registered` | E-mail já cadastrado | Verificar se já existe cadastro |
| `slug_generation_failed` | Não foi possível gerar slug único | Contatar suporte |
| `user_id_required` | ID do usuário é obrigatório | Verificar autenticação |
| `insert_failed` | Erro ao inserir fornecedor | Contatar suporte |

### Erros do `approve_supplier`:

| Código | Descrição | Ação |
|--------|-----------|------|
| `not_authorized` | Apenas service_role pode aprovar | Usar service key |
| `supplier_id_required` | ID do fornecedor é obrigatório | Fornecer supplier_id |
| `user_id_required` | ID do usuário é obrigatório | Fornecer user_id |
| `supplier_not_found` | Fornecedor não encontrado | Verificar ID |
| `supplier_already_processed` | Fornecedor já aprovado/rejeitado | Verificar status |

---

## 📊 Conciliação de Fluxo de Trabalho

### Estados Possíveis:

```
┌─────────────┐
│   PENDING   │ ← Cadastro inicial (self-service)
└──────┬──────┘
       │
       │ approve_supplier() [service_role]
       ▼
┌─────────────┐
│  APPROVED   │ ← Acesso completo
└─────────────┘
       │
       │ (manual via Dashboard)
       ▼
┌─────────────┐
│  REJECTED   │ ← Rejeitado (opcional)
└─────────────┘
```

### Tabelas Envolvidas:

1. **`suppliers`**
   - `status`: `'pending' | 'approved' | 'rejected'`
   - `cnpj_normalized`: CNPJ normalizado (apenas dígitos)
   - `email`: Email normalizado (lowercase)

2. **`supplier_users`**
   - Vínculo `supplier_id` ↔ `user_id`
   - Criado automaticamente no cadastro
   - Ativado na aprovação

3. **`auth.users`**
   - Usuário criado no cadastro
   - Email confirmado automaticamente (MVP)

### Verificações de Consistência:

**Cadastro:**
- ✅ Supplier criado com `status='pending'`
- ✅ `supplier_users` vinculado
- ✅ `cnpj_normalized` preenchido (se CNPJ fornecido)
- ✅ Email normalizado

**Aprovação:**
- ✅ `status` atualizado para `'approved'`
- ✅ `approved_at` preenchido
- ✅ `supplier_users.active = true`

**Rejeição (manual):**
- ✅ `status` atualizado para `'rejected'`
- ✅ `rejected_at` preenchido
- ✅ `supplier_users.active = false` (opcional)

---

## 🚀 Próximos Passos (Futuro)

- [ ] Painel Admin StudioOS para aprovação/rejeição
- [ ] Notificações por email (cadastro recebido, aprovado, rejeitado)
- [ ] Tabela `supplier_registrations` para histórico completo
- [ ] Verificação de "platform admin" na função `approve_supplier`
- [ ] Dashboard de métricas de cadastros pendentes

---

**Última atualização:** 2026-01-17
