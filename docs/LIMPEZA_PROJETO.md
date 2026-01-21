# 🧹 Plano de Limpeza do Projeto - StudioOS

**Data:** 2026-01-16  
**Objetivo:** Remover arquivos desnecessários antes de iniciar o MVP

---

## 📋 CATEGORIAS DE LIMPEZA

### 1. ✅ MIGRATIONS - Manter todas
**Status:** Todas as migrations devem ser mantidas
**Motivo:** Migrations são históricas e necessárias para setup de novos ambientes

**Ações:**
- ✅ Manter todas as 110 migrations
- ⚠️ Migrations com nomes não padronizados são válidas (ex: `20260109_fix_solicitacoes_visita_complete.sql`)

---

### 2. 🗑️ SCRIPTS DE TESTE/DIAGNÓSTICO - Remover temporários

**Scripts a REMOVER (scripts de teste/diagnóstico temporários):**
- `teste-conexao.mjs` - Teste temporário
- `teste-crm-producao.mjs` - Teste temporário
- `teste-excluir-orcamento.mjs` - Teste temporário
- `teste-exclusao-frontend.mjs` - Teste temporário
- `teste-feature-flags.mjs` - Teste temporário
- `teste-fluxo-e2e.mjs` - Teste temporário
- `teste-performance.mjs` - Teste temporário
- `ver-colunas.mjs` - Diagnóstico temporário
- `verificar-bugs.mjs` - Diagnóstico temporário
- `verificar-calculos.mjs` - Diagnóstico temporário
- `verificar-schema.mjs` - Diagnóstico temporário (manter `verificar-schema-completo.mjs`)
- `verificar-solicitacoes-visita.mjs` - Diagnóstico temporário
- `verificar-todas-constraints-orcamentos.mjs` - Diagnóstico temporário
- `diagnostico-exclusao-orcamento.mjs` - Diagnóstico temporário
- `setup-teste-multitenancy.mjs` - Setup de teste temporário

**Scripts a MANTER (scripts úteis para operação):**
- `aplicar-feature-flags.mjs` - Útil para configuração
- `aplicar-fix-oportunidades.mjs` - Útil para correções
- `aplicar-migration-pedidos.mjs` - Útil para migrações
- `atualizar-plano-prisma.mjs` - Útil para configuração
- `auditoria-completa-sistema.mjs` - Útil para auditoria
- `criar-pedidos-de-orcamentos.mjs` - Útil para importação
- `criar-pedidos-do-historico.mjs` - Útil para importação
- `executar-sql-direto.mjs` - Útil para execução de SQL
- `importar-historico-producao.mjs` - Útil para importação
- `importar-solicitacoes-visita.mjs` - Útil para importação
- `migrar-dados-v2.mjs` - Útil para migração
- `teste-performance.mjs` - Pode ser útil, mas verificar se ainda é necessário
- `validar-metricas-staging.mjs` - Útil para validação
- `verificar-adicionar-admin.mjs` - Útil para administração
- `verificar-schema-completo.mjs` - Útil para verificação completa

---

### 3. 🗑️ DOCS/BACKUP - Remover backups antigos

**Pasta `docs/backup/` - Remover:**
- `00_RESUMO.md` - Backup antigo
- `01_INSTRUCOES_MIGRACAO.md` - Backup antigo
- `11_RLS_FINAL_CORRIGIDO.sql` - Backup antigo (já aplicado)
- `12_FIX_RECURSION.sql` - Backup antigo (já aplicado)
- `13_FIX_USER_ROLES.sql` - Backup antigo (já aplicado)
- `EXECUTAR_NO_NOVO_SUPABASE.md` - Backup antigo
- `GUIA_IMPORTACAO_CSV.md` - Backup antigo
- `MIGRACAO_COMPLETA.sql` - Backup antigo (já aplicado)

**Motivo:** Esses arquivos são backups de migrações antigas que já foram aplicadas. As migrations atuais em `supabase/migrations/` são a fonte de verdade.

---

### 4. 🗑️ DOCS OBSOLETOS - Revisar e remover

