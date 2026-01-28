# Domínios e Rotas — Contrato Oficial

Este documento define o contrato oficial de domínios e roteamento do StudioOS, alinhado com a arquitetura Vercel-first.

## 📋 Índice

1. [Contrato de Domínios](#contrato-de-domínios)
2. [Regras de Redirecionamento por Role](#regras-de-redirecionamento-por-role)
3. [Comportamento em Dev/Preview](#comportamento-em-devpreview)
4. [Configuração na Vercel](#configuração-na-vercel)
5. [QA e Validação](#qa-e-validação)

---

## 🎯 Contrato de Domínios

### StudioOS (Plataforma)

| Domínio | Propósito | Principais Rotas | Observações |
|---------|-----------|-----------------|-------------|
| `studioos.pro` | LP / Marketing | `/`, `/cadastro-fornecedor` | Landing page principal do SaaS |
| `app.studioos.pro` | Gateway de Auth / App Fallback | `/login`, `/auth` (gateway), `/gerarorcamento` (fallback) | Gateway de autenticação + fallback comercial |
| `admin.studioos.pro` | Painel Admin (Canônico) | `/gerenciarusuarios` | Painel superadmin da plataforma |
| `fornecedores.studioos.pro` | Portal Fornecedor | `/dashboard`, `/catalogo` | Portal de fornecedores |

**⚠️ IMPORTANTE:** `panel.studioos.pro` redireciona automaticamente para `admin.studioos.pro` (domínio canônico).

**Sobre Redirects:**
- **MVP Atual:** Redirect client-side via `window.location.replace()` no `domainResolver.ts`
- **Produção/SEO:** Para 301 permanente real, configurar via Vercel Redirects (UI) ou Edge Middleware

### Clientes (Organizações)

#### Opção 1: Domínio Custom (White Label)

| Domínio | Propósito | Principais Rotas |
|---------|-----------|------------------|
| `{slug}.com` | LP / Marketing | `/` (landing page da organização) |
| `app.{slug}.com` | Sistema (ERP) | `/` (app protegido), `/auth` |

**Exemplo:**
- `prismadecorlab.com` → LP Prisma
- `app.prismadecorlab.com` → Sistema Prisma

#### Opção 2: Subdomínio StudioOS (MVP)

| Domínio | Propósito | Principais Rotas |
|---------|-----------|------------------|
| `{slug}-app.studioos.pro` | Sistema (ERP) | `/` (app protegido), `/auth` |

**Exemplo:**
- `prisma-app.studioos.pro` → Sistema Prisma

### Gateway de Autenticação (`app.studioos.pro`)

**Funcionalidade:** Porta de entrada para autenticação

**Rotas Canônicas:**
- `/login` → Tela de login (gateway)
- `/auth` → Tela de login (gateway, canônico)

**Comportamento:**
- **Usuário não autenticado:** Mostra tela de login
- **Usuário autenticado:** Redireciona automaticamente para domínio correto baseado em role
- **Fallback:** Rotas internas (`/gerarorcamento`) funcionam como app protegido

**Decisão Técnica:** `/login` e `/auth` apontam para o mesmo componente (`LoginGateway`) para compatibilidade e flexibilidade.

---

## 🔀 Regras de Redirecionamento por Role

Após login, o sistema redireciona automaticamente baseado no **role** do usuário:

### 1. Supplier (Fornecedor)

**Condição:** Usuário tem registro ativo em `supplier_users` (com `active = true`)

**Redirecionamento:**
- **Produção:** `https://fornecedores.studioos.pro`
- **Dev/Preview:** `/fornecedores`

**Evita loop:** Se já está em `fornecedores.studioos.pro` ou rota `/fornecedores`, não redireciona novamente.

### 2. Platform Admin (Superadmin)

**Condição:** Usuário tem registro em `user_roles` com `role = 'admin'`

**Redirecionamento:**
- **Produção:** `https://admin.studioos.pro`
- **Dev/Preview:** `/gerenciarusuarios`

**Evita loop:** Se já está em `admin.studioos.pro` ou `panel.studioos.pro`, não redireciona novamente.

### 3. Organization User/Admin (Cliente)

**Condição:** Usuário tem registro em `organization_members`

**Redirecionamento (prioridade):**

1. **Domínio custom** (se existir no banco):
   - Busca em `domains` por `organization_id` + `role = 'app'`
   - Exemplo: `https://app.prismadecorlab.com`

2. **Subdomínio StudioOS** (fallback):
   - `https://{orgSlug}-app.studioos.pro`
   - Exemplo: `https://prisma-app.studioos.pro`

3. **Fallback comercial** (se nenhum dos anteriores):
   - `https://app.studioos.pro/gerarorcamento`

**Dev/Preview:** `/gerarorcamento`

**Evita loop:** Se já está no domínio correto, não redireciona novamente.

---

## 🛠️ Comportamento em Dev/Preview

Em ambientes de desenvolvimento (`localhost`, `*.vercel.app`, `staging.*`), o sistema usa **paths** em vez de domínios:

| Role | Path |
|------|------|
| Supplier | `/fornecedores` |
| Admin | `/gerenciarusuarios` |
| Organization User | `/gerarorcamento` |

**Rotas públicas** funcionam em qualquer ambiente:
- `/cadastro-fornecedor`
- `/fornecedores/cadastro`

**⚠️ IMPORTANTE:** Em produção, rotas como `/studioos` e `/lp/:slug` **não devem ser acessadas**. Apenas subdomínios devem ser usados.

---

## ⚙️ Configuração na Vercel

### Modo 1 — DNS na Vercel (Nameservers / Vercel DNS) ⭐ ATUAL

**Este é o modo atualmente em uso para `studioos.pro`.**

Quando o domínio usa **Vercel Nameservers**, a Vercel gerencia **tudo automaticamente**:

#### Project Domains (o que deve existir na aba Domains do projeto)
```
studioos.pro
www.studioos.pro
app.studioos.pro
admin.studioos.pro
panel.studioos.pro
fornecedores.studioos.pro
*.studioos.pro
```

#### Domain (Vercel DNS Records) - Gerenciado Automaticamente
**⚠️ NÃO configurar manualmente.** A Vercel cria automaticamente:
- **ALIAS** para apex (`studioos.pro`)
- **CNAME** para subdomínios (`app`, `admin`, `fornecedores`, etc.)
- **Wildcard** para `*.studioos.pro`
- **SSL certificados** para todos os domínios

#### Checklist Operacional (Modo Nameservers)
- [ ] Domínio `studioos.pro` configurado com **Vercel Nameservers** no registrar
- [ ] Todos os domínios listados acima aparecem na aba **Domains** do projeto
- [ ] Status **Active** para todos os domínios
- [ ] **SSL ativo** para todos os domínios
- [ ] `*.studioos.pro` funciona para subdomínios como `teste-app.studioos.pro`

#### Suporte a `{slug}-app.studioos.pro`
O padrão `{slug}-app.studioos.pro` é suportado via:
1. **Wildcard `*.studioos.pro`** no Project Domains
2. **Lógica no `domainResolver.ts`** que detecta o padrão e extrai o slug
3. **Regex:** `/^([a-z0-9-]+)-app\.studioos\.pro$/`

**⚠️ IMPORTANTE:** Não existe registro DNS específico para cada slug (ex: `prisma-app.studioos.pro`). O wildcard `*.studioos.pro` resolve qualquer subdomínio e a lógica de routing acontece no código.

**🔒 Segurança Crítica:** O `domainResolver.ts` valida rigorosamente:
- ✅ Apenas padrão `{slug}-app.studioos.pro` é aceito (via regex)
- ✅ Slug não pode ser reservado (`studioos`)
- ✅ Organização deve existir no banco
- ✅ Subdomínios inválidos (ex: `lixo.studioos.pro`, `teste123.studioos.pro`) mostram "Domínio não configurado"
- ⚠️ **NUNCA relaxar essas validações** — qualquer subdomínio inválido deve ser bloqueado

#### Por que não `*-app.studioos.pro`?
DNS não suporta wildcards parciais como `*-app.studioos.pro`. O único padrão suportado é `*.studioos.pro` (todos os subdomínios de terceiro nível).

### Modo 2 — DNS Externo (Cloudflare/RegistroBR/etc.)

**Para clientes que querem manter DNS no provedor atual.**

#### Configuração Manual Necessária
Adicionar os seguintes registros DNS **no provedor externo**:

**Apex Domain:**
```
studioos.pro          → A → [IP fornecido pela Vercel]
```
*ou*
```
studioos.pro          → ALIAS → cname.vercel-dns.com
```

**Subdomínios:**
```
app.studioos.pro      → CNAME → cname.vercel-dns.com
admin.studioos.pro    → CNAME → cname.vercel-dns.com
fornecedores.studioos.pro → CNAME → cname.vercel-dns.com
*.studioos.pro        → CNAME → cname.vercel-dns.com (se suportado)
```

**⚠️ IMPORTANTE:**
- Valores podem variar. Sempre consulte o painel da Vercel para os targets corretos.
- Nem todos os provedores suportam wildcard (`*.studioos.pro`).
- SSL deve ser configurado manualmente se o provedor não integrar com a Vercel.

#### Clientes (Domínios Custom)
```
cliente.com           → CNAME → cname.vercel-dns.com
app.cliente.com       → CNAME → cname.vercel-dns.com
```

### Limitações e Soluções

#### Domínios Custom de Clientes
**Limitação:** Cada cliente deve adicionar seu domínio manualmente na Vercel.
**Solução Atual:** Processo manual via suporte ou admin panel (futuro).
**Solução Futura:** Edge Middleware para roteamento dinâmico.

### Rewrites/Redirects no `vercel.json`

#### Configuração Atual
O `vercel.json` atual inclui apenas rewrites para SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Para Redirects 301 Reais (Opcional)
Para configurar `panel.studioos.pro` → `admin.studioos.pro` como 301 permanente:

```json
{
  "redirects": [
    {
      "source": "https://panel.studioos.pro/:path*",
      "destination": "https://admin.studioos.pro/:path*",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**⚠️ Estratégia MVP vs SEO:**

- **MVP / Agora:** Client-side redirect (`window.location.replace()`) = **OK** para uso interno
- **🔜 Quando for público / SEO / tráfego real:** Configurar 301 permanente via Vercel (UI ou `vercel.json`)
- **📌 Recomendação:** Deixar como issue marcada como "SEO / Infra", não como bug. Priorizar quando houver tráfego público significativo.

#### Futuro: Edge Middleware
Para melhor performance e funcionalidades avançadas:
- Resolução de domínio no edge (cache + rate limit)
- Redirecionamentos otimizados
- Bloqueio de bots/ataques

---

## ✅ QA e Validação

### Checklist de Teste (Produção)

- [ ] `studioos.pro` abre LP StudioOS
- [ ] `studioos.pro/cadastro-fornecedor` abre CadastroFornecedor (público)
- [ ] `fornecedores.studioos.pro` abre SupplierPortal (requer auth)
- [ ] `fornecedores.studioos.pro/cadastro` abre CadastroFornecedor (público, não capturado pelo portal)
- [ ] `admin.studioos.pro` abre AdminRoute (requer auth + role admin)
- [ ] `panel.studioos.pro` redireciona para `admin.studioos.pro`
- [ ] `app.studioos.pro` abre app (fallback)
- [ ] `{slug}-app.studioos.pro` resolve `organizationSlug` corretamente
- [ ] Login como supplier redireciona para `fornecedores.studioos.pro`
- [ ] Login como admin redireciona para `admin.studioos.pro`
- [ ] Login como org user redireciona para app da org (custom ou `{slug}-app`)
- [ ] Não existem loops de redirect

### Checklist de Teste (Dev/Preview)

- [ ] `localhost:3000/fornecedores` abre SupplierPortal
- [ ] `localhost:3000/fornecedores/cadastro` abre CadastroFornecedor (público)
- [ ] `localhost:3000/gerenciarusuarios` abre AdminRoute (requer auth + role admin)
- [ ] `localhost:3000/gerarorcamento` abre app (requer auth)
- [ ] `localhost:3000/cadastro-fornecedor` abre CadastroFornecedor (público)
- [ ] Login como supplier redireciona para `/fornecedores`
- [ ] Login como admin redireciona para `/gerenciarusuarios`
- [ ] Login como org user redireciona para `/gerarorcamento`
- [ ] Preview Vercel (`*.vercel.app`) funciona igual a localhost

### Casos de Borda

- [ ] Usuário sem role definido → fallback para `app.studioos.pro`
- [ ] Usuário com múltiplas organizações → usa primeira encontrada
- [ ] Organização sem domínio custom → usa `{slug}-app.studioos.pro`
- [ ] Slug reservado (`studioos`) → não permite `studioos-app.studioos.pro`
- [ ] Domínio não configurado em produção → mostra erro amigável

---

## 🔒 Segurança

### RLS (Row-Level Security)

- `domains`: Policy pública para SELECT (MVP). Futuro: RPC `resolve_domain()` com SECURITY DEFINER.
- `supplier_users`: Apenas supplier vê seus próprios registros.
- `user_roles`: Apenas admin vê todos os roles.
- `organization_members`: Apenas membros veem membros da mesma organização.

### ⚠️ Validação de Wildcard `*.studioos.pro`

**IMPORTANTE:** O wildcard `*.studioos.pro` é **poderoso** e resolve **qualquer** subdomínio:

```
qualquercoisa.studioos.pro  ✅ Resolve
lixo.studioos.pro           ✅ Resolve
teste123.studioos.pro       ✅ Resolve
```

**Por isso é OBRIGATÓRIO que `domainResolver.ts`:**

1. ✅ **Valide padrão `{slug}-app`** via regex `/^([a-z0-9-]+)-app\.studioos\.pro$/`
2. ✅ **Bloqueie slugs reservados** (ex: `studioos-app.studioos.pro` não é permitido)
3. ✅ **Mostre "Domínio não configurado"** para subdomínios que não seguem padrões conhecidos

**Validações Implementadas:**
- ✅ Regex valida formato `{slug}-app.studioos.pro`
- ✅ Verifica se slug não é reservado (`studioos`)
- ✅ Busca organização no banco antes de aceitar
- ✅ Fallback para "Domínio não configurado" se não encontrar

**⚠️ NUNCA relaxar essas validações.** Qualquer subdomínio inválido deve ser bloqueado.

### ⚠️ Admin Domain — Zona Sensível

**Domínio Canônico:** `admin.studioos.pro`  
**Domínio Legacy:** `panel.studioos.pro` (redireciona para canônico)

**Proteções Atuais (MVP):**
- ✅ `AdminRoute` component verifica role via `user_roles`
- ✅ RLS no banco garante isolamento de dados
- ✅ Client-side redirect de `panel` → `admin`

**🔜 Proteções Futuras Necessárias:**

Quando o sistema for público / com tráfego real:

1. **Edge Middleware:**
   - Verificação de role no edge (antes do app)
   - Rate limiting por IP
   - Bloqueio de bots/ataques

2. **Double-check Server-side:**
   - Validar role em todas as queries críticas
   - RPC functions com SECURITY DEFINER

3. **IP Allowlist (Opcional):**
   - Restringir acesso admin a IPs conhecidos
   - Útil para ambientes corporativos

**📌 Status Atual:** Proteções MVP são suficientes. Migrar para Edge Middleware quando escalar.

### ⚠️ Redirect `panel` → `admin` — Estratégia MVP vs SEO

**MVP / Agora:**
- ✅ Client-side redirect (`window.location.replace()`) = **OK**
- ✅ Funcional para uso interno
- ⚠️ Pode resultar em 302/307 (não ideal para SEO)

**🔜 Quando for público / SEO / tráfego real:**
- 🔄 Configurar **301 permanente** no nível da Vercel:
  - Via UI: Settings → Domains → Redirects
  - Via `vercel.json`: `redirects` com `permanent: true`
  - Via Edge Middleware: redirect otimizado

**📌 Recomendação:** Deixar como issue marcada como "SEO / Infra", não como bug. Priorizar quando houver tráfego público significativo.

### Hardening Futuro

1. **Edge Middleware:**
   - Resolução de domínio no edge (cache + rate limit)
   - Retornar apenas `role` + `organizationSlug` (sem `organization_id`)
   - Proteção adicional para admin domain

2. **RPC `resolve_domain(hostname)`:**
   - SECURITY DEFINER
   - Rate limiting
   - Cache no edge
   - Validação rigorosa de padrões

3. **Validação de domínio custom:**
   - Verificar ownership via DNS TXT record
   - Validar SSL antes de ativar
   - Rate limiting por organização

---

## 📝 Notas de Implementação

### Ordem de Matching no `App.tsx`

**Ordem real baseada no código atual:**

1. **Loading** enquanto resolve domínio
2. **Supplier Portal** (`isSupplier` || `isSupplierRoute`)
   - ⚠️ **IMPORTANTE:** Verificado ANTES das rotas públicas para evitar conflito
   - Exceção: `/fornecedores/cadastro` NÃO é capturado pelo portal (rota pública)
3. **Admin StudioOS** (`isAdmin`)
4. **App do Cliente** (`isApp`) - fallback comercial
5. **Marketing StudioOS** (`isMarketing` && `organizationSlug === 'studioos'`)
6. **Marketing com Organização Cliente** (`isMarketing` && `organizationSlug`)
7. **Rotas Públicas** (`isPublicRoute`)
   - `/cadastro-fornecedor`
   - `/fornecedores/cadastro`
8. **Marketing StudioOS sem pathname específico** (permite rotas públicas também)
9. **Dev Fallbacks** (apenas em desenvolvimento/preview)

### Evitar Loops de Redirect

- Verificar `hostname` atual antes de redirecionar
- Em dev/preview, usar `navigate()` (same-origin)
- Em produção, usar `window.location.assign()` apenas se mudar domínio

### Slug Reservado

- `studioos` é reservado para organização interna
- Não permitir `studioos-app.studioos.pro`
- Validação em `domainResolver.ts` e `resolveSubdomainFallback()`

---

## 🚀 Próximos Passos

### Prioridade Alta (Escala / Segurança)
1. **Edge Middleware:** Migrar resolução de domínio para Vercel Edge
   - Proteção adicional para admin domain
   - Rate limiting e bloqueio de bots
   - Cache otimizado

2. **Redirect 301:** Configurar `panel.studioos.pro` → `admin.studioos.pro` como 301 permanente
   - Quando houver tráfego público significativo
   - Issue: "SEO / Infra"

### Prioridade Média (Funcionalidades)
3. **Admin Panel:** Implementar UI de aprovação de fornecedores
4. **Domínios Custom:** Implementar validação de ownership via DNS
5. **Analytics:** Rastrear uso de domínios por organização
6. **Documentação Cliente:** Guia de configuração de DNS para clientes

---

## ❓ FAQ

### 1. Por que o wildcard não funciona para `*-app.studioos.pro`?
DNS não suporta wildcards parciais. O único padrão válido é `*.studioos.pro` (todos os subdomínios). O suporte a `{slug}-app.studioos.pro` acontece via wildcard `*.studioos.pro` + lógica no código que detecta o padrão.

### 2. `panel.studioos.pro` redireciona com 301 ou 302?
**MVP Atual:** Client-side redirect (`window.location.replace()`) - pode resultar em 302/307.
**Produção/SEO:** Para 301 real, configurar via Vercel Redirects (UI) ou `vercel.json`.

### 3. Por que aparece "Domínio não configurado"?
Em **produção**, se o domínio não estiver listado nos Project Domains da Vercel ou não tiver resolução DNS válida, o sistema mostra este erro. 

**Especificamente para wildcard `*.studioos.pro`:**
- Subdomínios que **não seguem padrões conhecidos** (ex: `lixo.studioos.pro`, `teste123.studioos.pro`) são bloqueados
- Apenas padrões válidos são aceitos:
  - `{slug}-app.studioos.pro` (com slug válido e organização existente)
  - Domínios explícitos configurados (`admin`, `fornecedores`, etc.)
- Em **dev/preview**, rotas como `/studioos` funcionam como fallback

### 4. Como funciona o `*.studioos.pro`?
O wildcard permite que **qualquer** subdomínio (ex: `teste.studioos.pro`, `abc-app.studioos.pro`) seja resolvido pelo mesmo projeto. A lógica no `domainResolver.ts` analisa o hostname e decide o comportamento (marketing, app, etc.).

### 5. Posso usar domínio custom para cliente sem configurar na Vercel?
**Não.** Domínios custom (`app.cliente.com`) devem ser adicionados manualmente nos Project Domains da Vercel. Futuramente, isso pode ser automatizado via Edge Middleware.

---

**Última atualização:** 2026-01-23  
**Versão:** 1.1.0  
**Status:** ✅ Implementado (MVP) | Vercel Nameservers Ativo
