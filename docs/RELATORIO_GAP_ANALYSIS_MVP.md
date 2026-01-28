# 📊 RELATÓRIO GAP ANALYSIS - MVP STUDIOOS
## O Que Estava Planejado vs O Que Foi Implementado

**Data:** Janeiro 2026  
**Status:** Pós-Sprint 5 - Planejamento Próximos Sprints

---

## 🔴 Painel Supremo (SuperAdmin) - 0% Implementado

**Planejado em:** Sprint 1 (T1.3-T1.8)

| Feature | Status | Impacto |
|---------|--------|---------|
| `admin.studioos.pro` dashboard | ❌ | Crítico |
| Lista de tenants/organizações | ❌ | Crítico |
| Aprovação de fornecedores UI | ❌ | Crítico |
| Gestão de afiliados | ❌ | Alto |
| Feature flags admin | ❌ | Médio |
| Gestão de billing ASAAS | ❌ | Crítico |

**Atual:** Existe apenas [`GerenciarUsuarios.tsx`](src/pages/GerenciarUsuarios.tsx:1) que é **por organização**, não global.

---

## 🔴 Sistema de Billing/Cobrança - 0% Implementado

**Planejado em:** Sprint 1 (T1.1, T1.2, T1.11, T1.12)

| Feature | Status |
|---------|--------|
| Tabela `subscriptions` | ❌ |
| Edge Functions ASAAS | ❌ |
| Checkout de pagamento | ❌ |
| Webhook handler | ❌ |
| Página `/configuracoes/faturamento` | ❌ |

**Impacto:** Não é possível cobrar clientes automaticamente.

---

## 🔴 RBAC Granular - 0% Implementado

**Planejado em:** Sprint 1 (T1.13-T1.17)

| Feature | Status |
|---------|--------|
| Tabela `organization_member_permissions` | ❌ |
| Permissões por tela via checkboxes | ❌ |
| Hook `usePermissions()` | ❌ |

**Atual:** Apenas roles básicos `admin`/`user` em [`useUserRole.ts`](src/hooks/useUserRole.ts:1)

---

## 🔴 Sistema de Contratos - 0% Implementado

**Planejado em:** Sprint 2 (T2.1-T2.5)

| Feature | Status |
|---------|--------|
| Tabela `contract_templates` | ❌ |
| Editor de templates | ❌ |
| Geração PDF de contratos | ❌ |
| Integração com orçamentos | ❌ |

---

## 🔴 Blog StudioOS - 0% Implementado

**Planejado em:** Sprint 2 (T2.8-T2.10)

| Feature | Status |
|---------|--------|
| Tabela `blog_posts` | ❌ |
| Blog público em `studioos.pro/blog` | ❌ |
| Admin de posts | ❌ |

---

## 🔴 Portal de Afiliados - 0% Implementado

**Planejado em:** Sprint 4 (T4.1-T4.13)

| Feature | Status |
|---------|--------|
| Domínio `afiliados.studioos.pro` | ❌ |
| Cadastro de afiliados | ❌ |
| Geração de links de indicação | ❌ |
| Tracking de conversão | ❌ |
| Sistema de comissões (10%) | ❌ |
| Saque PIX | ❌ |

---

## 🔴 5 Temas de Landing Page - 0% Implementado

**Planejado em:** Sprint 2 (T2.11-T2.14)

| Tema | Status |
|------|--------|
| Minimalista | ❌ |
| Moderno | ❌ |
| Clássico | ❌ |
| Bold | ❌ |
| Elegante | ❌ |

**Atual:** Apenas tema único em [`LandingPageOrganizacao.tsx`](src/pages/LandingPageOrganizacao.tsx:1)

---

## 🚧 FEATURES PARCIAIS (Incompletas)

| Feature | % Completo | O que falta |
|---------|------------|-------------|
| **Integração Supplier → Orçamentos** | 30% | [`useSupplierMaterials.ts`](src/hooks/useSupplierMaterials.ts:1) existe mas não é usado em `MaterialSelector`. Falta campos `supplier_*` em `cortina_items` |
| **Dashboard Métricas** | 60% | Dados zerados, queries retornam vazio |
| **Contas a Receber** | 70% | Status não atualiza corretamente após pagamento |
| **Estoque** | 20% | Estrutura conceitual pronta, falta UI e triggers |
| **Soft Delete Usuários** | 10% | Só cria/altera senha, falta desativação |
| **Recuperação de Senha** | 10% | Supabase pronto, falta UI |

