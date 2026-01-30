# Studio OS Platform (Super Admin)

Aplicativo de Super Administração para a plataforma Studio OS.

## 🎯 Propósito

Gerenciar toda a plataforma multi-tenant:
- Visualizar métricas globais (MRR, organizações, usuários)
- Aprovar/rejeitar fornecedores
- Gerenciar organizações e planos
- Administrar usuários

## 🚀 Comandos

```bash
# Desenvolvimento (porta 5174)
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📁 Estrutura

```
src/
├── components/
│   ├── ProtectedRoute.tsx   # Verifica super_admin role
│   └── PlatformLayout.tsx   # Layout com sidebar
├── hooks/
│   ├── useAuth.ts           # Autenticação
│   └── usePlatformStats.ts  # Métricas globais
├── pages/
│   ├── LoginPage.tsx        # Login super admin
│   ├── DashboardPage.tsx    # Métricas principais
│   ├── OrganizationsPage.tsx
│   ├── SuppliersPage.tsx    # Aprovação de fornecedores
│   ├── UsersPage.tsx
│   └── PlansPage.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
└── main.tsx
```

## 🔒 Segurança

- Apenas usuários com `role = 'super_admin'` podem acessar
- Não-super_admins são redirecionados para app.studioos.pro
- Rotas protegidas por ProtectedRoute

## 🔗 URLs

- Local: http://localhost:5174
- Produção: https://admin.studioos.pro
