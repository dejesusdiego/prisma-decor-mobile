# 🧪 QA Test Execution Guide - StudioOS

## 📋 Credenciais de Teste

| Perfil | Email | Senha | Domínio de Acesso |
|--------|-------|-------|-------------------|
| **Super Admin** | `teste.superadmin@studioos.local` | `Teste@123456` | `admin.studioos.pro` |
| **Admin Org** | `teste.admin@prisma.local` | `Teste@123456` | `prisma-app.studioos.pro` |
| **Usuário Comum** | `teste.usuario@prisma.local` | `Teste@123456` | `prisma-app.studioos.pro` |
| **Fornecedor** | `teste.fornecedor@studioos.local` | `Teste@123456` | `fornecedores.studioos.pro` |

---

## 🚀 FASE 1: Setup e Criação de Usuários

### Passo 1.1: Executar Script SQL

**Opção A - SQL Editor do Supabase:**
1. Acesse: https://supabase.com/dashboard/project/_/sql/new
2. Cole o conteúdo de `scripts/criar-usuarios-teste-v3.sql`
3. Clique em "Run"
4. Verifique a saída com os 4 usuários criados

**Opção B - Node.js Script:**
```bash
# Configure as variáveis no .env
echo "SUPABASE_URL=sua_url" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=sua_chave" >> .env

# Execute
node scripts/criar-usuarios-teste.js
```

### Passo 1.2: Verificação de Criação

```sql
-- Verificar usuários criados
SELECT email, raw_user_meta_data->>'name' as nome, created_at
FROM auth.users
WHERE email LIKE '%teste.%'
ORDER BY created_at DESC;

-- Verificar roles
SELECT u.email, ur.role
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE '%teste.%';

-- Verificar membros da organização
SELECT u.email, o.name as org, om.role
FROM organization_members om
JOIN auth.users u ON om.user_id = u.id
JOIN organizations o ON om.organization_id = o.id
WHERE u.email LIKE '%teste.%';
```

---

## 🔍 FASE 2: Testes de Domínios e Roteamento

### 2.1 Teste: Super Admin (`admin.studioos.pro`)

| # | Passo | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 2.1.1 | Acesse `https://admin.studioos.pro` | Página de login carrega | ⬜ |
| 2.1.2 | Faça login com Super Admin | Redirecionado para `/admin-supremo/dashboard` | ⬜ |
| 2.1.3 | Verifique o Dashboard | Cards de métricas visíveis | ⬜ |
| 2.1.4 | Acesse "Organizações" | Lista de organizações carrega | ⬜ |
| 2.1.5 | Acesse "Fornecedores" | Lista de fornecedores carrega | ⬜ |
| 2.1.6 | Acesse "Configurações" | Configurações da plataforma acessível | ⬜ |
| 2.1.7 | Verifique o menu lateral | Opções de Super Admin visíveis | ⬜ |

**Problemas Potenciais:**
- ❌ Se redirecionar para login gateway: Problema no `DomainRouter`
- ❌ Se mostrar 404: Rota não registrada em `super-admin.ts`
- ❌ Se não carregar dados: Erro nas RLS policies

### 2.2 Teste: Organization Admin (`prisma-app.studioos.pro`)

| # | Passo | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 2.2.1 | Acesse `https://prisma-app.studioos.pro` | Tela de orçamento/dashboard carrega | ⬜ |
| 2.2.2 | Faça login com Admin Org | Sistema autentica e mantém na URL | ⬜ |
| 2.2.3 | Verifique sidebar completa | Todas as opções visíveis (incluindo Configurações e Financeiro) | ⬜ |
| 2.2.4 | Acesse "Configurações > Organização" | Formulário de configurações carrega | ⬜ |
| 2.2.5 | Acesse "Configurações > Usuários" | Lista de usuários da org carrega | ⬜ |
| 2.2.6 | Acesse "Configurações > Faturamento" | Página de billing carrega | ⬜ |
| 2.2.7 | Acesse "Financeiro > Contas a Receber" | Lista financeira carrega | ⬜ |
| 2.2.8 | Crie um novo orçamento | Orçamento criado com sucesso | ⬜ |

