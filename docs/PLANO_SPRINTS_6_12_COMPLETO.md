# 🚀 PLANO DE SPRINTS 6-12 - COMPLETO
## Baseado no Relatório Gap Analysis MVP

**Data:** Janeiro 2026  
**Objetivo:** Cobrir 100% dos gaps identificados no relatório  
**Total de Sprints:** 7 (Sprints 6-12)  
**Timeline Estimada:** 14 semanas (3.5 meses)

---

## 📋 RESUMO EXECUTIVO

Este plano cobre **TODOS** os itens do relatório de Gap Analysis:

| Categoria | Quantidade | Cobertura |
|-----------|------------|-----------|
| Bugs P0 | 5 | 100% |
| Features Críticas | 8 | 100% |
| Features Parciais | 6 | 100% |
| UX/UI Melhorias | 15 | 100% |
| Fluxos Quebrados | 4 | 100% |

**Sprint 6:** Hotfixes Críticos (Bug P0)  
**Sprint 7:** Painel Admin Supremo - Parte 1  
**Sprint 8:** Painel Admin Supremo - Parte 2 + Supplier Aprovação  
**Sprint 9:** Integração Supplier → Orçamentos  
**Sprint 10:** Billing e Foundation  
**Sprint 11:** UX/UI e Produtividade  
**Sprint 12:** Polimento e Finalização  

---

## 🐛 SPRINT 6: HOTFIXES CRÍTICOS (Semana 1)
**Objetivo:** Corrigir todos os bugs P0 antes de continuar

### Dia 1: Bug Fixes P0 - Parte 1
- [ ] **T6.1** Fix Popup Tour em LP Pública (2h)
  - Arquivo: `OnboardingProvider.tsx`
  - Código: Verificar se pathname é público antes de renderizar tour
  
- [ ] **T6.2** Fix RLS Recursão Supplier (30min)
  - Verificar migration `20260117000005` aplicada em produção
  - Se não aplicada, aplicar manualmente

- [ ] **T6.3** Fix Botão "Novo Orçamento" Duplicado (15min)
  - Remover de `DashboardContent.tsx` (manter só no sidebar)

### Dia 2: Bug Fixes P0 - Parte 2
- [ ] **T6.4** Corrigir Sincronização Orçamento↔Financeiro (1 dia)
  - Reescrever trigger com CTE para evitar recursão
  - Testar fluxo completo: Orçamento Aprovado → Financeiro

- [ ] **T6.5** Fix Status Contas Receber (4-6h)
  - Priorizar `status` do banco sobre `statusExibicao`
  - Arquivo: `ContasReceber.tsx` (linhas 106-140)

### Dia 3: Features Pendentes Críticas
- [ ] **T6.6** Recuperação de Senha - UI Completa (4h)
  - Adicionar link "Esqueci minha senha" no login
  - Formulário de reset de senha
  - Integração com `supabase.auth.resetPasswordForEmail()`

- [ ] **T6.7** Soft Delete Usuários (4-6h)
  - Migration: `deleted_at` em `user_roles`
  - Botão "Desativar" em GerenciarUsuarios
  - Filtrar deletados nas queries
  - RLS update para não retornar deletados

### Dia 4-5: Testing e Deploy
- [ ] **T6.8** Testes de regressão críticos (1 dia)
  - Login flow
  - Criar orçamento → pedido
  - Fluxo financeiro
  - Supplier portal

- [ ] **T6.9** Deploy para staging (4h)
- [ ] **T6.10** Deploy para produção (2h)

**Entregáveis Sprint 6:**
- Zero bugs P0
- Sistema financeiro sincronizado
- UX de login completa (com recuperação de senha)
- Gestão de usuários com soft delete

---

## 👑 SPRINT 7: PAINEL ADMIN SUPREMO - PARTE 1 (Semanas 2-3)
**Objetivo:** Criar estrutura base do painel administrativo da plataforma

### Semana 2 - Estrutura e Autenticação

