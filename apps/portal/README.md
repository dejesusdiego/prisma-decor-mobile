# Studio OS Portal (Fornecedores)

Portal de fornecedores para a plataforma Studio OS.

## 🎯 Propósito

Permitir que fornecedores aprovados:
- Gerenciem seus catálogos de produtos
- Visualizem e processem pedidos recebidos
- Atualizem seus dados de perfil

## 🚀 Comandos

```bash
# Desenvolvimento (porta 5175)
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
│   ├── ProtectedRoute.tsx   # Verifica se é fornecedor aprovado
│   └── PortalLayout.tsx     # Layout com sidebar
├── hooks/
│   ├── useAuth.ts           # Auth específico de fornecedor
│   └── useSupplierStats.ts  # Métricas do fornecedor
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx    # Cards: produtos, pedidos, views
│   ├── CatalogoPage.tsx     # Gerenciar produtos
│   ├── PedidosPage.tsx      # Listar pedidos recebidos
│   └── PerfilPage.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
└── main.tsx
```

## 🔒 Segurança

- Verifica se usuário está na tabela `suppliers` com `status = 'approved'`
- Usuários não-fornecedores recebem erro no login
- Rotas protegidas por ProtectedRoute

## 🔗 URLs

- Local: http://localhost:5175
- Produção: https://fornecedores.studioos.pro
