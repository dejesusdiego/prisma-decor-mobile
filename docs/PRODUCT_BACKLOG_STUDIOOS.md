# PRODUCT BACKLOG STUDIOOS - SPRINT DE FINALIZAÇÃO
## Source of Truth para Desenvolvimento (Atualizado: 2026-01-28)

---

## 🎯 NORTE ESTRATÉGICO (O que não pode quebrar)

1. **Multi-tenancy isolation** - RLS deve garantir isolamento perfeito entre organizações
2. **Fluxo Orçamento → Pedido → Produção** - Core business, nunca pode falhar
3. **Autenticação segura por domínio** - Domínio define contexto de segurança

---

## 📊 DASHBOARD DE SAÚDE DO PROJETO

| Métrica | Valor |
|---------|-------|
| Total Features Mapeadas | 67 |
| Prontas (100%) | 28 (42%) |
| Parciais (50-90%) | 12 (18%) |
| Não Iniciadas (0%) | 19 (28%) |
| Bugs P0 | 5 |
| Dívida Técnica Crítica | 3 |

---

## 📋 COLUNA 1: IMPLEMENTADO ✅ (Manter/Refinar)

| Feature | Arquivo Principal | Status Code | Testado? | Notas |
|---------|-------------------|-------------|----------|-------|
| Multi-tenant Core | `@/hooks/useOrganizationContext.tsx` | 100% | ✅ Sim | RLS + organization_id em todas tabelas |
| CRM Contatos/Leads | `@/components/crm/ListaContatosV2.tsx` | 100% | ✅ Sim | Merge de contatos funcional |
| Pipeline Vendas | `@/components/crm/PipelineVendas.tsx` | 100% | ✅ Sim | Kanban completo |
| Wizard Orçamentos | `@/components/orcamento/wizard/*.tsx` | 100% | ✅ Sim | 4 etapas funcionando |
| Cálculos Orçamento | `@/lib/calculosOrcamento.ts` | 100% | ✅ Sim | Hard-coded para cortinas |
| Geração PDF Orçamento | `@/lib/gerarPdfOrcamento.ts` | 100% | ✅ Sim | jsPDF + html2canvas |
| Kanban Produção | `@/components/producao/KanbanProducao.tsx` | 100% | ✅ Sim | Colunas fixas: fila/corte/costura/acabamento |
| Agenda Instalações | `@/components/producao/AgendaInstalacoes.tsx` | 100% | ✅ Sim | Calendário integrado |
| Contas a Pagar | `@/components/financeiro/ContasPagar.tsx` | 100% | ✅ Sim | CRUD completo |
| Conciliação Bancária | `@/components/financeiro/ConciliacaoBancaria.tsx` | 100% | ✅ Sim | Upload OFX funcionando |
| Autenticação Supabase | `@/hooks/useAuth.tsx` | 100% | ✅ Sim | JWT + session management |
| Roteamento por Domínio | `@/hooks/useDomainRouting.ts` | 100% | ✅ Sim | V3 final implementada |
| Landing Pages por Slug | `@/pages/LandingPageOrganizacao.tsx` | 100% | ✅ Sim | `/lp/:slug` funciona |
| Landing Page StudioOS | `@/pages/LandingPageStudioOS.tsx` | 100% | ✅ Sim | Marketing da plataforma |
| Feature Flags por Plano | `@/hooks/useFeatureFlags.ts` | 100% | ✅ Sim | Limites configuráveis |
| Gestão de Usuários Básica | `@/pages/GerenciarUsuarios.tsx` | 100% | ✅ Sim | Create + alterar senha |
| Roles Básicos (admin/user) | `@/hooks/useUserRole.ts` | 100% | ✅ Sim | 2 roles apenas |
| Supplier Catalog (Fornecedor) | `@/components/supplier/SupplierCatalog.tsx` | 100% | ✅ Sim | CRUD materiais + import CSV |
| Cadastro Público Supplier | `@/pages/CadastroFornecedor.tsx` | 100% | ✅ Sim | Form completo com validação |
| Portal Supplier Login | `@/pages/SupplierPortal.tsx` | 100% | ✅ Sim | Auth + dashboard placeholder |
| Tabelas Supplier | `migrations/20260117_*_supplier*.sql` | 100% | ✅ Sim | 8 migrations aplicadas |
| RPC approve_supplier | Migration `20260117000002` | 100% | ✅ Sim | Service_role only |
| Domains Structure | `migrations/20260116000002_domains_subdomains.sql` | 100% | ✅ Sim | V3 subdomínios |
| Triggers Core | Múltiplas migrations | 100% | ✅ Sim | Orçamento → Financeiro → Pedido |
| Importação CSV Dados | `@/components/orcamento/ImportarDados.tsx` | 100% | ✅ Sim | Preview + validação |
| Temas/Branding | `@/contexts/OrganizationContext.tsx` | 100% | ✅ Sim | Cores por organização |
| Calendário Geral | `@/components/calendario/CalendarioGeral.tsx` | 100% | ✅ Sim | Eventos integrados |
| Solicitações Visita | `@/components/crm/SolicitacoesVisita.tsx` | 100% | ✅ Sim | Form + lista |

