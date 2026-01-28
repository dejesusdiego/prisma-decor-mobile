# PLANO DE EXECUÇÃO FINAL - MVP STUDIOOS
## Versão Consolidada com Correções de Código

**Data:** Janeiro 2026  
**Versão:** MVP 1.0 FINAL  
**Status:** Aprovado para execução com sprints separados

---

## HISTÓRICO DE DECISÕES DO CHAT

### Decisões Arquiteturais Confirmadas

| # | Decisão | Valor Definido |
|---|---------|----------------|
| 1 | **Supplier Integration** | Fornecedor tem conta própria, gerencia catálogo/preços. B2B ordering (cliente → fornecedor) será V2 |
| 2 | **Payment Gateway** | ASAAS (escolhido pelo usuário) - substitui Stripe/Pagar.me |
| 3 | **Painel Supremo** | Expandir `admin.studioos.pro` com múltiplos módulos |
| 4 | **Inventário** | OPCIONAL - não bloqueia MVP |
| 5 | **MVP Timeline** | 10 semanas (expandido de 8) |
| 6 | **Taxa Implementação** | R$3.000 fixo para TODOS os planos |
| 7 | **Comissão Afiliados** | 10% padrão (editável no Painel Supremo) |
| 8 | **Afiliados Pós-venda** | Cliente permanece vinculado ao afiliado para acompanhamento |

### Preços Corrigidos (Valores Finais)

| Plano | Preço Mensal | Taxa Impl. | Comissão Afiliado (10%) |
|-------|--------------|------------|------------------------|
| Starter | R$499 | R$3.000 | R$49,90 + R$300 |
| Profissional | R$899 | R$3.000 | R$89,90 + R$300 |
| Business | R$1.499 | R$3.000 | R$149,90 + R$300 |
| Enterprise | R$2.499 | R$3.000 | R$249,90 + R$300 |

### Features Adicionais Solicitadas

1. **RBAC Granular**: Admin da organização define permissões por tela via checkboxes
2. **Portal de Afiliados**: `afiliados.studioos.pro` para representantes comerciais
3. **Contratos Pré-Prontos**: Templates parametrizáveis com geração de PDF
4. **Tela de Integrações**: Configuração de NF-e, WhatsApp, etc.
5. **Blog**: Para StudioOS (marketing) + capacidade V2 para clientes
6. **5 Temas de LP**: Minimalista, Moderno, Clássico, Bold, Elegante

### Correção de Entendimento (Importante)

**ANTES (errado):** "detecção por slug" no gateway de login  
**DEPOIS (correto):** `redirectAfterLogin` consulta 3 tabelas na ordem de prioridade:
1. `supplier_users` → redireciona para `fornecedores.studioos.pro`
2. `user_roles` (role='admin') → redireciona para `admin.studioos.pro`
3. `organization_members` → redireciona para `{slug}-app.studioos.pro`

---

## VERIFICAÇÃO DE CÓDIGO - BUGS CRÍTICOS ENCONTRADOS

### Categoria A: Type Safety (Bloqueante)

| Arquivo | Problema | Impacto | Correção |
|---------|----------|---------|----------|
| `src/contexts/OrganizationContext.tsx:30` | `as any` cast em theme_name | Perda de type safety | Definir tipo ThemeName |
| `src/components/orcamento/NovoOrcamento.tsx:100` | `as any` em tipoCortina | Runtime errors possíveis | Usar union types |
| `src/components/orcamento/VisualizarOrcamento.tsx:128` | `as any` em tipoCortina | Runtime errors possíveis | Usar union types |
| `src/components/orcamento/wizard/EtapaProdutos.tsx:219` | `as any` em tipoCortina | Runtime errors possíveis | Usar union types |
| `src/lib/integracaoOrcamentoFinanceiro.ts:158` | Cast de tabela `as any` | SQL injection risk | Usar tipos do Supabase |
| `src/components/financeiro/ConciliacaoBancaria.tsx:134` | Cast de tabela `as any` | SQL injection risk | Usar tipos do Supabase |

### Categoria B: Console.logs em Produção (Médio)

**Arquivos afetados (50+ ocorrências):**
- `src/pages/SupplierPortal.tsx` (4 logs)
- `src/hooks/useDashboardData.ts` (3 logs)
- `src/hooks/useDashboardUnificado.ts` (1 log)
- `src/lib/analytics.ts` (2 logs - GA4 tracking)
- `src/components/settings/ThemeSelector.tsx` (1 log)
- `src/hooks/useUserRole.ts` (1 log)
- `src/hooks/usePerformanceMonitor.ts` (1 log - condicional)
- `src/components/orcamento/OrcamentoSidebar.tsx` (3 logs)
- `src/components/orcamento/gestao/ListaMateriais.tsx` (1 log)
- `src/components/financeiro/ContasPagar.tsx` (2 logs)
- Diversos hooks de relatórios

