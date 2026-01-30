# StudioOS - Sistema de Gestão para Decoradoras

**Versão:** 5.0.0 - The Clean Split  
**Status:** Produção  
**Última atualização:** 2026-01-30

---

## Visão Geral

O StudioOS é um sistema completo de gestão para decoradoras de interiores, composto por três aplicações especializadas que trabalham em conjunto.

| Aplicação | Domínio | Propósito | Porta Dev |
|-----------|---------|-----------|-----------|
| **Core ERP** | app.studioos.com.br | Gestão operacional (orçamentos, pedidos, financeiro) | 5173 |
| **Platform Admin** | admin.studioos.com.br | Administração da plataforma | 5174 |
| **Portal Fornecedores** | portal.studioos.com.br | Portal para fornecedores | 5175 |

---

## Arquitetura

Este projeto segue a arquitetura **"The Clean Split"** - uma separação clara entre aplicações por responsabilidade, cada uma com seu próprio build e deploy.

```
studioos/
├── apps/
│   ├── core/           # ERP Principal (V5)
│   ├── platform/       # Admin Platform (V5)
│   └── portal/         # Portal Fornecedores (V5)
├── src/                # Código legado V4 (em depreciação)
├── infra/
│   ├── migrations/     # Schema do banco (baseline + seed)
│   └── backups/        # Backups do banco
├── supabase/
│   └── functions/      # Edge Functions
├── docs/               # Documentação
│   ├── ARCHITECTURE.md
│   ├── V5_DEPLOY_GUIDE.md
│   ├── V5_MIGRATION_GUIDE.md
│   └── archive/        # Documentação histórica
└── scripts/            # Scripts de automação
```

Para mais detalhes, veja [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Deploy:** Vercel
- **State Management:** TanStack Query (React Query)

---

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git

### Configuração

1. Clone o repositório:
```bash
git clone <repository-url>
cd prisma-decor-mobile
```

2. Configure as variáveis de ambiente em cada app:
```bash
# apps/core/.env
VITE_SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui

# apps/platform/.env
VITE_SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui

# apps/portal/.env
VITE_SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

3. Instale dependências em cada app:
```bash
cd apps/core && npm install
cd ../platform && npm install
cd ../portal && npm install
```

### Executando Localmente

Cada app deve ser executada em um terminal separado:

```bash
# Terminal 1 - Core ERP
cd apps/core
npm run dev
# http://localhost:5173

# Terminal 2 - Platform Admin
cd apps/platform
npm run dev
# http://localhost:5174

# Terminal 3 - Portal Fornecedores
cd apps/portal
npm run dev
# http://localhost:5175
```

---

## Build e Deploy

### Build Local

```bash
# Build Core
cd apps/core
npm run build

# Build Platform
cd apps/platform
npm run build

# Build Portal
cd apps/portal
npm run build
```

### Deploy para Produção

Use os scripts de deploy automatizados:

```bash
# Windows (PowerShell)
.\DEPLOY_ALL_APPS_FIXED.ps1

# Windows (Batch)
.\DEPLOY_ALL_APPS_FIXED.bat

# Unix/Linux/Mac
./scripts/v5-deploy-all.sh
```

Para mais detalhes, veja [docs/V5_DEPLOY_GUIDE.md](./docs/V5_DEPLOY_GUIDE.md).

---

## Estrutura do Projeto

### apps/core/ - ERP Principal

Aplicação principal para usuários finais (decoradoras):

- **Dashboard:** Métricas operacionais
- **Orçamentos:** Gestão completa de orçamentos
- **Wizard:** Criação de orçamentos em 4 passos (cliente, produtos, serviços, resumo)
- **Pedidos:** Acompanhamento de produção
- **Financeiro:** Contas a pagar/receber

### apps/platform/ - Admin Platform

Painel administrativo para super admins:

- **Dashboard:** Métricas da plataforma
- **Organizações:** Gestão de decoradoras
- **Usuários:** Gestão de usuários
- **Fornecedores:** Aprovação e gestão
- **Planos:** Configuração de planos de assinatura

### apps/portal/ - Portal Fornecedores

Portal self-service para fornecedores:

- **Dashboard:** Métricas do fornecedor
- **Catálogo:** Gerenciamento de produtos
- **Pedidos:** Pedidos recebidos
- **Perfil:** Configurações da conta

---

## Banco de Dados

O projeto usa Supabase com PostgreSQL. O schema está consolidado em:

```
infra/migrations/
├── 00000000000000_baseline_schema.sql    # Schema completo
└── 00000000000001_initial_seed.sql       # Dados iniciais
```

Para histórico completo, veja `infra/migrations/archive/` (140+ migrations).

### Edge Functions

```
supabase/functions/
├── calculate-mrr/
├── check-production-delays/
├── generate-recurring-bills/
├── send-lead-to-monday/
├── update-feature-flag/
└── update-overdue-status/
```

---

## Documentação

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Arquitetura completa do sistema
- **[V5_DEPLOY_GUIDE.md](./docs/V5_DEPLOY_GUIDE.md)** - Guia de deploy
- **[V5_MIGRATION_GUIDE.md](./docs/V5_MIGRATION_GUIDE.md)** - Guia de migração
- **[FEATURE_FLAGS_USAGE.md](./docs/FEATURE_FLAGS_USAGE.md)** - Uso de feature flags
- **[LIMPEZA_PROJETO.md](./LIMPEZA_RELATORIO.md)** - Relatório de limpeza (este arquivo)

---

## Status do Projeto

### Concluído (V5)

- ✅ Separação em 3 aplicações especializadas
- ✅ Sistema de autenticação unificado
- ✅ Wizard de orçamentos 100% funcional
- ✅ Dashboard com métricas reais
- ✅ Deploy automatizado para Vercel
- ✅ Schema de banco consolidado

### Em Andamento

- 🔄 Limpeza e consolidação de documentação
- 🔄 Identificação de código duplicado
- 🔄 Planejamento de shared packages

### Futuro

- ⏳ Criação de packages/shared/ para código comum
- ⏳ Unificação de configurações com workspaces
- ⏳ Deprecação completa do código V4

---

## Contribuição

1. Crie uma branch para sua feature: `git checkout -b feature/nome`
2. Commit suas mudanças: `git commit -am 'Adiciona nova feature'`
3. Push para a branch: `git push origin feature/nome`
4. Crie um Pull Request

---

## Suporte

Para dúvidas ou problemas:

1. Consulte a documentação em `docs/`
2. Verifique os logs das Edge Functions no Supabase Dashboard
3. Verifique os logs de deploy na Vercel

---

## Licença

[Private - StudioOS Team]

---

**Mantido por:** StudioOS Team  
**Última atualização:** 2026-01-30