---

## 📋 COLUNA 2: PARCIAL/INCOMPLETO 🚧 (Completar)

| Feature | % Pronto | O que falta exatamente | Dependência | Estimativa | Complexidade | Arquivos Envolvidos |
|---------|----------|------------------------|-------------|------------|--------------|---------------------|
| 🟡 **Integração Supplier→Orçamentos** | 30% | `useSupplierMaterials` existe mas não é usado em `MaterialSelector`. Falta: 1) Chamar hook em EtapaProdutos, 2) Adicionar campos supplier_* em cortina_items, 3) Salvar snapshot de preço no item | Supplier Catalog front pronto | 2-3 dias | M | `@/hooks/useSupplierMaterials.ts` (origem) → `@/components/orcamento/wizard/EtapaProdutos.tsx` (destino) → `@/types/orcamento.ts` (schema) |
| 🟡 **Painel Admin Aprovação** | 0% | UI para StudioOS admin aprovar fornecedores pendentes. Hoje só via SQL. Precisa: 1) Lista de pendentes, 2) Botão Aprovar/Rejeitar, 3) Notificação email | RPC `approve_supplier` existe e funciona | 5-7 dias | M | **Criar:** `@/pages/AdminSupremo.tsx` (shell) → `@/components/admin/SupplierApprovals.tsx` (feature) → `@/App.tsx` (rota `/admin/suppliers`) |
| 🟡 **Contas a Receber Sync** | 70% | Status não atualiza corretamente após pagamento. Trigger existe mas lógica de `statusExibicao` sobrescreve. Precisa: 1) Priorizar status do banco, 2) Corrigir trigger | Lógica atual quebrada | 1-2 dias | M | `@/components/financeiro/ContasReceber.tsx` (linhas 106-140) → `migrations/20251223200921_*` (trigger) → `@/lib/calculosFinanceiros.ts` |
| 🟡 **Dashboard Métricas** | 60% | Dados zerados ("0 dias", gráficos vazios). Queries retornam vazio ou filtros de data incorretos. Falta debugar `useMetricasCentralizadas` | Dados existem no banco | 1 dia | P | `@/hooks/useMetricasCentralizadas.ts` → `@/hooks/useDashboardData.ts` → `@/components/dashboard/DashboardExecutivo.tsx` |
| 🟡 **Estoque Simples** | 20% | Estrutura conceitual pronta (migrations de materiais_pedido). Falta: 1) Tabela inventory_items, 2) Tabela inventory_movements, 3) UI básica, 4) Triggers condicionais | Decisão: opcional ou obrigatório? | 3-4 dias | M | **Criar:** `migrations/20260129_add_inventory.sql` → `@/components/estoque/DashboardEstoque.tsx` → `@/pages/ConfiguracoesOrganizacao.tsx` (toggle) |
| 🟡 **Soft Delete Usuários** | 10% | Hoje só cria/altera senha. Falta: 1) Campo `deleted_at` em user_roles, 2) Botão "Desativar", 3) Filtrar nas queries, 4) RLS update | Migration necessária | 4-6 horas | P | `migrations/20260129_add_soft_delete_users.sql` → `@/pages/GerenciarUsuarios.tsx` (adicionar botão + handler) → `@/hooks/useUsers.ts` (filtrar deletados) |
| 🟡 **"Esqueci minha senha"** | 10% | Supabase tem `resetPasswordForEmail()`, falta apenas UI. Botão no login + formulário email | Supabase auth pronto | 2-4 horas | P | `@/pages/Auth.tsx` (adicionar link "Esqueci minha senha") → **Criar:** `@/components/auth/ResetPasswordDialog.tsx` |
| 🟡 **Automação Pedido→Instalação** | 0% | Quando `pedidos.status_producao = 'pronto'`, criar notificação/alerta para agendar. Hoje é manual | Trigger necessário | 4-6 horas | P | **Criar:** `migrations/20260129_trigger_sugerir_instalacao.sql` → `@/components/producao/FichaPedido.tsx` (adicionar alerta quando pronto) |
| 🟡 **Automação Instalação→Entregue** | 0% | Quando `instalacoes.status = 'concluida'`, atualizar `pedidos.status_producao = 'entregue'` | Trigger necessário | 2-3 horas | P | **Criar:** `migrations/20260129_trigger_entrega_automatica.sql` |
| 🟡 **Paginação Listagens** | 0% | Tabelas sem limit/offset. Falta: 1) Componente Pagination, 2) Estado página atual, 3) Query com limit/offset | Reutilizável em todas listas | 6-8 horas | P | `@/components/ui/Pagination.tsx` (criar) → `@/components/orcamento/ListaOrcamentos.tsx` (implementar) → replicar para outras listas |
| 🟡 **Filtros Orçamentos** | 0% | Sem filtro por data/vendedor. Falta: 1) UI filtros (date picker, select vendedor), 2) Query com where dinâmico | Design system pronto | 4-6 horas | P | `@/components/orcamento/ListaOrcamentos.tsx` (adicionar controles de filtro) |
| 🟡 **Guia de Costura PDF** | 0% | Template não existe. Similar a `gerarPdfOrcamento.ts` mas para produção. Falta: 1) Template PDF, 2) Função geradora, 3) Botão na ficha | PDF generator existente | 1 dia | M | **Criar:** `@/lib/gerarPdfProducao.ts` → `@/components/producao/FichaPedido.tsx` (botão "Gerar Guia de Costura") |

