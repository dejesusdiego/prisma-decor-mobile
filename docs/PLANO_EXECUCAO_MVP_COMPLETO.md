# PLANO DE EXECUÇÃO - MVP STUDIOOS COMPLETO
## Visão: Lançamento Acelerado com Escopo Priorizado

**Data:** Janeiro 2026
**Versão:** MVP 1.0
**Pagamento:** ASAAS (escolhido)
**Inventário:** Opcional (não bloqueante)
**Afiliados:** Portal para representantes comerciais (comissão 10% editável)
**RBAC:** Permissões granulares por tela
**Taxa Implementação:** R$3.000 fixo (todos os planos)
**Estimativa:** 10 semanas com time enxuto

---

## DECISÕES ARQUITETURAIS CONSOLIDADAS

| # | Decisão | Implementação |
|---|---------|---------------|
| 1 | **Supplier Integration** | Fornecedor tem conta própria, gerencia catálogo/preços. B2B ordering (cliente → fornecedor) será V2 |
| 2 | **Payment Gateway** | ASAAS (substitui Stripe/Pagar.me) - PIX, Boleto, Cartão |
| 3 | **Painel Supremo** | Expandir `admin.studioos.pro` com 6 módulos (ver seção abaixo) |
| 4 | **Inventário** | OPCIONAL - não bloqueia MVP. Empresas on-demand funcionam sem |
| 5 | **MVP Timeline** | 10 semanas, dividido em 5 fases de 2 semanas |

---

## FASE 1: FOUNDATION (Semanas 1-2)
### Objetivo: Base estável para build rápido

### 1.1 Painel Supremo - Estrutura Base
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** Full-stack

```
admin.studioos.pro/
├── /dashboard           [NOVO] Métricas consolidadas
├── /organizations       [NOVO] Lista de tenants
├── /suppliers           [NOVO] Aprovação de fornecedores
├── /users               [EXISTE] GerenciarUsuarios.tsx
├── /billing             [NOVO] Gestão ASAAS
├── /settings            [NOVO] Feature flags
└── /audit               [NOVO] Logs do sistema
```

**Tarefas:**
- [ ] Criar `AdminLayout` com navegação lateral
- [ ] Criar `AdminDashboard` com cards de métricas (Supabase queries)
- [ ] Criar `AdminOrganizations` - tabela com filtros
- [ ] Conectar `GerenciarUsuarios` ao novo layout
- [ ] Implementar RLS para admin (role = 'super_admin')

### 1.2 ASAAS Integration - Setup
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** Backend

**Tarefas:**
- [ ] Criar conta ASAAS sandbox
- [ ] Adicionar `ASAAS_API_KEY` ao .env
- [ ] Criar tabela `subscriptions`:
  ```sql
  CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    plan_type TEXT CHECK (plan_type IN ('starter', 'professional', 'business', 'enterprise')),
    status TEXT CHECK (status IN ('active', 'inactive', 'past_due', 'canceled')),
    price_cents INTEGER,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Criar Edge Functions:
  - `asaas-create-customer` - Criar cliente no ASAAS
  - `asaas-create-subscription` - Criar assinatura
  - `asaas-webhook` - Receber callbacks de pagamento
- [ ] Criar página `/configuracoes/faturamento` no ERP

### 1.3 Supplier Approval Workflow
**Complexidade:** Baixa | **Impacto:** Alto | **Responsável:** Full-stack

**Contexto:** Hoje `CadastroFornecedor.tsx` salva com `status = 'pending'`. Precisamos da interface de aprovação.

**Tarefas:**
- [ ] Criar `AdminSuppliers` page em `admin.studioos.pro/suppliers`
- [ ] Tabela mostrando fornecedores pendentes
- [ ] Botão "Aprovar" → atualiza status + cria auth user
- [ ] Botão "Rejeitar" → atualiza status + envia email
- [ ] Email automático (Supabase Auth ou SendGrid)

**Estado do Fornecedor:**
```
pending → approved → active
   ↓
