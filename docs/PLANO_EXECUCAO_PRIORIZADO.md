# 🚀 Plano de Execução Priorizado - StudioOS MVP

**Data:** 2026-01-16  
**Baseado em:** `ANALISE_MVP_STUDIOOS.md` + Análise do código atual  
**Filosofia:** Facilidade + Crítico + Impacto

---

## 📊 RESUMO DO ESTADO ATUAL

### ✅ O que JÁ ESTÁ PRONTO:
- ✅ Multi-tenant completo (organizations, RLS)
- ✅ CRM básico (contatos, pipeline, atividades)
- ✅ Orçamentos (wizard, cálculos, PDF)
- ✅ Produção (Kanban, pedidos, histórico)
- ✅ Instalação (agendamento, agenda)
- ✅ Financeiro básico (contas pagar/receber, conciliação)
- ✅ Automações core (triggers: orçamento → conta receber → pedido)
- ✅ Gestão de usuários (criar, alterar senha)
- ✅ Roles básicos (admin/user)

### ⚠️ O que ESTÁ PARCIAL:
- ⚠️ Financeiro: Bug de status não atualiza após pagamento
- ⚠️ Dashboard: Dados zerados (queries/filtros)
- ⚠️ Listagens: Sem paginação, filtros, ordenação
- ⚠️ Usuários: Sem soft delete

### ❌ O que NÃO EXISTE:
- ❌ "Esqueci minha senha" (Supabase já tem, só falta UI)
- ❌ Soft delete de usuários
- ❌ Rebranding StudioOS (ainda "Prisma" em vários lugares)
- ❌ Estoque (mesmo simples)
- ❌ Supplier V1
- ❌ Guia de costura PDF
- ❌ Automações faltantes (pedido pronto → instalação, etc.)

---

## 🎯 PRIORIZAÇÃO POR FASE

### FASE 1: QUICK WINS + BUGS CRÍTICOS (1-2 dias)
**Objetivo:** Corrigir bugs que impedem uso + Implementar features fáceis de alto impacto

#### 1.1 "Esqueci minha senha" (FÁCIL - 30min)
**Status:** Supabase já tem `resetPasswordForEmail()`, só falta UI

**Implementação:**
- Adicionar link "Esqueci minha senha" em `src/pages/Auth.tsx`
- Criar estado para modal/dialog de recuperação
- Chamar `supabase.auth.resetPasswordForEmail(email)`
- Mostrar mensagem de sucesso

**Arquivos:**
- `src/pages/Auth.tsx` (adicionar link + handler)
- `src/hooks/useAuth.tsx` (adicionar método `resetPassword` se necessário)

**Impacto:** Alto (UX básico esperado)

---

#### 1.2 Remover botão "Novo Orçamento" duplicado (FÁCIL - 15min)
**Status:** Botão existe em `DashboardContent.tsx` e `OrcamentoSidebar.tsx`

**Implementação:**
- Remover botão de `DashboardContent.tsx` (manter apenas no sidebar)
- OU remover do sidebar e manter no dashboard (preferência: manter no sidebar)

**Arquivos:**
- `src/components/orcamento/DashboardContent.tsx` (remover botão)
- `src/components/orcamento/OrcamentoSidebar.tsx` (manter botão)

**Impacto:** Médio (confusão de UX)

---

#### 1.3 Rebranding StudioOS - Parte 1: Textos Básicos (FÁCIL - 1h)
**Status:** Ainda tem "Prisma" em vários lugares

**Implementação:**
- Substituir "Prisma" por "StudioOS" em:
  - `package.json` (name)
  - `index.html` (title, meta tags)
  - `src/pages/Auth.tsx` ("Sistema de Orçamentos" → "StudioOS")
  - `src/components/orcamento/OrcamentoSidebar.tsx` (fallback name)
  - `src/components/onboarding/OnboardingDialog.tsx` ("Prisma ERP" → "StudioOS")
  - `src/components/ui/FeatureGate.tsx` (mensagem de upgrade)

**Arquivos:**
- `package.json`
- `index.html`
- `src/pages/Auth.tsx`
- `src/components/orcamento/OrcamentoSidebar.tsx`
- `src/components/onboarding/OnboardingDialog.tsx`
- `src/components/ui/FeatureGate.tsx`