---

## 📋 COLUNA 3: FANTASMA/ÓRFÃO 👻 (Decidir: Implementar ou Arquivar)

| Feature | Doc Original | Justificativa | Esforço se fizer | Recomendação |
|---------|--------------|---------------|------------------|--------------|
| 👻 **Website Builder drag-drop** | BACKLOG_FUNCIONALIDADES.md | Diferencial competitivo vs concorrência | 3-4 sprints | **Arquivar** (Pós-MVP) |
| 👻 **Blog completo (CMS)** | BACKLOG_FUNCIONALIDADES.md | SEO e marketing de conteúdo | 2-3 sprints | **Arquivar** (Pós-MVP) |
| 👻 **Dashboard MRR/ARR Supremo** | ANALISE_MVP_STUDIOOS.md | Necessário para gestão interna do SaaS | 3-4 dias | **Fazer** (P1 - Sprint 2) |
| 👻 **Billing/Stripe Integration** | MODELO_NEGOCIO.md | Cobrança automática é essencial para SaaS | 2-3 sprints | **Fazer** (P1 - Sprint 3) |
| 👻 **One-click Onboarding** | ANALISE_MVP_STUDIOOS.md | Criar org + LP + ERP em 1 hora (promessa de venda) | 5-7 dias | **Fazer** (P1 - Sprint 4) |
| 👻 **API Pública Documentada** | EXPANSAO_ERP_GENERALIZACAO.md | Enterprise clients precisam integrações | 2-3 sprints | **Arquivar** (Enterprise-only, P2) |
| 👻 **WhatsApp Business API** | MODELO_NEGOCIO.md | Notificações automáticas para clientes | 1-2 sprints | **Arquivar** (Business+, P2) |
| 👻 **NF-e Integração** | MODELO_NEGOCIO.md | Faturamento eletrônico | 2-3 sprints | **Arquivar** (Business+, P2) |
| 👻 **Generalização de Produtos** | EXPANSAO_ERP_GENERALIZACAO.md | Sair do "cortinas-only" para móveis/tapetes | 2-3 sprints | **Arquivar** (P2 - após validação mercado) |
| 👻 **Permissões Granulares** | EXPANSAO_ERP_GENERALIZACAO.md | Roles por módulo/ação (vendedor, instalador, etc) | 1-2 sprints | **Arquivar** (P2 - roles básicos ok por agora) |
| 👻 **Heatmaps/Analytics Site** | BACKLOG_FUNCIONALIDADES.md | Entender comportamento visitantes LP | 1 sprint | **Arquivar** (Pós-MVP) |
| 👻 **Avaliações/Reviews** | BACKLOG_FUNCIONALIDADES.md | Social proof para LPs | 4-5 dias | **Arquivar** (Pós-MVP) |
| 👻 **App Mobile Fornecedor** | RELATORIO_SUPPLIERS_V1.md | Versão V2+ do portal | 1-2 meses | **Arquivar** (V2+) |
| 👻 **Sincronização Preços Auto** | RELATORIO_SUPPLIERS_V1.md | Webhook quando fornecedor muda preço | 1 sprint | **Arquivar** (P2) |
| 👻 **Chat Interno** | BACKLOG_FUNCIONALIDADES.md | Comunicação cliente/fornecedor | 1-2 sprints | **Arquivar** (Pós-MVP) |
| 👻 **Gamificação** | BACKLOG_FUNCIONALIDADES.md | Motivar uso do sistema | 1-2 sprints | **Arquivar** (Pós-MVP) |
| 👻 **BI Avançado Cross-tenant** | ANALISE_MVP_STUDIOOS.md | Inteligência de mercado agregada | 1-2 meses | **Arquivar** (Visão estratégica, P3) |
| 👻 **Configurador 3D** | BACKLOG_FUNCIONALIDADES.md | Visualização produtos | 2-3 meses | **Arquivar** (Futuro) |
| 👻 **MFA/SSO** | Não documentado mas óbvio | Segurança enterprise | 1 sprint | **Arquivar** (Enterprise-only) |

