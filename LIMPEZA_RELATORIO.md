# Relatório de Limpeza - StudioOS Rescue Engineer

**Data:** 2026-01-30  
**Versão:** V5 The Clean Split  
**Status:** Em Análise

---

## Resumo Executivo

Este relatório documenta o estado atual do projeto StudioOS e o plano de limpeza/consolidação antes da migração para arquitetura unificada.

| Métrica | Valor |
|---------|-------|
| Total de arquivos analisados | 1,200+ |
| Arquivos de documentação | 63 `.md` |
| Migrations históricas | 140+ (arquivadas) |
| Aplicações | 4 (1 V4 legado + 3 V5) |
| Package.json files | 4 |
| Código duplicado identificado | 12 componentes/hooks |

---

## 1. Análise da Documentação (63 arquivos)

### 1.1 Arquivos Obsoletos (Arquivar)

Estes documentos referem-se a sprints concluídas, hotfixes aplicados ou decisões já implementadas:

| Arquivo | Motivo |
|---------|--------|
| `AJUSTE_LIMITES.md` | Hotfix aplicado |
| `AJUSTE_REDUNDANCIA_UNIQUE.md` | Migration executada |
| `AJUSTES_FINAIS_3_PONTOS.md` | Concluído |
| `AJUSTES_FINAIS_APLICADOS.md` | Concluído |
| `ANALISE_MVP_CROSSCHECK.md` | Análise histórica |
| `ANALISE_MVP_STUDIOOS.md` | Análise histórica |
| `APLICAR_FIX_RLS_RECURSAO.md` | Fix aplicado |
| `APLICAR_MIGRATION_USER_ONBOARDING.md` | Migration aplicada |
| `APROVAR_FORNECEDOR_MANUAL.md` | Processo obsoleto |
| `ARQUITETURA_ROTAS_V4_REFATORADA.md` | V4 obsoleto |
| `ATUALIZACAO_DOMINIOS_E_ROTAS.md` | Implementado |
| `AUDIT_SUPPLIERS_V1_HOTFIX.md` | Hotfix aplicado |
| `AUDITORIA_TECH_LEAD_SUPPLIERS_V1.md` | Audit concluído |
| `CHECKLIST_MVP.md` | MVP concluído |
| `CONTEXT_DUMP_GAP_ANALYSIS_SUPPLIERS_V1.md` | Análise concluída |
| `CORRECOES_ESTRUTURA_DOMINIOS.md` | Implementado |
| `CORRECOES_FINAIS_DOMINIOS.md` | Implementado |
| `CREDENCIAIS_ACESSO.md` | Dados sensíveis - remover |
| `DESABILITAR_CONFIRMACAO_EMAIL.md` | Config aplicada |
| `DIAGNOSTICO_COMPLETO_PROJETO.md` | Diagnóstico antigo |
| `DIAGNOSTICO_FEEDBACKS_USUARIOS.md` | Análise histórica |
| `DIAGNOSTICO_ROTAS_DOMINIOS_CRITICO.md` | Problema resolvido |
| `DOMINIOS_E_ROTAS.md` | V4 obsoleto |
| `ESTRUTURA_DOMINIOS_V2.md` | Versão antiga |
| `ESTRUTURA_DOMINIOS_V3_FINAL.md` | V4 obsoleto |
| `ESTRUTURA_DOMINIOS.md` | Versão antiga |
| `EXPANSAO_ERP_GENERALIZACAO.md` | Planejamento antigo |
| `GUIA_TESTE_SUPPLIER_CATALOG.md` | Testes concluídos |
| `LANDING_PAGES_PERSONALIZADAS.md` | Implementado |
| `PLANO_EXECUCAO_FUTURO.md` | Desatualizado |
| `PLANO_EXECUCAO_MVP_COMPLETO.md` | MVP concluído |
| `PLANO_EXECUCAO_MVP_FINAL.md` | MVP concluído |
| `PLANO_EXECUCAO_PRIORIZADO.md` | Desatualizado |
| `PLANO_SPRINTS_6_12_COMPLETO.md` | Sprints concluídas |
| `PR_CONTRATO_DOMINIOS_PRODUCAO.md` | PR merged |
| `PR_DOMINIOS_ROTAS_REDIRECTS.md` | PR merged |
| `PRODUCAO_VS_DEV_ROTAS.md` | Documentação temporária |
| `PRODUCT_BACKLOG_STUDIOOS.md` | Backlog antigo |
| `QA_CONTRATO_DOMINIOS_PRODUCAO.md` | QA concluído |
| `QA_SUPPLIERS_V1_HOTFIX.md` | QA concluído |
| `QA_TEST_EXECUTION_GUIDE.md` | Testes concluídos |
| `QA_TEST_RESULTS.md` | Resultados antigos |
| `REBRANDING_STUDIOOS.md` | Rebranding aplicado |
| `RELATORIO_COMPARATIVO_DOCUMENTOS.md` | Análise concluída |
| `RELATORIO_GAP_ANALYSIS_MVP.md` | Análise concluída |
| `RELATORIO_POLIMENTO_SPRINTS_6_7_8.md` | Sprints concluídas |
| `RELATORIO_SUPPLIERS_V1.md` | Release concluída |
| `RESUMO_AUDITORIA_SISTEMA.md` | Audit antigo |
| `RESUMO_CONTRATO_DOMINIOS_PRODUCAO.md` | Produção estável |
| `RESUMO_EXECUTIVO_EXPANSAO.md` | Expansão aplicada |
| `RESUMO_EXECUTIVO_FEEDBACKS.md` | Feedbacks processados |
| `RESUMO_EXECUTIVO_PR_DOMINIOS.md` | PR merged |
| `RESUMO_EXECUTIVO.md` | Resumo antigo |
| `RESUMO_HOTFIX_SUPPLIERS_V1.md` | Hotfix aplicado |
| `REVISAO_ARQUITETURA_COMPLETA.md` | Arquitetura V5 ativa |
| `REVISAO_ARQUITETURA_DETALHADA.md` | Detalhada no V5 |
| `ROADMAP_MONITORAMENTO.md` | Roadmap antigo |
| `SEGURANCA_DOMINIOS.md` | Segurança implementada |
| `SUBDOMINIOS_SPRINT2.md` | Sprint 2 concluída |
| `SUPPLIER_CATALOG_V1.md` | Catálogo ativo |
| `SUPPLIER_SELF_SERVICE_REGISTRATION.md` | Implementado |
| `TESTES_REGRESSAO_SPRINT6.md` | Testes concluídos |