---

## 🐛 BUGS CRÍTICOS (P0) PENDENTES

Do [`PRODUCT_BACKLOG_STUDIOOS.md`](docs/PRODUCT_BACKLOG_STUDIOOS.md:107):

| Bug | Severidade | Arquivo |
|-----|------------|---------|
| Popup Tour em LP Pública | P0 | `OnboardingProvider.tsx` |
| Sincronização Orçamento↔Financeiro | P0 | Trigger migration |
| RLS Recursão Supplier | P0 | Migration `20260117000005` |
| Botão "Novo Orçamento" Duplicado | P1 | `DashboardContent.tsx` + `OrcamentoSidebar.tsx` |
| Status Contas Receber Não Atualiza | P1 | `ContasReceber.tsx` |

---

## 🔄 FLUXOS QUEBRADOS/INCOMPLETOS

### Fluxo 1: Fornecedor → Aprovação → Catálogo → Orçamento

```
Cadastro Público      ✅ Funciona
       ↓
Aprovação            🚧 SÓ VIA SQL (gap crítico)
       ↓
Catálogo             ✅ Funciona
       ↓
Uso em Orçamento     ❌ NÃO EXISTE
```

**Buraco Negro:** O fornecedor cadastra materiais, mas o orçamentista NÃO consegue selecioná-los no orçamento.

---

### Fluxo 2: Orçamento → Financeiro → Pedido → Entrega

```
Orçamento Aprovado   ✅ Funciona
       ↓
Conta a Receber      ✅ Funciona
       ↓
Pagamento            ⚠️ BUG: Status não atualiza
       ↓
Pedido Criado        ✅ Funciona
       ↓
Produção             ✅ Funciona
       ↓
Instalação           🚧 Sem alerta automático
       ↓
Entrega              🚧 Não atualiza automático
```

**Buracos Negros:**
1. Status financeiro não sincroniza perfeitamente
2. Pedido pronto não sugere instalação
3. Instalação concluída não fecha o ciclo

---

## 📊 ESTATÍSTICAS DO PRODUCT BACKLOG

Do [`PRODUCT_BACKLOG_STUDIOOS.md`](docs/PRODUCT_BACKLOG_STUDIOOS.md:14):

| Métrica | Valor |
|---------|-------|
| Total Features Mapeadas | 67 |
| Prontas (100%) | 28 (42%) |
| Parciais (50-90%) | 12 (18%) |
| Não Iniciadas (0%) | 19 (28%) |
| Bugs P0 | 5 |
| Dívida Técnica Crítica | 3 |

---

## ✅ O QUE FUNCIONA BEM (Implementado e Estável)

1. **Multi-tenancy Core** - RLS + organization_id funcionando
2. **Wizard de Orçamentos** - 4 etapas completas
3. **Pipeline de Vendas (Kanban)** - CRM funcional
4. **Kanban de Produção** - Colunas fixas operacionais
5. **Autenticação por Domínio** - Roteamento V3 finalizado
6. **Supplier Portal** - Fornecedor gerencia catálogo próprio
7. **Importação CSV** - Preview + validação
8. **WhatsApp Rotation** - Distribuição de leads entre vendedores
9. **Analytics Dashboard** - Métricas de conversão implementadas

---

## 🎯 RECOMENDAÇÕES

### Prioridade 1 (Crítico - Faça Imediatamente)

1. **Painel Admin de Aprovação** - Fornecedores estão "presos" sem UI de aprovação
2. **Fix Popup Tour** - 2 horas, impacto imediato na UX
3. **Corrigir sincronização Financeiro** - Core business quebrado

### Prioridade 2 (Alto - Próximas 2 semanas)

1. **Integração Supplier → Orçamentos** - Completa o valor do supplier portal
2. **Sistema de Billing (visual)** - Prepara para cobrança
3. **Soft delete usuários** - Gestão básica incompleta

### Prioridade 3 (Médio - Mês 2)

1. **RBAC Granular** - Permissões por tela
2. **Sistema de Contratos** - Diferencial competitivo
3. **5 Temas de LP** - Personalização

### Arquivar para Pós-MVP

