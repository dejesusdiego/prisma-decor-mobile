# PR: Contrato de Domínios/Rotas em Produção

## 📋 Resumo

Este PR implementa o contrato oficial de domínios e rotas em produção, transformando `app.studioos.pro` em gateway de autenticação e garantindo que todas as rotas funcionem corretamente em cada domínio.

## ✅ O que foi implementado

### 1. Gateway de Autenticação (`app.studioos.pro`)

**Novo componente:** `src/pages/LoginGateway.tsx`
- Funciona como porta de entrada para autenticação
- Rotas canônicas: `/login` e `/auth` (ambas apontam para o mesmo componente)
- Se usuário não autenticado: mostra tela de login
- Se usuário autenticado: redireciona automaticamente para domínio correto baseado em role

**Funcionalidade:**
- ✅ Usa `redirectAfterLogin()` para redirecionamento inteligente
- ✅ Suporta rotas `/login` e `/auth` como canônicas
- ✅ Fallback para `/gerarorcamento` se usuário já está no domínio correto

### 2. Função Utilitária de Redirect

**Novo arquivo:** `src/lib/redirectAfterLogin.ts`
- Função reutilizável para redirect após login
- Centraliza lógica de redirecionamento por role
- Suporta produção (domínios) e dev/preview (paths)

**Prioridade de redirect:**
1. Supplier → `fornecedores.studioos.pro`
2. Platform Admin → `admin.studioos.pro`
3. Organization User → domínio custom ou `{slug}-app.studioos.pro`

### 3. Refatoração do `useAuth.tsx`

- ✅ Usa função utilitária `redirectAfterLogin` do `src/lib/redirectAfterLogin.ts`
- ✅ Mantém compatibilidade com código existente
- ✅ `signIn()` chama `redirectAfterLogin()` automaticamente após login

### 4. Ajustes no `App.tsx`

**Roteamento por domínio:**

1. **Supplier Portal** (`fornecedores.studioos.pro`):
   - Renderiza `SupplierPortal` diretamente
   - Suporta rotas internas via tabs (dashboard/catalogo)

2. **Admin** (`admin.studioos.pro`):
   - Renderiza `AdminRoute` com rotas internas
   - Suporta `/gerenciarusuarios` e outras rotas admin
   - Redirect 301 de `panel.studioos.pro` → `admin.studioos.pro` (via vercel.json)

3. **Gateway** (`app.studioos.pro`):
   - Rotas `/login` e `/auth` → `LoginGateway`
   - Rotas `/gerarorcamento` e outras → app protegido (fallback)
   - Funciona como porta de entrada para autenticação

4. **App da Organização** (`{slug}-app.studioos.pro`):
   - Rotas internas do sistema (`/gerarorcamento`, `/configuracoes/organizacao`, etc.)
   - App protegido com `ProtectedRoute`

5. **Marketing** (`studioos.pro`):
   - Landing page StudioOS
   - Rotas públicas (`/cadastro-fornecedor`)

### 5. Redirect 301 (Opcional)

**`vercel.json`:**
- ✅ Adicionado redirect 301 de `panel.studioos.pro` → `admin.studioos.pro`
- ✅ Mantém rewrites para SPA (React Router)
- ✅ Não quebra funcionalidade existente

### 6. SPA Rewrites

**`vercel.json`:**
- ✅ Rewrite global `/(.*)` → `/index.html` garante que todas as rotas funcionem
- ✅ Suporta refresh direto em rotas internas sem 404

## 🧪 Como testar

### Produção

#### Domínios Principais
- [ ] `studioos.pro/` → Landing page StudioOS
- [ ] `studioos.pro/cadastro-fornecedor` → Cadastro público
- [ ] `app.studioos.pro/login` → Gateway de login
- [ ] `app.studioos.pro/auth` → Gateway de login (canônico)
- [ ] `app.studioos.pro/gerarorcamento` → App protegido (fallback)
- [ ] `admin.studioos.pro/` → Admin (requer auth + role admin)
- [ ] `admin.studioos.pro/gerenciarusuarios` → Admin (requer auth + role admin)
- [ ] `panel.studioos.pro/` → Redireciona 301 para `admin.studioos.pro`
- [ ] `fornecedores.studioos.pro/` → Supplier Portal (requer auth)
- [ ] `{slug}-app.studioos.pro/` → App da organização (requer auth)
- [ ] `{slug}-app.studioos.pro/gerarorcamento` → App da organização

#### Redirects por Role
- [ ] Login como **Supplier** → redireciona para `fornecedores.studioos.pro`
- [ ] Login como **Admin** → redireciona para `admin.studioos.pro`
- [ ] Login como **Org User** → redireciona para `{slug}-app.studioos.pro` ou domínio custom
- [ ] Sem loops de redirect

#### Rotas Internas (SPA)
- [ ] Refresh direto em `https://{dominio}/gerarorcamento` → não dá 404
- [ ] Refresh direto em `https://admin.studioos.pro/gerenciarusuarios` → não dá 404
- [ ] Navegação interna funciona em todos os domínios

### Dev/Preview

- [ ] `localhost:3000/login` → Gateway de login
- [ ] `localhost:3000/auth` → Gateway de login
- [ ] `localhost:3000/fornecedores` → Supplier Portal
- [ ] `localhost:3000/gerenciarusuarios` → Admin
- [ ] `localhost:3000/gerarorcamento` → App protegido

## 📝 Decisões Técnicas

### Rotas Canônicas: `/login` e `/auth`

**Decisão:** Ambas as rotas (`/login` e `/auth`) apontam para o mesmo componente `LoginGateway`.

**Motivo:**
- Compatibilidade com código existente que usa `/auth`
- Flexibilidade para usar `/login` como padrão futuro
- Ambas funcionam como gateway de autenticação

**Documentação:** Atualizado em `docs/DOMINIOS_E_ROTAS.md`

### Gateway vs App

**`app.studioos.pro`:**
- Funciona como **gateway** para autenticação
- Rotas `/login` e `/auth` mostram tela de login
- Rotas internas (`/gerarorcamento`) funcionam como fallback

**`{slug}-app.studioos.pro`:**
- Funciona como **app** da organização
- Todas as rotas são internas do sistema
- Requer autenticação

## ⚠️ Riscos e Mitigações

### Baixo Risco

1. **Redirect 301 pode quebrar sessões:**
   - Mitigação: Redirect apenas de `panel` → `admin` (domínios diferentes)
   - Usuários devem usar `admin.studioos.pro` diretamente

2. **Gateway pode confundir usuários:**
   - Mitigação: Redirect automático após login resolve isso
   - Documentação clara sobre gateway

3. **Rotas internas podem não funcionar:**
   - Mitigação: SPA rewrites garantem que todas as rotas funcionem
   - Testado com refresh direto

## 🚀 Próximos Passos (Futuro)

1. **Edge Middleware:** Migrar resolução de domínio para Vercel Edge
2. **Analytics:** Rastrear uso de gateway vs app direto
3. **Documentação Cliente:** Guia de configuração de DNS

---

**Status:** ✅ Pronto para merge  
**Breaking Changes:** Nenhum (compatível com código existente)  
**Dependências:** Nenhuma nova dependência