**Impacto:** Alto (identidade do produto)

---

#### 1.4 Corrigir dashboard com dados zerados (MÉDIO - 2-3h)
**Status:** Queries podem estar retornando vazias ou filtros de data incorretos

**Investigação necessária:**
- Verificar `useMetricasCentralizadas.ts` e `useDashboardData.ts`
- Verificar se queries estão filtrando por `organization_id` corretamente
- Verificar se filtros de data estão corretos
- Verificar se há dados no banco para a organização atual

**Implementação:**
- Adicionar logs para debug
- Corrigir queries (adicionar `organization_id` se faltar)
- Corrigir filtros de data (usar `startOfMonth`, `endOfMonth` corretamente)
- Adicionar fallbacks para quando não há dados

**Arquivos:**
- `src/hooks/useMetricasCentralizadas.ts`
- `src/hooks/useDashboardData.ts`

**Impacto:** Crítico (dashboard é a primeira tela)

---

### FASE 2: BUGS CRÍTICOS DE FINANCEIRO (2-3 dias)
**Objetivo:** Corrigir bugs que impedem uso do módulo financeiro

#### 2.1 Corrigir status de contas a receber não atualizando (MÉDIO - 3-4h)
**Status:** Lógica de cálculo dinâmico pode estar sobrescrevendo status do banco

**Investigação necessária:**
- Verificar `src/components/financeiro/ContasReceber.tsx` (linhas 106-140)
- Verificar trigger `supabase/migrations/20251223200921_*.sql`
- Verificar se `statusExibicao` está sobrescrevendo `status` do banco
- Verificar se trigger está atualizando corretamente quando pagamento é registrado

**Implementação:**
- Corrigir lógica de `statusExibicao` para respeitar status do banco primeiro
- Verificar e corrigir trigger de sincronização
- Adicionar logs para debug
- Testar fluxo completo: orçamento → conta receber → pagamento → status atualizado

**Arquivos:**
- `src/components/financeiro/ContasReceber.tsx`
- `src/lib/calculosFinanceiros.ts`
- `supabase/migrations/20251223200921_*.sql` (verificar trigger)

**Impacto:** Crítico (módulo financeiro não funciona)

---

#### 2.2 Melhorar sincronização bidirecional Orçamento ↔ Contas Receber (MÉDIO - 2-3h)
**Status:** Trigger existe mas pode ter race conditions

**Implementação:**
- Revisar trigger `supabase/migrations/20251223200921_*.sql`
- Adicionar condições para evitar loops infinitos
- Adicionar logs para debug
- Testar todos os cenários:
  - Orçamento pago → Conta receber criada
  - Conta receber paga → Orçamento atualizado
  - Orçamento cancelado → Conta receber cancelada

**Arquivos:**
- `supabase/migrations/20251223200921_*.sql`
- `src/lib/integracaoOrcamentoFinanceiro.ts`

**Impacto:** Alto (automação core)

---

### FASE 3: FEATURES BÁSICAS DE UX (2-3 dias)
**Objetivo:** Melhorar experiência básica do usuário

#### 3.1 Implementar soft delete de usuários (MÉDIO - 2h)
**Status:** Não existe, apenas criar/alterar senha

**Implementação:**
- Adicionar campo `deleted_at TIMESTAMP` em `user_roles` (ou criar tabela `user_deletions`)
- Criar migration
- Adicionar botão "Desativar" em `src/pages/GerenciarUsuarios.tsx`
- Filtrar usuários deletados nas queries
- Adicionar RLS policy para não mostrar usuários deletados

**Arquivos:**
- `supabase/migrations/20260116_add_soft_delete_users.sql` (nova migration)
- `src/pages/GerenciarUsuarios.tsx` (adicionar botão + handler)
- `supabase/functions/list-users/index.ts` (filtrar deletados)

**Impacto:** Médio (funcionalidade esperada)

---

#### 3.2 Adicionar paginação em listagens (MÉDIO - 3-4h)
**Status:** Queries sem `limit`/`offset`, UI sem paginação