**Problemas Potenciais:**
- ❌ Se não mostrar Configurações: Erro no hook `usePermissions` ou `useUserRole`
- ❌ Se não mostrar Financeiro: Verificar RBAC na sidebar
- ❌ Se redirecionar indevidamente: Verificar `RouteValidator`

### 2.3 Teste: Regular User (`prisma-app.studioos.pro`)

| # | Passo | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 2.3.1 | Acesse `https://prisma-app.studioos.pro` | Tela de orçamento carrega | ⬜ |
| 2.3.2 | Faça login com Usuário Comum | Sistema autentica | ⬜ |
| 2.3.3 | Verifique sidebar limitada | **NÃO DEVE** mostrar Configurações | ⬜ |
| 2.3.4 | Verifique sidebar limitada | **NÃO DEVE** mostrar Financeiro | ⬜ |
| 2.3.5 | Tente acessar `/configuracoes` diretamente | Redirecionado ou 403 | ⬜ |
| 2.3.6 | Tente acessar `/financeiro` diretamente | Redirecionado ou 403 | ⬜ |
| 2.3.7 | Acesse áreas permitidas (Orçamentos, Pedidos) | Funcionam normalmente | ⬜ |
| 2.3.8 | Crie um novo orçamento | Orçamento criado com sucesso | ⬜ |

**Problemas Potenciais:**
- ❌ Se mostrar Configurações/Financeiro: Bug crítico de segurança RBAC
- ❌ Se conseguir acessar via URL: `RouteValidator` não validando corretamente

### 2.4 Teste: Supplier (`fornecedores.studioos.pro`)

| # | Passo | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 2.4.1 | Acesse `https://fornecedores.studioos.pro` | Página de login de fornecedor carrega | ⬜ |
| 2.4.2 | Faça login com Fornecedor | Dashboard do fornecedor carrega | ⬜ |
| 2.4.3 | Verifique sidebar do fornecedor | Opções: Catálogo, Pedidos, Configurações | ⬜ |
| 2.4.4 | Acesse "Catálogo" | Catálogo de materiais carrega | ⬜ |
| 2.4.5 | Acesse "Pedidos" | Pedidos recebidos carregam | ⬜ |
| 2.4.6 | Tente acessar `/orcamentos` | Redirecionado (rota não existe para fornecedor) | ⬜ |

**Problemas Potenciais:**
- ❌ Se mostrar opções de usuário comum: Erro no domínio supplier
- ❌ Se redirecionar para app de org: Confusão no domain resolver

---

## 🔐 FASE 3: Testes de Segurança Cross-Domain

### 3.1 Teste de Isolamento de Sessão

| # | Passo | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 3.1.1 | Login como Super Admin em `admin.studioos.pro` | Autenticado | ⬜ |
| 3.1.2 | Abra `prisma-app.studioos.pro` em aba anônima | **NÃO DEVE** estar logado | ⬜ |
| 3.1.3 | Abra `fornecedores.studioos.pro` em aba anônima | **NÃO DEVE** estar logado | ⬜ |
| 3.1.4 | Volte para `admin.studioos.pro` | Sessão ainda ativa | ⬜ |

### 3.2 Teste de Escalonamento de Privilégios

| # | Passo | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 3.2.1 | Login como Usuário Comum | Autenticado | ⬜ |
| 3.2.2 | Tente acessar `https://admin.studioos.pro/admin-supremo` | Redirecionado ou 403 | ⬜ |
| 3.2.3 | Tente acessar `https://prisma-app.studioos.pro/configuracoes/usuarios` | Redirecionado ou 403 | ⬜ |
| 3.2.4 | Verifique localStorage/sessionStorage | Não deve haver tokens de admin | ⬜ |

### 3.3 Teste de CSRF/Token Hijacking

| # | Passo | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 3.3.1 | Capture o token JWT do usuário comum | Token obtido | ⬜ |
| 3.3.2 | Tente usar esse token em `admin.studioos.pro` | Token rejeitado ou sem permissões | ⬜ |
| 3.3.3 | Tente usar token de fornecedor em `prisma-app.studioos.pro` | Acesso negado | ⬜ |

---

## 🐛 FASE 4: Reprodução do Bug "Requests Infinitos"

### 4.1 Cenário 1: Loop no useEffect de Organização