rejected
```

### 1.4 RLS & Segurança - Reforço
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** Backend

**Tarefas:**
- [ ] Verificar todas as políticas RLS existentes
- [ ] Criar policy para super_admin (bypass all)
- [ ] Criar policy para supplier (só vê próprios dados)
- [ ] Audit log para ações críticas (delete, status change)

### 1.5 RBAC - Permissões Granulares por Tela (NOVO)
**Complexidade:** Alta | **Impacto:** Alto | **Responsável:** Full-stack

**Contexto:** Admin da organização precisa gerenciar funcionários e definir quais telas cada um pode acessar via checkboxes.

**Tabelas:**
```sql
-- Permissões por tela para cada membro
CREATE TABLE organization_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  -- Telas do sistema
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
  can_usuarios BOOLEAN DEFAULT false, -- só admin pode dar permissão para gerenciar usuários
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

**Frontend:**
- [ ] Criar página `/configuracoes/usuarios` no ERP
- [ ] Listar membros da organização
- [ ] Modal "Gerenciar Permissões" com checkboxes:
  ```
  ☑ Dashboard
  ☑ Orçamentos
  ☑ Pedidos
  ☑ Clientes
  ☐ CRM
  ☐ Financeiro
  ☐ Produção
  ☐ Fornecedores
  ☐ Contratos
  ☐ Configurações
  ☐ Gerenciar Usuários (admin only)
  ```
- [ ] Hook `usePermissions()` para verificar acesso em cada tela
- [ ] Componente `<ProtectedScreen permission="can_crm">`
- [ ] Hide menu items baseado nas permissões

**Integração:**
- [ ] Verificar permissão em cada rota protegida
- [ ] Mostrar "Acesso Negado" se não tiver permissão
- [ ] Admin sempre tem todas as permissões

---

## FASE 2: CORE FEATURES (Semanas 3-4)
### Objetivo: Funcionalidades que vendem

### 2.1 Contratos Pré-Prontos
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** Full-stack

**Requisitos:**
- Templates de contrato parametrizáveis
- Editor visual simples (ou markdown)
- Geração de PDF assinável
- Integração com orçamentos

**Tarefas:**
- [ ] Criar tabela `contract_templates`:
  ```sql
  CREATE TABLE contract_templates (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML/Markdown
    variables JSONB, -- {client_name, project_value, date}
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Criar página `/contratos/templates` no ERP
- [ ] Criar página `/contratos/gerar` - seleciona template + preenche vars
- [ ] Integrar com orçamento: "Gerar contrato deste orçamento"
- [ ] PDF generation (puppeteer ou react-pdf)
- [ ] Envio por email com link para assinatura digital (DocuSign ou simples)

### 2.2 Integrações - Tela de Configuração
**Complexidade:** Baixa | **Impacto:** Médio | **Responsável:** Frontend

**Integrações a mostrar (algumas mockadas para MVP):**
- NF-e: Emissor de Nota Fiscal (link para Tiny, Bling, etc)
- WhatsApp: API de envio (mock)
- Email: SMTP configuration
- Calendar: Google Calendar sync (mock)

**Tarefas:**
- [ ] Criar página `/configuracoes/integracoes`
- [ ] Cards com status (Conectado/Desconectado)
- [ ] Modais de configuração para cada integração
- [ ] Salvar tokens/settings no banco criptografados

### 2.3 Blog - Estrutura Base
**Complexidade:** Baixa | **Impacto:** Médio | **Responsável:** Full-stack

**Escopo:** Blog para StudioOS (marketing) + capacidade de cada cliente ter blog próprio (V2)

**Tarefas MVP:**
- [ ] Criar tabela `blog_posts`:
  ```sql
  CREATE TABLE blog_posts (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id), -- NULL = StudioOS blog
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP,
    tags TEXT[],
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Criar `/blog` no marketing site (studioos.pro/blog)
- [ ] Criar `/blog/:slug` - post individual
- [ ] Criar admin para blog em `admin.studioos.pro/blog`

### 2.4 5 Temas de Landing Page
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** Frontend

**Contexto:** Temas separados da cor do sistema (como decidido)

**Temas:**
1. **Minimalista** - Clean, branco, tipografia elegante
2. **Moderno** - Gradients, glassmorphism, animações
3. **Clássico** - Cores sóbrias, serif fonts
4. **Bold** - Cores vibrantes, alto contraste
5. **Elegante** - Dourado/preto, sofisticado

**Tarefas:**
- [ ] Criar sistema de temas no `LandingPageOrganizacao.tsx`
- [ ] Cada tema = componente separado ou config JSON
- [ ] Seletor de tema em `/configuracoes/organizacao` (apenas para planos Business+)
- [ ] Preview em tempo real