---

## 📋 COLUNA 4: BUGS/DÍVIDA TÉCNICA 🔴 (Corrigir antes de avançar)

| Bug | Severidade | Arquivo Afetado | Causa Raiz | Solução Proposta | Estimativa |
|-----|------------|-----------------|------------|------------------|------------|
| 🔴 **Popup Tour em LP Pública** | P0 | `@/components/onboarding/OnboardingProvider.tsx` | Provider renderiza em todas rotas, não verifica se é rota pública | Adicionar verificação: se pathname === '/studioos' ou startsWith '/lp/' → não renderizar tour | 2 horas |
| 🔴 **Sincronização Orçamento↔Financeiro** | P0 | `migrations/20251223200921_*.sql` (trigger) | Trigger com recursão ou condição de race condition | Reescrever trigger com CTE e verificação de contexto para evitar loop | 1 dia |
| 🔴 **RLS Recursão Supplier** | P0 | `migrations/20260117000005_fix_supplier_users_rls_recursion.sql` | Policy circular em supplier_users | Verificar se migration foi aplicada em produção; se não, aplicar manualmente | 5 minutos |
| 🔴 **Botão "Novo Orçamento" Duplicado** | P1 | `@/components/orcamento/DashboardContent.tsx` + `@/components/orcamento/OrcamentoSidebar.tsx` | Dois componentes criam botão sem coordenação | Remover de DashboardContent (manter no sidebar) ou vice-versa | 15 minutos |
| 🔴 **Status Contas Receber Não Atualiza** | P1 | `@/components/financeiro/ContasReceber.tsx` | `statusExibicao` calculado no frontend sobrescreve status real do banco | Priorizar `status` do banco; `statusExibicao` como fallback apenas | 4-6 horas |
| 🔴 **Dashboard Zerado ("0 dias")** | P1 | `@/hooks/useMetricasCentralizadas.ts` | Queries podem estar filtrando organization_id incorreto ou datas erradas | Debugar queries; adicionar logs; verificar filtros de data (startOfMonth/endOfMonth) | 1 dia |
| 🟡 **Sem Legendas Gráficos** | P1 | `@/components/orcamento/charts/GraficoCustos.tsx` | Componente `Legend` importado do Recharts mas não renderizado | Adicionar `<Legend />` no componente; verificar outros gráficos | 1-2 horas |
| 🟡 **Sem Tooltips Ícones** | P1 | Múltiplos componentes | Ícones de ação sem explicação | Adicionar `<Tooltip>` do Radix UI em ícones de status/ações | 2-3 horas |
| 🟡 **Validação CNPJ Incompleta** | P2 | `@/pages/CadastroFornecedor.tsx` + RPC `register_supplier` | Apenas verifica formato 14 dígitos, não valida dígitos verificadores | Adicionar algoritmo validação CNPJ frontend + backend | 4-6 horas |
| 🟡 **Enumeração Email/CNPJ** | P2 | RPC `register_supplier` | Erros específicos permitem enumerar emails cadastrados | Considerar mensagem genérica (trade-off UX vs segurança) | 1 hora |

