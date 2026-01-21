# 🧪 Guia de Testes - Supplier Catalog V1

**Data:** 2026-01-17  
**Versão:** 1.0

---

## 📋 Pré-requisitos

1. ✅ Migration SQL aplicada no Supabase
2. ✅ Código deployado na Vercel
3. ✅ Acesso ao Supabase Dashboard
4. ✅ Conta de usuário admin de uma organização

---

## 🎯 Cenário 1: Cadastrar Fornecedor (Organização Cliente)

### Passo a passo:

1. **Acesse o sistema como admin de uma organização:**
   - URL: `https://prisma-decor-mobile.vercel.app` (ou seu domínio)
   - Faça login com credenciais de admin

2. **Navegue até Fornecedores:**
   - Menu lateral → **Administração** → **Fornecedores**

3. **Cadastre um novo fornecedor:**
   - Preencha:
     - **Nome:** "Tecidos ABC Ltda"
     - **E-mail:** "contato@tecidosabc.com"
     - **Telefone:** "(11) 99999-9999"
     - **CNPJ:** "12.345.678/0001-90"
     - **Regiões Atendidas:** Selecione UFs (ex: SC, PR, RS, SP)
   - Clique em **"Cadastrar Fornecedor"**
   - ✅ Deve aparecer mensagem de sucesso

4. **Verifique na lista:**
   - O fornecedor deve aparecer na lista à direita
   - Badges das UFs devem aparecer abaixo do nome

5. **Teste filtro por UF:**
   - No dropdown "Filtrar por UF", selecione uma UF (ex: SC)
   - ✅ Apenas fornecedores que atendem essa UF devem aparecer

6. **Teste edição de regiões:**
   - Clique no ícone de editar (lápis) ao lado do fornecedor
   - Adicione/remova UFs
   - Clique em **"Salvar"**
   - ✅ As UFs devem ser atualizadas

---

## 🎯 Cenário 2: Criar Usuário de Fornecedor

### Passo a passo:

1. **No Supabase Dashboard:**
   - Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn
   - Vá em **Authentication** → **Users**

2. **Crie um novo usuário:**
   - Clique em **"Add user"** → **"Create new user"**
   - Preencha:
     - **Email:** `fornecedor@teste.com`
     - **Password:** `senha123456`
   - Clique em **"Create user"**
   - ✅ Copie o **User ID** (UUID)

3. **Vincule o usuário ao fornecedor:**
   - Vá em **Table Editor** → **supplier_users**
   - Clique em **"Insert row"**
   - Preencha:
     - **supplier_id:** UUID do fornecedor criado no Cenário 1
     - **user_id:** UUID do usuário criado acima
     - **role:** `supplier`
     - **active:** `true`
   - Clique em **"Save"**

4. **Verifique:**
   - ✅ O registro deve aparecer na tabela `supplier_users`

---

## 🎯 Cenário 3: Portal do Fornecedor - Login e Catálogo

### Passo a passo:

1. **Acesse o Portal de Fornecedores:**
   - URL: `https://prisma-decor-mobile.vercel.app` (o sistema detecta automaticamente se é fornecedor)
   - Ou acesse diretamente: `fornecedores.studioos.pro` (se configurado)

2. **Faça login:**
   - Use as credenciais criadas no Cenário 2:
     - **Email:** `fornecedor@teste.com`
     - **Password:** `senha123456`
   - ✅ Deve fazer login e mostrar o dashboard do fornecedor

3. **Acesse o Catálogo:**
   - Clique na aba **"Catálogo"**
   - ✅ Deve mostrar a tela de catálogo (inicialmente vazia)

4. **Adicione um material manualmente:**
   - Clique no ícone de editar em qualquer linha (ou use o botão se houver)
   - Preencha:
     - **Nome:** "Tecido Algodão Premium"
     - **SKU:** "TEC-001"
     - **Unidade:** "m"
     - **Preço:** "45.90"
     - **Descrição:** "Tecido 100% algodão, 150cm de largura"
   - Clique em **"Salvar"**
   - ✅ O material deve aparecer na lista

5. **Edite um material:**
   - Clique no ícone de editar ao lado do material
   - Altere o preço para "50.00"
   - Clique em **"Salvar"**
   - ✅ O preço deve ser atualizado na lista

---

## 🎯 Cenário 4: Importar CSV

### Passo a passo:

1. **Prepare um arquivo CSV:**
   - Crie um arquivo `catalogo.csv` com o seguinte conteúdo:
   ```csv
   name;sku;price;unit;description;active
   Tecido Algodão Premium;TEC-001;45.90;m;Tecido 100% algodão, 150cm de largura;true
   Trilho Alumínio 3m;TRL-002;120.00;un;Trilho de alumínio, 3 metros;true
   Cortina Blackout;CTN-003;89.50;m;Cortina com bloqueio total de luz;true
   Forro Branco;FOR-004;25.00;m;Forro branco padrão;true
   ```

2. **No Portal do Fornecedor:**
   - Aba **"Catálogo"**
   - Clique em **"Importar CSV"**

3. **Faça upload:**
   - Clique em **"Escolher arquivo"**
   - Selecione o arquivo `catalogo.csv`
   - ✅ Deve aparecer um preview das primeiras 10 linhas

4. **Verifique o preview:**
   - ✅ Deve mostrar uma tabela com os dados
   - ✅ Deve mostrar contagem de linhas válidas

