# Supplier Catalog V1 - Documentação

**Data:** 2026-01-17  
**Versão:** 1.0

---

## 📋 Visão Geral

O Supplier Catalog V1 permite que fornecedores gerenciem seu próprio catálogo de materiais, que é então disponibilizado para organizações clientes de forma **read-only** (somente leitura).

### Princípios Fundamentais

1. **Fonte única de verdade:** Cada fornecedor controla seu próprio catálogo
2. **Read-only para clientes:** Organizações não podem editar materiais de fornecedores
3. **Preço global:** No V1, o preço é o mesmo para todos os clientes
4. **Sem estoque:** Materiais de fornecedor não têm controle de estoque no V1

---

## 📤 Importação CSV - Especificação

### Formato do Arquivo

- **Extensão:** `.csv`
- **Separador:** `;` (ponto e vírgula) ou `,` (vírgula) - detectado automaticamente
- **Encoding:** UTF-8 recomendado
- **Cabeçalho:** Primeira linha deve conter os nomes das colunas

### Colunas Obrigatórias

| Coluna | Nomes Aceitos | Tipo | Descrição |
|--------|---------------|------|-----------|
| Nome | `name`, `nome` | Texto | Nome do material (obrigatório) |
| Preço | `price`, `preco`, `preço` | Numérico | Preço unitário (obrigatório, >= 0) |

### Colunas Opcionais

| Coluna | Nomes Aceitos | Tipo | Descrição |
|--------|---------------|------|-----------|
| SKU | `sku`, `codigo`, `código` | Texto | Código do fornecedor (único por fornecedor) |
| Unidade | `unit`, `unidade` | Texto | Unidade de medida (ex: "m", "un", "rolo") |
| Descrição | `description`, `descricao`, `descrição` | Texto | Descrição do material |
| Ativo | `active`, `ativo` | Boolean | Se o material está ativo (true/false, sim/não, 1/0) |

### Exemplo de CSV

```csv
name;sku;price;unit;description;active
Tecido Algodão Premium;TEC-001;45.90;m;Tecido 100% algodão, 150cm de largura;true
Trilho Alumínio 3m;TRL-002;120.00;un;Trilho de alumínio, 3 metros;true
Cortina Blackout;CTN-003;89.50;m;Cortina com bloqueio total de luz;true
```

### Regras de Importação

1. **Upsert por SKU:** Se o material tiver SKU, o sistema busca por `supplier_id + sku` e atualiza se existir, ou cria se não existir
2. **Upsert por Nome:** Se o material não tiver SKU, o sistema busca por `supplier_id + name` e atualiza se existir, ou cria se não existir
3. **Não desativa automaticamente:** Itens que não aparecem no CSV **não são desativados** automaticamente no V1 (evita apagar catálogo por erro)
4. **Validação:** Linhas com erros são registradas mas não bloqueiam a importação

### Processo de Importação

1. **Upload:** Fornecedor faz upload do arquivo CSV
2. **Preview:** Sistema mostra preview das primeiras 10 linhas válidas + lista de erros
3. **Validação:** Sistema valida colunas obrigatórias e formatos
4. **Aplicação:** Fornecedor confirma e aplica a importação
5. **Registro:** Sistema registra o resultado em `supplier_material_imports` com métricas (inseridos, atualizados, erros)

---

## 🔒 Comportamento Read-Only

### Para Organizações Clientes

**O que PODE fazer:**
- ✅ Visualizar materiais de fornecedores vinculados e ativos
- ✅ Buscar/filtrar materiais por nome, SKU ou fornecedor
- ✅ Usar materiais de fornecedor em orçamentos e pedidos
- ✅ Ver preços atualizados em tempo real

**O que NÃO PODE fazer:**
- ❌ Editar nome, preço, descrição ou qualquer campo
- ❌ Deletar materiais de fornecedor
- ❌ Alterar status (ativo/inativo)
- ❌ Adicionar novos materiais ao catálogo do fornecedor

### Para Fornecedores

**O que PODE fazer:**
- ✅ Criar, editar e deletar seus próprios materiais
- ✅ Importar CSV em lote
- ✅ Atualizar preços globalmente (afeta todos os clientes)
- ✅ Ativar/desativar materiais

**O que NÃO PODE fazer:**
- ❌ Editar materiais de outros fornecedores
- ❌ Ver materiais de outros fornecedores

---

## 🔗 Integração com Orçamentos e Pedidos

### Status: ⚠️ PARCIALMENTE IMPLEMENTADO

**O que está implementado:**
- ✅ Hook `useSupplierMaterials` para buscar materiais de fornecedores
- ✅ Transformação de supplier_materials em formato Material compatível
- ✅ Identificação de materiais de fornecedor (prefixo `supplier_` no ID)