---

## FASE 3: SUPPLIER B2B & REFINAMENTO (Semanas 5-6)
### Objetivo: Supplier completo + B2B ordering base

### 3.1 Supplier Portal Completo
**Complexidade:** Alta | **Impacto:** Alto | **Responsável:** Full-stack

**Funcionalidades pendentes em `SupplierPortal.tsx`:**

- [ ] **Dashboard do Fornecedor**:
  - Estatísticas: produtos cadastrados, visualizações, leads
  - Gráfico simples de engajamento
  
- [ ] **Catálogo Management**:
  - CRUD completo de produtos
  - Upload de imagens (Supabase Storage)
  - Categorização
  - Preços e variações
  
- [ ] **Leads/Interessados**:
  - Lista de empresas que visualizaram produtos
  - Contato direto ( integração com chat futuramente)

- [ ] **Perfil da Empresa**:
  - Dados cadastrais editáveis
  - Logo e imagens
  - Área de atuação (estados)

### 3.2 B2B Ordering - Fase 1 (Catálogo Visível)
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** Full-stack

**Contexto:** Clientes StudioOS podem ver catálogo de fornecedores e solicitar orçamento

**Tarefas:**
- [ ] Criar página `/fornecedores/catalogo` no ERP
- [ ] Listar fornecedores aprovados por categoria
- [ ] Visualizar produtos de um fornecedor
- [ ] Botão "Solicitar Orçamento" → cria lead no supplier
- [ ] Notificação para fornecedor (email)

**Fluxo:**
```
Empresa A (StudioOS) → Vê catálogo Fornecedor B
                    → Clica "Solicitar Orçamento"
                    → Preenche necessidades
                    → Fornecedor B recebe email
                    → Fornecedor responde com preço
                    → Empresa A recebe proposta
```

### 3.3 Feature Flags Dinâmicas
**Complexidade:** Baixa | **Impacto:** Alto | **Responsável:** Backend

**Tarefas:**
- [ ] Criar tabela `feature_flags`:
  ```sql
  CREATE TABLE feature_flags (
    id UUID PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    description TEXT,
    default_value BOOLEAN DEFAULT false,
    plan_values JSONB -- {"starter": false, "business": true}
  );
  ```
- [ ] Hook `useFeatureFlag(key)` para verificar acesso
- [ ] Painel em `admin.studioos.pro/settings` para ligar/desligar

### 3.4 Portal de Afiliados (NOVO)
**Complexidade:** Alta | **Impacto:** Alto | **Responsável:** Full-stack

**Domínio:** `afiliados.studioos.pro`

**Contexto:** Representantes comerciais podem vender o StudioOS em todo o Brasil e ganhar comissão.