---

## 🔗 FLUXOS QUEBRADOS (User Journey Gaps)

### FLUXO 1: Fornecedor cadastra → Aprovação → Catálogo → Uso em Orçamento

```
Cadastro Público      ✅ Funciona (/cadastro-fornecedor)
       ↓
Aprovação            🚧 SÓ VIA SQL (gap crítico operacional)
       ↓
Catálogo (Fornecedor) ✅ Funciona (SupplierCatalog.tsx)
       ↓
Uso em Orçamento     ❌ NÃO EXISTE (cliente não vê materiais do fornecedor)
```

**Buraco Negro:** O fornecedor cadastra materiais, mas o orçamentista NÃO consegue selecioná-los no orçamento.

**AÇÃO NECESSÁRIA:**
1. Criar painel admin para aprovação (UI)
2. Integrar `useSupplierMaterials` em `EtapaProdutos`
3. Adicionar campos `supplier_material_id`, `supplier_id`, `price_snapshot` em `cortina_items`

**ARQUIVOS CHAVE:**
- Origem: `@/hooks/useSupplierMaterials.ts` (já existe, retorna materiais formatados)
- Destino: `@/components/orcamento/wizard/EtapaProdutos.tsx` (precisa chamar o hook)
- Schema: `@/types/orcamento.ts` (adicionar campos supplier)

---

### FLUXO 2: Orçamento Aprovado → Financeiro → Pedido → Produção → Instalação → Entrega

```
Orçamento Aprovado   ✅ Funciona
       ↓
Conta a Receber      ✅ Funciona (trigger automático)
       ↓
Pagamento Registrado ⚠️ BUG: Status não atualiza corretamente
       ↓
Pedido Criado        ✅ Funciona (trigger automático)
       ↓
Produção             ✅ Funciona (Kanban)
       ↓
Pedido Pronto        🚧 Sem alerta para agendar instalação (manual)
       ↓
Instalação Agendada  ✅ Funciona
       ↓
Instalação Concluída 🚧 Não atualiza pedido para "entregue" automaticamente
```

**Buracos Negros:**
1. Status financeiro não sincroniza perfeitamente
2. Pedido pronto não sugere instalação
3. Instalação concluída não fecha o ciclo

**AÇÃO NECESSÁRIA:**
1. Corrigir trigger de sincronização financeiro
2. Criar trigger/alerta: pedido pronto → sugerir instalação
3. Criar trigger: instalação concluída → pedido entregue

---

### FLUXO 3: Lead (LP Externa) → CRM → Orçamento → Cliente

```
Formulário LP        ❌ NÃO EXISTE (não há endpoint/API)
       ↓
Lead no CRM          🚧 Só criação manual
       ↓
Orçamento            ✅ Funciona
       ↓
Orçamento Aprovado   🚧 Lead não vira "cliente" automaticamente
```

**Buraco Negro:** Não há integração automática entre LP externa e CRM.

**AÇÃO NECESSÁRIA:**
1. Criar Edge Function: `create-lead-from-lp`
2. Endpoint POST simples para formulários externos
3. Trigger: orçamento aprovado → atualizar `contatos.tipo = 'cliente'`