#### Dia 1: Setup e Estrutura
- [ ] **T7.1** Criar rota `/admin-supremo` no App.tsx
- [ ] **T7.2** Criar componente `AdminSupremo.tsx` (shell/layout)
- [ ] **T7.3** Criar `SuperAdminRoute` (verificação de role super_admin)
- [ ] **T7.4** Migration: Adicionar role 'super_admin' na tabela `user_roles`
- [ ] **T7.5** Script SQL para promover primeiro usuário a super_admin

#### Dia 2: Dashboard MRR/ARR - Backend
- [ ] **T7.6** Migration: Tabela `subscriptions` (schema ASAAS)
- [ ] **T7.7** Migration: Tabela `subscription_events` (histórico)
- [ ] **T7.8** Edge Function: `calculate-mrr` (cálculo de métricas)
- [ ] **T7.9** RPC: `get_platform_metrics()` (MRR, ARR, churn, LTV)

#### Dia 3: Dashboard MRR/ARR - Frontend
- [ ] **T7.10** Componente `SuperAdminDashboard.tsx`
- [ ] **T7.11** Gráfico de MRR ao longo do tempo
- [ ] **T7.12** Cards: Total de tenants, MRR, ARR, Churn Rate
- [ ] **T7.13** Tabela: Últimas assinaturas

#### Dia 4: Lista de Organizações
- [ ] **T7.14** Componente `OrganizationsList.tsx`
- [ ] **T7.15** Tabela com filtros (nome, plano, status)
- [ ] **T7.16** Paginação e ordenação
- [ ] **T7.17** Ação: Ver detalhes da organização
- [ ] **T7.18** Modal: Detalhes do tenant (usuários, orçamentos, etc.)

#### Dia 5: Code Review e Testes
- [ ] **T7.19** Code review
- [ ] **T7.20** Testes de segurança (verificar que só super_admin acessa)
- [ ] **T7.21** Deploy staging

### Semana 3 - Feature Flags Admin

#### Dia 1-2: Feature Flags Backend
- [ ] **T7.22** Migration: Tabela `feature_flags` (com plan_values)
- [ ] **T7.23** Seed: Inserir flags padrão (contracts, integrations, blog, etc.)
- [ ] **T7.24** RPC: `check_feature_flag(org_id, flag_name)`
- [ ] **T7.25** Edge Function: Atualizar flag por organização

#### Dia 3-4: Feature Flags Frontend
- [ ] **T7.26** Página `/admin-supremo/feature-flags`
- [ ] **T7.27** Lista de todas as flags
- [ ] **T7.28** Toggle por plano (Starter/Pro/Business/Enterprise)
- [ ] **T7.29** Override por organização específica
- [ ] **T7.30** Hook `useFeatureFlag()` - atualizar para verificar do backend

#### Dia 5: Documentação e Deploy
- [ ] **T7.31** Documentar uso de feature flags
- [ ] **T7.32** Deploy produção

**Entregáveis Sprint 7:**
- Painel Admin Supremo acessível em `/admin-supremo`
- Dashboard MRR/ARR funcionando
- Lista de organizações gerenciável
- Sistema de feature flags completo

---

## 👑 SPRINT 8: PAINEL ADMIN SUPREMO - PARTE 2 + SUPPLIER (Semanas 4-5)
**Objetivo:** Completar painel admin + fluxo de aprovação de fornecedores

### Semana 4 - Supplier Management

#### Dia 1: Backend Aprovação
- [ ] **T8.1** RPC: `approve_supplier(supplier_id)` - já existe, verificar
- [ ] **T8.2** RPC: `reject_supplier(supplier_id, reason)`
- [ ] **T8.3** Trigger: Notificar fornecedor por email ao ser aprovado/rejeitado
- [ ] **T8.4** Edge Function: `send-supplier-notification`

#### Dia 2: Frontend Aprovação
- [ ] **T8.5** Página `/admin-supremo/suppliers`
- [ ] **T8.6** Lista de fornecedores pendentes
- [ ] **T8.7** Lista de fornecedores aprovados
- [ ] **T8.8** Lista de fornecedores rejeitados
- [ ] **T8.9** Modal de detalhes do fornecedor