**Tabelas:**
```sql
-- Afiliados
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL, -- código de indicação
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  status affiliate_status DEFAULT 'pending', -- pending, active, suspended
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- % comissão (padrão 10%, editável)
  custom_plan_comissions JSONB DEFAULT '{}', -- {"starter": 10, "professional": 15}
  total_earnings_cents INTEGER DEFAULT 0,
  total_paid_cents INTEGER DEFAULT 0,
  balance_cents INTEGER DEFAULT 0,
  pix_key TEXT, -- para pagamento
  bank_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id)
);

-- Indicações (referrals) - com vinculação permanente para pós-venda
CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  subscription_id UUID REFERENCES subscriptions(id),
  status referral_status DEFAULT 'pending', -- pending, converted, canceled
  commission_cents INTEGER,
  commission_rate_at_conversion DECIMAL(5,2), -- taxa no momento da conversão
  lifetime_value_cents INTEGER DEFAULT 0, -- valor total gerado pelo cliente
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Vinculação permanente: mesmo após cancelamento, mantém histórico
  UNIQUE(organization_id) -- uma org só pode ter um afiliado
);

-- Comissões recorrentes (mensalidade)
CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
  referral_id UUID REFERENCES affiliate_referrals(id) NOT NULL,
  subscription_payment_id UUID REFERENCES subscription_payments(id),
  amount_cents INTEGER NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status commission_status DEFAULT 'pending', -- pending, paid, voided
  payment_month INTEGER NOT NULL, -- mês de referência
  payment_year INTEGER NOT NULL,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saques/Pagamentos
CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
  amount_cents INTEGER NOT NULL,
  status payout_status DEFAULT 'pending', -- pending, processing, paid, failed
  method TEXT DEFAULT 'pix', -- pix, transfer
  metadata JSONB, -- dados da transação
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Frontend - Portal Afiliado:**
```
afiliados.studioos.pro/
├── /                    → Landing page programa
├── /cadastro            → Form de inscrição
├── /login               → Login
├── /dashboard           → Painel (protegido)
│   ├── Resumo: ganhos, saldo, indicados
│   ├── Gráfico de conversão
│   ├── Lista de indicações
│   └── Código de indicação + link
├── /saques              → Solicitar saque
└── /perfil              → Dados bancários
```

**Tarefas:**
- [ ] Criar domínio `afiliados.studioos.pro`
- [ ] Landing page do programa (benefícios, comissões)
- [ ] Form de cadastro de afiliado
- [ ] Aprovação em `admin.studioos.pro/affiliates`
- [ ] Dashboard com métricas:
  - Total de indicações
  - Taxa de conversão
  - Ganhos do mês
  - Saldo disponível
- [ ] Gerar link de indicação: `studioos.pro/?ref=CODIGO`
- [ ] Tracking de conversão (cookie/localStorage)
- [ ] Sistema de saque (PIX)
- [ ] Notificações de nova conversão

**Comissões (padrão 10% - editável no Painel Supremo):**
| Plano | Preço Mensal | Comissão (10%) | Taxa Impl. | Comissão Impl. |
|-------|--------------|----------------|------------|----------------|
| Starter | R$499 | R$49,90 | R$3.000 | R$300 |
| Profissional | R$899 | R$89,90 | R$3.000 | R$300 |
| Business | R$1.499 | R$149,90 | R$3.000 | R$300 |
| Enterprise | R$2.499 | R$249,90 | R$3.000 | R$300 |

**Configuração no Painel Supremo:**
- [ ] Página `admin.studioos.pro/affiliates/settings`
- [ ] Editar taxa padrão de comissão (%)
- [ ] Editar comissão por plano individualmente
- [ ] Configurar se comissão é recorrente (mensal) ou só na primeira venda
- [ ] Configurar se paga comissão sobre taxa de implementação

**Pós-venda - Acompanhamento do Cliente:**
- [ ] No dashboard do afiliado, aba "Meus Clientes"
- [ ] Lista de clientes vinculados com:
  - Nome da empresa
  - Plano contratado
  - Data de início
  - Status (ativo/cancelado)
  - MRR do cliente
  - Total pago pelo cliente (lifetime value)
  - Última interação
- [ ] Gráfico de evolução do cliente
- [ ] Alerta quando cliente cancela
- [ ] Oportunidade de upgrade (cliente no Starter, sugerir Profissional)

### 3.5 Bug Fixes & Polish
**Complexidade:** Variável | **Impacto:** Médio | **Responsável:** Todos

- [ ] Revisar todos os TODOs do código
- [ ] Testar fluxo de onboarding completo
- [ ] Otimizar queries lentas (analisar com EXPLAIN)
- [ ] Revisar mobile responsiveness
- [ ] Traduções e copywriting

---

## FASE 4: LAUNCH PREP (Semanas 7-8)
### Objetivo: Produção e Go-to-Market

### 4.1 Produção - Setup
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** DevOps

**Tarefas:**
- [ ] Configurar domínios de produção:
  - `studioos.pro`
  - `admin.studioos.pro`
  - `fornecedores.studioos.pro`
  - `*.studioos.pro` (wildcard para subdominios)
- [ ] SSL certificates (Let's Encrypt ou Cloudflare)
- [ ] Configurar Vercel/Netlify para SPA routing
- [ ] ASAAS produção (migrar de sandbox)
- [ ] Backups automáticos Supabase
- [ ] Monitoring (Sentry ou LogRocket)

### 4.2 Testes & QA
**Complexidade:** Média | **Impacto:** Alto | **Responsável:** QA/Devs

**Tarefas:**
- [ ] Testes E2E críticos (Playwright ou Cypress):
  - Signup completo
  - Criar orçamento → pedido
  - Fluxo de pagamento (ASAAS sandbox)
  - Supplier registration → approval
- [ ] Testes de carga (k6 ou Artillery)
- [ ] Testes de segurança (SQL injection, XSS)
- [ ] Device testing (mobile, tablet, desktop)

### 4.3 Documentação
**Complexidade:** Baixa | **Impacto:** Médio | **Responsável:** Tech Lead

**Tarefas:**
- [ ] README atualizado com setup
- [ ] API documentation (Swagger ou Postman)
- [ ] User guides (Loom videos)
- [ ] Onboarding checklist para novos clientes

### 4.4 Go-to-Market
**Complexidade:** Baixa | **Impacto:** Alto | **Responsável:** Produto/Marketing

**Tarefas:**
- [ ] Landing page otimizada (copy, SEO)
- [ ] Pricing page funcional com ASAAS checkout
- [ ] Email sequences (onboarding, nurture)
- [ ] Demo video (2-3 minutos)
- [ ] Casos de sucesso (beta users)
- [ ] Suporte: WhatsApp/Chat setup

---

## ARQUITETURA ATUALIZADA

### Domínios & Rotas (V3 Confirmada)

```
┌─────────────────────────────────────────────────────────────┐
│                         STUDIOOS                            │
├─────────────────────────────────────────────────────────────┤
│  studioos.pro/              → Landing Page StudioOS         │
│  studioos.pro/blog          → Blog StudioOS                 │
│  studioos.precos/           → Pricing Page                  │
├─────────────────────────────────────────────────────────────┤
│  admin.studioos.pro/        → Painel Supremo                │
│  admin.studioos.pro/dashboard                                    │
│  admin.studioos.pro/organizations                                │
│  admin.studioos.pro/suppliers   ← Aprovação fornecedores    │
│  admin.studioos.pro/users       ← GerenciarUsuarios         │
│  admin.studioos.pro/billing     ← ASAAS management          │
│  admin.studioos.pro/settings                                     │
│  admin.studioos.pro/blog        ← Gerenciar posts           │
├─────────────────────────────────────────────────────────────┤
│  fornecedores.studioos.pro/ → Supplier Portal               │
│  fornecedores.studioos.pro/cadastro ← CadastroFornecedor    │
├─────────────────────────────────────────────────────────────┤
│  {slug}-app.studioos.pro/   → ERP do Cliente                │
│  {slug}-app.studioos.pro/gerarorcamento                       │
│  {slug}-app.studioos.pro/dashboard                            │
│  {slug}-app.studioos.pro/contratos      ← NOVO              │
│  {slug}-app.studioos.pro/fornecedores/catalogo ← NOVO       │
│  {slug}-app.studioos.pro/configuracoes/integracoes ← NOVO   │
├─────────────────────────────────────────────────────────────┤
│  {slug}.studioos.pro/       → Landing Page do Cliente       │
│  (com 5 temas disponíveis)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## MODELO DE DADOS - NOVAS TABELAS

