# 🚀 Guia de Migração: Lovable → Supabase Direto

## Resumo

Esta migração permite controle total do Supabase enquanto mantém todos os dados da empresa em funcionamento.

**Projeto Supabase Atual:** `emmogpqoqfmwtipxwcit`

---

## 📋 Checklist de Migração

### Fase 1: Preparação (30 min)
- [ ] Fazer backup do banco de dados
- [ ] Anotar todas as credenciais atuais
- [ ] Criar conta no Vercel/Netlify
- [ ] Verificar acesso ao Supabase Dashboard

### Fase 2: Transferência de Controle (15 min)
- [ ] Acessar projeto no Supabase Dashboard
- [ ] Configurar autenticação de 2 fatores
- [ ] Gerar novas chaves de API se necessário

### Fase 3: Deploy Separado (1 hora)
- [ ] Configurar projeto no Vercel/Netlify
- [ ] Configurar variáveis de ambiente
- [ ] Fazer primeiro deploy
- [ ] Testar todas as funcionalidades

### Fase 4: Apontar Domínio (30 min)
- [ ] Configurar domínio personalizado
- [ ] Atualizar DNS
- [ ] Verificar SSL

### Fase 5: Desativar Lovable (após validação)
- [ ] Confirmar que tudo funciona no novo host
- [ ] Pausar/cancelar projeto Lovable

---

## 📝 Passo a Passo Detalhado

### 1. Acessar Supabase Dashboard

O Lovable cria um projeto Supabase para você. Você pode acessá-lo diretamente:

1. Vá para https://supabase.com/dashboard
2. Faça login com a **mesma conta** do Lovable (Google/GitHub)
3. Seu projeto `emmogpqoqfmwtipxwcit` deve aparecer

**Se não aparecer:**
- No Lovable: Settings > Supabase > "View in Supabase"
- Ou: Settings > Supabase > "Transfer to Supabase Account"

### 2. Obter Service Role Key

No Supabase Dashboard:
1. Vá em **Settings** > **API**
2. Copie a **service_role key** (NUNCA exponha no frontend!)
3. Guarde em local seguro (1Password, etc)

### 3. Fazer Backup

No Supabase Dashboard:
1. **Database** > **Backups**
2. Clique em **"Create backup"**
3. **Download** o backup
4. Guarde em local seguro

Ou via CLI:
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref emmogpqoqfmwtipxwcit

# Dump do banco
supabase db dump > backup_$(date +%Y%m%d).sql
```

### 4. Deploy no Vercel

#### 4.1 Criar Projeto
1. Acesse https://vercel.com
2. Clique em **"Add New Project"**
3. Importe o repositório Git do projeto
4. Framework Preset: **Vite**

#### 4.2 Configurar Variáveis de Ambiente
No Vercel Dashboard do projeto:
1. **Settings** > **Environment Variables**
2. Adicione:

```
VITE_SUPABASE_PROJECT_ID = emmogpqoqfmwtipxwcit
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL = https://emmogpqoqfmwtipxwcit.supabase.co
```

#### 4.3 Build Settings
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### 4.4 Deploy
Clique em **Deploy** e aguarde.

### 5. Deploy no Netlify (Alternativa)

#### 5.1 Criar Site
1. Acesse https://app.netlify.com
2. **Add new site** > **Import an existing project**
3. Conecte ao repositório Git

#### 5.2 Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `dist`

#### 5.3 Environment Variables
Em **Site settings** > **Environment variables**:
```
VITE_SUPABASE_PROJECT_ID = emmogpqoqfmwtipxwcit
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL = https://emmogpqoqfmwtipxwcit.supabase.co
```

### 6. Configurar Domínio Personalizado

#### No Vercel:
1. **Settings** > **Domains**
2. Adicione seu domínio (ex: `app.prismadecorlab.com`)
3. Configure o DNS:
   - **CNAME:** `cname.vercel-dns.com`
   - Ou **A Record** para o IP fornecido

#### No Netlify:
1. **Domain settings** > **Add custom domain**
2. Configure DNS conforme instruções

### 7. Atualizar URLs no Supabase

No Supabase Dashboard:
1. **Authentication** > **URL Configuration**
2. Atualize:
   - **Site URL:** `https://app.prismadecorlab.com`
   - **Redirect URLs:** `https://app.prismadecorlab.com/**`

---

## 🔧 Edge Functions (Se necessário)

Se você estava usando Edge Functions do Lovable, elas continuam funcionando no mesmo projeto Supabase.

Para gerenciá-las diretamente:

```bash
# Deploy de uma função
supabase functions deploy save-visit-request

# Ver logs
supabase functions logs save-visit-request

# Listar funções
supabase functions list
```

---

## ⚠️ Pontos de Atenção

### CORS
Se tiver erros de CORS após migração:
1. Verifique URLs no Supabase (Authentication > URL Config)
2. Adicione domínio nas Edge Functions (se necessário)

### Autenticação
- Links de confirmação de email usarão a nova URL
- Usuários existentes não são afetados

### Dados
- TODOS os dados permanecem no Supabase
- Nenhum dado é perdido na migração
- O banco continua o mesmo

---

## 🧪 Testes Pós-Migração

Execute estes testes antes de desativar o Lovable:

- [ ] Login funciona
- [ ] Criar novo orçamento
- [ ] Ver lista de orçamentos
- [ ] Gerar PDF
- [ ] Criar novo contato (CRM)
- [ ] Ver dashboard financeiro
- [ ] Agendar visita na LP
- [ ] Receber notificação de visita

---

## 📞 Em Caso de Problemas

### Rollback
Se algo der errado:
1. Aponte o domínio de volta para o Lovable
2. Ou: restaure o backup no Supabase

### Logs de Erro
- **Vercel:** Dashboard > Deployments > Functions
- **Netlify:** Functions > Function logs
- **Supabase:** Logs > Edge Functions

### Suporte
- Supabase Discord: https://discord.supabase.com
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com

---

## ✅ Conclusão

Após esta migração, você terá:

1. ✅ Controle total do Supabase Dashboard
2. ✅ Acesso a todos os logs e métricas
3. ✅ Capacidade de rodar migrations manualmente
4. ✅ Backups sob seu controle
5. ✅ Liberdade para trocar de host frontend
6. ✅ Dados da empresa preservados 100%
