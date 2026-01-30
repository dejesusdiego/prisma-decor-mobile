# 🚀 StudioOS V5 - Guia de Deploy Multi-App na Vercel

## 📋 Resumo da Arquitetura

| App | Diretório | Projeto Vercel | Domínio |
|-----|-----------|----------------|---------|
| Core (ERP) | `apps/core` | `studioos-core` | app.studioos.pro |
| Platform (Admin) | `apps/platform` | `studioos-platform` | panel.studioos.pro |
| Portal (Fornecedores) | `apps/portal` | `studioos-portal` | fornecedores.studioos.pro |

---

## ✅ Pré-requisitos

1. **Vercel CLI instalado:**
```bash
npm i -g vercel@latest
vercel --version  # Deve mostrar versão 33+
```

2. **Login na Vercel:**
```bash
vercel login
```

3. **Variáveis de ambiente locais configuradas** (já feito nos arquivos `.env` de cada app)

---

## 🚀 PASSO 1: Deploy do Core (ERP)

```bash
cd apps/core

# Primeiro deploy (cria o projeto)
vercel --name studioos-core

# Responda:
# ? Set up and deploy? [Y/n] → Y
# ? Which scope? → Selecione sua conta
# ? Link to existing project? [y/N] → n

# Deploy para produção
vercel --prod
```

### Configurar Domínio:
```bash
vercel domains add app.studioos.pro
```

Ou configure via dashboard: https://vercel.com/dashboard → studioos-core → Settings → Domains

---

## 👑 PASSO 2: Deploy do Platform (Admin)

```bash
cd apps/platform

# Primeiro deploy
vercel --name studioos-platform

# Deploy para produção
vercel --prod
```

### Configurar Domínio:
```bash
vercel domains add panel.studioos.pro
```

---

## 🏪 PASSO 3: Deploy do Portal (Fornecedores)

```bash
cd apps/portal

# Primeiro deploy
vercel --name studioos-portal

# Deploy para produção
vercel --prod
```

### Configurar Domínio:
```bash
vercel domains add fornecedores.studioos.pro
```

---

## 🔐 PASSO 4: Configurar Variáveis de Ambiente (CRÍTICO!)

Cada projeto precisa das variáveis do Supabase. Configure via CLI ou Dashboard:

### Via CLI (para cada app):

**Core:**
```bash
cd apps/core
vercel env add VITE_SUPABASE_URL
# Cole: https://tjwpqrlfhngibuwqodcn.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Cole sua anon key
```

**Platform:**
```bash
cd apps/platform
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_SERVICE_ROLE_KEY  # Opcional, para operações admin
```

**Portal:**
```bash
cd apps/portal
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Via Dashboard:
1. Acesse https://vercel.com/dashboard
2. Selecione cada projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 🧪 PASSO 5: Testar Deploys

Após configurar tudo, teste cada app:

```bash
# Teste Core
curl -I https://app.studioos.pro

# Teste Platform
curl -I https://panel.studioos.pro

# Teste Portal
curl -I https://fornecedores.studioos.pro
```

Ou acesse no navegador:
- https://app.studioos.pro (deve mostrar login)
- https://panel.studioos.pro (deve mostrar login admin)
- https://fornecedores.studioos.pro (deve mostrar login fornecedor)

---

## 🔄 Script Automatizado (Opcional)

Execute o script de deploy:

```bash
# Windows (Git Bash/WSL)
./scripts/v5-deploy-all.sh

# Ou manualmente cada passo
```

---

## 🚨 Troubleshooting

### Erro: "Project name already exists"
- O projeto já existe na Vercel
- Use `vercel --prod` diretamente após fazer login

### Erro: "Domain already in use"
- O domínio está em outro projeto
- Remova do projeto antigo ou use um subdomínio diferente

### Erro: "Build failed"
- Verifique se as variáveis de ambiente estão configuradas
- Verifique os logs: `vercel logs --all`

### App mostra 404 em rotas
- Verifique se `vercel.json` está correto com as rewrites

---

## 📊 Status Esperado Após Deploy

| App | Status | URL |
|-----|--------|-----|
| Core | ✅ Deployed | https://app.studioos.pro |
| Platform | ✅ Deployed | https://panel.studioos.pro |
| Portal | ✅ Deployed | https://fornecedores.studioos.pro |

---

## 🎯 Próximo Passo: DIA 7

Após todos os deploys funcionarem, prossiga para:
- Testes de integração
- Testes de segurança
- Go Live!