---

## 🎯 PRIORIZAÇÃO MATRICIAL (Impacto x Esforço)

### | Alto Impacto / Baixo Esforço (FAÇA AGORA) | Alto Impacto / Alto Esforço (PLANEJE) |
### |-------------------------------------------|---------------------------------------|
| • Fix Popup Tour em LP (2h) | • Integração Supplier→Orçamentos (2-3 dias) |
| • Fix RLS Recursão (5min) | • Painel Admin Completo (1 semana) |
| • Esqueci senha UI (4h) | • Billing Stripe/Pagar.me (2-3 sprints) |
| • Botão duplicado (15min) | • One-click Onboarding (5-7 dias) |
| • Soft delete usuários (4h) | • Dashboard MRR/ARR (3-4 dias) |
| • Legendas gráficos (1h) | • Estoque Simples Opcional (3-4 dias) |

### | Baixo Impacto / Baixo Esforço (QUICK WINS) | Baixo Impacto / Alto Esforço (EVITE AGORA) |
### |--------------------------------------------|-------------------------------------------|
| • Tooltips ícones (2h) | • Website Builder |
| • Toast notifications (1h) | • API Pública completa |
| • Loading states (2h) | • MFA/SSO |
| • Ajustes textos (30min) | • Chat interno |
| • Favicon/logo (30min) | • Gamificação |

---

## 🗺️ ROADMAP SUGERIDO (Próximas 4 Semanas)

### SEMANA 1: Hotfixes & Foundation
**Objetivo:** Sistema estável, sem bugs críticos

**Sprint Bugfix (Prioridade P0):**
1. 🔴 Fix Popup Tour em LPs públicas (2h)
2. 🔴 Verificar/aplicar migration RLS recursão (5min)
3. 🔴 Corrigir sincronização Orçamento↔Financeiro (1 dia)
4. 🔴 Fix status Contas Receber (4-6h)
5. 🟡 Remover botão duplicado (15min)
6. 🟡 Esqueci minha senha UI (4h)

**Entregável:** Sistema financeiro funcionando corretamente, UX de login completa

---

### SEMANA 2: Supplier Completion
**Objetivo:** Feature Supplier V1 100% funcional

**Sprint Supplier:**
1. 🟡 Criar estrutura Admin Supremo (shell) (4h)
2. 🟡 Painel Admin Aprovação Fornecedores (2-3 dias)
3. 🟡 Integração Supplier→Orçamentos MVP (2-3 dias)
4. 🟡 Teste end-to-end fluxo fornecedor (4h)

**Entregável:** Fornecedor pode: cadastrar → ser aprovado via UI → materiais aparecem em orçamentos

---

### SEMANA 3: Multi-tenant & Billing Foundation
**Objetivo:** Plataforma SaaS completa (cobrança e gestão)

**Sprint Platform:**
1. 👻 Dashboard MRR/ARR Supremo básico (3-4 dias)
2. 👻 Billing Page (visual apenas, sem gateway) (2-3 dias)
   - Mostrar planos (Starter/Pro/Business/Enterprise)
   - Botão "Upgrade" (mock)
   - Histórico de faturas (placeholder)
3. 🟡 Soft delete usuários (4-6h)
4. 🟡 Paginação listagens (6-8h)

**Entregável:** Painel admin operacional, estrutura de billing pronta para integração gateway

---

### SEMANA 4: Polimento & Automações
**Objetivo:** UX fluida, automações core funcionando

**Sprint Polish:**
1. 🟡 Automação: Pedido pronto → Sugerir instalação (4-6h)
2. 🟡 Automação: Instalação concluída → Pedido entregue (2-3h)
3. 🟡 Guia de Costura PDF (1 dia)
4. 🟡 Filtros ordenação listagens (4-6h)
5. 🟡 Legendas + Tooltips (3-4h)
6. 🧪 Testes end-to-end fluxos críticos (1 dia)

**Entregável:** Fluxo completo automático, UX refinada

---

## ❓ DECISÕES PENDENTES (Preciso que você decida)

### ❓ DECISÃO 1: Supplier integra ao orçamento como?

