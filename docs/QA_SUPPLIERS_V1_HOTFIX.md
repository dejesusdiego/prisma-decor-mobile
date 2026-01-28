# CHECKLIST QA — SUPPLIERS V1 HOTFIX
## Testes Manuais para Validação das Correções

**Data:** 2026-01-21  
**Versão:** Hotfix RLS + Hardening  
**Objetivo:** Validar que todas as correções de segurança e consistência estão funcionando

---

## PRÉ-REQUISITOS

1. ✅ Migration `20260121000000_suppliers_hotfix_rls.sql` aplicada no Supabase
2. ✅ Frontend atualizado com correções
3. ✅ Acesso a:
   - Conta de organização cliente (para testar visualização de materiais)
   - Conta de fornecedor `pending` (para testar portal limitado)
   - Conta de fornecedor `approved` (para testar portal completo)
   - Service role key (para testar `approve_supplier`)

---

## TESTE 1: RLS — Organização NÃO vê materiais de fornecedor `pending`

### Objetivo
Validar que a RLS corrigida bloqueia materiais de fornecedor `pending` ou `rejected`.

### Passos

1. **Criar fornecedor `pending`:**
   - Acessar `/cadastro-fornecedor`
   - Cadastrar novo fornecedor (ex: "Fornecedor Teste Pending")
   - Verificar que status é `pending` (via Supabase Dashboard)

2. **Vincular fornecedor `pending` à organização:**
   - Como admin da organização, ir em "Administração → Fornecedores"
   - Buscar e vincular "Fornecedor Teste Pending"
   - Verificar que vínculo foi criado (`supplier_organizations.active = true`)

3. **Fornecedor cadastra materiais:**
   - Fazer login como fornecedor `pending`
   - Acessar Portal de Fornecedores
   - Cadastrar 3 materiais no catálogo (ex: "Tecido A", "Tecido B", "Tecido C")

4. **Organização tenta ver materiais:**
   - Fazer login como membro da organização
   - Ir em "Gestão de Materiais → Aba Fornecedores"
   - **Resultado esperado:** ❌ **Nenhum material deve aparecer**
   - **Mensagem esperada:** "Nenhum fornecedor aprovado vinculado à sua organização" OU "Catálogo disponível apenas após aprovação do fornecedor"

### Validação

- [ ] Organização **NÃO** vê materiais de fornecedor `pending`
- [ ] Mensagem de fallback é exibida corretamente
- [ ] Query retorna 0 materiais (verificar no console do navegador)

---

## TESTE 2: RLS — Organização vê materiais de fornecedor `approved`

### Objetivo
Validar que após aprovação, organização pode ver materiais.

### Passos

1. **Aprovar fornecedor:**
   - Via Supabase Dashboard (SQL Editor), executar:
     ```sql
     SELECT public.approve_supplier(
       (SELECT id FROM suppliers WHERE name = 'Fornecedor Teste Pending'),
       (SELECT user_id FROM supplier_users WHERE supplier_id = (SELECT id FROM suppliers WHERE name = 'Fornecedor Teste Pending') LIMIT 1)
     );
     ```
   - Verificar que `suppliers.status = 'approved'`

2. **Organização visualiza materiais:**
   - Fazer login como membro da organização
   - Ir em "Gestão de Materiais → Aba Fornecedores"
   - **Resultado esperado:** ✅ **3 materiais devem aparecer** (Tecido A, B, C)

### Validação

- [ ] Organização **VÊ** materiais de fornecedor `approved`
- [ ] Materiais aparecem com nome, preço, SKU corretos
- [ ] Filtro por fornecedor funciona
- [ ] Busca por nome/SKU funciona

---

## TESTE 3: Hardening — `approve_supplier` bloqueia acesso não autorizado

### Objetivo
Validar que apenas `service_role` pode executar `approve_supplier`.

### Passos

1. **Tentar executar como `authenticated` (deve falhar):**
   - Via Supabase Dashboard (SQL Editor), executar como usuário autenticado:
     ```sql
     -- Isso deve FALHAR
     SELECT public.approve_supplier(
       '00000000-0000-0000-0000-000000000000'::UUID,
       '00000000-0000-0000-0000-000000000000'::UUID
     );
     ```
   - **Resultado esperado:** ❌ **Erro `not_authorized`**