### subscriptions (ASAAS)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  asaas_customer_id TEXT NOT NULL,
  asaas_subscription_id TEXT,
  plan_type plan_type NOT NULL,
  status subscription_status DEFAULT 'inactive',
  price_cents INTEGER NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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

### contracts (instâncias)
```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  template_id UUID REFERENCES contract_templates(id),
  client_id UUID REFERENCES clients(id) NOT NULL,
  orcamento_id UUID REFERENCES orcamentos(id),
  content TEXT NOT NULL, -- conteúdo final gerado
  status contract_status DEFAULT 'draft',
  signed_at TIMESTAMP,
  signed_by_client BOOLEAN DEFAULT false,
  signed_by_company BOOLEAN DEFAULT false,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### blog_posts
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id), -- NULL = StudioOS
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  status post_status DEFAULT 'draft',
  published_at TIMESTAMP,
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  view_count INTEGER DEFAULT 0,
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
  plan_values JSONB DEFAULT '{}', -- override por plano
  organization_overrides JSONB DEFAULT '{}', -- override específico
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed inicial
INSERT INTO feature_flags (key, description, plan_values) VALUES
('contracts', 'Contratos pré-prontos', '{"starter": false, "professional": true, "business": true, "enterprise": true}'),
('integrations', 'Tela de integrações', '{"starter": false, "professional": true, "business": true, "enterprise": true}'),
('blog', 'Blog próprio', '{"starter": false, "professional": false, "business": true, "enterprise": true}'),
('custom_landing_theme', 'Temas customizados de LP', '{"starter": false, "professional": false, "business": true, "enterprise": true}'),
('b2b_ordering', 'Pedidos B2B para fornecedores', '{"starter": false, "professional": false, "business": true, "enterprise": true}'),
('inventory', 'Módulo de estoque', '{"starter": false, "professional": true, "business": true, "enterprise": true}');
```