#### Dia 3: Ações de Aprovação
- [ ] **T8.10** Botão "Aprovar Fornecedor" com confirmação
- [ ] **T8.11** Botão "Rejeitar Fornecedor" com input de motivo
- [ ] **T8.12** Preview do catálogo do fornecedor
- [ ] **T8.13** Estatísticas: Total cadastrados, pendentes, aprovados

#### Dia 4: Email Templates
- [ ] **T8.14** Template email: Cadastro recebido
- [ ] **T8.15** Template email: Cadastro aprovado
- [ ] **T8.16** Template email: Cadastro rejeitado
- [ ] **T8.17** Template email: Novo lead/interessado
- [ ] **T8.18** Edge Function: `send-email` (integração SendGrid/AWS SES)

#### Dia 5: Testes
- [ ] **T8.19** Teste fluxo completo: Cadastro → Aprovação → Notificação
- [ ] **T8.20** Teste rejeição com motivo

### Semana 5 - Admin Completo

#### Dia 1: Gerenciamento de Usuários Global
- [ ] **T8.21** Página `/admin-supremo/users`
- [ ] **T8.22** Buscar usuário por email
- [ ] **T8.23** Ver organizações do usuário
- [ ] **T8.24** Promover/despromover admin
- [ ] **T8.25** Resetar senha de usuário

#### Dia 2: Logs e Auditoria
- [ ] **T8.26** Migration: Tabela `audit_logs`
- [ ] **T8.27** Trigger: Logar ações importantes (login, orçamento criado, etc.)
- [ ] **T8.28** Página `/admin-supremo/audit-logs`
- [ ] **T8.29** Filtros por data, usuário, ação

#### Dia 3: Configurações da Plataforma
- [ ] **T8.30** Página `/admin-supremo/settings`
- [ ] **T8.31** Configurar preços dos planos
- [ ] **T8.32** Configurar taxa de implementação
- [ ] **T8.33** Configurar comissão de afiliados (padrão 10%)
- [ ] **T8.34** Configurar domínios permitidos

#### Dia 4-5: Polimento e Deploy
- [ ] **T8.35** Melhorias de UI no painel admin
- [ ] **T8.36** Responsive design para mobile
- [ ] **T8.37** Deploy produção

**Entregáveis Sprint 8:**
- Fluxo completo de aprovação de fornecedores via UI
- Notificações por email funcionando
- Gerenciamento global de usuários
- Logs de auditoria
- Configurações da plataforma editáveis

---

## 🔗 SPRINT 9: INTEGRAÇÃO SUPPLIER → ORÇAMENTOS (Semanas 6-7)
**Objetivo:** Permitir que orçamentistas usem materiais dos fornecedores

### Semana 6 - Backend e Schema

#### Dia 1: Schema de Integração
- [ ] **T9.1** Migration: Adicionar colunas em `cortina_items`
  - `supplier_material_id` (UUID, FK)
  - `supplier_id` (UUID, FK)
  - `supplier_price_snapshot` (INTEGER, preço no momento do orçamento)
  - `supplier_name_snapshot` (TEXT, nome do material no momento)
- [ ] **T9.2** Migration: Índices para performance
- [ ] **T9.3** RLS: Políticas para supplier_materials

#### Dia 2: Hook de Materiais do Fornecedor
- [ ] **T9.4** Hook `useSupplierMaterialsForOrcamento()`
- [ ] **T9.5** Filtrar apenas fornecedores aprovados
- [ ] **T9.6** Filtrar apenas materiais ativos
- [ ] **T9.7** Agrupar por fornecedor

#### Dia 3: MaterialSelector - Modificações
- [ ] **T9.8** Nova aba/seção "Materiais de Fornecedores"
- [ ] **T9.9** Lista de fornecedores aprovados
- [ ] **T9.10** Ao selecionar fornecedor, mostrar seus materiais
- [ ] **T9.11** Filtros por tipo/linha/cor (reutilizar lógica existente)

#### Dia 4: Salvar no Orçamento
- [ ] **T9.12** Modificar `EtapaProdutos` para salvar `supplier_*`
- [ ] **T9.13** Salvar snapshot de preço no momento da seleção
- [ ] **T9.14** Mostrar indicador visual de material do fornecedor
- [ ] **T9.15** Tooltip com nome do fornecedor