- Portal de Afiliados (complexo, depende de billing)
- Blog completo
- Website Builder
- API Pública
- App Mobile

---

## 📝 CONCLUSÃO

**O MVP Core está OPERACIONAL** - o sistema funciona para orçamentos, pedidos, produção e financeiro. Porém, **as funcionalidades de SaaS avançadas não foram implementadas**:

- ❌ Não há Painel Supremo para gestão da plataforma
- ❌ Não há sistema de cobrança automática
- ❌ Não há portal de afiliados
- ❌ Não há RBAC granular
- ❌ Fornecedores não integram aos orçamentos

**Próximo passo recomendado:** Implementar o Painel Admin de Aprovação de Fornecedores (gap crítico operacional) e corrigir os bugs P0 antes de aceitar novos clientes.

---

## 💡 SUGESTÕES DE FEATURES E MELHORIAS UX/UI

### 🎨 Melhorias de UX/UI Prioritárias

| # | Sugestão | Motivação | Esforço |
|---|----------|-----------|---------|
| 1 | **Command Palette (Cmd+K)** | Navegação rápida entre telas sem usar mouse | 4-6h |
| 2 | **Global Search** | Buscar orçamentos, clientes, pedidos de qualquer lugar | 1 dia |
| 3 | **Toast Notifications Persistentes** | Notificações de ações importantes não sumirem rápido | 2h |
| 4 | **Atalhos de Teclado** | Ctrl+N (novo orçamento), Ctrl+S (salvar), Esc (fechar) | 4h |
| 5 | **Tema de Alto Contraste** | Acessibilidade para usuários com deficiência visual | 4h |
| 6 | **Modo Compacto/Denso** | Para usuários que preferem ver mais dados na tela | 6h |
| 7 | **Cards de Resumo Flutuantes** | KPIs principais sempre visíveis (sticky header) | 4h |
| 8 | **Animações de Transição** | Transições suaves entre telas para sensação de fluidez | 6h |

### 📱 Melhorias Mobile-First

| # | Sugestão | Motivação | Esforço |
|---|----------|-----------|---------|
| 1 | **Bottom Navigation** | Menu inferior para mobile (mais ergonômico) | 1 dia |
| 2 | **Swipe Gestures** | Swipe para ações rápidas (ex: arquivar orçamento) | 6h |
| 3 | **Camera Integration** | Tirar foto direto do celular para anexar em orçamento | 4h |
| 4 | **Voice Input** | Ditado para campos de texto (nome, endereço, observações) | 4h |
| 5 | **Pull-to-Refresh** | Atualizar dados puxando para baixo (padrão mobile) | 2h |

### ✨ Features de Produtividade

| # | Sugestão | Motivação | Esforço |
|---|----------|-----------|---------|
| 1 | **Templates de Orçamento** | Salvar orçamentos como templates para reutilizar | 1 dia |
| 2 | **Duplicar Orçamento** | Criar novo baseado em orçamento existente | 4h |
| 3 | **Autopreenchimento Endereço** | Via CEP (API dos Correios) | 4h |
| 4 | **Autopreenchimento Cliente** | Sugestão de clientes existentes ao digitar | 6h |
| 5 | **Agendamento de Follow-up** | Agendar lembrete para contatar cliente | 1 dia |
| 6 | **Email Templates** | Templates pré-definidos para envio de orçamentos | 6h |
| 7 | **Bulk Actions** | Ações em lote (ex: marcar 5 orçamentos como "perdido") | 1 dia |
| 8 | **Exportar Dados** | Exportar lista de orçamentos/clientes para Excel/PDF | 6h |

---

## 🔄 ANÁLISE DE FLUXOS DE TRABALHO

### 👤 Fluxo do Usuário da Organização (Orçamentista/Vendedor)

#### Fluxo Atual
```
Login → Dashboard → Lista Orçamentos → Novo Orçamento
                                        ↓
                                    Wizard 4 Etapas
                                        ↓
                                    Salvar PDF
                                        ↓
                                    Enviar Email (manual)
```

#### Problemas Identificados