### supplier_catalog_items
```sql
CREATE TABLE supplier_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES product_categories(id),
  images TEXT[],
  base_price DECIMAL(10,2),
  price_unit TEXT,
  variations JSONB, -- [{"name": "Cor", "options": ["Branco", "Bege"]}]
  attributes JSONB, -- {"width_min": 100, "width_max": 300}
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### b2b_leads (pedidos de orçamento)
```sql
CREATE TABLE b2b_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL, -- quem solicitou
  supplier_id UUID REFERENCES suppliers(id) NOT NULL, -- fornecedor alvo
  items JSONB NOT NULL, -- [{"catalog_item_id": "...", "quantity": 5, "specifications": "..."}]
  message TEXT,
  status lead_status DEFAULT 'pending',
  response_price DECIMAL(10,2),
  response_message TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## EDGE FUNCTIONS (Supabase)

### asaas-create-customer
```typescript
// Cria cliente no ASAAS vinculado à organization
export default async (req: Request) => {
  const { organization_id, name, email, cpf_cnpj } = await req.json();
  
  const response = await fetch('https://api.asaas.com/v3/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('ASAAS_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, cpfCnpj: cpf_cnpj })
  });
  
  const customer = await response.json();
  
  // Salvar asaas_customer_id na subscriptions
  await supabase.from('subscriptions').insert({
    organization_id,
    asaas_customer_id: customer.id,
    // ...
  });
  
  return new Response(JSON.stringify(customer));
};
```

### asaas-webhook
```typescript
// Recebe webhooks de pagamento do ASAAS
export default async (req: Request) => {
  const event = await req.json();
  
  if (event.event === 'PAYMENT_RECEIVED') {
    await supabase.from('subscriptions')
      .update({ status: 'active', last_payment_at: new Date() })
      .eq('asaas_subscription_id', event.payment.subscription);
  }
  
  if (event.event === 'SUBSCRIPTION_CANCELED') {
    await supabase.from('subscriptions')
      .update({ status: 'canceled' })
      .eq('asaas_subscription_id', event.subscription.id);
  }
  
  return new Response('OK');
};
```

---

## FRONTEND - NOVOS COMPONENTES

### Admin Module Structure
```
src/pages/admin/
├── AdminDashboard.tsx         # Métricas
├── AdminOrganizations.tsx     # Lista tenants
├── AdminSuppliers.tsx         # Aprovação fornecedores
├── AdminBilling.tsx           # Gestão ASAAS
├── AdminSettings.tsx          # Feature flags
├── AdminBlog.tsx              # Gerenciar posts
└── AdminAudit.tsx             # Logs

src/components/admin/
├── AdminLayout.tsx            # Layout com sidebar
├── AdminSidebar.tsx           # Navegação
├── MetricCard.tsx             # Card de métrica
├── OrganizationTable.tsx      # Tabela de orgs
├── SupplierApprovalCard.tsx   # Card de aprovação
└── FeatureFlagToggle.tsx      # Toggle de feature
```

### Contracts Module
```
src/pages/contratos/
├── ContratosTemplates.tsx     # Listar templates
├── ContratosEditor.tsx        # Criar/editar template
├── ContratosGerar.tsx         # Gerar contrato de orçamento
└── ContratosVisualizar.tsx    # Ver/assinar
```

### Integrations Module
```
src/pages/integracoes/
├── IntegracoesHub.tsx         # Central de integrações
├── NFeIntegration.tsx         # Config NF-e
├── WhatsAppIntegration.tsx    # Config WhatsApp
└── CalendarIntegration.tsx    # Config Calendar
```

### Supplier B2B Module
```
src/pages/fornecedores/
├── CatalogoFornecedores.tsx   # Listar fornecedores
├── CatalogoProdutos.tsx       # Ver produtos de um fornecedor
└── SolicitarOrcamento.tsx     # Form B2B lead
```

---

## MELHORIAS UX/UI INDISPENSÁVEIS

