# 🛡️ Deploy Seguro - Preview → Produção

## ESTRATÉGIA: Preview URLs primeiro, domínios depois

Isso permite testar sem afetar os domínios de produção atuais.

---

## 🚀 FASE 1: Deploy em Preview (Teste)

### PASSO 1: Core (ERP)
```bash
cd apps/core

# Deploy preview (sem afetar produção)
vercel --name studioos-core
```

**Responda:**
- `? Set up and deploy?` → **Y**
- `? Which scope?` → **Selecione sua conta**
- `? Link to existing project?` → **N** (primeira vez)

**Resultado:** Vercel gerará URL tipo:
```
🔍  Inspect: https://vercel.com/seu-user/studioos-core/abc123
✅  Preview: https://studioos-core-abc123.vercel.app
```

**Teste imediatamente:**
```bash
# Teste no terminal
curl https://studioos-core-XXXX.vercel.app | head -20

# Ou abra no browser e verifique:
# - Página de login aparece?
# - Não dá erro 404?
# - Não dá erro 500?
```

---

### PASSO 2: Platform (Admin)
```bash
cd apps/platform
vercel --name studioos-platform
```

**Teste:**
```bash
curl https://studioos-platform-XXXX.vercel.app | head -20
```

---

### PASSO 3: Portal (Fornecedores)
```bash
cd apps/portal
vercel --name studioos-portal
```

**Teste:**
```bash
curl https://studioos-portal-XXXX.vercel.app | head -20
```

---

## ✅ FASE 2: Validação (Testes Críticos)

Antes de apontar os domínios, verifique:

### Teste 1: Core - Login Funciona?
```bash
# Abra no browser: https://studioos-core-XXXX.vercel.app
# Tente fazer login com credenciais válidas
# Esperado: Redireciona para dashboard
```

### Teste 2: Platform - Auth Admin
```bash
# Abra: https://studioos-platform-XXXX.vercel.app
# Login com conta super-admin
# Esperado: Vê dashboard com métricas
```

### Teste 3: Portal - Auth Fornecedor
```bash
# Abra: https://studioos-portal-XXXX.vercel.app
# Login com conta de fornecedor aprovado
# Esperado: Vê dashboard do fornecedor
```

### Teste 4: Variáveis de Ambiente
Se der erro de "Supabase URL not found":
```bash
cd apps/core  # ou platform ou portal
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# Depois: vercel --prod
```

---

## 🎯 FASE 3: Produção (Só se Preview OK)

### Só prossiga se TODOS os previews estiverem funcionando!

### PASSO 4: Core → Produção
```bash
cd apps/core
vercel --prod
vercel domains add app.studioos.pro
```

**Verificação:**
```bash
curl -I https://app.studioos.pro
# Deve retornar: HTTP/2 200
```

---

### PASSO 5: Platform → Produção
```bash
cd apps/platform
vercel --prod
vercel domains add panel.studioos.pro
```

**Verificação:**
```bash
curl -I https://panel.studioos.pro
```

---

### PASSO 6: Portal → Produção
```bash
cd apps/portal
vercel --prod
vercel domains add fornecedores.studioos.pro
```

**Verificação:**
```bash
curl -I https://fornecedores.studioos.pro
```

---

## 🧪 FASE 4: Testes Finais (DIA 7)

### Teste de Integração Cruzada:
```bash
# 1. Crie um orçamento em app.studioos.pro
# 2. Verifique se aparece no dashboard
# 3. Acesse panel.studioos.pro - deve mostrar organizações
# 4. Acesse fornecedores.studioos.pro - login deve funcionar
```

### Teste de Isolamento:
```bash
# Se um app parar, os outros continuam funcionando?
# Isso é verificado automaticamente pelos domínios separados
```

---

## 🚨 ROLLBACK (Se algo der errado)

Se precisar voltar atrás:

```bash
# Ver deploys anteriores
vercel --version  # lista deploys

# Rollback para versão anterior
vercel rollback

# Ou via dashboard: https://vercel.com/dashboard → projeto → Deployments
```

---

## ⏱️ Timeline Estimada

| Fase | Tempo | Quando Parar |
|------|-------|--------------|
| Preview Core | 3 min | Se der erro no build |
| Preview Platform | 3 min | Se der erro no build |
| Preview Portal | 3 min | Se der erro no build |
| Testes Preview | 10 min | Se login não funcionar |
| Prod Core | 2 min | Se domínio falhar |
| Prod Platform | 2 min | Se domínio falhar |
| Prod Portal | 2 min | Se domínio falhar |
| **Total** | **~25 min** | |

---

## ✅ CHECKLIST FINAL

Antes de considerar "Done":

- [ ] Preview Core funciona (login ok)
- [ ] Preview Platform funciona (login ok)
- [ ] Preview Portal funciona (login ok)
- [ ] app.studioos.pro responde 200
- [ ] panel.studioos.pro responde 200
- [ ] fornecedores.studioos.pro responde 200
- [ ] Teste de login em todos
- [ ] Variáveis de ambiente configuradas
- [ ] DNS propagado (pode levar até 24h)

---

## 🎉 PRÓXIMO PASSO

Execute o **PASSO 1** agora:
```bash
cd apps/core
vercel --name studioos-core
```

Me envie o resultado (a URL de preview gerada) que eu te ajudo a validar!