| # | Problema | Impacto | Solução Sugerida |
|---|----------|---------|------------------|
| 1 | **Navegação confusa entre módulos** | Alto | Sidebar tem muitas seções, usuário se perde |
| 2 | **Sem atalho rápido para "Novo Orçamento"** | Médio | Botão só aparece no sidebar |
| 3 | **Wizard sem salvamento automático** | Alto | Se fechar aba, perde todo o progresso |
| 4 | **Sem preview do PDF antes de salvar** | Médio | Usuário não sabe como vai ficar |
| 5 | **Envio de email manual** | Alto | Copia PDF, abre Gmail, envia manualmente |
| 6 | **Sem acompanhamento de "email aberto"** | Alto | Não sabe se cliente viu o orçamento |

#### Fluxo Ideal Proposto
```
Login → Dashboard com Ações Rápidas
            ↓
    ┌───────┴───────┐
    ↓               ↓
Novo Orçamento   Buscar Cliente
    ↓               ↓
Wizard com       Histórico do
Autosave         Cliente
    ↓               ↓
Preview PDF ←─── Sugestão de
    ↓             Preços
Enviar Email    Anteriores
    ↓               ↓
Tracking →──→ Dashboard
(aberturas)     Follow-ups
```

---

### 🏭 Fluxo do Fornecedor (Supplier)

#### Fluxo Atual
```
Cadastro → Aguarda Aprovação (SQL manual) → Portal
                                              ↓
                                    ┌────────┴────────┐
                                    ↓                 ↓
                                Dashboard         Catálogo
                                    ↓                 ↓
                                Métricas básicas  CRUD Materiais
                                    ↓                 ↓
                                Status pendente   Import CSV
```

#### Problemas Críticos

| # | Problema | Impacto | Solução Sugerida |
|---|----------|---------|------------------|
| 1 | **Sem UI de aprovação** | CRÍTICO | Admin precisa acessar SQL |
| 2 | **Sem notificação de aprovação** | Alto | Fornecedor não sabe quando foi aprovado |
| 3 | **Catálogo não conecta a vendas** | CRÍTICO | Não sabe quem comprou seus produtos |
| 4 | **Sem histórico de preços** | Médio | Não consegue ver evolução de preços |
| 5 | **Sem relatório de leads** | Alto | Não sabe quantos orçamentos usaram seus materiais |
| 6 | **Sem controle de estoque** | Médio | Pode vender o que não tem |

#### Fluxo Ideal Proposto
```
Cadastro → Email de Confirmação → Aguardando Aprovação
                                      ↓
                    ┌─────────────────┘
                    ↓
            Notificação Email
            "Você foi aprovado!"
                    ↓
            Portal Completo
                    ↓
        ┌───────┼───────┬───────┐
        ↓       ↓       ↓       ↓
    Dashboard Catálogo  Vendas  Financeiro
        ↓       ↓       ↓       ↓
    Métricas  Preços   Leads   Repasses
    de uso    dinâmicos recebidos
```

---

### 👑 Fluxo do Admin da Plataforma (SuperAdmin)

#### Fluxo Atual
```
NÃO EXISTE - Só via SQL
```

#### Problema
**Não há interface para gerenciar a plataforma.**

Tudo é feito via SQL:
- Aprovar fornecedores
- Ver métricas de tenants
- Gerenciar billing
- Configurar feature flags

#### Fluxo Ideal (Painel Supremo)
```
admin.studioos.pro
        ↓
┌───────┼───────┬───────┬───────┐
↓       ↓       ↓       ↓       ↓
Dash    Orgs    Forn    Afil    Billing
        ↓       ↓       ↓       ↓
    Lista   Aprovar   Comissões   Faturas
    tenants cadastros  saques    assinaturas
        ↓       ↓       ↓       ↓
    MRR/    Catálogo  Tracking  Repasse
    ARR     por forn  links     automático
```

---

## 🧭 ANÁLISE DE NAVEGAÇÃO E MENU

### Problemas na Navegação Atual

#### 1. Sidebar Muito Carregada
**Observação:** A sidebar em [`OrcamentoSidebar.tsx`](src/components/orcamento/OrcamentoSidebar.tsx:110) tem 7 seções com muitos itens:
- Orçamentos (4 itens)
- CRM (4 itens)
- Produção (4 itens)
- Financeiro (8 itens)
- Analytics (1 item)
- Relatórios & BI (7 itens)
- Administração (5 itens)

**Total:** ~33 itens de menu

**Problema:** Sobrecarga cognitiva, usuário não encontra o que precisa.