### 1.2 Arquivos Essenciais (Manter)

| Arquivo | Propósito |
|---------|-----------|
| `THE_CLEAN_SPLIT_V5_ARCHITECTURE.md` | Arquitetura atual |
| `V5_DEPLOY_GUIDE.md` | Guia de deploy |
| `V5_MIGRATION_GUIDE.md` | Guia de migração |
| `CONTEXTUALIZACAO_CRITICA_V5.md` | Contexto crítico |
| `FEATURE_FLAGS_USAGE.md` | Uso de feature flags |
| `LIMPEZA_PROJETO.md` | Este plano de limpeza |
| `V5_AUTOMATION_SCRIPTS.md` | Scripts de automação |
| `MODELO_NEGOCIO.md` | Modelo de negócio |
| `BACKLOG_FUNCIONALIDADES.md` | Backlog atual |

### 1.3 Arquivos de Dados (JSON)

- `AUDITORIA_SISTEMA.json` - Dados de audit - **Mover para infra/audits/**

---

## 2. Análise das Migrations

### 2.1 Estado Atual (Já Consolidado ✓)

```
infra/migrations/
├── 00000000000000_baseline_schema.sql    (546 KB)
├── 00000000000001_initial_seed.sql       (Seed data)
├── baseline-metadata.json
├── README.md
└── archive/
    └── 140+ arquivos históricos
```

**Status:** A consolidação das migrations já foi executada. O schema baseline contém todo o estado atual do banco.

### 2.2 Verificação do Baseline

O arquivo `00000000000000_baseline_schema.sql` inclui:
- Todas as tabelas (users, organizations, orcamentos, pedidos, etc.)
- Todas as funções e triggers
- Todas as políticas RLS
- Domains e subdomains schema
- Feature flags tables
- Supplier catalog tables
- Production automation tables

---

## 3. Análise da Estrutura de Código

### 3.1 Aplicações

#### V4 Legado (src/)
**Status:** Manter para referência até migração completa

```
src/
├── components/          # 50+ componentes
│   ├── admin/
│   ├── financeiro/
│   ├── orcamento/
│   └── ui/
├── domains/             # Sistema de domínios V4
├── hooks/               # Hooks React
├── integrations/        # Supabase client
├── lib/                 # Utilidades
├── pages/               # 30+ páginas
├── routing/             # Router V4
├── styles/
└── types/
```

#### V5 Ativo (apps/)
**Status:** Em produção

```
apps/
├── core/                # ERP Principal
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/      # Componentes básicos
│   │   │   └── wizard/  # Wizard de orçamentos
│   │   ├── hooks/       # useAuth, useOrcamentos, etc.
│   │   ├── lib/         # supabase.ts, utils.ts
│   │   └── pages/       # Dashboard, Orcamentos, NovoOrcamento
│   ├── package.json     # 12 deps
│   └── vite.config.ts
│
├── platform/            # Admin Platform
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/       # Dashboard, Users, Organizations, Plans
│   ├── package.json     # 11 deps
│   └── vite.config.ts
│
└── portal/              # Portal de Fornecedores
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   └── pages/       # Dashboard, Catalogo, Pedidos
    ├── package.json     # 11 deps
    └── vite.config.ts
```

### 3.2 Código Duplicado Identificado

| Componente/Hook | Localização | Duplicado Em | Ação Recomendada |
|-----------------|-------------|--------------|------------------|
| `supabase.ts` | apps/core/src/lib | platform, portal | Criar shared package |
| `useAuth.ts` | apps/core/src/hooks | platform, portal | Criar shared package |
| `Button.tsx` | apps/core/src/components/ui | platform, portal | Shared UI lib |
| `Card.tsx` | apps/core/src/components/ui | platform, portal | Shared UI lib |
| `Input.tsx` | apps/core/src/components/ui | platform, portal | Shared UI lib |
| `tailwind.config.js` | apps/core | platform, portal | Shared config |
| `vite.config.ts` | apps/core | platform, portal | Shared config |
| `utils.ts` (cn) | apps/core/src/lib | platform, portal | Shared lib |
| `ConfigError.tsx` | apps/platform/src/components | portal | Shared component |
| `ProtectedRoute.tsx` | apps/core/src/components | platform, portal | Shared component |
| `LoginPage.tsx` | apps/core/src/pages | platform, portal | Shared template |
| `index.css` | apps/core/src | platform, portal | Shared styles |

---

## 4. Análise de Configurações

### 4.1 Múltiplos package.json

| Arquivo | Propósito | Deps | Status |
|---------|-----------|------|--------|
| `/package.json` | V4 Legacy | 68 | Deprecated |
| `/apps/core/package.json` | V5 ERP | 12 | Active |
| `/apps/platform/package.json` | V5 Admin | 11 | Active |
| `/apps/portal/package.json` | V5 Portal | 11 | Active |

### 4.2 Divergências de Versão

```
React:
  Root:    18.3.1
  Core:    18.2.0  ← Desatualizado
  Platform: 18.3.1
  Portal:  18.3.1

React Router:
  Root:    6.30.1
  Core:    6.21.0  ← Desatualizado
  Platform: 7.0.2  ← Major diferente!
  Portal:  7.0.2   ← Major diferente!

Vite:
  Root:    5.4.19
  Core:    5.0.8   ← Desatualizado
  Platform: 5.4.11
  Portal:  5.4.11
```

### 4.3 Vite Configurations

Todas as apps têm configurações similares:
- Portas diferentes (5173, 5174, 5175)
- Mesmos aliases (@/ → ./src)
- Mesmos plugins (react, path)
- Builds separados para Vercel

---

## 5. Arquivos de Deploy

### 5.1 Scripts de Deploy

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| `DEPLOY_ALL_APPS_FIXED.bat` | Deploy Windows | Ativo |
| `DEPLOY_ALL_APPS_FIXED.ps1` | Deploy PowerShell | Ativo |
| `REDEPLOY_PLATFORM_PORTAL.bat` | Redeploy parcial | Ativo |
| `v5-deploy-all.sh` | Deploy Unix | Ativo |
| `DEPLOY_*.md` (vários) | Guias de deploy | Consolidar |

### 5.2 Configurações Vercel

```
apps/
├── core/vercel.json      # Config core
├── platform/vercel.json  # Config platform
└── portal/vercel.json    # Config portal
```

Todos idênticos com SPA routing config.

---

## 6. Recomendações de Limpeza

### 6.1 Fase 1: Documentação (Alta Prioridade)

1. **Criar estrutura de arquivamento:**
   ```
   docs/archive/
   ├── 2026-01-30_manifest.md
   ├── obsolete/        # 35 arquivos
   └── historical/      # 20 arquivos
   ```

2. **Manter na raiz apenas:**
   - `README.md` (novo)
   - `ARCHITECTURE.md` (novo)
   - `V5_*.md` (guias ativos)
   - `FEATURE_FLAGS_USAGE.md`
   - `MODELO_NEGOCIO.md`
   - `BACKLOG_FUNCIONALIDADES.md`

### 6.2 Fase 2: Configurações (Média Prioridade)

1. **Criar `packages/shared/`** para código compartilhado:
   ```
   packages/shared/
   ├── package.json
   ├── src/
   │   ├── components/ui/   # Button, Card, Input
   │   ├── hooks/           # useAuth
   │   ├── lib/             # supabase client
   │   └── styles/          # CSS compartilhado
   └── tsconfig.json
   ```

2. **Sincronizar versões** nas apps V5

3. **Criar workspace root package.json** com turborepo/pnpm workspaces

### 6.3 Fase 3: Código Legado (Baixa Prioridade)

1. Mover `src/` para `archive/src-v4/`
2. Manter apenas referências críticas
3. Documentar migração completa no ARCHITECTURE.md

---

## 7. Métricas de Cleanup

### Antes
- 63 documentos na raiz
- 140+ migrations soltas
- 4 package.json
- Código duplicado em 3 apps
- 12+ componentes duplicados

### Depois (Proposto)
- 8 documentos na raiz + archive/
- 2 migrations ativas + archive/
- 1 workspace root + 3 apps
- Código compartilhado em packages/shared/
- 0 componentes duplicados

---

## 8. Próximos Passos

1. [ ] Aprovar plano de limpeza
2. [ ] Executar arquivamento de documentos
3. [ ] Criar packages/shared/
4. [ ] Migrar componentes duplicados
5. [ ] Atualizar documentação essencial
6. [ ] Configurar workspaces

---

**Relatório gerado por:** StudioOS Rescue Engineer  
**Data:** 2026-01-30  
**Versão:** 1.0
