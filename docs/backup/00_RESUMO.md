# Backup do Banco de Dados - Resumo

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `01_INSTRUCOES_MIGRACAO.md` | Guia completo de migração |
| `02_SCHEMA_TYPES.sql` | Tipos enum (app_role) |
| `03_SCHEMA_TABLES.sql` | Todas as 40 tabelas + índices + RLS |
| `04_SCHEMA_FUNCTIONS_1.sql` | Funções principais (30+ funções) |
| `07_DATA_BASE.sql` | Dados base (organizations, plans, formas pagamento, configs) |

## Próximos Passos

### Para exportar dados completos (materiais, orçamentos, etc):

**Opção 1 - Via Supabase CLI (RECOMENDADO):**
```bash
supabase link --project-ref emmogpqoqfmwtipxwcit
supabase db dump --data-only -f backup_data_completo.sql
```

**Opção 2 - Via Query no Lovable:**
Peça-me para exportar tabelas específicas em formato INSERT SQL.

## Estatísticas do Banco

- **40 tabelas** no schema public
- **~2.300 registros** total
- **~30 funções** e triggers
- **2 organizações** (Prisma + CM Home Decor)
- **4 planos** de assinatura configurados

## Notas Importantes

1. Os `user_id` estão vinculados ao auth.users do Supabase original
2. Após migrar, você precisará:
   - Criar novos usuários
   - Atualizar `user_roles` e `organization_members` com os novos IDs
   - Recriar as políticas RLS se necessário
