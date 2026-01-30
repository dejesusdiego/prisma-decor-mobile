# 🚀 Comandos de Deploy - Copie e Cole

## 1. Core (ERP) - app.studioos.pro

```bash
cd apps/core
vercel --name studioos-core
# Responda Y, selecione scope, N para link existing
vercel --prod
vercel domains add app.studioos.pro
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 2. Platform (Admin) - panel.studioos.pro

```bash
cd apps/platform
vercel --name studioos-platform
vercel --prod
vercel domains add panel.studioos.pro
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 3. Portal (Fornecedores) - fornecedores.studioos.pro

```bash
cd apps/portal
vercel --name studioos-portal
vercel --prod
vercel domains add fornecedores.studioos.pro
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## ⚡ Quick Test

```bash
curl -I https://app.studioos.pro
curl -I https://panel.studioos.pro
curl -I https://fornecedores.studioos.pro
```
