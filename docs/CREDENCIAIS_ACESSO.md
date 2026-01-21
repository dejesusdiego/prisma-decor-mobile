# 🔐 Credenciais de Acesso - Vercel e Supabase

**Data:** 2026-01-16  
**Status:** Documento para centralizar credenciais de acesso

---

## 🚀 VERCEL

### Token de Deploy
Para fazer deploy na Vercel, você precisa de um token de acesso.

**Token encontrado no histórico:**
```
nKHzyF3GpjKUC9TRQq0NFMPk
```

⚠️ **IMPORTANTE:** Este token pode estar expirado ou ter permissões limitadas. Verifique se ainda funciona.

### Como obter um novo token:
1. Acesse: https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Dê um nome descritivo (ex: "StudioOS Deploy")
4. Selecione o escopo necessário (deploy, read, write)
5. Copie o token gerado

### Como usar o token:
```bash
# Deploy de produção
npx vercel --prod --token SEU_TOKEN_AQUI --yes

# Ou configurar como variável de ambiente
export VERCEL_TOKEN=SEU_TOKEN_AQUI
npx vercel --prod --yes
```

### Projeto Vercel:
- **Nome:** prisma-decor-mobile
- **URL de produção:** https://prisma-decor-mobile.vercel.app
- **Organização:** futurisintelligences-projects

---

## 🗄️ SUPABASE

### Informações do Projeto
- **Project ID:** `tjwpqrlfhngibuwqodcn`
- **URL Base:** `https://tjwpqrlfhngibuwqodcn.supabase.co`

### Credenciais Necessárias

#### 1. Publishable Key (Anon Key)
- **Uso:** Frontend (React app)
- **Variável:** `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Onde encontrar:** Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

#### 2. Service Role Key (Secret)
- **Uso:** Backend (Edge Functions, scripts administrativos)
- **Variável:** `SUPABASE_SERVICE_ROLE_KEY`
- **Onde encontrar:** Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- ⚠️ **NUNCA exponha esta chave no frontend!**

#### 3. Supabase URL
- **Variável:** `VITE_SUPABASE_URL` (frontend) ou `SUPABASE_URL` (backend)
- **Valor:** `https://tjwpqrlfhngibuwqodcn.supabase.co`

### Como obter as credenciais:
1. Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` (apenas para backend)

---

## 📝 Variáveis de Ambiente Necessárias

### Frontend (.env.local ou .env.production)
```env
VITE_SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key-aqui
```

### Backend (Edge Functions - Supabase Dashboard)
```env
SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### Vercel (Environment Variables no Dashboard)
- Adicione as mesmas variáveis do frontend no dashboard da Vercel
- Settings → Environment Variables → Production/Preview/Development

---

## 🔒 Segurança

### ⚠️ NUNCA faça commit de:
- Tokens de acesso
- Service Role Keys
- Senhas
- Credenciais sensíveis

### ✅ Sempre:
- Use arquivos `.env.local` (não commitados)
- Adicione `.env*` ao `.gitignore`
- Use variáveis de ambiente no Vercel
- Use Secrets no Supabase para Edge Functions

---

## 🛠️ Comandos Úteis

### Deploy Vercel
```bash
# Deploy de produção
npx vercel --prod --token SEU_TOKEN --yes

# Deploy de preview
npx vercel --token SEU_TOKEN --yes

# Verificar status
npx vercel ls --token SEU_TOKEN
```

### Supabase CLI
```bash
# Login
npx supabase login

# Linkar projeto
npx supabase link --project-ref tjwpqrlfhngibuwqodcn

# Aplicar migrations
npx supabase db push

# Verificar status
npx supabase status
```

---

## 📋 Checklist de Acesso

- [ ] Token Vercel válido
- [ ] Acesso ao projeto Vercel (prisma-decor-mobile)
- [ ] Credenciais Supabase (URL, Anon Key, Service Role Key)
- [ ] Acesso ao dashboard Supabase
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Secrets configurados no Supabase (Edge Functions)

---

**Última atualização:** 2026-01-16