**Ação:** Remover todos console.logs ou substituir por logger condicional (só em DEV).

### Categoria C: RLS & Segurança (Alto)

| Problema | Localização | Impacto |
|----------|-------------|---------|
| Queries sem RLS explícito | Múltiplos hooks | Possível vazamento de dados |
| `supabase.from('table' as any)` | ~15 arquivos | Bypass de type safety |
| Cast `as any` em joins | Hooks de relatório | Dados incorretos possíveis |

### Categoria D: UX/UI Issues (Médio)

| Problema | Localização | Solução |
|----------|-------------|---------|
| TODO não implementado | `LandingPageStudioOS.tsx:645` | Integrar com API/CRM |
| TODO APM não implementado | `usePerformanceMetrics.ts:70` | Integrar Sentry |
| TODO category em supplier_materials | `useSupplierMaterials.ts:72` | Adicionar campo category |
| Comentários em português misturados | Vários arquivos | Padronizar para português |

### Categoria E: Performance (Médio)

| Problema | Localização | Impacto |
|----------|-------------|---------|
| Queries sem limit | Vários hooks | Memory leaks em dados grandes |
| N+1 queries | Hooks de relatório | Lentidão com muitos dados |
| Sem virtualização em listas | Tabelas grandes | Slow rendering |

---

## ARQUITETURA DE DOMÍNIOS CONFIRMADA

```
┌─────────────────────────────────────────────────────────────┐
│                      STUDIOOS v3.0                          │
├─────────────────────────────────────────────────────────────┤
│  studioos.pro/                    → Landing Page StudioOS   │
│  studioos.pro/precos              → Pricing Page            │
│  studioos.pro/blog                → Blog StudioOS           │
├─────────────────────────────────────────────────────────────┤
│  admin.studioos.pro/              → Painel Supremo          │
│  ├── /dashboard                   → Métricas consolidadas   │
│  ├── /organizations               → Lista de tenants        │
│  ├── /suppliers                   → Aprovação fornecedores  │
│  ├── /affiliates                  → Gestão de afiliados     │
│  ├── /users                       → GerenciarUsuarios.tsx   │
│  ├── /billing                     → Gestão ASAAS            │
│  ├── /settings                    → Feature flags           │
│  └── /blog                        → Gerenciar posts         │
├─────────────────────────────────────────────────────────────┤
│  fornecedores.studioos.pro/       → Supplier Portal         │
│  ├── /cadastro                    → CadastroFornecedor      │
│  ├── /dashboard                   → Dashboard fornecedor    │
│  ├── /catalogo                    → CRUD produtos           │
│  └── /leads                       → Interessados            │
├─────────────────────────────────────────────────────────────┤
│  afiliados.studioos.pro/          → Portal de Afiliados     │
│  ├── /cadastro                    → Form de inscrição       │
│  ├── /dashboard                   → Painel do afiliado      │
│  ├── /clientes                    → Meus clientes (pós-venda)│
│  └── /saques                      → Solicitar saque         │
├─────────────────────────────────────────────────────────────┤
│  {slug}-app.studioos.pro/         → ERP do Cliente          │
│  ├── /gerarorcamento              → Orçamentos              │
│  ├── /dashboard                   → Dashboard               │
│  ├── /contratos                   → Contratos (NOVO)        │
│  ├── /fornecedores/catalogo       → Catálogo B2B (NOVO)     │
│  └── /configuracoes/usuarios      → RBAC permissions (NOVO) │
├─────────────────────────────────────────────────────────────┤
│  {slug}.studioos.pro/             → Landing Page do Cliente │
│  (5 temas disponíveis: Minimalista, Moderno, Clássico,      │
│   Bold, Elegante)                                           │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação (Login Gateway)

```
Usuário faz login em app.studioos.pro
         │
         ▼
[redirectAfterLogin.ts]
         │
    ┌────┴────┐
    ▼         ▼
supplier_users?  ──SIM──►  fornecedores.studioos.pro
    │
    NÃO
    ▼
user_roles='admin'? ──SIM──► admin.studioos.pro
    │
    NÃO
    ▼