5. **Aplique a importação:**
   - Clique em **"Aplicar Importação"**
   - ✅ Deve mostrar mensagem de sucesso com métricas (inseridos, atualizados)
   - ✅ Os materiais devem aparecer na lista

6. **Teste com erro:**
   - Crie um CSV com erro (ex: preço inválido):
   ```csv
   name;price
   Material Teste;abc
   ```
   - Faça upload
   - ✅ Deve mostrar erros no preview
   - ✅ Não deve permitir aplicar se houver erros críticos

---

## 🎯 Cenário 5: Visualizar Materiais de Fornecedor (Organização Cliente)

### Passo a passo:

1. **Como admin da organização:**
   - Faça login no sistema
   - Navegue até **Gestão de Materiais**

2. **Acesse a aba Fornecedores:**
   - Clique na aba **"Fornecedores"**
   - ✅ Deve mostrar os materiais dos fornecedores vinculados

3. **Verifique read-only:**
   - ✅ Deve ter badge "Somente leitura" no título
   - ✅ Deve mostrar badge com nome do fornecedor em cada material
   - ✅ Não deve ter botões de editar/deletar

4. **Teste busca:**
   - Digite no campo de busca: "Tecido"
   - ✅ Deve filtrar apenas materiais com "Tecido" no nome

5. **Teste filtro por fornecedor:**
   - No dropdown "Filtrar por fornecedor", selecione um fornecedor
   - ✅ Deve mostrar apenas materiais daquele fornecedor

6. **Verifique mensagem informativa:**
   - ✅ Deve aparecer mensagem explicando que materiais são controlados pelo fornecedor

---

## 🎯 Cenário 6: Testar RLS (Row-Level Security)

### Passo a passo:

1. **Teste: Fornecedor não vê materiais de outros fornecedores:**
   - No Supabase Dashboard → **Table Editor** → **supplier_materials**
   - Tente inserir um material com `supplier_id` diferente do seu
   - ✅ Deve dar erro de permissão (RLS bloqueando)

2. **Teste: Organização não pode editar materiais de fornecedor:**
   - Como admin da organização, tente fazer UPDATE em `supplier_materials` via SQL Editor
   - ✅ Deve dar erro de permissão (RLS bloqueando)

3. **Teste: Organização só vê materiais de fornecedores vinculados:**
   - Desvincule um fornecedor (marque `active = false` em `supplier_organizations`)
   - Recarregue a aba Fornecedores
   - ✅ Materiais daquele fornecedor não devem aparecer

---

## ✅ Checklist de Validação

### Funcionalidades Core
- [ ] Cadastro de fornecedor com UFs
- [ ] Edição de UFs atendidas
- [ ] Filtro por UF na listagem
- [ ] Login no Portal de Fornecedores
- [ ] Listagem de materiais no catálogo
- [ ] Edição individual de material
- [ ] Import CSV com preview
- [ ] Import CSV aplicando dados
- [ ] Visualização read-only na organização
- [ ] Busca e filtros na organização

### Segurança (RLS)
- [ ] Fornecedor só vê seus próprios materiais
- [ ] Organização não pode editar materiais de fornecedor
- [ ] Organização só vê materiais de fornecedores vinculados
- [ ] Usuário não vinculado não acessa portal de fornecedor

### UX
- [ ] Mensagens de erro claras
- [ ] Loading states funcionando
- [ ] Badges e indicadores visuais corretos
- [ ] Navegação fluida

---

## 🐛 Problemas Comuns e Soluções

### Problema: "Fornecedor não consegue fazer login"
**Solução:**
- Verifique se o usuário está vinculado em `supplier_users`
- Verifique se `active = true` em `supplier_users`
- Verifique se o fornecedor existe e está ativo

### Problema: "Materiais não aparecem na organização"
**Solução:**
- Verifique se o fornecedor está vinculado (`supplier_organizations.active = true`)
- Verifique se os materiais estão ativos (`supplier_materials.active = true`)
- Verifique se o usuário está na organização correta

### Problema: "Erro ao importar CSV"
**Solução:**
- Verifique se o CSV tem cabeçalho correto (name, price obrigatórios)
- Verifique se os preços são numéricos válidos
- Verifique se o separador está correto (; ou ,)

### Problema: "RLS bloqueando queries"
**Solução:**
- Verifique se as policies estão criadas corretamente
- Verifique se o usuário está autenticado
- Verifique se o `supplier_id` corresponde ao usuário logado

---

## 📊 Dados de Teste Sugeridos

### Fornecedor 1: Tecidos ABC
- Nome: "Tecidos ABC Ltda"
- Email: "contato@tecidosabc.com"
- UFs: SC, PR, RS

### Fornecedor 2: Trilhos XYZ
- Nome: "Trilhos XYZ Indústria"
- Email: "vendas@trilhosxyz.com"
- UFs: SP, RJ, MG

### Materiais de Teste (CSV)
```csv
name;sku;price;unit;description;active
Tecido Algodão Premium;TEC-001;45.90;m;Tecido 100% algodão;true
Tecido Poliéster;TEC-002;32.50;m;Tecido poliéster resistente;true
Trilho Alumínio 3m;TRL-001;120.00;un;Trilho de alumínio 3 metros;true
Trilho Madeira 2m;TRL-002;85.00;un;Trilho de madeira 2 metros;true
Cortina Blackout;CTN-001;89.50;m;Cortina com bloqueio total de luz;true
Forro Branco;FOR-001;25.00;m;Forro branco padrão;true
```

---

**Última atualização:** 2026-01-17