#### Dia 5: Visualização do Orçamento
- [ ] **T9.16** Modificar `VisualizarOrcamento.tsx`
- [ ] **T9.17** Mostrar badge "Fornecedor: X" nos itens
- [ ] **T9.18** Mostrar preço do fornecedor (snapshot)
- [ ] **T9.19** Link para catálogo do fornecedor (se ainda existir)

### Semana 7 - Portal do Fornecedor - Leads

#### Dia 1: Backend de Leads
- [ ] **T9.20** Migration: Tabela `supplier_leads`
  - `supplier_id`, `orcamento_id`, `cortina_item_id`
  - `status` (new, viewed, contacted, converted, lost)
  - `created_at`, `updated_at`
- [ ] **T9.21** Trigger: Criar lead quando orçamentista usa material
- [ ] **T9.22** RPC: `get_supplier_leads(supplier_id)`

#### Dia 2: Portal - Página de Leads
- [ ] **T9.23** Nova aba "Leads" no SupplierPortal
- [ ] **T9.24** Lista de interessados
- [ ] **T9.25** Filtros por status
- [ ] **T9.26** Ver detalhes do orçamento (limitado)

#### Dia 3: Notificações para Fornecedor
- [ ] **T9.27** Email: "Novo interessado no seu material X"
- [ ] **T9.28** Email: "Orçamento aprovado com seu material"
- [ ] **T9.29** Badge de notificação no portal

#### Dia 4-5: Testes e Deploy
- [ ] **T9.30** Teste: Cadastrar fornecedor → Aprovar → Usar material → Ver lead
- [ ] **T9.31** Teste: Verificar snapshot de preço
- [ ] **T9.32** Deploy produção

**Entregáveis Sprint 9:**
- Orçamentistas podem selecionar materiais de fornecedores aprovados
- Preço snapshot salvo no orçamento
- Fornecedores veem leads/interessados no portal
- Sistema de notificações por email

---

## 💰 SPRINT 10: BILLING E FOUNDATION (Semanas 8-9)
**Objetivo:** Implementar sistema de cobrança visual (sem gateway ainda)

### Semana 8 - Backend Billing

#### Dia 1: Schema Completo
- [ ] **T10.1** Migration: Tabela `subscriptions` completa
  - `asaas_customer_id`, `asaas_subscription_id`
  - `plan_type`, `status`, `price_cents`
  - `current_period_start/end`, `cancel_at_period_end`
- [ ] **T10.2** Migration: Tabela `invoices` (faturas)
- [ ] **T10.3** Migration: Tabela `payments` (pagamentos)

#### Dia 2: Integração ASAAS - Setup
- [ ] **T10.4** Criar conta ASAAS Sandbox
- [ ] **T10.5** Edge Function: `asaas-create-customer`
- [ ] **T10.6** Edge Function: `asaas-create-subscription`
- [ ] **T10.7** Edge Function: `asaas-cancel-subscription`

#### Dia 3: Webhooks ASAAS
- [ ] **T10.8** Edge Function: `webhook-asaas` (handler principal)
- [ ] **T10.9** Processar eventos: `PAYMENT_RECEIVED`
- [ ] **T10.10** Processar eventos: `PAYMENT_OVERDUE`
- [ ] **T10.11** Processar eventos: `SUBSCRIPTION_CANCELED`
- [ ] **T10.12** Atualizar status da subscription no banco

#### Dia 4: Checkout Page
- [ ] **T10.13** Página `/configuracoes/faturamento`
- [ ] **T10.14** Mostrar plano atual
- [ ] **T10.15** Comparar planos (Starter/Pro/Business/Enterprise)
- [ ] **T10.16** Botão "Upgrade" (redireciona ASAAS checkout)

#### Dia 5: Gestão de Assinatura
- [ ] **T10.17** Ver histórico de faturas
- [ ] **T10.18** Download de faturas (PDF)
- [ ] **T10.19** Cancelar assinatura (com confirmação)
- [ ] **T10.20** Atualizar método de pagamento

### Semana 9 - RBAC Granular

