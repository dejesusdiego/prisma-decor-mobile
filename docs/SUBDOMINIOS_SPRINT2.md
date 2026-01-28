# 🚀 Sprint 2: Sistema de Subdomínios Personalizados

## Visão Geral

Este documento descreve o sistema de subdomínios implementado no Sprint 2, permitindo que cada organização tenha seu próprio subdomínio personalizado para landing page.

## Padrão de Subdomínios

### Landing Pages
```
{slug}.studioos.com.br    → Landing page da organização
{slug}.studioos.pro       → Landing page da organização
```

**Exemplos:**
- `prisma-decor.studioos.com.br` → Landing page da Prisma Decor
- `acme-cortinas.studioos.com.br` → Landing page da Acme Cortinas

### Apps (Sistema)
```
{slug}-app.studioos.com.br    → Sistema ERP da organização
{slug}-app.studioos.pro       → Sistema ERP da organização
```

**Exemplos:**
- `prisma-decor-app.studioos.com.br` → Sistema da Prisma Decor

### Domínios da Plataforma
```
studioos.pro / studioos.com.br          → Landing page StudioOS (SaaS)
admin.studioos.pro / admin.studioos.com.br    → Painel administrativo
panel.studioos.pro / panel.studioos.com.br    → Redireciona para admin
fornecedores.studioos.pro / fornecedores.studioos.com.br  → Portal fornecedores
app.studioos.pro / app.studioos.com.br        → Gateway de login
```

## Slugs Reservados

Os seguintes slugs não podem ser usados por organizações:

```
admin, panel, fornecedores, fornecedor, app, api, www, mail, ftp, studioos,
studio, os, login, auth, logout, register, signup, dashboard, settings, config,
graphql, rest, webhook, cdn, static, assets, images, files, docs, documentation,
help, support, contact, about, blog, news, store, shop, payment, payments, billing,
invoice, invoices, subscription, plan, plans, pricing, trial, demo, test, testing,
staging, dev, development, local, localhost
```

## Arquivos Modificados/Criados

### 1. [`vercel.json`](vercel.json:1)
Configuração para suporte a wildcard domains e redirects:
- Redireciona `panel` → `admin`
- Redireciona `www` → non-www
- Rewrites para SPA

### 2. [`src/lib/domainResolver.ts`](src/lib/domainResolver.ts:1)
Resolve domínios para informações de roteamento:
- Suporte a `{slug}.studioos.com.br`
- Cache de resoluções (5 minutos)
- Fallback para desenvolvimento

### 3. [`src/middleware/domainMiddleware.ts`](src/middleware/domainMiddleware.ts:1)
Middleware de resolução de domínios:
- Validação de slugs
- Geração de sugestões
- Funções utilitárias

### 4. [`src/App.tsx`](src/App.tsx:170)
Roteamento por subdomínio:
- Detecta `{slug}.studioos.com.br`
- Renderiza landing page da organização

### 5. [`supabase/migrations/20260128000000_setup_studioos_com_br.sql`](supabase/migrations/20260128000000_setup_studioos_com_br.sql:1)
Migration com:
- Configuração dos domínios `.com.br`
- Função `resolve_domain()` para backend
- Índices de performance

## Configuração no Vercel

### 1. Wildcard Domain
Para suportar `*.studioos.com.br`, configure no Vercel:

```bash
# Adicionar domínio wildcard
vercel domains add *.studioos.com.br

# Ou via dashboard:
# Project Settings → Domains → Add Domain → *.studioos.com.br
```

### 2. DNS Configuration
No provedor de DNS (Registro.br, Cloudflare, etc):

```
# Registro A para o domínio principal
studioos.com.br    A     76.76.21.21

# Registro CNAME wildcard para subdomínios
*.studioos.com.br  CNAME cname.vercel-dns.com.
```

> **Nota:** O Vercel automaticamente provisiona SSL para todos os subdomínios.

## Testando Localmente

