# 🔧 FIX - Variáveis de Ambiente no Vercel

## Problema
O deploy falhou porque as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não estão configuradas no projeto Vercel.

## Solução Rápida (Dashboard)

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto: **studioos-core**
3. Vá em: **Settings** → **Environment Variables**
4. Adicione estas 2 variáveis:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://tjwpqrlfhngibuwqodcn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NjYwNDAsImV4cCI6MjA0NzU0MjA0MH0._hEbV3pRPR0EUn1Nv8Lxh0rMvAoESKoFKXNCWs7V2y0` |

5. Clique em **Save**
6. Vá em **Deployments** → clique nos **3 pontos** do deploy mais recente → **Redeploy**

## Solução via CLI

Execute no terminal:

```bash
cd apps/core

# Adicionar URL
vercel env add VITE_SUPABASE_URL production
# Cole: https://tjwpqrlfhngibuwqodcn.supabase.co

# Adicionar chave  
vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NjYwNDAsImV4cCI6MjA0NzU0MjA0MH0._hEbV3pRPR0EUn1Nv8Lxh0rMvAoESKoFKXNCWs7V2y0

# Deploy novamente
vercel --prod
```

## Repetir para Platform e Portal

Após o Core funcionar, faça o mesmo para:
- **studioos-platform** (apps/platform)
- **studioos-portal** (apps/portal)

Use os mesmos valores de URL e ANON_KEY.