#### Dia 1: Schema de Permissões
- [ ] **T10.21** Migration: `organization_member_permissions`
  - `can_dashboard`, `can_orcamentos`, `can_pedidos`
  - `can_clientes`, `can_crm`, `can_financeiro`
  - `can_producao`, `can_fornecedores`, `can_configuracoes`
- [ ] **T10.22** Trigger: Criar permissões default ao adicionar membro

#### Dia 2: Hook de Permissões
- [ ] **T10.23** Hook `usePermissions()`
- [ ] **T10.24** Função `hasPermission(permission: string)`
- [ ] **T10.25** Atualizar `useUserRole` para considerar permissões granulares

#### Dia 3: UI de Permissões
- [ ] **T10.26** Modal de permissões em GerenciarUsuarios
- [ ] **T10.27** Grid de checkboxes por módulo
- [ ] **T10.28** Presets: "Vendedor", "Instalador", "Financeiro", "Administrativo"
- [ ] **T10.29** Salvar alterações

#### Dia 4: Aplicar Permissões na UI
- [ ] **T10.30** Ocultar menu items sem permissão
- [ ] **T10.31** Bloquear acesso direto via URL (404)
- [ ] **T10.32** Mostrar mensagem "Sem permissão"
- [ ] **T10.33** Testar cada role

#### Dia 5: Deploy
- [ ] **T10.34** Testes de segurança
- [ ] **T10.35** Deploy produção

**Entregáveis Sprint 10:**
- Sistema de billing visual funcionando
- Integração ASAAS sandbox
- Webhooks processando pagamentos
- RBAC granular implementado

---

## 🎨 SPRINT 11: UX/UI E PRODUTIVIDADE (Semanas 10-11)
**Objetivo:** Melhorar experiência do usuário e produtividade

### Semana 10 - UX Core

#### Dia 1: Command Palette
- [ ] **T11.1** Componente `CommandPalette` (Cmd+K)
- [ ] **T11.2** Buscar orçamentos por número/cliente
- [ ] **T11.3** Buscar clientes
- [ ] **T11.4** Ações rápidas: "Novo orçamento", "Novo contato"
- [ ] **T11.5** Navegação: Ir para módulo X

#### Dia 2: Global Search
- [ ] **T11.6** Barra de busca global no header
- [ ] **T11.7** Busca em tempo real (debounce)
- [ ] **T11.8** Resultados agrupados (Orçamentos, Clientes, Pedidos)
- [ ] **T11.9** Atalho: `/` para focar busca

#### Dia 3: Autosave no Wizard
- [ ] **T11.10** Hook `useAutosave()`
- [ ] **T11.11** Salvar rascunho a cada 30 segundos
- [ ] **T11.12** Tabela `orcamento_rascunhos`
- [ ] **T11.13** Recuperar rascunho ao voltar
- [ ] **T11.14** Limpar rascunho ao finalizar

#### Dia 4: Templates de Orçamento
- [ ] **T11.15** Migration: `orcamento_templates`
- [ ] **T11.16** Botão "Salvar como Template"
- [ ] **T11.17** Lista de templates ao criar novo orçamento
- [ ] **T11.18** Duplicar orçamento existente

#### Dia 5: Atalhos de Teclado
- [ ] **T11.19** Hook `useKeyboardShortcuts()`
- [ ] **T11.20** Ctrl+N: Novo orçamento
- [ ] **T11.21** Ctrl+S: Salvar (onde aplicável)
- [ ] **T11.22** Esc: Fechar modal/voltar
- [ ] **T11.23** ?: Mostrar ajuda de atalhos

### Semana 11 - Produtividade

#### Dia 1: Autopreenchimento
- [ ] **T11.24** Integração API dos Correios (CEP)
- [ ] **T11.25** Autopreencher endereço a partir do CEP
- [ ] **T11.26** Autopreenchimento de cliente (sugestão ao digitar)
- [ ] **T11.27** Histórico de preços por cliente

#### Dia 2: Follow-ups e Lembretes
- [ ] **T11.28** Migration: `follow_ups`
- [ ] **T11.29** Botão "Agendar follow-up" no orçamento
- [ ] **T11.30** Notificações de follow-up próximo
- [ ] **T11.31** Lista de follow-ups pendentes no dashboard