organization_members? ──SIM──► {slug}-app.studioos.pro
    │
    NÃO
    ▼
Fallback ──► app.studioos.pro/gerarorcamento
```

---

## SPRINTS SEPARADOS

### 🐛 SPRINT 0: CRITICAL BUG FIXES (Semana 0 - 3 dias)
**Objetivo:** Corrigir bugs críticos antes de iniciar novas features

#### Dia 1: Type Safety & Security
- [ ] **T0.1** Remover todos `as any` casts críticos
  - `OrganizationContext.tsx` - theme_name
  - `NovoOrcamento.tsx` - tipoCortina
  - `VisualizarOrcamento.tsx` - tipoCortina
  - `EtapaProdutos.tsx` - tipoCortina
- [ ] **T0.2** Corrigir casts de tabela `as any` em queries Supabase
  - `integracaoOrcamentoFinanceiro.ts`
  - `ConciliacaoBancaria.tsx`
  - Todos os hooks de relatório
- [ ] **T0.3** Definir tipos estritos para tabelas dinâmicas

#### Dia 2: Cleanup & RLS
- [ ] **T0.4** Remover/condicionar todos console.logs (50+)
  - Criar helper `logger.ts` que só loga em DEV
  - Substituir todos console.log por logger.debug
- [ ] **T0.5** Auditar RLS policies existentes
  - Verificar se todas as tabelas têm RLS ativado
  - Criar policy para super_admin (bypass)
  - Criar policy para supplier (só próprios dados)
- [ ] **T0.6** Adicionar limites em queries sem paginação

#### Dia 3: Testing & Validation
- [ ] **T0.7** Testes de regressão críticos
  - Login flow completo
  - Criar orçamento → pedido
  - Fluxo de pagamento
- [ ] **T0.8** ESLint rule para bloquear `as any` novo
- [ ] **T0.9** Deploy para staging e validação

**Métricas de Conclusão:**
- Zero `as any` casts em código novo
- Zero console.logs em produção
- 100% das tabelas com RLS
- Todos os testes de regressão passando

---

### 🏗️ SPRINT 1: FOUNDATION (Semanas 1-2)
**Objetivo:** Base estável para build rápido

#### Semana 1
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 1 | **T1.1** Setup ASAAS sandbox, criar tabela subscriptions | Backend |
| 1 | **T1.2** Criar Edge Functions: asaas-create-customer, asaas-create-subscription | Backend |
| 2 | **T1.3** Painel Supremo - criar AdminLayout com navegação | Frontend |
| 2 | **T1.4** Painel Supremo - AdminDashboard com métricas | Frontend |
| 3 | **T1.5** Painel Supremo - AdminOrganizations (lista tenants) | Frontend |
| 3 | **T1.6** Migrar GerenciarUsuarios para novo layout | Frontend |
| 4 | **T1.7** Supplier approval workflow - AdminSuppliers page | Full-stack |
| 4 | **T1.8** Supplier approval - botões Aprovar/Rejeitar + email | Full-stack |
| 5 | **T1.9** RLS - policy super_admin (bypass all) | Backend |
| 5 | **T1.10** ASAAS webhook handler | Backend |
| 6-7 | Code review, testes integração | Todos |

#### Semana 2
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 8 | **T1.11** Página /configuracoes/faturamento no ERP | Frontend |
| 9 | **T1.12** Integração ASAAS checkout | Frontend |
| 10 | **T1.13** RBAC - tabela organization_member_permissions | Backend |
| 11 | **T1.14** RBAC - página /configuracoes/usuarios | Frontend |
| 12 | **T1.15** RBAC - modal de permissões com checkboxes | Frontend |
| 13 | **T1.16** RBAC - hook usePermissions() | Frontend |
| 14 | **T1.17** Testes RBAC, fixes | Todos |

**Entregáveis Sprint 1:**
- Painel Supremo funcional com dashboard
- Supplier approval workflow completo
- ASAAS integrado (sandbox)
- RBAC básico implementado

---

### ✨ SPRINT 2: CORE FEATURES (Semanas 3-4)
**Objetivo:** Funcionalidades que vendem

#### Semana 3
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 15 | **T2.1** Contratos - tabela contract_templates | Backend |
| 16 | **T2.2** Contratos - página /contratos/templates | Frontend |
| 17 | **T2.3** Contratos - editor de templates | Frontend |
| 18 | **T2.4** Contratos - geração PDF | Frontend |
| 19 | **T2.5** Contratos - integração com orçamentos | Full-stack |
| 20 | **T2.6** Integrações - página /configuracoes/integracoes | Frontend |
| 21 | **T2.7** Integrações - cards NF-e, WhatsApp, Email | Frontend |

#### Semana 4
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 22 | **T2.8** Blog - tabela blog_posts | Backend |
| 23 | **T2.9** Blog - /blog no marketing site | Frontend |
| 24 | **T2.10** Blog - admin em admin.studioos.pro/blog | Frontend |
| 25 | **T2.11** 5 Temas - estrutura base LandingPageOrganizacao | Frontend |
| 26 | **T2.12** 5 Temas - implementar tema Minimalista | Frontend |
| 27 | **T2.13** 5 Temas - implementar temas Moderno, Clássico | Frontend |
| 28 | **T2.14** 5 Temas - implementar temas Bold, Elegante + seletor | Frontend |

**Entregáveis Sprint 2:**
- Sistema de contratos funcionando
- Tela de integrações (mock/config)
- Blog estruturado
- 5 temas de LP disponíveis

---

### 🏭 SPRINT 3: SUPPLIER B2B & CATALOG (Semanas 5-6)
**Objetivo:** Supplier completo + catálogo visível

#### Semana 5
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 29 | **T3.1** Supplier Portal - dashboard com métricas | Frontend |
| 30 | **T3.2** Supplier Portal - CRUD catálogo | Full-stack |
| 31 | **T3.3** Supplier Portal - upload de imagens (Storage) | Full-stack |
| 32 | **T3.4** Supplier Portal - perfil editável | Frontend |
| 33 | **T3.5** B2B - página /fornecedores/catalogo | Frontend |
| 34 | **T3.6** B2B - listar fornecedores por categoria | Frontend |
| 35 | **T3.7** B2B - visualizar produtos de fornecedor | Frontend |

#### Semana 6
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 36 | **T3.8** B2B - solicitar orçamento (leads) | Full-stack |
| 37 | **T3.9** B2B - notificação email para fornecedor | Backend |
| 38 | **T3.10** Feature flags - tabela e hook useFeatureFlag | Backend |
| 39 | **T3.11** Feature flags - painel em admin/settings | Frontend |
| 40 | **T3.12** Supplier Portal - leads/interessados | Frontend |
| 41-42 | Testes fluxo completo, otimização queries | QA |

**Entregáveis Sprint 3:**
- Supplier Portal completo (dashboard, catálogo, leads)
- Catálogo B2B visível para clientes
- Sistema de feature flags

---

### 🤝 SPRINT 4: PORTAL DE AFILIADOS (Semanas 7-8)
**Objetivo:** Programa de representantes comerciais

#### Semana 7
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 43 | **T4.1** Afiliados - tabelas (affiliates, referrals, commissions, payouts) | Backend |
| 44 | **T4.2** Afiliados - domínio afiliados.studioos.pro configurado | DevOps |
| 45 | **T4.3** Afiliados - landing page do programa | Frontend |
| 46 | **T4.4** Afiliados - form de cadastro | Frontend |
| 47 | **T4.5** Afiliados - login e dashboard base | Full-stack |
| 48 | **T4.6** Afiliados - métricas (indicações, conversão, ganhos) | Frontend |
| 49 | **T4.7** Afiliados - geração de link de indicação | Frontend |

#### Semana 8
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 50 | **T4.8** Afiliados - tracking de conversão (cookie/localStorage) | Frontend |
| 51 | **T4.9** Afiliados - sistema de saque (PIX) | Full-stack |
| 52 | **T4.10** Afiliados - aba "Meus Clientes" com pós-venda | Frontend |
| 53 | **T4.11** Admin - página de aprovação de afiliados | Frontend |
| 54 | **T4.12** Admin - configuração de comissões (padrão 10%, editável) | Frontend |
| 55 | **T4.13** Integração afiliado → checkout | Full-stack |
| 56-57 | Testes fluxo afiliado completo | QA |

**Entregáveis Sprint 4:**
- Portal de afiliados funcional
- Sistema de comissões (10% padrão)
- Tracking e conversão
- Pós-venda para afiliados

---

### 🚀 SPRINT 5: UX/UI & LAUNCH PREP (Semanas 9-10)
**Objetivo:** Polimento e preparação para lançamento

#### Semana 9
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 58 | **T5.1** UX - Onboarding guiado (tour interativo) | Frontend |
| 59 | **T5.2** UX - Checklist de setup progressivo | Frontend |
| 60 | **T5.3** UX - Dashboard modernizado (sparklines, atalhos) | Frontend |
| 61 | **T5.4** UX - Mobile responsiveness (drawer, bottom sheet) | Frontend |
| 62 | **T5.5** UX - Formulários inteligentes (CEP, CPF/CNPJ, telefone) | Frontend |
| 63 | **T5.6** UX - Command palette (Cmd+K) para navegação | Frontend |
| 64 | **T5.7** Performance - Virtualização em listas longas | Frontend |

#### Semana 10
| Dia | Tarefa | Resp. |
|-----|--------|-------|
| 65 | **T5.8** Produção - setup domínios, SSL | DevOps |
| 66 | **T5.9** Produção - ASAAS produção | Backend |
| 67 | **T5.10** Testes E2E críticos | QA |
| 68 | **T5.11** Testes de segurança | QA |
| 69 | **T5.12** Documentação - README, API docs | Tech Lead |
| 70 | **T5.13** Documentação - user guides, videos | Tech Lead |
| 71-72 | Beta launch, feedback, hotfixes | Todos |

**Entregáveis Sprint 5:**
- UX/UI polida e responsiva
- Performance otimizada
- Ambiente de produção pronto
- Documentação completa

---

## MODELO DE DADOS - NOVAS TABELAS

### subscriptions (ASAAS)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  asaas_customer_id TEXT NOT NULL,
  asaas_subscription_id TEXT,
  plan_type TEXT CHECK (plan_type IN ('starter', 'professional', 'business', 'enterprise')),
  status TEXT CHECK (status IN ('active', 'inactive', 'past_due', 'canceled')),
  price_cents INTEGER NOT NULL,
  implementation_fee_cents INTEGER DEFAULT 300000, -- R$3.000
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  affiliate_id UUID REFERENCES affiliates(id), -- quem indicou
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### organization_member_permissions (RBAC)
```sql
CREATE TABLE organization_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  can_dashboard BOOLEAN DEFAULT true,
  can_orcamentos BOOLEAN DEFAULT true,
  can_pedidos BOOLEAN DEFAULT true,
  can_clientes BOOLEAN DEFAULT true,
  can_crm BOOLEAN DEFAULT false,
  can_financeiro BOOLEAN DEFAULT false,
  can_producao BOOLEAN DEFAULT false,
  can_fornecedores BOOLEAN DEFAULT false,
  can_contratos BOOLEAN DEFAULT false,
  can_configuracoes BOOLEAN DEFAULT false,
  can_usuarios BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Trigger: criar permissões default quando novo membro é adicionado
