# 🚀 GUIA DE IMPORTAÇÃO VIA CSV NO SUPABASE

## Projeto Destino
- **URL:** `https://tjwpqrlfhngibuwqodcn.supabase.co`
- **Dashboard:** `https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn`

---

## 📋 PASSO 1: EXECUTAR SCHEMA (SQL Editor)

### 1.1 Acessar SQL Editor
```
https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql
```

### 1.2 Executar os arquivos na ordem:
1. **02_SCHEMA_TYPES.sql** - Tipos enum
2. **03_SCHEMA_TABLES.sql** - Tabelas + índices
3. **04_SCHEMA_FUNCTIONS_1.sql** - Funções
4. **07_DATA_BASE.sql** - Dados base (orgs, plans, configs)

---

## 📋 PASSO 2: IMPORTAR CSVs (Table Editor)

### 2.1 Acessar Table Editor
```
https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/editor
```

### 2.2 Ordem de Importação (IMPORTANTE!)

⚠️ **ORDEM IMPORTA** - Respeite as dependências de Foreign Keys:

| # | Tabela | Arquivo CSV | Dependência |
|---|--------|-------------|-------------|
| 1 | `contatos` | contatos-export-*.csv | Nenhuma |
| 2 | `categorias_financeiras` | categorias_financeiras-export-*.csv | Nenhuma |
| 3 | `servicos_confeccao` | servicos_confeccao-export-*.csv | Nenhuma |
| 4 | `materiais` | materiais-export-*.csv | Nenhuma |
| 5 | `orcamentos` | orcamentos-export-*.csv | contatos |
| 6 | `cortina_items` | cortina_items-export-*.csv | orcamentos |
| 7 | `oportunidades` | oportunidades-export-*.csv | contatos, orcamentos |
| 8 | `atividades_crm` | atividades_crm-export-*.csv | contatos, oportunidades, orcamentos |
| 9 | `contas_receber` | contas_receber-export-*.csv | orcamentos |
| 10 | `parcelas_receber` | parcelas_receber-export-*.csv | contas_receber |
| 11 | `lancamentos_financeiros` | lancamentos_financeiros-export-*.csv | categorias_financeiras, parcelas_receber |
| 12 | `comissoes` | comissoes-export-*.csv | orcamentos |

### 2.3 Como Importar cada CSV

1. **Acesse a tabela** no Table Editor
2. Clique no botão **"Import Data"** (ícone de upload)
3. Selecione **"Import data from CSV"**
4. Faça upload do arquivo CSV correspondente
5. **Configure o separador** para `;` (ponto e vírgula)
6. Verifique se as colunas estão mapeadas corretamente
7. Clique em **"Import"**

---

## 📋 PASSO 3: CONFIGURAR USUÁRIOS (Auth)

### 3.1 Criar usuários no novo projeto

Os usuários precisam ser recriados manualmente no Authentication:
- Acesse: `https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/auth/users`

### 3.2 Usuários do sistema atual (para referência):
```
c6105b6e-0416-437b-9e18-70dbe8db0a87 - Usuário principal
89af99ca-ebaa-45de-975d-f01ac43f4429 - Usuário secundário
2ff0b7bb-41ea-45b8-a2a3-3c4a9b9704e0 - Outro usuário
```

### 3.3 Após criar os usuários:
Execute este SQL para associá-los às organizações:

```sql
-- Inserir membros da organização Prisma
INSERT INTO organization_members (user_id, organization_id, role)
VALUES 
  ('SEU_USER_ID_AQUI', '11111111-1111-1111-1111-111111111111', 'owner')
ON CONFLICT (user_id, organization_id) DO NOTHING;
```

---

## 📋 PASSO 4: TESTAR O SISTEMA

### 4.1 Atualizar .env.production

```env
VITE_SUPABASE_PROJECT_ID="tjwpqrlfhngibuwqodcn"
VITE_SUPABASE_URL="https://tjwpqrlfhngibuwqodcn.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_5XRNjuD6tThVntkB-4_O5g_dq8RBCN5"
```

### 4.2 Deploy para Vercel/Netlify

Crie um novo deploy apontando para o novo Supabase para testar.

---

## ⚠️ NOTAS IMPORTANTES

### Separador CSV
- Os CSVs exportados usam **`;`** (ponto e vírgula) como separador
- Configure isso corretamente no Supabase ao importar

### Ordem de Importação
- **SEMPRE** importe na ordem indicada para evitar erros de Foreign Key

### Dados Limpos
- Os CSVs contêm dados REAIS da Prisma Interiores
- Teste em staging antes de usar em produção

### IDs Preservados
- Todos os UUIDs originais são preservados
- Isso mantém as relações entre tabelas intactas

---

## 📁 LISTA DE CSVs NECESSÁRIOS

Mova estes arquivos de `C:\Users\Gabri\Downloads\CSV TABELAS\` para `docs\backup\`:

- [ ] materiais-export-*.csv (~1200 registros)
- [ ] contatos-export-*.csv (58 registros)
- [ ] orcamentos-export-*.csv (55 registros)
- [ ] cortina_items-export-*.csv (~100 registros)
- [ ] lancamentos_financeiros-export-*.csv (~170 registros)
- [ ] atividades_crm-export-*.csv (126 registros)
- [ ] oportunidades-export-*.csv (75 registros)
- [ ] categorias_financeiras-export-*.csv (74 registros)
- [ ] servicos_confeccao-export-*.csv (33 registros)
- [ ] contas_receber-export-*.csv (19 registros)
- [ ] parcelas_receber-export-*.csv (28 registros)
- [ ] comissoes-export-*.csv (1 registro)