#### Dia 3: Email Templates
- [ ] **T11.32** Migration: `email_templates`
- [ ] **T11.33** Templates padrão: Orçamento enviado, Aprovação, Rejeição
- [ ] **T11.34** Editor simples de templates (variáveis)
- [ ] **T11.35** Enviar email direto do sistema (com tracking)

#### Dia 4-5: Bulk Actions e Export
- [ ] **T11.36** Seleção múltipla em listas
- [ ] **T11.37** Bulk actions: Arquivar, Mudar status, Exportar
- [ ] **T11.38** Exportar para Excel (CSV)
- [ ] **T11.39** Exportar relatórios para PDF
- [ ] **T11.40** Deploy

**Entregáveis Sprint 11:**
- Command Palette (Cmd+K)
- Global Search funcionando
- Autosave no wizard
- Templates de orçamento
- Atalhos de teclado
- Sistema de follow-ups

---

## ✨ SPRINT 12: POLIMENTO E FINALIZAÇÃO (Semanas 12-14)
**Objetivo:** Finalizar fluxos pendentes e polir a experiência

### Semana 12 - Automações e Fluxos

#### Dia 1: Automação Produção → Instalação
- [ ] **T12.1** Trigger: Quando pedido muda para "pronto"
- [ ] **T12.2** Criar notificação: "Pedido pronto - Agendar instalação"
- [ ] **T12.3** Email para cliente: "Seu pedido está pronto!"
- [ ] **T12.4** Botão rápido "Agendar Instalação" na notificação

#### Dia 2: Automação Instalação → Entrega
- [ ] **T12.5** Trigger: Quando instalação marcada como "concluída"
- [ ] **T12.6** Atualizar pedido para "entregue"
- [ ] **T12.7** Criar conta a receber (se ainda não existe)
- [ ] **T12.8** Email para cliente: "Instalação concluída"

#### Dia 3: Dashboard Métricas Fix
- [ ] **T12.9** Debugar `useMetricasCentralizadas`
- [ ] **T12.10** Corrigir filtros de data
- [ ] **T12.11** Verificar queries de organization_id
- [ ] **T12.12** Testar com dados reais

#### Dia 4: Estoque Simples (Opcional)
- [ ] **T12.13** Migration: `inventory_items`
- [ ] **T12.14** Migration: `inventory_movements`
- [ ] **T12.15** Toggle em Configurações: "Controlar estoque"
- [ ] **T12.16** UI básica de estoque (opcional)

#### Dia 5: Testes E2E
- [ ] **T12.17** Teste fluxo completo: Lead → Orçamento → Pedido → Produção → Instalação → Entrega
- [ ] **T12.18** Teste fluxo fornecedor: Cadastro → Aprovação → Catálogo → Venda
- [ ] **T12.19** Teste fluxo financeiro: Orçamento → Conta → Pagamento

### Semana 13 - UX Final

#### Dia 1: Mobile Responsiveness
- [ ] **T12.20** Bottom navigation para mobile
- [ ] **T12.21** Swipe gestures em listas
- [ ] **T12.22** Otimizar touch targets
- [ ] **T12.23** Testar em dispositivos reais

#### Dia 2: Animações e Transições
- [ ] **T12.24** Animação de transição entre telas
- [ ] **T12.25** Skeleton screens em carregamentos
- [ ] **T12.26** Loading states em botões
- [ ] **T12.27** Toast notifications melhorados

#### Dia 3: Acessibilidade
- [ ] **T12.28** Tema de alto contraste
- [ ] **T12.29** ARIA labels em elementos interativos
- [ ] **T12.30** Navegação por teclado completa
- [ ] **T12.31** Teste com leitor de tela

#### Dia 4: Performance
- [ ] **T12.32** Virtualização em listas longas
- [ ] **T12.33** Lazy loading de componentes
- [ ] **T12.34** Otimização de imagens
- [ ] **T12.35** Cache de queries frequentes

#### Dia 5: Documentação
- [ ] **T12.36** User guide atualizado
- [ ] **T12.37** Vídeos tutoriais (Loom)
- [ ] **T12.38** FAQ interno
- [ ] **T12.39** Changelog do produto