### 1. Usando hosts file
Edite `/etc/hosts` (Linux/Mac) ou `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1  prisma-decor.studioos.local
127.0.0.1  admin.studioos.local
127.0.0.1  studioos.local
```

### 2. Usando ngrok
```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar túnel
ngrok http 5173

# Usar a URL HTTPS fornecida
# Ex: https://abc123.ngrok-free.app
```

### 3. Preview Deployments
Cada PR no Vercel gera uma URL de preview que pode ser usada para testar.

## Implementação Técnica

### Fluxo de Resolução

1. **Entrada na Aplicação**
   ```
   Usuário acessa: prisma-decor.studioos.com.br
   ```

2. **Detecção no App.tsx**
   ```typescript
   const studioosSubdomainMatch = currentHostname.match(/^([a-z0-9-]+)\.studioos\.(com\.br|pro)$/);
   ```

3. **Verificação de Slug Reservado**
   ```typescript
   const reservedSlugs = ['admin', 'panel', ...];
   if (!reservedSlugs.includes(orgSlug)) {
     return <LandingPageOrganizacao slug={orgSlug} />;
   }
   ```

4. **Carregamento de Dados**
   - [`useLandingPageData`](src/hooks/useLandingPageData.ts:1) busca dados da organização
   - [`LandingPageOrganizacao`](src/pages/LandingPageOrganizacao.tsx:1) renderiza a página

### Cache de Domínios

O sistema implementa cache em memória para melhorar performance:

```typescript
const domainCache = new Map<string, { data: DomainInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
```

Para limpar o cache:
```typescript
import { clearDomainCache } from '@/lib/domainResolver';
clearDomainCache();
```

## Segurança

### Validações Implementadas

1. **Slug válido**: Apenas letras minúsculas, números e hífens
2. **Tamanho mínimo**: 3 caracteres
3. **Tamanho máximo**: 63 caracteres (limite DNS)
4. **Slugs reservados**: Lista de slugs protegidos
5. **Organização ativa**: Apenas organizações `active=true`

### Hardening Recomendado (Pós-MVP)

- [ ] Rate limiting no Edge
- [ ] Cache no Edge (Vercel Edge Config)
- [ ] Validação de DNS (evitar subdomain takeover)
- [ ] Logging de acessos
- [ ] Monitoramento de domínios suspeitos

## Troubleshooting

### Subdomínio não resolve

1. Verifique DNS:
   ```bash
   nslookup prisma-decor.studioos.com.br
   ```

2. Verifique SSL:
   ```bash
   curl -I https://prisma-decor.studioos.com.br
   ```

3. Verifique no Vercel:
   - Domínio adicionado ao projeto
   - Configuração de wildcard correta

### Landing page não carrega

1. Verifique se o slug existe:
   ```sql
   SELECT slug, active FROM organizations WHERE slug = 'prisma-decor';
   ```

2. Verifique se `lp_enabled` está true:
   ```sql
   SELECT lp_enabled FROM organizations WHERE slug = 'prisma-decor';
   ```

3. Verifique console do navegador por erros

### Cache desatualizado

Limpe o cache:
```typescript
import { clearDomainCache } from '@/lib/domainResolver';
clearDomainCache();
```

Ou recarregue a página com:
```
Ctrl+Shift+R (hard refresh)
```

## Próximos Passos

- [ ] Configurar Vercel Edge Middleware para resolução mais rápida
- [ ] Implementar cache distribuído (Redis/Upstash)
- [ ] Criar painel de administração de domínios
- [ ] Suporte a domínios personalizados (ex: empresa.com.br)
- [ ] Analytics por subdomínio

## Referências

- [Vercel Wildcard Domains](https://vercel.com/docs/concepts/projects/custom-domains#wildcard-domains)
- [Estrutura de Domínios V3](ESTRUTURA_DOMINIOS_V3_FINAL.md)
- [Documentação de Segurança](SEGURANCA_DOMINIOS.md)
