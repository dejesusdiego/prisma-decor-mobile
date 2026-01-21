# 📊 Diagnóstico Completo do Projeto StudioOS

**Data:** 2026-01-16  
**Status:** Análise Completa do Estado Atual  
**Objetivo:** Visão geral clara do projeto, estado atual, MVP, próximos passos e estrutura organizacional

---

## 📍 1. ONDE PARAMOS EXATAMENTE

### 1.1 Últimas Correções Implementadas

#### ✅ Bugs Críticos Corrigidos (Fase 1.4 e 2.1-2.2)
1. **Dashboard zerado** (Fase 1.4)
   - ✅ Corrigido: Queries aguardando `organizationId` carregar
   - ✅ Corrigido: Filtros de data incluindo dia completo
   - ✅ Arquivos: `useDashboardData.ts`, `useMetricasCentralizadas.ts`, `useDashboardUnificado.ts`

2. **Status de contas a receber não atualizando** (Fase 2.1)
   - ✅ Corrigido: Trigger SQL `atualizar_conta_receber_por_parcela` criado
   - ✅ Arquivo: `supabase/migrations/20260110000000_fix_status_contas_receber_trigger.sql`
   - ✅ Frontend atualizado para confiar no trigger com fallback

3. **Sincronização bidirecional Orçamento ↔ Contas Receber** (Fase 2.2)
   - ✅ Melhorado: Triggers com tolerância (R$ 5 ou 0,5%) e proteção contra loops
   - ✅ Arquivo: `supabase/migrations/20260110000001_improve_sync_orcamento_contas_receber.sql`

4. **Contas a Pagar carregando infinitamente** (Fase 2.3)
   - ✅ Corrigido: Query usando campos errados (`valor_total`/`valor_pago` → `valor`)
   - ✅ Corrigido: Aguardar `organizationId` carregar
   - ✅ Arquivo: `src/components/financeiro/ContasPagar.tsx`

5. **Breadcrumb duplicado no Financeiro** (Fase 2.4)
   - ✅ Corrigido: Desabilitado breadcrumb genérico do componente pai para views financeiras
   - ✅ Arquivo: `src/pages/GerarOrcamento.tsx`

### 1.2 Estado Atual do Código

**Módulos Funcionais:**
- ✅ Multi-tenant completo (organizações, RLS, isolamento de dados)
- ✅ CRM básico (contatos, pipeline, atividades, follow-ups)
- ✅ Orçamentos (wizard, cálculos automáticos, PDF)
- ✅ Produção (Kanban, pedidos, histórico, materiais)
- ✅ Instalação (agendamento, agenda integrada)
- ✅ Financeiro (contas pagar/receber, conciliação, lançamentos, comissões)
- ✅ Automações core (orçamento → conta receber → pedido)

**Bugs Conhecidos (Pendentes):**
- ❌ **CRÍTICO:** Popup de tour aparecendo em LPs públicas (`/studioos`, `/lp/:slug`)
- ⚠️ Botão "Novo Orçamento" duplicado (header + sidebar)
- ⚠️ Sem "Esqueci minha senha" (parcialmente implementado, precisa testar)
- ⚠️ Sem paginação visível em listagens
- ⚠️ Sem filtros por data/vendedor em orçamentos
- ⚠️ Sem ordenação de colunas

**Funcionalidades Faltantes no MVP:**
- ❌ Estoque simples OPCIONAL (baixa automática)
- ❌ Supplier V1 (cadastro + vínculo + importação CSV)
- ❌ Guia de costura em PDF
- ❌ Automação: Pedido pronto → sugerir agendar instalação
- ❌ Automação: Instalação concluída → pedido entregue
- ❌ Soft delete de usuários
- ❌ Painel Supremo básico (lista de organizações, planos, status)

---

## 🎯 2. O QUE JÁ ESTÁ CONSIDERADO "MVP"

### 2.1 Funcionalidades Core Implementadas