#### 2. Seções Mal Agrupadas
- "Analytics" é separado de "Relatórios & BI" (deveriam ser juntos)
- "Ajustes do Sistema" está em Administração, mas "Configurações da Empresa" também (confusão)

#### 3. Nomes Inconsistentes
- "Meus Orçamentos" vs "Orçamentos" (padronizar)
- "Visão Geral" aparece em várias seções (não é descritivo)

#### 4. Falta Hierarquia Visual
- Não há separação clara entre áreas operacionais vs administrativas
- Tudo parece ter a mesma importância

---

### Proposta de Reorganização do Menu

#### Princípios
1. **Máximo 5 seções principais**
2. **Agrupar por função, não por módulo**
3. **Destacar ações primárias**
4. **Esconder/secundarizar ações administrativas**

#### Nova Estrutura Proposta

```
┌─────────────────────────────────────────┐
│  🏠 Visão Geral (Dashboard Executivo)   │
├─────────────────────────────────────────┤
│  ➕ Novo Orçamento (Botão Destacado)    │
├─────────────────────────────────────────┤
│  📋 OPERACIONAL                         │
│     • Orçamentos                        │
│     • CRM (Contatos + Pipeline)         │
│     • Produção (Kanban + Pedidos)       │
│     • Calendário                        │
├─────────────────────────────────────────┤
│  💰 FINANCEIRO                          │
│     • Contas a Pagar/Receber            │
│     • Conciliação                       │
│     • Relatórios                        │
├─────────────────────────────────────────┤
│  📊 ANÁLISES (Analytics + BI)           │
│     • Dashboard Analytics               │
│     • KPIs do Negócio                   │
│     • Relatórios Detalhados             │
├─────────────────────────────────────────┤
│  ⚙️ CONFIGURAÇÕES                       │
│     • Minha Empresa                     │
│     • Usuários                          │
│     • Integrações                       │
│     • Materiais e Fornecedores          │
└─────────────────────────────────────────┘
```

---

## 🔧 QUICK WINS DE UX (Implementar Imediatamente)

### 1. Fix: Popup Tour em Landing Pages
**Problema:** Tour aparece em páginas públicas
**Arquivo:** `OnboardingProvider.tsx`
**Fix:** 2 linhas de código
```typescript
const isPublicRoute = pathname === '/studioos' || pathname.startsWith('/lp/');
if (isPublicRoute) return null;
```

### 2. Fix: Botão "Novo Orçamento" Duplicado
**Problema:** Existe em `DashboardContent` e `OrcamentoSidebar`
**Decisão:** Manter apenas no sidebar (padrão consistente)

### 3. Fix: Salvar Posição do Sidebar
**Problema:** Sidebar sempre volta ao estado padrão
**Arquivo:** Já implementado em `OrcamentoSidebar.tsx` ✅

### 4. Add: Loading States em Transições
**Problema:** Tela fica em branco ao trocar de módulo
**Solução:** Skeleton screens durante carregamento

### 5. Add: Confirmação ao Sair do Wizard
**Problema:** Fechar aba = perder tudo
**Solução:** `beforeunload` event + modal de confirmação

---

## 📋 CHECKLIST DE FLUXOS QUE PRECISAM DE ATENÇÃO

### Fluxos Quebrados (Corrigir Urgente)
- [ ] **Fornecedor → Aprovação → Catálogo → Venda** (gap crítico)
- [ ] **Orçamento → Financeiro → Pedido** (sync status)
- [ ] **Pedido Pronto → Instalação** (sem alerta)
- [ ] **Instalação → Entrega** (não atualiza automaticamente)

### Fluxos Complicados (Simplificar)
- [ ] **Navegação entre CRM e Orçamentos** (muitos cliques)
- [ ] **Criar pedido de orçamento antigo** (não é intuitivo)
- [ ] **Conciliação bancária** (processo manual confuso)

### Fluxos Inexistentes (Criar)
- [ ] **Lead → Orçamento → Cliente** (sem integração automática)
- [ ] **Pedido → Compra de Materiais** (sem integração fornecedor)
- [ ] **Alertas de Atraso** (sistema não notifica)

---

**Documento atualizado em:** Janeiro 2026
**Versão:** 1.1
**Inclui:** Análise de UX, Sugestões de Features, Fluxos de Trabalho, Reorganização de Navegação