**Como Reproduzir:**
1. Acesse `prisma-app.studioos.pro` com Admin Org
2. Abra DevTools (F12) > Network tab
3. Limpe o cache e recarregue (Ctrl+Shift+R)
4. Observe por múltiplas requests para:
   - `organizations?select=*`
   - `organization_members?select=*`
   - `user_roles?select=*`

**Sinais de Bug:**
- ❌ Requests repetidos a cada 1-2 segundos
- ❌ CPU do navegador em alta
- ❌ Mensagens de warning no console sobre re-renders

**Diagnóstico:**
```javascript
// Verifique no console por:
"Maximum update depth exceeded"
"Too many re-renders"
```

### 4.2 Cenário 2: Loop na Validação de Rotas

**Como Reproduzir:**
1. Acesse uma rota inexistente: `prisma-app.studioos.pro/rota-invalida`
2. Observe o comportamento de redirect
3. Verifique se há loop de redirecionamentos

**Sinais de Bug:**
- ❌ URL fica mudando rapidamente
- ❌ Página fica piscando
- ❌ Browser mostra "Too many redirects"

### 4.3 Cenário 3: Loop em Autenticação

**Como Reproduzir:**
1. Limpe todos os cookies e storage
2. Acesse `prisma-app.studioos.pro/configuracoes`
3. Quando redirecionado para login, faça login
4. Observe o comportamento pós-login

**Sinais de Bug:**
- ❌ Redirecionamento infinito entre login e dashboard
- ❌ Nunca completa o login
- ❌ Erro "redirected you too many times"

### 4.4 Checklist de Verificação no Console

Abra DevTools e verifique:

```javascript
// 1. Verificar número de renders
let renderCount = 0;
const originalRender = React.createElement;
React.createElement = function(...args) {
  renderCount++;
  console.log('Render #' + renderCount, args[0]?.name || args[0]);
  return originalRender.apply(this, args);
};

// 2. Monitorar requests
timeout = setInterval(() => {
  const requests = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('supabase'));
  console.log(`Requests: ${requests.length}`);
}, 2000);

// Limpe com: clearInterval(timeout);
```

---

## 📊 Template de Relatório de Teste

### Resumo Executivo

```
Data: ___/___/______
Testador: ___________________
Ambiente: ⬜ Produção  ⬜ Staging  ⬜ Dev
Versão: ________________
```

### Resultados por Fase

| Fase | Total Testes | Passou | Falhou | Bloqueado |
|------|--------------|--------|--------|-----------|
| Fase 1: Setup | 4 | | | |
| Fase 2: Domínios | 24 | | | |
| Fase 3: Segurança | 10 | | | |
| Fase 4: Bug Hunt | 3 | | | |
| **TOTAL** | **41** | | | |

### Bugs Encontrados

#### Bug #1
- **Severidade:** ⬜ Crítica ⬜ Alta ⬜ Média ⬜ Baixa
- **Título:** 
- **Passos para Reproduzir:**
  1. 
  2. 
  3. 
- **Resultado Esperado:** 
- **Resultado Atual:** 
- **Evidências:** [Screenshot/Video]
- **Sugestão de Correção:** 

#### Bug #2
...

### Métricas de Performance

| Métrica | Valor Esperado | Valor Obtido | Status |
|---------|---------------|--------------|--------|
| Tempo de carregamento inicial | < 3s | | |
| Tempo de login | < 2s | | |
| Requests por página | < 20 | | |
| Uso de memória | < 200MB | | |

### Recomendações

1. 
2. 
3. 

---

## 🔧 Ferramentas de Debug

### 1. Verificar Domain Resolution
```javascript
// Cole no console do navegador
fetch('/api/debug/domain').then(r => r.json()).then(console.log);
```

### 2. Verificar User Context
```javascript
// No console
__STUDIOOS_DEBUG = true; // Ativa logs detalhados
```

### 3. Network Analysis
- Abra Network tab
- Filtre por "Fetch/XHR"
- Ordene por "Waterfall"
- Procure por padrões repetitivos

### 4. React DevTools Profiler
- Instale React DevTools
- Aba "Profiler"
- Grave uma sessão
- Procure por componentes com muitos renders

---

## ✅ Sign-off

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| QA Engineer | | | |
| Tech Lead | | | |
| Product Owner | | | |