CREATE OR REPLACE FUNCTION create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_member_permissions (
    organization_id, user_id,
    can_dashboard, can_orcamentos, can_pedidos, can_clientes
  ) VALUES (
    NEW.organization_id, NEW.user_id,
    true, true, true, true
  )
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### affiliates
```sql
CREATE TYPE affiliate_status AS ENUM ('pending', 'active', 'suspended');

CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  status affiliate_status DEFAULT 'pending',
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- 10% padrão, editável
  total_earnings_cents INTEGER DEFAULT 0,
  total_paid_cents INTEGER DEFAULT 0,
  balance_cents INTEGER DEFAULT 0,
  pix_key TEXT,
  bank_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id)
);
```

### affiliate_referrals (vinculação permanente)
```sql
CREATE TYPE referral_status AS ENUM ('pending', 'converted', 'canceled');

CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) UNIQUE, -- uma org só pode ter um afiliado
  subscription_id UUID REFERENCES subscriptions(id),
  status referral_status DEFAULT 'pending',
  commission_cents INTEGER,
  commission_rate_at_conversion DECIMAL(5,2),
  lifetime_value_cents INTEGER DEFAULT 0,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### contract_templates
```sql
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### feature_flags
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  default_value BOOLEAN DEFAULT false,
  plan_values JSONB DEFAULT '{}',
  organization_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed inicial