#### Multi-tenant e Organizações
- ✅ Tabela `organizations` com isolamento completo
- ✅ RLS (Row-Level Security) implementado
- ✅ `organization_members` com roles (owner, admin, member)
- ✅ Feature flags por organização
- ✅ Tema personalizado por organização

#### CRM
- ✅ Gestão de contatos/leads
- ✅ Pipeline de oportunidades
- ✅ Atividades e follow-ups
- ✅ Solicitações de visita
- ✅ Calendário integrado
- ✅ Jornada do cliente
- ✅ Merge de contatos

#### Orçamentos
- ✅ Wizard multi-etapas
- ✅ Cálculos automáticos (cortinas/persianas)
- ✅ Geração de PDF profissional
- ✅ Importação de dados (CSV)
- ✅ Histórico de alterações
- ✅ Descontos e margens

#### Produção
- ✅ Kanban visual
- ✅ Gestão de pedidos
- ✅ Timeline/histórico
- ✅ Ficha de pedido completa
- ✅ Lista de materiais por pedido
- ✅ Integração com orçamentos

#### Instalação
- ✅ Agendamento de instalações
- ✅ Agenda visual
- ✅ Integração com produção

#### Financeiro
- ✅ Contas a receber (com status automático via trigger)
- ✅ Contas a pagar
- ✅ Conciliação bancária
- ✅ Lançamentos financeiros
- ✅ Comissões
- ✅ Dashboard financeiro
- ✅ Sincronização Orçamento ↔ Contas Receber (melhorada)

#### Automações
- ✅ Orçamento pago → Conta Receber (trigger)
- ✅ Orçamento pago → Pedido (trigger)
- ✅ Conta Receber atualizada → Orçamento (trigger melhorado)
- ✅ Custos → Contas Pagar (trigger)
- ✅ Materiais completos → em_producao (trigger)

### 2.2 Infraestrutura e Base Técnica

- ✅ Supabase como backend (PostgreSQL + Auth + Storage)
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS + Shadcn/ui
- ✅ React Query para data fetching
- ✅ React Router para navegação
- ✅ Sistema de temas (light/dark mode)
- ✅ Landing pages personalizadas por organização (`/lp/:slug`)
- ✅ Landing page StudioOS (`/studioos`)

---

## ❌ 3. O QUE AINDA FALTA PARA FINALIZAR O MVP

### 3.1 Bugs Críticos (P0 - Bloqueadores)

#### 🐞 **BUG CRÍTICO: Popup de Tour em LPs Públicas**
**Problema:** O `OnboardingProvider` está renderizando o popup de tour em todas as rotas, incluindo landing pages públicas (`/studioos`, `/lp/:slug`).

**Causa Raiz:**
- `OnboardingProvider` está envolvendo TODAS as rotas no `App.tsx`
- A verificação `shouldShowOnboarding` só checa se `user` existe, mas não verifica se a rota é pública
- Landing pages públicas não devem ter usuário autenticado, mas o provider ainda tenta renderizar

**Solução Necessária:**
1. Modificar `OnboardingProvider` para verificar se a rota atual é pública
2. Não renderizar `OnboardingDialog` em rotas públicas (`/`, `/studioos`, `/lp/:slug`, `/auth`, `/documentacao`, `/nossos-produtos`)
3. Alternativa: Mover `OnboardingProvider` para dentro apenas de rotas protegidas

**Arquivos Afetados:**
- `src/components/onboarding/OnboardingProvider.tsx`
- `src/App.tsx`

**Prioridade:** 🔴 **CRÍTICA** - Deve ser corrigido antes de qualquer deploy público

---

### 3.2 Funcionalidades Faltantes (P0 - MVP Obrigatório)