### Semana 14 - Launch Prep

#### Dia 1-2: Security Audit
- [ ] **T12.40** Auditar todas as RLS policies
- [ ] **T12.41** Verificar exposição de dados sensíveis
- [ ] **T12.42** Teste de penetração básico
- [ ] **T12.43** Revisar todos os endpoints

#### Dia 3-4: Performance Testing
- [ ] **T12.44** Load testing com k6/Artillery
- [ ] **T12.45** Testar com 1000+ orçamentos
- [ ] **T12.46** Otimizar queries lentas
- [ ] **T12.47** Cache em queries frequentes

#### Dia 5: Deploy Final
- [ ] **T12.48** Backup completo do banco
- [ ] **T12.49** Deploy para produção
- [ ] **T12.50** Monitoramento (Sentry, Analytics)
- [ ] **T12.51** Comunicação de launch

**Entregáveis Sprint 12:**
- Fluxos 100% automatizados
- Dashboard métricas funcionando
- UX mobile otimizada
- Performance otimizada
- Sistema pronto para escalar

---

## 📊 RESUMO DOS SPRINTS

| Sprint | Duração | Foco Principal | Entregáveis Chave |
|--------|---------|----------------|-------------------|
| 6 | 1 semana | Hotfixes | Zero bugs P0 |
| 7 | 2 semanas | Admin Parte 1 | Dashboard MRR, Feature Flags |
| 8 | 2 semanas | Admin Parte 2 | Aprovação Supplier, Logs, Configs |
| 9 | 2 semanas | Supplier Integration | Materiais em orçamentos, Leads |
| 10 | 2 semanas | Billing | Cobrança, RBAC Granular |
| 11 | 2 semanas | UX/UI | Command Palette, Autosave, Templates |
| 12 | 3 semanas | Polimento | Automações, Performance, Launch |

**Total: 14 semanas (3.5 meses)**

---

## ✅ CHECKLIST DE COBERTURA

### Bugs P0 - TODOS COBERTOS ✅
- [x] Popup Tour em LP Pública → Sprint 6
- [x] Sincronização Orçamento↔Financeiro → Sprint 6
- [x] RLS Recursão Supplier → Sprint 6
- [x] Botão "Novo Orçamento" Duplicado → Sprint 6
- [x] Status Contas Receber → Sprint 6

### Features Críticas - TODAS COBERTAS ✅
- [x] Painel Admin Supremo → Sprints 7-8
- [x] Aprovação de Fornecedores UI → Sprint 8
- [x] Integração Supplier → Orçamentos → Sprint 9
- [x] Billing/Cobrança → Sprint 10
- [x] RBAC Granular → Sprint 10
- [x] Sistema de Leads para Suppliers → Sprint 9
- [x] Recuperação de Senha → Sprint 6
- [x] Soft Delete Usuários → Sprint 6

### UX/UI - TODAS COBERTAS ✅
- [x] Command Palette → Sprint 11
- [x] Global Search → Sprint 11
- [x] Autosave no Wizard → Sprint 11
- [x] Templates de Orçamento → Sprint 11
- [x] Atalhos de Teclado → Sprint 11
- [x] Mobile Responsiveness → Sprint 12
- [x] Animações → Sprint 12
- [x] Acessibilidade → Sprint 12

### Fluxos Quebrados - TODOS COBERTOS ✅
- [x] Fornecedor → Aprovação → Catálogo → Venda → Sprints 7-9
- [x] Orçamento → Financeiro → Pedido → Sprint 6
- [x] Pedido Pronto → Instalação → Sprint 12
- [x] Instalação → Entrega → Sprint 12

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar este plano** - Validar prioridades e estimativas
2. **Definir data de início** do Sprint 6
3. **Alocar recursos** - Quem vai trabalhar em cada sprint?
4. **Setup de ambiente** - Staging, produção, ferramentas
5. **Começar Sprint 6** - Hotfixes críticos

---

**Documento criado em:** Janeiro 2026  
**Versão:** 1.0  
**Status:** Pronto para execução  
**Próxima ação:** Revisão e aprovação do plano