**O que falta implementar:**
- ❌ Modificar `MaterialSelector` para incluir supplier_materials na lista
- ❌ Adicionar campos no schema do banco:
  - `orcamento_itens`: `supplier_material_id UUID`, `supplier_id UUID`, `price_snapshot NUMERIC`
  - `pedido_itens`: `supplier_material_id UUID`, `supplier_id UUID`, `price_snapshot NUMERIC`
- ❌ Lógica para salvar snapshot quando supplier_material é selecionado
- ❌ UI para mostrar badge "Fornecedor" no MaterialSelector
- ❌ Validação para não permitir edição de supplier_materials em orçamentos/pedidos

### Seleção de Materiais (Planejado)

Quando um usuário cria um orçamento ou pedido, o seletor de materiais deve mostrar:

1. **Materiais próprios** (da organização)
2. **Materiais de fornecedores** (read-only, com badge indicando fornecedor)

### Snapshot de Preço (Planejado)

**Importante:** Quando um material de fornecedor é adicionado a um orçamento/pedido, o sistema deve salvar um **snapshot do preço** no momento da adição. Isso garante que:

- Se o fornecedor alterar o preço depois, o orçamento/pedido mantém o preço original
- O histórico financeiro permanece consistente
- Não há surpresas de preço em orçamentos já criados

**Implementação técnica necessária:**
- Campo `price_snapshot` no item do orçamento/pedido
- Campo `supplier_material_id` para rastreio
- Campo `supplier_id` para referência

---

## 🗺️ Regiões Atendidas (Service States)

### Conceito

Cada fornecedor pode definir em quais **estados (UFs)** ele atende. Isso permite que organizações clientes filtrem fornecedores por região.

### UFs Suportadas

Todas as 27 UFs do Brasil:
- AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO

### Uso

- **Cadastro:** Organização cliente seleciona UFs ao cadastrar/vincular fornecedor
- **Filtro:** Organização pode filtrar fornecedores por UF atendida
- **Visualização:** Badges mostram UFs atendidas na lista de fornecedores

---

## 📊 Estrutura de Dados

### Tabelas Principais

1. **`suppliers`**
   - Dados do fornecedor
   - Campo `service_states TEXT[]` (lista de UFs)

2. **`supplier_materials`**
   - Catálogo de materiais do fornecedor
   - Campos: `id`, `supplier_id`, `sku`, `name`, `description`, `unit`, `price`, `active`

3. **`supplier_material_imports`**
   - Histórico de importações CSV
   - Métricas: `inserted`, `updated`, `errors`

4. **`supplier_organizations`**
   - Vínculo fornecedor ↔ organização
   - Campo `active` controla se o catálogo está disponível para a organização

### RLS (Row-Level Security)

- **Fornecedor:** Pode gerenciar apenas seus próprios materiais
- **Organização:** Pode apenas **ler** materiais de fornecedores vinculados e ativos
- **Organização:** **NUNCA** pode INSERT/UPDATE/DELETE em `supplier_materials`

---

## 🚀 Fluxo de Uso

### 1. Cadastro de Fornecedor (Organização Cliente)

1. Organização acessa **Administração → Fornecedores**
2. Cadastra novo fornecedor ou vincula existente
3. Seleciona **UFs atendidas** pelo fornecedor
4. Fornecedor fica vinculado e ativo

### 2. Gerenciamento de Catálogo (Fornecedor)

1. Fornecedor acessa **Portal de Fornecedores** (`fornecedores.studioos.pro`)
2. Faz login com credenciais
3. Acessa aba **Catálogo**
4. Pode:
   - Visualizar lista de materiais
   - Editar material individual
   - Importar CSV em lote

### 3. Visualização de Catálogo (Organização Cliente)

1. Organização acessa **Gestão de Materiais → Aba Fornecedores**
2. Visualiza materiais de fornecedores vinculados e ativos
3. Pode buscar/filtrar, mas **não pode editar**
4. Pode usar materiais em orçamentos/pedidos

### 4. Uso em Orçamento/Pedido

1. Usuário cria orçamento/pedido
2. Ao selecionar material, vê:
   - Materiais próprios
   - Materiais de fornecedores (com badge)
3. Seleciona material de fornecedor
4. Sistema salva **snapshot do preço** no item
5. Orçamento/pedido mantém preço mesmo se fornecedor alterar depois

---

## ⚠️ Limitações do V1

- **Preço global:** Mesmo preço para todos os clientes (sem override por organização)
- **Sem estoque:** Materiais de fornecedor não têm controle de estoque
- **Não desativa em import:** CSV não desativa materiais que não aparecem no arquivo
- **Sem histórico de preços:** Não há histórico de mudanças de preço
- **Sem notificações:** Clientes não são notificados quando fornecedor altera preços

---

## 🔮 Melhorias Futuras (V2+)

- Preço customizado por organização
- Controle de estoque para materiais de fornecedor
- Histórico de preços
- Notificações de mudanças
- API para integração direta
- Desativação automática via CSV (opcional)
- Dashboard de estatísticas para fornecedor

---

**Última atualização:** 2026-01-17