#### Estoque Simples OPCIONAL
**Status:** ❌ Não implementado  
**Prioridade:** P0 (Sprint 2 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- Campo `controla_estoque BOOLEAN DEFAULT false` em `organizations`
- Campo `controla_estoque BOOLEAN DEFAULT false` em `materiais`
- Tabela `inventory_items` (produto_id, quantidade_atual, estoque_minimo)
- Tabela `inventory_movements` (tipo: entrada/saída, quantidade, motivo)
- UI básica: dashboard de estoque (só aparece se habilitado)
- Trigger CONDICIONAL: baixar estoque apenas se `controla_estoque = true`
- Toggle em Configurações: "Controlar Estoque" (on/off)

**⚠️ CRÍTICO:** Deve ser 100% opcional - empresas sob medida/parcerias podem desabilitar completamente.

#### Supplier V1 (Fornecedor Básico)
**Status:** ❌ Não implementado  
**Prioridade:** P0 (Sprint 3 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- Tabela `suppliers` (nome, cnpj, contato, email, telefone, organization_id)
- Tabela `supplier_materials` (supplier_id, material_id, preco, codigo_fornecedor)
- UI: cadastro de fornecedores, lista, vínculo fornecedor → materiais
- Importação de tabela de preços (CSV)
- Atualizar campo `fornecedor` em `materiais` para usar FK para `suppliers`

#### Guia de Costura em PDF
**Status:** ❌ Não implementado  
**Prioridade:** P0 (Sprint 4 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- Template de guia de costura (PDF simples)
- Função `gerarPdfProducao.ts` (similar a `gerarPdfOrcamento.ts`)
- Botão "Gerar Guia de Costura" na ficha do pedido
- Conteúdo: item, medidas, materiais, observações

#### Automações Core Faltantes
**Status:** ❌ Não implementado  
**Prioridade:** P0 (Sprint 5 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
1. **Pedido pronto → Sugerir agendar instalação**
   - Trigger: quando pedido status = 'pronto', criar notificação/alerta
   
2. **Instalação concluída → Pedido entregue**
   - Trigger: quando instalação status = 'concluida', atualizar pedido status = 'entregue'

#### Soft Delete de Usuários
**Status:** ❌ Não implementado  
**Prioridade:** P0 (Sprint 1 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- Campo `deleted_at TIMESTAMPTZ` ou `active BOOLEAN` em `users` (via Supabase Auth metadata)
- UI para desativar usuário (não apagar fisicamente)
- Filtrar usuários deletados nas listagens

#### UX Básica Completa
**Status:** ⚠️ Parcial  
**Prioridade:** P0 (Sprint 6 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- ✅ Paginação em listagens (orçamentos, contas receber, etc.)
- ✅ Filtros (data, vendedor) em orçamentos
- ✅ Ordenação de colunas em tabelas

---

### 3.3 Funcionalidades Importantes (P1 - Logo Após MVP)

#### Painel Supremo Básico
**Status:** ❌ Não implementado  
**Prioridade:** P1 (Sprint 6 ou 7 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- Rota `/admin` (protegida para super admins)
- Listar todas as organizações (clientes)
- Campos: nome, CNPJ/ID, cidade/UF, plano atual, status, data criação, contagem de usuários
- Ações: ativar/desativar organizações, ajustar plano
- Ver uso básico (número de orçamentos, pedidos, etc.)

**⚠️ CRÍTICO para operação do SaaS:** Permite gerenciar clientes sem entrar no banco.

#### Automações CRM
**Status:** ❌ Não implementado  
**Prioridade:** P1 (Sprint 5 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
1. **Lead → Cliente automático**
   - Quando orçamento aprovado, atualizar `contatos.tipo = 'cliente'`
   
2. **Preencher orçamento com dados do lead**
   - Quando criar orçamento a partir de lead, preencher automaticamente dados do cliente

#### Melhorias de UX
**Status:** ⚠️ Parcial  
**Prioridade:** P1 (Sprint 6 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- Legendas em gráficos (bug alto identificado)
- Tooltips em ícones explicativos (bug alto identificado)
- Melhorar feedback visual em automações (toast quando trigger dispara)

#### Integração LP → CRM
**Status:** ❌ Não implementado  
**Prioridade:** P1 (Sprint 5 conforme `ANALISE_MVP_STUDIOOS.md`)

**Requisitos:**
- Endpoint/API: `POST /api/leads` (ou Edge Function Supabase)
- Aceitar dados do formulário da LP (nome, email, telefone, mensagem, origem)
- Criar lead automaticamente no CRM (`contatos` com `tipo = 'lead'`)
- Se houver solicitação de visita, criar `solicitacoes_visita` automaticamente
- Documentar integração para facilitar conexão de LPs externas

---

## 🏗️ 4. DEFINIÇÕES ESTRUTURAIS (SEPARAÇÃO CLARA)

### 4.1 Estrutura de Vendas do StudioOS (SaaS)

**Objetivo:** Vender o ERP StudioOS como SaaS para empresas de decoração.

**Componentes:**
- ✅ Landing page de vendas (`/studioos`)
- ✅ Sistema de planos (Starter, Profissional, Business, Enterprise)
- ✅ Feature flags por plano
- ✅ Multi-tenant (cada cliente = organização isolada)
- ❌ Painel Supremo (admin do StudioOS gerencia clientes)
- ❌ Billing/invoice (integração com gateway de pagamento)
- ❌ Onboarding automatizado (one-click setup)

**Rotas:**
- `/studioos` - Landing page de vendas
- `/auth` - Login/registro (comum a todas as organizações)
- `/gerarorcamento` - App principal (protegido, multi-tenant)

**Dados:**
- Tabela `organizations` (clientes do StudioOS)
- Tabela `organization_members` (usuários de cada organização)
- Tabela `feature_flags` (recursos por plano)
- Tabela `subscriptions` (assinaturas - **NÃO IMPLEMENTADA**)

---

### 4.2 Estrutura de Vendas da Prisma (Decoração)

**Objetivo:** Prisma é uma empresa cliente do StudioOS que vende produtos de decoração.

**Componentes:**
- ✅ Landing page personalizada (`/lp/prisma`)
- ✅ Tema personalizado (cores, logo)
- ✅ CRM para gerenciar clientes da Prisma
- ✅ Orçamentos para clientes da Prisma
- ✅ Produção e instalação para pedidos da Prisma
- ✅ Financeiro para contas da Prisma

**Rotas:**
- `/lp/prisma` - Landing page da Prisma (pública)
- `/gerarorcamento` - App da Prisma (protegido, apenas membros da organização Prisma)

**Dados:**
- Organização `prisma` em `organizations`
- Todos os dados isolados por `organization_id = 'prisma'`
- RLS garante que apenas membros da Prisma veem dados da Prisma

**⚠️ IMPORTANTE:** Prisma é apenas uma organização cliente do StudioOS. O sistema deve suportar N organizações, cada uma com seus próprios dados isolados.

---

### 4.3 Sistema Core Multi-empresa (Orçamento, Financeiro, Produção, Instalação)

**Objetivo:** Core do ERP que funciona para qualquer organização cliente.

**Componentes:**
- ✅ Multi-tenant completo (RLS, isolamento)
- ✅ Módulos: CRM, Orçamentos, Produção, Instalação, Financeiro
- ✅ Automações entre módulos
- ✅ Feature flags (habilitar/desabilitar recursos por plano)
- ✅ Tema personalizado por organização

**Arquitetura:**
- Todas as tabelas têm `organization_id UUID`
- RLS policies garantem isolamento
- Função helper `get_user_organization_id()` para queries
- Context `OrganizationContext` no frontend

**Rotas:**
- `/gerarorcamento` - App principal (protegido, multi-tenant)
- `/configuracoes/organizacao` - Configurações da organização
- `/gerenciarusuarios` - Gestão de usuários (admin only)

---

### 4.4 Administrativo do StudioOS (Superadmin, Billing, Clientes)

**Objetivo:** Painel para o dono do StudioOS gerenciar o SaaS.

**Componentes:**
- ❌ **Painel Supremo básico** (P1 - Sprint 6/7)
  - Listar organizações (clientes)
  - Ver status, planos, uso
  - Ativar/desativar organizações
  - Ajustar planos
  
- ❌ **Billing/Invoice** (P2 - Futuro)
  - Integração com gateway de pagamento
  - Geração de invoices
  - Controle de assinaturas
  
- ❌ **Onboarding automatizado** (P2 - Fase 2 do Painel Supremo)
  - One-click criação de organização
  - Setup automático de dados padrão
  - Envio de email de boas-vindas

**Rotas Planejadas:**
- `/admin` - Painel Supremo (protegido para super admins)
- `/admin/organizations` - Lista de organizações
- `/admin/billing` - Billing e assinaturas (futuro)

**Dados:**
- Tabela `organizations` (todas as organizações, sem filtro RLS para super admin)
- Tabela `subscriptions` (assinaturas - **NÃO IMPLEMENTADA**)
- Tabela `invoices` (faturas - **NÃO IMPLEMENTADA**)

**⚠️ IMPORTANTE:** Super admin precisa de acesso especial que bypassa RLS para ver todas as organizações.

---

### 4.5 Portal de Fornecedores (Login Separado)

**Objetivo:** Portal para fornecedores acessarem pedidos, atualizarem preços, etc.

**Componentes:**
- ❌ **Estrutura inicial** (P1 - Adição ao MVP)
  - Login separado em `fornecedores.studioos.pro`
  - Autenticação específica para fornecedores
  - Tabela `suppliers` com campo `user_id` (vínculo com auth)
  
- ❌ **Funcionalidades futuras** (P2 - V2+)
  - Visualizar pedidos vinculados
  - Atualizar status de entrega
  - Enviar tabela de preços
  - Dashboard de vendas

**Rotas Planejadas:**
- `fornecedores.studioos.pro` - Subdomínio separado
- `/login` - Login específico para fornecedores
- `/dashboard` - Dashboard do fornecedor
- `/pedidos` - Pedidos vinculados (futuro)
- `/precos` - Gestão de preços (futuro)

**Dados:**
- Tabela `suppliers` (fornecedores)
- Campo `user_id UUID` em `suppliers` (vínculo com `auth.users`)
- RLS específico para fornecedores (veem apenas seus próprios dados)

**⚠️ IMPORTANTE:** Portal de fornecedores deve ser completamente separado do app principal, com autenticação e RLS próprios.

---

## ➕ 5. ADIÇÕES AO ESCOPO DO MVP

### 5.1 Sistema de Rodízio de Vendedores no WhatsApp (LPs das Empresas)

**Objetivo:** Distribuir leads do WhatsApp entre vendedores de forma rotativa.

**Requisitos:**
- Configuração por organização: lista de vendedores (usuários) para rodízio
- Campo em `organizations`: `whatsapp_vendedores JSONB` (array de user_ids)
- Campo em `organizations`: `whatsapp_rodizio_ativo BOOLEAN DEFAULT false`
- Algoritmo de rodízio: distribuir leads sequencialmente entre vendedores
- Botão WhatsApp nas LPs (`/lp/:slug`) usa vendedor do rodízio
- Histórico: qual vendedor atendeu qual lead

**Implementação:**
1. Adicionar campos em `organizations`:
   ```sql
   ALTER TABLE organizations 
   ADD COLUMN whatsapp_rodizio_ativo BOOLEAN DEFAULT false,
   ADD COLUMN whatsapp_vendedores JSONB DEFAULT '[]'::jsonb;
   ```

2. Criar função helper para obter próximo vendedor:
   ```sql
   CREATE FUNCTION get_next_vendedor_whatsapp(org_id UUID)
   RETURNS UUID AS $$
   -- Lógica de rodízio
   $$;
   ```

3. Atualizar componente `WhatsAppButton` nas LPs para usar rodízio
4. UI em Configurações da Organização: gerenciar lista de vendedores

**Prioridade:** P1 (Adição ao MVP)

---

### 5.2 Sistema de Geração de Recibos de Pagamento em PDF

**Objetivo:** Gerar recibos profissionais quando pagamento é registrado.

**Requisitos:**
- Template de recibo (PDF)
- Função `gerarPdfRecibo.ts` (similar a `gerarPdfOrcamento.ts`)
- Botão "Gerar Recibo" em:
  - Dialog de registro de recebimento
  - Lista de contas a receber (quando pago)
  - Histórico de pagamentos
- Conteúdo: dados do cliente, valor, data, forma de pagamento, número do recibo

**Implementação:**
1. Criar `src/lib/gerarPdfRecibo.ts`
2. Adicionar campo `numero_recibo TEXT` em `parcelas_receber`
3. Gerar número sequencial por organização
4. Botão na UI de pagamentos

**Prioridade:** P1 (Adição ao MVP)

---

### 5.3 Sistema de Geração de Guias de Produção/Costureira em PDF

**Objetivo:** Gerar guias detalhados para costureira/produção.

**Requisitos:**
- Template de guia de produção (PDF mais detalhado que guia de costura)
- Função `gerarPdfGuiaProducao.ts`
- Botão "Gerar Guia de Produção" na ficha do pedido
- Conteúdo: item, medidas detalhadas, materiais, instruções, desenhos técnicos (se possível)

**Implementação:**
1. Criar `src/lib/gerarPdfGuiaProducao.ts`
2. Botão na ficha do pedido
3. Template mais completo que guia de costura

**Prioridade:** P1 (Adição ao MVP)

---

### 5.4 Início da Preparação Estrutural para Portal de Fornecedores

**Objetivo:** Preparar estrutura base para portal de fornecedores, sem implementar funcionalidades completas.

**Requisitos:**
- Subdomínio `fornecedores.studioos.pro` configurado (DNS)
- Rota separada no app (ou app separado)
- Autenticação específica para fornecedores
- Tabela `suppliers` com campo `user_id` (vínculo com auth)
- RLS básico para fornecedores
- Página de login para fornecedores
- Dashboard básico (placeholder, sem funcionalidades)

**Implementação:**
1. Criar tabela `suppliers` (se não existir):
   ```sql
   CREATE TABLE suppliers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     organization_id UUID REFERENCES organizations(id),
     user_id UUID REFERENCES auth.users(id),
     nome TEXT NOT NULL,
     cnpj TEXT,
     email TEXT,
     telefone TEXT,
     ativo BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. Criar RLS para fornecedores:
   ```sql
   CREATE POLICY "Suppliers can view their own data"
   ON suppliers FOR SELECT
   TO authenticated
   USING (user_id = auth.uid());
   ```

3. Criar rota `/fornecedor/login` e `/fornecedor/dashboard`
4. Configurar subdomínio (DNS + Vercel)

**⚠️ IMPORTANTE:** Não implementar funcionalidades de pedidos agora, apenas estrutura inicial.

**Prioridade:** P1 (Adição ao MVP)

---

## 📋 6. CHECKLIST DE MVP

### 6.1 Bugs Críticos (P0 - Bloqueadores)

- [ ] **🐞 CRÍTICO:** Corrigir popup de tour em LPs públicas
- [ ] Remover botão "Novo Orçamento" duplicado
- [ ] Testar "Esqueci minha senha" (já implementado, verificar funcionamento)

### 6.2 Funcionalidades Core (P0 - MVP Obrigatório)

- [ ] Estoque simples OPCIONAL (baixa automática)
- [ ] Supplier V1 (cadastro + vínculo + importação CSV)
- [ ] Guia de costura em PDF
- [ ] Automação: Pedido pronto → sugerir agendar instalação
- [ ] Automação: Instalação concluída → pedido entregue
- [ ] Soft delete de usuários
- [ ] Paginação em listagens
- [ ] Filtros (data, vendedor) em orçamentos
- [ ] Ordenação de colunas

### 6.3 Funcionalidades Importantes (P1 - Logo Após MVP)

- [ ] Painel Supremo básico (lista de organizações, planos, status)
- [ ] Automação: Lead → Cliente automático
- [ ] Automação: Preencher orçamento com dados do lead
- [ ] Legendas em gráficos
- [ ] Tooltips em ícones
- [ ] Integração LP → CRM (endpoint para criar leads)

### 6.4 Adições ao MVP

- [ ] Sistema de rodízio de vendedores no WhatsApp
- [ ] Geração de recibos de pagamento em PDF
- [ ] Geração de guias de produção/costureira em PDF
- [ ] Estrutura inicial do portal de fornecedores (login, dashboard básico)

---

## 🎯 7. PRÓXIMOS PASSOS RECOMENDADOS (ORDEM DE PRIORIDADE)

### Fase 1: Correções Críticas (1-2 dias)

**Prioridade:** 🔴 **MÁXIMA**

1. **Corrigir popup de tour em LPs públicas**
   - Modificar `OnboardingProvider` para não renderizar em rotas públicas
   - Testar em `/studioos` e `/lp/:slug`
   - Deploy imediato

2. **Remover botão "Novo Orçamento" duplicado**
   - Identificar onde está duplicado (header + sidebar)
   - Remover um dos dois
   - Testar navegação

---

### Fase 2: Completar MVP Core (2-3 semanas)

**Prioridade:** 🟠 **ALTA**

#### Sprint 1: Bugs e UX Básica (1 semana)
- [ ] Soft delete de usuários
- [ ] Paginação em listagens
- [ ] Filtros (data, vendedor) em orçamentos
- [ ] Ordenação de colunas
- [ ] Testar "Esqueci minha senha"

#### Sprint 2: Estoque Simples OPCIONAL (1 semana)
- [ ] Criar tabelas `inventory_items` e `inventory_movements`
- [ ] Adicionar campos `controla_estoque` em `organizations` e `materiais`
- [ ] UI básica de estoque (dashboard, lista, entrada/saída)
- [ ] Trigger CONDICIONAL para baixa automática
- [ ] Toggle em Configurações

#### Sprint 3: Supplier V1 + Guia de Costura (1 semana)
- [ ] Criar tabelas `suppliers` e `supplier_materials`
- [ ] UI de cadastro de fornecedores
- [ ] Importação de tabela de preços (CSV)
- [ ] Guia de costura em PDF
- [ ] Botão na ficha do pedido

---

### Fase 3: Automações e Integrações (1 semana)

**Prioridade:** 🟡 **MÉDIA**

#### Sprint 4: Automações Core
- [ ] Automação: Pedido pronto → sugerir agendar instalação
- [ ] Automação: Instalação concluída → pedido entregue
- [ ] Automação: Lead → Cliente automático
- [ ] Automação: Preencher orçamento com dados do lead

#### Sprint 5: Integração LP → CRM
- [ ] Criar endpoint/Edge Function: `POST /api/leads`
- [ ] Aceitar dados do formulário da LP
- [ ] Criar lead automaticamente no CRM
- [ ] Documentar integração

---

### Fase 4: Adições ao MVP (1-2 semanas)

**Prioridade:** 🟢 **BAIXA** (mas importante para diferenciação)

#### Sprint 6: Funcionalidades Adicionais
- [ ] Sistema de rodízio de vendedores no WhatsApp
- [ ] Geração de recibos de pagamento em PDF
- [ ] Geração de guias de produção/costureira em PDF
- [ ] Estrutura inicial do portal de fornecedores

---

### Fase 5: Painel Supremo e Melhorias (1 semana)

**Prioridade:** 🟡 **MÉDIA** (importante para operação do SaaS)

#### Sprint 7: Painel Supremo Básico
- [ ] Rota `/admin` (protegida para super admins)
- [ ] Listar organizações (clientes)
- [ ] Ver status, planos, uso
- [ ] Ações: ativar/desativar, ajustar plano

#### Sprint 8: Melhorias de UX
- [ ] Legendas em gráficos
- [ ] Tooltips em ícones
- [ ] Melhorar feedback visual em automações

---

## 📝 8. PROPOSTA DE ORGANIZAÇÃO DO SISTEMA

### 8.1 Estrutura de Rotas Proposta

```
/                           → Landing page pública (Index)
/studioos                   → Landing page de vendas do StudioOS (pública)
/lp/:slug                   → Landing page personalizada da organização (pública)
/auth                       → Login/registro (público)
/documentacao               → Documentação (público)

/gerarorcamento             → App principal (protegido, multi-tenant)
/configuracoes/organizacao  → Configurações da organização (protegido)
/gerenciarusuarios          → Gestão de usuários (admin only)

/admin                      → Painel Supremo (super admin only) [FUTURO]
/admin/organizations        → Lista de organizações [FUTURO]
/admin/billing              → Billing e assinaturas [FUTURO]

fornecedores.studioos.pro   → Portal de fornecedores (subdomínio separado) [FUTURO]
```

### 8.2 Estrutura de Dados Proposta

```
organizations               → Organizações (clientes do StudioOS)
  ├── organization_members  → Membros de cada organização
  ├── feature_flags        → Recursos por plano
  └── subscriptions       → Assinaturas [FUTURO]

suppliers                  → Fornecedores [FUTURO]
  ├── supplier_materials  → Materiais por fornecedor
  └── supplier_orders     → Pedidos por fornecedor [FUTURO]

[Dados isolados por organization_id]
  ├── contatos            → CRM
  ├── orcamentos          → Orçamentos
  ├── pedidos             → Produção
  ├── contas_receber      → Financeiro
  ├── contas_pagar        → Financeiro
  └── ...
```

### 8.3 Separação de Contextos

**1. Contexto Público (Sem autenticação)**
- Landing pages (`/`, `/studioos`, `/lp/:slug`)
- Login/registro (`/auth`)
- Documentação (`/documentacao`)

**2. Contexto Autenticado (Multi-tenant)**
- App principal (`/gerarorcamento`)
- Configurações (`/configuracoes/organizacao`)
- Gestão de usuários (`/gerenciarusuarios`)
- Dados isolados por `organization_id`

**3. Contexto Super Admin**
- Painel Supremo (`/admin`)
- Acesso a todas as organizações
- Bypass de RLS para operações administrativas

**4. Contexto Fornecedor (Futuro)**
- Portal de fornecedores (`fornecedores.studioos.pro`)
- Autenticação específica
- RLS específico para fornecedores

---

## ✅ 9. RESUMO EXECUTIVO

### Estado Atual
- ✅ **Core funcional:** Multi-tenant, CRM, Orçamentos, Produção, Instalação, Financeiro
- ✅ **Automações:** Orçamento → Financeiro → Pedido funcionando
- ✅ **Bugs críticos corrigidos:** Dashboard, contas a receber, sincronização
- ❌ **Bug crítico pendente:** Popup de tour em LPs públicas
- ❌ **Funcionalidades faltantes:** Estoque, Supplier, Guias PDF, Automações adicionais

### Próximos Passos Imediatos
1. **🔴 URGENTE:** Corrigir popup de tour em LPs públicas (1-2 horas)
2. **🟠 ALTA:** Completar MVP core (2-3 semanas)
3. **🟡 MÉDIA:** Automações e integrações (1 semana)
4. **🟢 BAIXA:** Adições ao MVP (1-2 semanas)

### Definições Estruturais
- ✅ **StudioOS SaaS:** Sistema de vendas do ERP
- ✅ **Prisma Decoração:** Cliente exemplo do StudioOS
- ✅ **Core Multi-empresa:** ERP isolado por organização
- ❌ **Painel Supremo:** Admin do StudioOS (P1 - Sprint 6/7)
- ❌ **Portal Fornecedores:** Login separado (P1 - Estrutura inicial)

### Adições ao MVP
- ✅ **Rodízio WhatsApp:** Distribuir leads entre vendedores
- ✅ **Recibos PDF:** Gerar recibos de pagamento
- ✅ **Guias Produção PDF:** Guias detalhados para costureira
- ✅ **Portal Fornecedores:** Estrutura inicial (login, dashboard básico)

---

**Este documento deve ser atualizado conforme o progresso do projeto.**
