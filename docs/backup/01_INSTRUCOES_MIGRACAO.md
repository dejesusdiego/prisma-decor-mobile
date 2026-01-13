# Instruções de Migração do Banco de Dados Supabase

## Visão Geral

Este documento contém instruções para migrar o banco de dados do Prisma ERP para outro projeto Supabase.

## Método Recomendado: Supabase CLI + pg_dump

### 1. Instalar Supabase CLI
```bash
npm install -g supabase
```

### 2. Fazer Login
```bash
supabase login
```

### 3. Vincular ao projeto origem
```bash
supabase link --project-ref emmogpqoqfmwtipxwcit
```

### 4. Exportar Schema (estrutura)
```bash
supabase db dump --schema public -f backup_schema.sql
```

### 5. Exportar Dados
```bash
supabase db dump --data-only -f backup_data.sql
```

### 6. No projeto DESTINO, importar
```bash
# Vincular ao novo projeto
supabase link --project-ref SEU_NOVO_PROJECT_ID

# Importar schema primeiro
supabase db push --file backup_schema.sql

# Depois importar dados
supabase db push --file backup_data.sql
```

---

## Método Alternativo: Via SQL Editor no Dashboard

Se você tem acesso ao Supabase Dashboard do projeto destino:

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql
2. Execute os arquivos na ordem:
   - `02_SCHEMA_TYPES.sql` (tipos enum)
   - `03_SCHEMA_TABLES.sql` (tabelas)
   - `04_SCHEMA_FUNCTIONS.sql` (funções)
   - `05_SCHEMA_TRIGGERS.sql` (triggers)
   - `06_SCHEMA_POLICIES.sql` (RLS policies)
   - `07_DATA_*.sql` (dados de cada tabela)

---

## Estrutura do Banco de Dados

### Tabelas (40 total)
| Tabela | Registros |
|--------|-----------|
| materiais | ~1200 |
| lancamentos_financeiros | ~170 |
| movimentacoes_extrato | ~151 |
| atividades_crm | ~102 |
| cortina_items | ~102 |
| historico_producao | ~89 |
| oportunidades | ~75 |
| categorias_financeiras | ~74 |
| contatos | ~58 |
| orcamentos | ~52 |
| servicos_confeccao | ~33 |
| parcelas_receber | ~28 |
| itens_pedido | ~27 |
| materiais_pedido | ~22 |
| contas_receber | ~19 |
| pedidos | ~15 |
| formas_pagamento | ~14 |
| regras_conciliacao | ~12 |
| solicitacoes_visita | ~12 |
| configuracoes_sistema | ~9 |
| contas_pagar | ~7 |
| plans | 4 |
| organization_members | 3 |
| user_roles | 3 |
| organizations | 2 |

### Organizações Existentes
- **Prisma Interiores**: `11111111-1111-1111-1111-111111111111`
- **CM HOME DECOR**: `22222222-2222-2222-2222-222222222222`

---

## Notas Importantes

1. **Ordem de Importação**: Respeite as foreign keys - importe primeiro as tabelas pai
2. **Usuários**: Os user_ids estão vinculados ao auth.users do Supabase original
3. **organization_id**: Cada registro tem organization_id para multi-tenancy
4. **RLS**: As policies usam funções como `get_user_organization_id()`