**Contexto:** Materiais do supplier precisam ser selecionáveis no orçamento

**Opção A:** Tabela intermediária (denormalização)
- Copiar dados de `supplier_materials` para `order_items` no momento da seleção
- Pros: Orçamento independente de mudanças futuras do supplier
- Cons: Duplicação de dados, preço fica "congelado" no orçamento

**Opção B:** Referência direta (normalização)
- `order_items` aponta para `supplier_materials` via FK
- Pros: Dados sempre atualizados, menos duplicação
- Cons: Queries complexas, se supplier muda preço, orçamento antigo reflete novo preço (ruim)

**Opção C:** Hybrid (RECOMENDADO)
- Referência (`supplier_material_id`) + Snapshot (`price_snapshot`)
- Pros: Mantém histórico do preço no momento do orçamento + referência para rastreabilidade
- Cons: Schema mais complexo

**Impacto:** Escolha afeta schema de banco e lógica de negócio

---

### ❓ DECISÃO 2: Gateway de pagamento (Billing)

**Contexto:** Sistema precisa cobrar clientes automaticamente

**Opção A:** Stripe
- Pros: Internacional, documentação excelente, suporte PIX (via Stripe Brazil)
- Cons: Taxas em dólar, suporte técnico em inglês

**Opção B:** Pagar.me (Stone)
- Pros: Brasileiro, suporte local, PIX nativo, boletos, split de pagamento
- Cons: Menos documentação, menos integrações internacionais

**Opção C:** Asaas
- Pros: Brasileiro, boletos, PIX, assinaturas, NF-e integrada
- Cons: Menos conhecido, menos comunidade

**Restrição:** Precisa suportar PIX, Boleto e Cartão; recorrência mensal

---

### ❓ DECISÃO 3: Arquitetura Painel Supremo

**Contexto:** Admin da plataforma SaaS precisa de interface

**Opção A:** Subdomínio separado (`panel.studioos.pro`)
- Pros: Separação clara de concerns, pode ter build diferente, segurança isolada
- Cons: Mais complexo de manter, 2 deploys

**Opção B:** Rota no app principal (`/admin-super` ou `/studioos-admin`)
- Pros: Mesmo codebase, fácil manutenção, reutilização de componentes
- Cons: "Poluição" do código do cliente, risco de vazar funcionalidades admin

**Opção C:** Subdomínio com mesmo código (verificação de role)
- Pros: Single codebase, acesso por role super_admin
- Cons: Complexidade de verificação, risco de segurança se mal implementado

---

### ❓ DECISÃO 4: Estoque é opcional ou obrigatório?

**Contexto:** Algumas empresas trabalham sob medida (sem estoque), outras têm estoque

**Opção A:** 100% Opcional (RECOMENDADO no docs)
- Campo `controla_estoque` em `organizations` (default: false)
- Campo `controla_estoque` em `materiais` (default: false)
- UI só aparece se habilitado
- Triggers condicionais

**Opção B:** Obrigatório mas simples
- Todo mundo usa, mas pode ser "estoque infinito" (não controla)

**Opção C:** Por tipo de material
- Alguns materiais controlam estoque, outros não

**Impacto:** Afeta migrations, UI, lógica de negócio

---

### ❓ DECISÃO 5: Quando lançar MVP?

**Contexto:** Quanto tempo de desenvolvimento antes de aceitar clientes pagantes?

**Opção A:** 4 semanas (completo tudo da Semana 4)
- Pros: Produto maduro, menos churn
- Cons: Demora para validar mercado

**Opção B:** 2 semanas (após Semana 2 - Supplier completo)
- Pros: Validação rápida, feedback cedo
- Cons: Algumas features ainda manuais (aprovação SQL)

**Opção C:** 1 semana (Hotfixes apenas)
- Pros: Validação imediata
- Cons: Produto cru, risco de má experiência

---

## 🚀 PRÓXIMO SPRINT (O que codar AMANHÃ)

Se você vai começar a desenvolver agora, a ordem de prioridade é:

### 1️⃣ PRIMEIRO ARQUIVO A ABRIR:
**`@/components/onboarding/OnboardingProvider.tsx`**
- **Tarefa:** Adicionar verificação de rota pública
- **Código a adicionar:**
```typescript
const isPublicRoute = pathname === '/studioos' || pathname.startsWith('/lp/');
if (isPublicRoute) return null; // Não renderizar tour
```
- **Tempo:** 2 horas
- **Impacto:** UX imediata (visitantes não veem tour)

---

### 2️⃣ SEGUNDO ARQUIVO:
**`@/pages/Auth.tsx`**
- **Tarefa:** Adicionar link "Esqueci minha senha"
- **Dependência:** Supabase já tem `resetPasswordForEmail()`
- **Tempo:** 4 horas
- **Impacto:** UX crítica (usuários presos sem recuperação)

---

### 3️⃣ TERCEIRO ARQUIVO:
**`migrations/20260129_check_rls_recursion.sql`** (criar)
- **Tarefa:** Verificar se `20260117000005_fix_supplier_users_rls_recursion.sql` foi aplicada
- **Se não:** Aplicar manualmente no Supabase Dashboard
- **Tempo:** 5 minutos
- **Impacto:** Segurança/funcionalidade do portal fornecedor

---

### 4️⃣ QUARTO ARQUIVO:
**`@/components/financeiro/ContasReceber.tsx`** (linhas 106-140)
- **Tarefa:** Corrigir lógica de `statusExibicao`
- **Problema:** Calculado no frontend sobrescreve status do banco
- **Solução:** Priorizar `status` do banco sobre cálculo
- **Tempo:** 4-6 horas
- **Impacto:** Core business (financeiro)

---

## ⚠️ RISCOS IDENTIFICADOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Sem Billing, não podemos cobrar clientes** | Alta | Crítico | Implementar billing visual na Semana 3, gateway na Semana 5 |
| **Supplier sem aprovação UI fica sem gestão operacional** | Alta | Alto | Priorizar painel admin na Semana 2 |
| **RLS recursão não aplicada em produção** | Média | Crítico | Verificar e aplicar migration imediatamente |
| **Sincronização financeira quebrada afeta caixa** | Média | Alto | Corrigir triggers na Semana 1 |
| **Integração Supplier→Orçamentos é complexa** | Média | Alto | Fazer MVP simples primeiro (só referência) |
| **Equipe pequena, 4 semanas pode ser otimista** | Alta | Médio | Definir MVP mínimo (Semana 2) vs completo (Semana 4) |

---

## 📁 ESTRUTURA DE ARQUIVOS RECOMENDADA (Novos)

```
src/
├── pages/
│   ├── AdminSupremo.tsx              # CRIAR - Shell do admin
│   └── Billing.tsx                    # CRIAR - Planos e upgrade
│
├── components/
│   ├── admin/
│   │   ├── SupplierApprovals.tsx      # CRIAR - Aprovação fornecedores
│   │   ├── OrganizationsList.tsx      # CRIAR - Lista orgs (painel supremo)
│   │   └── MetricsDashboard.tsx       # CRIAR - MRR/ARR
│   │
│   ├── auth/
│   │   └── ResetPasswordDialog.tsx    # CRIAR - Esqueci senha
│   │
│   └── estoque/
│       ├── DashboardEstoque.tsx       # CRIAR - Controle estoque
│       ├── ListaItensEstoque.tsx      # CRIAR
│       └── DialogEntradaSaida.tsx     # CRIAR
│
├── lib/
│   └── gerarPdfProducao.ts            # CRIAR - Guia de costura
│
supabase/migrations/
├── 20260129_add_soft_delete_users.sql
├── 20260129_add_inventory.sql
├── 20260129_trigger_sugerir_instalacao.sql
└── 20260129_trigger_entrega_automatica.sql
```

---

## ✅ CHECKLIST PRIMEIRO DIA

- [ ] Abrir `@/components/onboarding/OnboardingProvider.tsx` e fix tour
- [ ] Abrir `@/pages/Auth.tsx` e adicionar "Esqueci senha"
- [ ] Verificar migration RLS recursão aplicada em produção
- [ ] Commit das mudanças
- [ ] Testar em preview Vercel

---

**Documento gerado em:** 2026-01-28  
**Versão:** 1.0  
**Próxima revisão:** Após decisões pendentes