2. **Executar como `service_role` (deve funcionar):**
   - Via Supabase Dashboard (usando service role key), executar:
     ```sql
     SELECT public.approve_supplier(
       (SELECT id FROM suppliers WHERE status = 'pending' LIMIT 1),
       (SELECT user_id FROM supplier_users WHERE supplier_id = (SELECT id FROM suppliers WHERE status = 'pending' LIMIT 1) LIMIT 1)
     );
     ```
   - **Resultado esperado:** ✅ **Retorna `true`**

### Validação

- [ ] `authenticated` **NÃO** pode executar `approve_supplier`
- [ ] `service_role` **PODE** executar `approve_supplier`
- [ ] Mensagem de erro é clara: "Apenas service_role pode aprovar fornecedores"

---

## TESTE 4: Hardening — `register_supplier` força `status='pending'` sempre

### Objetivo
Validar que cadastro self-service sempre cria `status='pending'`, mesmo em ON CONFLICT.

### Passos

1. **Cadastrar fornecedor:**
   - Acessar `/cadastro-fornecedor`
   - Cadastrar fornecedor (ex: "Fornecedor Teste Status")
   - Verificar no Supabase: `suppliers.status = 'pending'`

2. **Aprovar fornecedor:**
   - Via service_role, aprovar fornecedor
   - Verificar: `suppliers.status = 'approved'`

3. **Tentar cadastrar novamente (mesmo email/CNPJ):**
   - Acessar `/cadastro-fornecedor` novamente
   - Usar mesmo email/CNPJ do passo 1
   - **Resultado esperado:** ❌ **Erro de duplicidade** OU **status volta para `pending`** (dependendo da lógica)

### Validação

- [ ] Novo cadastro sempre cria `status='pending'`
- [ ] ON CONFLICT não mantém `status='approved'` (força `pending`)
- [ ] CNPJ normalizado é usado para verificar duplicidade

---

## TESTE 5: Import CSV — Normalização de preço e SKU

### Objetivo
Validar que import CSV normaliza preço (remove espaços, trata vírgula) e SKU vazio.

### Passos

1. **Criar CSV de teste:**
   ```csv
   nome,preco,sku,unidade
   "Tecido Teste 1"," 1.234,56 ","","m"
   "Tecido Teste 2","2.500,00","SKU001","m"
   "Tecido Teste 3","  3.000,50  ","","m"
   ```

2. **Importar CSV:**
   - Fazer login como fornecedor
   - Ir em "Catálogo → Importar CSV"
   - Fazer upload do CSV
   - Verificar preview (deve mostrar preços normalizados)

3. **Aplicar import:**
   - Clicar em "Aplicar Importação"
   - **Resultado esperado:** ✅ **3 materiais inseridos com preços corretos**

4. **Verificar no banco:**
   - Via Supabase, verificar `supplier_materials`:
     - `Tecido Teste 1`: `price = 1234.56`, `sku = NULL`
     - `Tecido Teste 2`: `price = 2500.00`, `sku = 'SKU001'`
     - `Tecido Teste 3`: `price = 3000.50`, `sku = NULL`

### Validação

- [ ] Preços são normalizados (espaços removidos, vírgula → ponto)
- [ ] SKU vazio (`''`) vira `NULL` (evita duplicados)
- [ ] Preview mostra preços corretos
- [ ] Import não quebra com JSON inválido em `errors`

---

## TESTE 6: Mensagens de erro genéricas (anti-enumeração)

### Objetivo
Validar que mensagens de erro não expõem enumeração de emails/CNPJs.

### Passos

1. **Tentar cadastrar com email já existente:**
   - Acessar `/cadastro-fornecedor`
   - Usar email de fornecedor já cadastrado
   - **Resultado esperado:** ❌ **Mensagem genérica:** "Não foi possível completar o cadastro. Verifique os dados informados."

2. **Tentar cadastrar com CNPJ já existente:**
   - Acessar `/cadastro-fornecedor`
   - Usar CNPJ de fornecedor já cadastrado
   - **Resultado esperado:** ❌ **Mensagem genérica:** "Não foi possível completar o cadastro. Verifique os dados informados."

3. **Verificar logs:**
   - Verificar console do navegador (F12)
   - **Resultado esperado:** ✅ **Logs internos mostram código específico** (`email_already_registered`, `cnpj_already_registered`), mas UI mostra mensagem genérica

