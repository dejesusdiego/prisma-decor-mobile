# 🔑 Como Obter Token do Vercel

## 📋 Método 1: Via Dashboard (Recomendado)

1. **Acesse:** https://vercel.com/account/tokens
2. **Faça login** na sua conta Vercel
3. **Clique em "Create Token"**
4. **Configure o token:**
   - **Name:** `prisma-decor-mobile-deploy`
   - **Expiration:** Escolha uma data ou "No expiration"
   - **Scope:** `Full Account` (ou apenas o projeto específico)
5. **Clique em "Create Token"**
6. **Copie o token** (ele só aparece uma vez!)

---

## 📋 Método 2: Via CLI (Alternativa)

Se você já está logado no Vercel CLI:

```bash
# Verificar se está logado
vercel whoami

# Se não estiver, fazer login
vercel login

# O token será salvo automaticamente em:
# Windows: %USERPROFILE%\.vercel\auth.json
# Mac/Linux: ~/.vercel/auth.json
```

---

## 🔐 Usar o Token

### Opção 1: Variável de Ambiente

```bash
# Windows PowerShell
$env:VERCEL_TOKEN="seu_token_aqui"
vercel --prod

# Windows CMD
set VERCEL_TOKEN=seu_token_aqui
vercel --prod

# Mac/Linux
export VERCEL_TOKEN="seu_token_aqui"
vercel --prod
```

### Opção 2: Direto no Comando

```bash
vercel --token seu_token_aqui --prod
```

---

## ⚠️ Segurança

- **NUNCA** commite o token no Git
- Adicione `.vercel` ao `.gitignore` (já está adicionado)
- Use tokens com escopo limitado quando possível
- Revogue tokens antigos regularmente

---

## 📝 Verificar Token

```bash
# Verificar se o token funciona
vercel --token seu_token_aqui whoami
```

---

## 🔄 Se o Token Expirar

1. Acesse https://vercel.com/account/tokens
2. Revogue o token antigo
3. Crie um novo token
4. Atualize onde você usa o token