### Onboarding Guiado (First-time User Experience)
**Complexidade:** Média | **Impacto:** Alto

**Problema:** Usuários novos podem se perder no ERP complexo

**Solução:**
- [ ] Tour interativo na primeira entrada (React Joyride ou similar)
- [ ] Checklist de setup progressivo:
  ```
  ☑ Criar primeiro orçamento
  ☐ Adicionar logo da empresa
  ☐ Configurar dados bancários
  ☐ Conectar WhatsApp
  ☐ Convidar primeiro funcionário
  ```
- [ ] Tooltips contextuais em campos complexos
- [ ] Vídeos explicativos curtos (Loom) embutidos nas telas
- [ ] Empty states ilustrados e com call-to-action

### Dashboard Modernizado
**Complexidade:** Baixa | **Impacto:** Alto

**Melhorias:**
- [ ] Cards de métricas com sparklines (gráficos mini)
- [ ] Atalhos rápidos customizáveis
- [ ] Widget de "Próximos passos" inteligente
- [ ] Notificações inline (não só toast)
- [ ] Modo escuro/claro persistente por usuário

### Mobile-First Responsiveness
**Complexidade:** Média | **Impacto:** Alto

**Ações:**
- [ ] Drawer de navegação em mobile
- [ ] Bottom sheet para ações em tabelas
- [ ] Cards empilháveis em vez de tabelas em telas < 768px
- [ ] Input de valores monetários com máscara real-time
- [ ] Auto-save em formulários longos (evitar perda de dados)

### Feedback & Confirmação
**Complexidade:** Baixa | **Impacto:** Médio

**Implementações:**
- [ ] Confetti animation ao finalizar orçamento
- [ ] Undo nas ações deletar (Toast com botão "Desfazer")
- [ ] Skeleton loading (não só spinners)
- [ ] Preview de PDF antes de download
- [ ] Confirmação visual ao copiar (ex: código de orçamento)

### Busca & Navegação Universal
**Complexidade:** Média | **Impacto:** Alto

**Features:**
- [ ] Command palette (Cmd+K) para navegação rápida
- [ ] Busca global: clientes, orçamentos, produtos
- [ ] Atalhos de teclado documentados (? para help)
- [ ] Breadcrumbs em todas as páginas internas
- [ ] Histórico de páginas recentes

### Formulários Inteligentes
**Complexidade:** Baixa | **Impacto:** Médio

**Melhorias:**
- [ ] Autocomplete de endereço via CEP (ViaCEP)
- [ ] CPF/CNPJ validação e formatação automática
- [ ] Telefone com máscara internacional
- [ ] CEP com máscara
- [ ] Valores em reais com separador de milhar
- [ ] Formatação automática de dimensões (m/cm)

### Notificações & Comunicação
**Complexidade:** Média | **Impacto:** Médio

**Sistema:**
- [ ] Central de notificações (bell icon)
- [ ] Notificações in-app + push (OneSignal)
- [ ] Integração WhatsApp para alertas
- [ ] Email transacional configurável
- [ ] Lembretes de follow-up automáticos

### Performance Percebida
**Complexidade:** Baixa | **Impacto:** Alto

**Ações:**
- [ ] Virtualização em listas longas (react-window)
- [ ] Lazy loading de imagens
- [ ] Placeholders durante carregamento
- [ ] Transições suaves entre páginas
- [ ] Cache otimista (UI atualiza antes do servidor)

### Acessibilidade (A11y)
**Complexidade:** Baixa | **Impacto:** Médio

**Checklist:**
- [ ] Contraste WCAG AA
- [ ] Navegação por teclado
- [ ] Labels em todos os inputs
- [ ] Skip links
- [ ] Focus indicators visíveis

---

## CRONOGRAMA DETALHADO

### Semana 1-2: Foundation
| Dia | Tarefa | Responsável |
|-----|--------|-------------|
| 1-2 | Setup ASAAS sandbox, criar tabelas | Backend |
| 2-3 | Painel Supremo - layout base, dashboard | Frontend |
| 3-4 | Painel Supremo - organizations, users | Frontend |
| 4-5 | Supplier approval workflow | Full-stack |
| 5-7 | RLS policies, segurança | Backend |
| 7-8 | ASAAS integration - backend | Backend |
| 8-10 | ASAAS - frontend billing page | Frontend |
| 10-14 | Testes integração, fixes | Todos |