**Implementação:**
- Adicionar paginação em `src/components/orcamento/ListaOrcamentos.tsx`
- Usar componente `Pagination` existente (se houver) ou criar
- Adicionar `limit` e `offset` nas queries
- Adicionar estado para página atual
- Adicionar controles de paginação na UI

**Arquivos:**
- `src/components/orcamento/ListaOrcamentos.tsx`
- `src/components/ui/Pagination.tsx` (verificar se existe)

**Impacto:** Médio (performance e UX)

---

#### 3.3 Adicionar legendas em gráficos (FÁCIL - 1h)
**Status:** Componente `Legend` importado mas não renderizado

**Implementação:**
- Adicionar `<Legend />` em `src/components/orcamento/charts/GraficoCustos.tsx`
- Verificar outros gráficos que precisam de legendas
- Ajustar layout se necessário

**Arquivos:**
- `src/components/orcamento/charts/GraficoCustos.tsx`
- `src/components/orcamento/charts/DistribuicaoCidades.tsx` (verificar)
- `src/components/orcamento/charts/GraficoFaturamentoMensal.tsx` (verificar)

**Impacto:** Médio (UX - bug alto identificado)

---

#### 3.4 Adicionar tooltips em ícones explicativos (FÁCIL - 1-2h)
**Status:** Falta componente `Tooltip` em ícones

**Implementação:**
- Identificar ícones que precisam de tooltip (ícone de pagamento, status, etc.)
- Adicionar `<Tooltip>` do Radix UI (já existe no projeto)
- Adicionar textos explicativos

**Arquivos:**
- Vários componentes (identificar onde há ícones sem explicação)

**Impacto:** Baixo-Médio (UX - bug alto identificado)

---

### FASE 4: REBRANDING COMPLETO (1 dia)
**Objetivo:** Completar rebranding StudioOS em todos os lugares

#### 4.1 Rebranding StudioOS - Parte 2: PDFs e Metadados (MÉDIO - 2h)
**Status:** PDFs de orçamento ainda podem ter "Prisma"

**Implementação:**
- Verificar `src/lib/gerarPdfOrcamento.ts`
- Substituir "Prisma" por "StudioOS" em:
  - Cabeçalho do PDF
  - Rodapé do PDF
  - Metadados do PDF
- Atualizar logo (se houver)

**Arquivos:**
- `src/lib/gerarPdfOrcamento.ts`

**Impacto:** Médio (identidade do produto)

---

#### 4.2 Rebranding StudioOS - Parte 3: Favicon e Assets (FÁCIL - 30min)
**Status:** Favicon e assets podem ter "Prisma"

**Implementação:**
- Substituir favicon (se houver logo StudioOS)
- Verificar assets públicos
- Atualizar `og-image.jpg` se necessário

**Arquivos:**
- `public/favicon.ico`
- `public/og-image.jpg`
- `index.html` (referências)

**Impacto:** Baixo (identidade visual)

---

### FASE 5: FEATURES NOVAS - ESTOQUE SIMPLES (3-4 dias)
**Objetivo:** Implementar estoque simples e 100% opcional

#### 5.1 Criar estrutura de estoque (MÉDIO - 1 dia)
**Status:** Não existe

**Implementação:**
- Criar migration para:
  - Campo `controla_estoque BOOLEAN DEFAULT false` em `organizations`
  - Campo `controla_estoque BOOLEAN DEFAULT false` em `materiais`
  - Tabela `inventory_items` (produto_id, quantidade_atual, estoque_minimo, organization_id)
  - Tabela `inventory_movements` (tipo: entrada/saída, quantidade, motivo, pedido_id/orcamento_id)
- Criar RLS policies
- Criar triggers para baixa automática (CONDICIONAL: só se `controla_estoque = true`)

**Arquivos:**
- `supabase/migrations/20260117_add_estoque_simples.sql` (nova migration)

**Impacto:** Alto (feature nova P0)

---

#### 5.2 Criar UI básica de estoque (MÉDIO - 2 dias)
**Status:** Não existe