INSERT INTO feature_flags (key, description, plan_values) VALUES
('contracts', 'Contratos pré-prontos', '{"starter": false, "professional": true, "business": true, "enterprise": true}'),
('integrations', 'Tela de integrações', '{"starter": false, "professional": true, "business": true, "enterprise": true}'),
('blog', 'Blog próprio', '{"starter": false, "professional": false, "business": true, "enterprise": true}'),
('custom_landing_theme', 'Temas customizados de LP', '{"starter": false, "professional": false, "business": true, "enterprise": true}'),
('b2b_ordering', 'Pedidos B2B para fornecedores', '{"starter": false, "professional": false, "business": true, "enterprise": true}'),
('inventory', 'Módulo de estoque', '{"starter": false, "professional": true, "business": true, "enterprise": true}'),
('rbac', 'Permissões granulares', '{"starter": false, "professional": true, "business": true, "enterprise": true}');
```

---

## CHECKLIST PRÉ-DEPLOY

### Código
- [ ] Todos os `as any` removidos ou justificados
- [ ] Todos console.logs removidos ou condicionais
- [ ] ESLint passando sem erros
- [ ] TypeScript compilando sem erros
- [ ] Testes de regressão passando

### Banco de Dados
- [ ] Migrations aplicadas em staging
- [ ] RLS policies verificadas
- [ ] Índices criados para queries frequentes
- [ ] Seed data inserido (feature flags, configurações)

### Infraestrutura
- [ ] Domínios configurados e apontados
- [ ] SSL certificates ativos
- [ ] ASAAS sandbox → produção
- [ ] Supabase backups configurados
- [ ] Vercel/Netlify config para SPA routing

### Segurança
- [ ] RLS auditado (nenhum dado exposto)
- [ ] API keys em environment variables
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo

### Documentação
- [ ] README atualizado
- [ ] API documentation (Postman/Swagger)
- [ ] User guides criados
- [ ] Onboarding checklist

---

## COMANDOS DE DEPLOY AUTOMATIZADO

### Preparação (usuário deve fornecer tokens)

```bash
# Variáveis de ambiente necessárias (usuário fornecerá)
export VERCEL_TOKEN="seu_token_aqui"
export VERCEL_ORG_ID="sua_org_aqui"
export VERCEL_PROJECT_ID="seu_projeto_aqui"
export SUPABASE_ACCESS_TOKEN="seu_token_aqui"
export SUPABASE_PROJECT_ID="seu_projeto_aqui"
export ASAAS_API_KEY="sua_key_aqui"
```

### Deploy Staging
```bash
# 1. Aplicar migrations
supabase link --project-ref $SUPABASE_PROJECT_ID
supabase db push