**Documentos que podem ser removidos (obsoletos ou duplicados):**
- `ANALISE_UX_UI_PRATICA.md` - Análise antiga (substituída por documentos mais recentes)
- `BUGS_CORRIGIDOS.md` - Histórico antigo (informação já consolidada)
- `BUGS_IDENTIFICADOS.md` - Histórico antigo (informação já consolidada)
- `CHECKLIST_PREPARACAO.md` - Checklist antigo
- `COMO_ACESSAR_CONFIGURACOES.md` - Guia antigo
- `COMO_OBTER_TOKEN_VERCEL.md` - Guia antigo
- `DEBUG_THEME_SELECTOR.md` - Debug antigo (já resolvido)
- `DEPLOY_PRODUCAO.md` - Guia antigo (pode ser consolidado)
- `FIX_COLUNAS_FALTANTES.md` - Fix antigo (já aplicado)
- `GUIA_LOADING_STATES.md` - Guia antigo
- `GUIA_PRODUCAO_MONITORAMENTO.md` - Guia antigo
- `GUIA_STAGING.md` - Guia antigo
- `IMPLEMENTACAO_FINAL.md` - Documento antigo
- `MELHORIAS_TOASTS.md` - Histórico antigo
- `MIGRACAO_LOVABLE_SUPABASE.md` - Migração antiga (já concluída)
- `MIGRACAO_TOASTS.md` - Histórico antigo
- `MONITORAMENTO_PERFORMANCE.md` - Guia antigo
- `OTIMIZACAO_PERFORMANCE.md` - Guia antigo
- `OTIMIZACOES_APLICADAS.md` - Histórico antigo
- `PLANO_EXECUCAO_SPRINT2.md` - Plano antigo (substituído por ANALISE_MVP_STUDIOOS.md)
- `PROGRESSO_SPRINT2.md` - Progresso antigo
- `PROGRESSO_TOASTS.md` - Progresso antigo
- `PROXIMOS_PASSOS_SPRINT2.md` - Próximos passos antigos
- `PLANO_RESPONSIVIDADE.md` - Plano antigo (já implementado)
- `RESUMO_OTIMIZACOES.md` - Resumo antigo
- `RESUMO_SPRINT2_COMPLETO.md` - Resumo antigo
- `STATUS_COMPLETO_SPRINT2.md` - Status antigo
- `SUGESTAO_CARDS_FINANCEIRO.md` - Sugestão antiga (já implementada)
- `SISTEMA_TEMAS.md` - Documento antigo (tema foi revertido)
- `TRATAMENTO_ERROS.md` - Guia antigo

**Documentos a MANTER (importantes para referência):**
- `ANALISE_MVP_STUDIOOS.md` - ✅ Plano oficial do MVP
- `ANALISE_MVP_CROSSCHECK.md` - ✅ Análise cruzada
- `BACKLOG_FUNCIONALIDADES.md` - ✅ Backlog de funcionalidades
- `DIAGNOSTICO_FEEDBACKS_USUARIOS.md` - ✅ Diagnóstico de feedbacks
- `EXPANSAO_ERP_GENERALIZACAO.md` - ✅ Expansão do ERP
- `LANDING_PAGES_PERSONALIZADAS.md` - ✅ Landing pages
- `MODELO_NEGOCIO.md` - ✅ Modelo de negócio
- `PLANO_EXECUCAO_FUTURO.md` - ✅ Plano de execução
- `REBRANDING_STUDIOOS.md` - ✅ Rebranding
- `RELATORIO_COMPARATIVO_DOCUMENTOS.md` - ✅ Relatório comparativo
- `RESUMO_AUDITORIA_SISTEMA.md` - ✅ Resumo de auditoria
- `RESUMO_EXECUTIVO_EXPANSAO.md` - ✅ Resumo executivo
- `RESUMO_EXECUTIVO_FEEDBACKS.md` - ✅ Resumo executivo
- `REVISAO_ARQUITETURA_COMPLETA.md` - ✅ Revisão de arquitetura
- `REVISAO_ARQUITETURA_DETALHADA.md` - ✅ Revisão detalhada
- `AUDITORIA_SISTEMA.json` - ✅ Auditoria em JSON
- `AJUSTE_LIMITES.md` - ✅ Ajuste de limites