**Implementação:**
- Criar componente `src/components/estoque/DashboardEstoque.tsx`
- Criar componente `src/components/estoque/ListaItensEstoque.tsx`
- Criar componente `src/components/estoque/DialogEntradaSaida.tsx`
- Adicionar rota `/estoque` (só aparece se `controla_estoque = true`)
- Adicionar toggle em Configurações: "Controlar Estoque"
- Adicionar alertas de estoque mínimo

**Arquivos:**
- `src/components/estoque/*` (novos componentes)
- `src/pages/GerarOrcamento.tsx` (adicionar rota)
- `src/pages/ConfiguracoesOrganizacao.tsx` (adicionar toggle)

**Impacto:** Alto (feature nova P0)

---

### FASE 6: FEATURES NOVAS - SUPPLIER V1 (2-3 dias)
**Objetivo:** Implementar cadastro básico de fornecedores

#### 6.1 Criar estrutura de fornecedores (FÁCIL - 1 dia)
**Status:** Campo `fornecedor` existe em `materiais`, mas não há tabela

**Implementação:**
- Criar migration para:
  - Tabela `suppliers` (nome, cnpj, contato, email, telefone, organization_id)
  - Tabela `supplier_materials` (supplier_id, material_id, preco, codigo_fornecedor)
- Atualizar campo `fornecedor` em `materiais` para usar FK
- Criar RLS policies

**Arquivos:**
- `supabase/migrations/20260118_add_suppliers.sql` (nova migration)

**Impacto:** Médio (feature nova P0)

---

#### 6.2 Criar UI de fornecedores (MÉDIO - 1-2 dias)
**Status:** Não existe

**Implementação:**
- Criar componente `src/components/supplier/ListaFornecedores.tsx`
- Criar componente `src/components/supplier/DialogFornecedor.tsx`
- Criar componente `src/components/supplier/ImportarTabelaPrecos.tsx`
- Adicionar rota `/fornecedores`
- Adicionar vínculo fornecedor → materiais na UI

**Arquivos:**
- `src/components/supplier/*` (novos componentes)
- `src/pages/GerarOrcamento.tsx` (adicionar rota)

**Impacto:** Médio (feature nova P0)

---

### FASE 7: FEATURES NOVAS - AUTOMAÇÕES E GUIAS (2-3 dias)
**Objetivo:** Completar automações faltantes e guia de costura

#### 7.1 Guia de costura em PDF (MÉDIO - 1 dia)
**Status:** Não existe

**Implementação:**
- Criar template de guia de costura
- Criar função `src/lib/gerarPdfProducao.ts` (similar a `gerarPdfOrcamento.ts`)
- Adicionar botão "Gerar Guia de Costura" em `src/components/producao/FichaPedido.tsx`
- Incluir: item, medidas, materiais, observações

**Arquivos:**
- `src/lib/gerarPdfProducao.ts` (novo)
- `src/components/producao/FichaPedido.tsx` (adicionar botão)

**Impacto:** Médio (feature nova P0)

---

#### 7.2 Automação: Pedido pronto → Sugerir instalação (FÁCIL - 2h)
**Status:** Não existe

**Implementação:**
- Criar trigger: quando `pedidos.status_producao = 'pronto'`, criar notificação/alerta
- OU criar função que verifica pedidos prontos e mostra alerta na UI
- Adicionar botão "Agendar Instalação" destacado quando pedido está pronto

**Arquivos:**
- `supabase/migrations/20260119_auto_sugerir_instalacao.sql` (nova migration/trigger)
- `src/components/producao/FichaPedido.tsx` (adicionar alerta/botão)

**Impacto:** Médio (automação P0)

---

#### 7.3 Automação: Instalação concluída → Pedido entregue (FÁCIL - 1h)
**Status:** Não existe

**Implementação:**
- Criar trigger: quando `instalacoes.status = 'concluida'`, atualizar `pedidos.status_producao = 'entregue'`
- Adicionar log de auditoria

**Arquivos:**
- `supabase/migrations/20260119_auto_entregue.sql` (nova migration/trigger)

**Impacto:** Médio (automação P0)

---

### FASE 8: MELHORIAS DE UX E FILTROS (2-3 dias)
**Objetivo:** Completar funcionalidades básicas de listagem

#### 8.1 Adicionar filtros (data, vendedor) em orçamentos (MÉDIO - 2h)
**Status:** Não existe