### Validação

- [ ] Mensagens de erro na UI são genéricas (não expõem "email já cadastrado")
- [ ] Logs internos mantêm códigos específicos para debugging
- [ ] Usuário não consegue enumerar emails/CNPJs via mensagens de erro

---

## TESTE 7: Fornecedor `pending` pode usar portal (acesso limitado)

### Objetivo
Validar que fornecedor `pending` pode acessar portal e cadastrar materiais, mas organização não vê.

### Passos

1. **Fornecedor `pending` acessa portal:**
   - Fazer login como fornecedor `pending`
   - Acessar `fornecedores.studioos.pro`
   - **Resultado esperado:** ✅ **Portal carrega normalmente**
   - **Resultado esperado:** ✅ **Banner "Aguardando aprovação" aparece**

2. **Fornecedor cadastra materiais:**
   - Ir em "Catálogo"
   - Cadastrar 2 materiais manualmente
   - **Resultado esperado:** ✅ **Materiais são salvos no banco**

3. **Organização não vê materiais:**
   - Fazer login como organização
   - Ir em "Gestão de Materiais → Aba Fornecedores"
   - **Resultado esperado:** ❌ **Materiais NÃO aparecem** (fornecedor ainda `pending`)

4. **Aprovar fornecedor:**
   - Via service_role, aprovar fornecedor

5. **Organização vê materiais:**
   - Fazer login como organização
   - Ir em "Gestão de Materiais → Aba Fornecedores"
   - **Resultado esperado:** ✅ **2 materiais aparecem**

### Validação

- [ ] Fornecedor `pending` pode acessar portal
- [ ] Fornecedor `pending` pode cadastrar materiais
- [ ] Organização **NÃO** vê materiais de fornecedor `pending`
- [ ] Após aprovação, organização **VÊ** materiais

---

## TESTE 8: Verificação de JWT em `approve_supplier`

### Objetivo
Validar que `approve_supplier` verifica JWT explicitamente e nega acesso se JWT não existir.

### Passos

1. **Simular JWT ausente:**
   - Via Supabase Dashboard (SQL Editor), executar sem contexto de JWT:
     ```sql
     -- Isso deve FALHAR
     SET LOCAL request.jwt.claims = NULL;
     SELECT public.approve_supplier(
       '00000000-0000-0000-0000-000000000000'::UUID,
       '00000000-0000-0000-0000-000000000000'::UUID
     );
     ```
   - **Resultado esperado:** ❌ **Erro:** "JWT inválido ou ausente"

### Validação

- [ ] `approve_supplier` verifica se JWT existe antes de ler `role`
- [ ] Se JWT não existir, acesso é negado imediatamente
- [ ] Mensagem de erro é clara

---

## RESUMO DE VALIDAÇÃO

### ✅ Correções de RLS

- [ ] Organização **NÃO** vê materiais de fornecedor `pending`
- [ ] Organização **VÊ** materiais de fornecedor `approved`
- [ ] RLS filtra por `suppliers.status = 'approved'`

### ✅ Hardening de RPCs

- [ ] `approve_supplier` bloqueia acesso não autorizado
- [ ] `register_supplier` força `status='pending'` sempre
- [ ] `approve_supplier` verifica JWT explicitamente

### ✅ Correções de Frontend

- [ ] Import CSV normaliza preço (espaços, vírgula)
- [ ] SKU vazio vira `NULL` (evita duplicados)
- [ ] Mensagens de erro são genéricas (anti-enumeração)
- [ ] Fallback message aparece quando há vínculos mas 0 materiais

### ✅ Fluxo Completo

- [ ] Fornecedor `pending` pode usar portal
- [ ] Organização não vê materiais de fornecedor `pending`
- [ ] Após aprovação, organização vê materiais

---

## NOTAS DE TESTE

- **Ambiente:** [ ] Local / [ ] Staging / [ ] Produção
- **Data do teste:** _______________
- **Testado por:** _______________
- **Observações:**
  - 
  - 
  - 

---

## PRÓXIMOS PASSOS (se houver falhas)

1. Documentar falha específica
2. Verificar logs do Supabase
3. Verificar console do navegador
4. Aplicar correção adicional se necessário