# 2. Deploy Vercel (preview)
vercel --token=$VERCEL_TOKEN

# 3. Rodar testes
npm run test
```

### Deploy Produção
```bash
# 1. Backup antes do deploy
supabase db dump -f backup_pre_deploy.sql

# 2. Aplicar migrations
supabase db push

# 3. Deploy Vercel (produção)
vercel --prod --token=$VERCEL_TOKEN

# 4. Verificar health check
curl https://studioos.pro/api/health
```

---

## MÉTRICAS DE SUCESSO

### Técnicas
- [ ] 0 downtime em deploys
- [ ] < 200ms tempo resposta API
- [ ] 100% cobertura RLS crítico
- [ ] 0 vulnerabilidades alta/crítica
- [ ] 0 `as any` casts em código produtivo
- [ ] 0 console.logs em produção

### Negócio
- [ ] 10 beta users ativos
- [ ] 3 assinaturas pagas no mês 1
- [ ] < 24h tempo de aprovação supplier
- [ ] 80% completação onboarding
- [ ] 5 afiliados ativos no mês 1

---

## RISCOS & MITIGAÇÕES ATUALIZADAS

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Bugs de type safety | Alta | Alto | Sprint 0 dedicado a fixes |
| ASAAS delay integração | Média | Alto | Sandbox desde dia 1 |
| Scope creep | Alta | Alto | Congelar features pós-semana 4 |
| Performance multi-tenant | Média | Médio | Índices desde início |
| Afiliados não adotarem | Média | Médio | Comissão atrativa (10% + impl) |

---

## PRÓXIMOS PASSOS IMEDIATOS

### Hoje (Setup)
- [ ] Criar conta ASAAS sandbox
- [ ] Receber tokens Vercel/Supabase do usuário
- [ ] Criar branch `sprint0/bug-fixes`
- [ ] Criar branch `sprint1/foundation`

### Amanhã (Sprint 0)
- [ ] Iniciar correção de `as any` casts
- [ ] Remover console.logs
- [ ] Auditar RLS

### Esta Semana
- [ ] Finalizar Sprint 0
- [ ] Code review
- [ ] Deploy staging
- [ ] Iniciar Sprint 1

---

**Documento criado em:** Janeiro 2026  
**Versão:** FINAL v1.0  
**Status:** [x] Aprovado para execução  
**Próxima ação:** Aguardando tokens Vercel/Supabase para deploy automatizado