**Implementação:**
- Adicionar controles de filtro em `src/components/orcamento/ListaOrcamentos.tsx`
- Adicionar filtro por data (range picker)
- Adicionar filtro por vendedor (select com usuários)
- Atualizar queries para aplicar filtros

**Arquivos:**
- `src/components/orcamento/ListaOrcamentos.tsx`

**Impacto:** Médio (UX - P1)

---

#### 8.2 Adicionar ordenação de colunas (MÉDIO - 2h)
**Status:** Não existe

**Implementação:**
- Adicionar componente `SortableHeader` (ou usar componente existente)
- Adicionar estado para coluna e direção de ordenação
- Atualizar queries para aplicar `ORDER BY`
- Adicionar indicadores visuais (setas)

**Arquivos:**
- `src/components/orcamento/ListaOrcamentos.tsx`
- `src/components/ui/SortableHeader.tsx` (criar se não existir)

**Impacto:** Médio (UX - P1)

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1 (Fases 1-2):
- **Dia 1:** Fase 1.1-1.3 (Esqueci senha, remover botão duplicado, rebranding básico)
- **Dia 2:** Fase 1.4 (Corrigir dashboard zerado)
- **Dia 3-4:** Fase 2.1-2.2 (Bugs críticos de financeiro)

### Semana 2 (Fases 3-4):
- **Dia 1:** Fase 3.1-3.2 (Soft delete, paginação)
- **Dia 2:** Fase 3.3-3.4 (Legendas, tooltips)
- **Dia 3:** Fase 4 (Rebranding completo)

### Semana 3 (Fase 5):
- **Dia 1-2:** Fase 5.1 (Estrutura de estoque)
- **Dia 3-4:** Fase 5.2 (UI de estoque)

### Semana 4 (Fases 6-7):
- **Dia 1-2:** Fase 6 (Supplier V1)
- **Dia 3-4:** Fase 7 (Automações e guias)

### Semana 5 (Fase 8):
- **Dia 1-2:** Fase 8 (Filtros e ordenação)

---

## 🎯 PRIORIZAÇÃO FINAL (ORDEM DE EXECUÇÃO)

### 🔴 CRÍTICO (Fazer primeiro):
1. ✅ Fase 1.1: "Esqueci minha senha" (30min)
2. ✅ Fase 1.4: Corrigir dashboard zerado (2-3h)
3. ✅ Fase 2.1: Corrigir status contas receber (3-4h)
4. ✅ Fase 2.2: Sincronização orçamento ↔ financeiro (2-3h)

### 🟡 IMPORTANTE (Fazer em seguida):
5. ✅ Fase 1.2: Remover botão duplicado (15min)
6. ✅ Fase 1.3: Rebranding básico (1h)
7. ✅ Fase 3.1: Soft delete usuários (2h)
8. ✅ Fase 3.2: Paginação (3-4h)
9. ✅ Fase 4: Rebranding completo (1 dia)

### 🟢 DESEJÁVEL (Fazer depois):
10. ✅ Fase 3.3: Legendas em gráficos (1h)
11. ✅ Fase 3.4: Tooltips (1-2h)
12. ✅ Fase 5: Estoque simples (3-4 dias)
13. ✅ Fase 6: Supplier V1 (2-3 dias)
14. ✅ Fase 7: Automações e guias (2-3 dias)
15. ✅ Fase 8: Filtros e ordenação (2-3 dias)

---

## 📝 NOTAS IMPORTANTES

### Sobre Estoque:
- **CRÍTICO:** Estoque deve ser 100% opcional
- Se `controla_estoque = false`, sistema funciona normalmente SEM estoque
- UI de estoque só aparece se habilitado
- Triggers de baixa só executam se habilitado

### Sobre Rebranding:
- Fazer em 3 partes para não quebrar nada
- Testar após cada parte
- Manter compatibilidade com dados existentes

### Sobre Bugs:
- Sempre adicionar logs para debug
- Testar fluxo completo após correção
- Documentar o que foi corrigido

---

**Este plano está pronto para execução. Começar pela Fase 1 (Quick Wins) para ganhar momentum rápido.**