### Semana 3-4: Core Features
| Dia | Tarefa | Responsável |
|-----|--------|-------------|
| 15-17 | Contratos - estrutura DB, CRUD templates | Full-stack |
| 17-19 | Contratos - geração PDF, integração orçamento | Frontend |
| 19-21 | Integrações - tela config, mock providers | Frontend |
| 21-23 | Blog - estrutura, admin, listagem | Full-stack |
| 23-25 | 5 Temas - implementação, seletor | Frontend |
| 25-28 | Testes, polish, documentação | Todos |

### Semana 5-6: Supplier & B2B
| Dia | Tarefa | Responsável |
|-----|--------|-------------|
| 29-31 | Supplier Portal - dashboard, catálogo CRUD | Full-stack |
| 31-33 | Supplier Portal - leads, perfil | Frontend |
| 33-35 | B2B Ordering - catálogo visível, solicitar | Full-stack |
| 35-37 | Feature flags dinâmicas | Backend |
| 37-40 | Bug fixes, otimização queries | Todos |
| 40-42 | Testes fluxo completo | QA |

### Semana 7-8: Portal de Afiliados
| Dia | Tarefa | Responsável |
|-----|--------|-------------|
| 43-46 | Afiliados - tabelas, cadastro, login | Full-stack |
| 46-49 | Afiliados - dashboard, tracking, links | Frontend |
| 49-52 | Afiliados - saques, admin aprovação | Backend |
| 52-54 | Integração afiliado → checkout | Full-stack |
| 54-56 | Testes fluxo afiliado completo | QA |

### Semana 9-10: Launch
| Dia | Tarefa | Responsável |
|-----|--------|-------------|
| 57-59 | Produção setup, domínios, SSL | DevOps |
| 59-61 | Testes E2E, segurança, carga | QA |
| 61-63 | Documentação, videos | Tech Lead |
| 63-65 | Landing page, copy, SEO, programa afiliados | Marketing |
| 65-68 | Beta launch, feedback, hotfixes | Todos |
| 68-70 | Public launch | Todos |

---

## MÉTRICAS DE SUCESSO

### Técnicas
- [ ] 0 downtime em deploys
- [ ] < 200ms tempo resposta API
- [ ] 100% cobertura RLS crítico
- [ ] 0 vulnerabilidades alta/crítica

### Negócio
- [ ] 10 beta users ativos
- [ ] 3 assinaturas pagas no mês 1
- [ ] < 24h tempo de aprovação supplier
- [ ] 80% completação onboarding

---

## RISCOS & MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| ASAAS delay integração | Média | Alto | Começar sandbox imediato, fallback manual |
| Scope creep | Alta | Alto | Congelar features pós-semana 2, só bugs |
| Performance com multi-tenant | Média | Médio | Índices, cache, monitoramento desde início |
| Fornecedores não adotarem | Média | Médio | Onboarding simplificado, incentivos |
| Concorrência lançar primeiro | Baixa | Médio | Foco em nicho (cortinas/persianas) |

---

## PRÓXIMOS PASSOS IMEDIATOS

1. **Hoje:** 
   - [ ] Criar conta ASAAS sandbox
   - [ ] Criar branch `feature/admin-panel`
   - [ ] Setup tabelas subscriptions

2. **Amanhã:**
   - [ ] Implementar AdminLayout
   - [ ] Mover GerenciarUsuarios para novo layout
   - [ ] Criar AdminDashboard base

3. **Esta Semana:**
   - [ ] Finalizar Foundation (Fase 1)
   - [ ] Code review em grupo
   - [ ] Deploy staging

---

## CHECKLIST PRÉ-LAUNCH

- [ ] ASAAS produção configurado
- [ ] Domínios apontados
- [ ] SSL ativo
- [ ] RLS auditado
- [ ] Backups configurados
- [ ] Monitoring ativo
- [ ] Documentação completa
- [ ] Demo video gravado
- [ ] Landing page otimizada
- [ ] Suporte (WhatsApp) pronto
- [ ] Política de privacidade
- [ ] Termos de uso

---

**Documento criado em:** Janeiro 2026  
**Responsável:** Tech Lead StudioOS  
**Status:** [ ] Draft [ ] Review [x] Aprovado para execução