---

### 5. 🗑️ PASTA DIST/ - Já no .gitignore

**Status:** A pasta `dist/` já está no `.gitignore`, então não precisa ser removida manualmente. Ela será ignorada pelo Git.

---

## 📊 RESUMO DA LIMPEZA

### Arquivos a REMOVER:
- **Scripts de teste/diagnóstico:** ~14 arquivos
- **Docs/backup:** ~8 arquivos
- **Docs obsoletos:** ~28 arquivos

### Total estimado: ~50 arquivos

---

## ⚠️ ANTES DE EXECUTAR

1. **Fazer backup do repositório** (commit atual ou branch de backup)
2. **Revisar lista** de arquivos a remover
3. **Confirmar** que não há dependências

---

## 🚀 EXECUÇÃO

✅ **LIMPEZA EXECUTADA COM SUCESSO!**

**Data:** 2026-01-16

### Arquivos Removidos:

#### Scripts de Teste/Diagnóstico (14 arquivos):
- ✅ `teste-conexao.mjs`
- ✅ `teste-crm-producao.mjs`
- ✅ `teste-excluir-orcamento.mjs`
- ✅ `teste-exclusao-frontend.mjs`
- ✅ `teste-feature-flags.mjs`
- ✅ `teste-fluxo-e2e.mjs`
- ✅ `teste-performance.mjs`
- ✅ `ver-colunas.mjs`
- ✅ `verificar-bugs.mjs`
- ✅ `verificar-calculos.mjs`
- ✅ `verificar-schema.mjs`
- ✅ `verificar-solicitacoes-visita.mjs`
- ✅ `verificar-todas-constraints-orcamentos.mjs`
- ✅ `diagnostico-exclusao-orcamento.mjs`
- ✅ `setup-teste-multitenancy.mjs`

#### Pasta docs/backup/ (8 arquivos):
- ✅ Pasta completa removida

#### Documentos Obsoletos (28 arquivos):
- ✅ `ANALISE_UX_UI_PRATICA.md`
- ✅ `BUGS_CORRIGIDOS.md`
- ✅ `BUGS_IDENTIFICADOS.md`
- ✅ `CHECKLIST_PREPARACAO.md`
- ✅ `COMO_ACESSAR_CONFIGURACOES.md`
- ✅ `COMO_OBTER_TOKEN_VERCEL.md`
- ✅ `DEBUG_THEME_SELECTOR.md`
- ✅ `DEPLOY_PRODUCAO.md`
- ✅ `FIX_COLUNAS_FALTANTES.md`
- ✅ `GUIA_LOADING_STATES.md`
- ✅ `GUIA_PRODUCAO_MONITORAMENTO.md`
- ✅ `GUIA_STAGING.md`
- ✅ `IMPLEMENTACAO_FINAL.md`
- ✅ `MELHORIAS_TOASTS.md`
- ✅ `MIGRACAO_LOVABLE_SUPABASE.md`
- ✅ `MIGRACAO_TOASTS.md`
- ✅ `MONITORAMENTO_PERFORMANCE.md`
- ✅ `OTIMIZACAO_PERFORMANCE.md`
- ✅ `OTIMIZACOES_APLICADAS.md`
- ✅ `PLANO_EXECUCAO_SPRINT2.md`
- ✅ `PROGRESSO_SPRINT2.md`
- ✅ `PROGRESSO_TOASTS.md`
- ✅ `PROXIMOS_PASSOS_SPRINT2.md`
- ✅ `PLANO_RESPONSIVIDADE.md`
- ✅ `RESUMO_OTIMIZACOES.md`
- ✅ `RESUMO_SPRINT2_COMPLETO.md`
- ✅ `STATUS_COMPLETO_SPRINT2.md`
- ✅ `SUGESTAO_CARDS_FINANCEIRO.md`
- ✅ `SISTEMA_TEMAS.md`
- ✅ `TRATAMENTO_ERROS.md`

**Total removido:** ~50 arquivos

### Próximos Passos:
1. ✅ Verificar se .gitignore está completo
2. Fazer commit das mudanças
3. Iniciar Sprint 1 do MVP
