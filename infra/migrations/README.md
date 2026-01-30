# StudioOS V5 - Database Schema

## Estrutura

```
infra/migrations/
├── 00000000000000_baseline_schema.sql    # Schema completo consolidado
├── 00000000000001_initial_seed.sql        # Dados essenciais iniciais
├── baseline-metadata.json                  # Metadados do schema
└── archive/                                # Migrations antigas (140 arquivos)
```

## Restore do Banco (Do Zero)

Para recriar o banco de dados completo em uma nova instância:

```bash
# 1. Criar banco novo (ex: no Supabase Dashboard ou CLI)

# 2. Aplicar schema
psql $DATABASE_URL < 00000000000000_baseline_schema.sql

# 3. Aplicar seed
psql $DATABASE_URL < 00000000000001_initial_seed.sql
```

## O que está incluído

### Schema Baseline (00000000000000_baseline_schema.sql)
- Todas as 140 migrations consolidadas
- Tabelas do sistema (organizations, users, etc)
- Tabelas de domínio (orcamentos, clientes, pedidos)
- Tabelas de fornecedores
- RLS Policies
- Functions e Triggers
- Indexes

### Seed (00000000000001_initial_seed.sql)
- Planos: Starter, Pro, Business
- Feature flags padrão
- Categorias de materiais
- Unidades de medida
- Tipos de cortina
- Status de pedido

## Novas Migrations

Após o baseline, novas alterações devem seguir o padrão:

```
YYYYMMDD_HHMMSS_descricao.sql
```

Exemplo: `20260201_120000_add_campo_telefone_clientes.sql`

## Backup

Backups automáticos estão em:
```
infra/backups/
└── pre-v5-complete-YYYYMMDD.sql
```

## Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `organizations` | Multi-tenant - cada cliente tem uma org |
| `organization_members` | Ligação user <> org com roles |
| `platform_admins` | Super admins da plataforma |
| `plans` | Planos de assinatura |
| `orcamentos` | Orçamentos dos clientes |
| `orcamento_items` | Itens de cada orçamento |
| `clientes` | Cadastro de clientes |
| `pedidos` | Pedidos gerados de orçamentos |
| `fornecedores` | Cadastros de fornecedores |
| `supplier_catalog` | Catálogo de materiais |

## Notas

- O schema baseline tem **546 KB** e **15.529 linhas**
- Consolidado de **140 migrations** originais
- Gerado em: 2026-01-29
- Usar sempre o baseline para novos deploys
