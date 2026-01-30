# StudioOS Core V5

Aplicação Core ERP do StudioOS - Interface principal para gestão de orçamentos e vendas.

## 🚀 Tecnologias

- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Roteamento:** React Router v6
- **Estado:** TanStack Query (React Query)
- **Auth:** Supabase Auth
- **UI:** Tailwind CSS + shadcn/ui
- **Ícones:** Lucide React

## 📁 Estrutura

```
src/
├── components/
│   ├── ui/           # Componentes shadcn (Button, Card, Input, etc)
│   ├── AppLayout.tsx # Layout com Sidebar
│   ├── ErrorBoundary.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   ├── useAuth.tsx       # Autenticação Supabase
│   ├── useOrcamentos.ts  # CRUD Orçamentos
│   └── useDashboardStats.ts # Métricas dashboard
├── lib/
│   ├── supabase.ts   # Cliente Supabase
│   └── utils.ts      # Helpers (cn)
├── pages/
│   ├── DashboardPage.tsx    # Dashboard com métricas
│   ├── LoginPage.tsx        # Tela de login
│   ├── OrcamentosPage.tsx   # Lista de orçamentos
│   └── NovoOrcamentoPage.tsx # Criar orçamento
├── main.tsx          # Entry point
└── router.tsx        # Configuração de rotas
```

## 🔐 Autenticação

- Login via Supabase Auth
- Rotas protegidas com ProtectedRoute
- Redirecionamento automático para /login

## 📊 Funcionalidades

1. **Dashboard**
   - Métricas em tempo real (total, pendentes, aprovados, valor)
   - Lista de orçamentos recentes
   - Ações rápidas

2. **Orçamentos**
   - Lista paginada
   - Busca por cliente/código
   - Status badges

3. **Novo Orçamento**
   - Placeholder para wizard completo
   - Migração gradual do V4

## 🛠️ Scripts

```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # Build de produção
npm run preview  # Preview do build
```

## 🔧 Configuração

Variáveis de ambiente em `.env.local`:

```env
VITE_SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

## 📝 Próximos Passos

1. Integrar wizard completo de orçamentos
2. Adicionar CRUD de clientes
3. Módulo financeiro
4. Relatórios
