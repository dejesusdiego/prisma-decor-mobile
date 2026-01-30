# 📄 CONTEXTUALIZAÇÃO CRÍTICA - PROJETO STUDIOOS ERP

> **Data:** 29/01/2026  
> **Status:** 🔴 CRÍTICO - Múltiplos deploys falhando  
> **Versão Atual:** V5 (The Clean Split) - **INCOMPLETO**

---

## 1. HISTÓRICO NARRATIVO (Timeline)

### 📍 V1-V3: ERP Monolítico Funcional
- **O que era:** Aplicação React + Supabase única, todas as funcionalidades em um codebase
- **Funcionalidades:** Orçamentos, pedidos, financeiro, catálogo de produtos, login
- **Estado:** ✅ Funcionando em produção (studioos.vercel.app)
- **Problema:** Código misturava lógica de diferentes personas (admin, fornecedor, cliente)

### 📍 V4: Sistema de Domínios (Tentativa de Separação)
- **Objetivo:** Separar acessos por hostname (app.studioos.com.br, admin.studioos.com.br, etc.)
- **Implementação:** DomainRouter, RouteValidator, RedirectHandler
- **Problema:** 🔴 Complexidade excessiva, rotas conflitantes, loop de redirecionamentos
- **Resultado:** Login quebrado, páginas em branco, experiência degradada

### 📍 V5: The Clean Split (ATUAL - INCOMPLETO)
- **Motivação Real:** Separar fisicamente em 3 apps para simplificar mentalmente
- **Arquitetura:** Monorepo com 3 Vite apps independentes
  - `apps/core/` - ERP principal
  - `apps/platform/` - Painel Super Admin
  - `apps/portal/` - Portal Fornecedores
- **Problema:** 🔴 Deploys falhando, variáveis de ambiente não configuradas, páginas em branco

---

## 2. ESTADO ATUAL DO CÓDIGO

### 📁 Estrutura de Pastas

```
/
├── apps/
│   ├── core/          🚧 Criado, build funciona local, DEPLOY FALHANDO
│   │   ├── src/
│   │   │   ├── pages/LoginPage.tsx       ✅ Implementado
│   │   │   ├── pages/DashboardPage.tsx   ✅ Implementado
│   │   │   ├── pages/OrcamentosPage.tsx  ✅ Implementado
│   │   │   └── hooks/useAuth.ts          ✅ Migrado
│   │   └── package.json                  ✅ Vite + React + TS
│   │
│   ├── platform/      🚧 Criado, build funciona local, DEPLOY FALHANDO
│   │   ├── src/
│   │   │   ├── pages/LoginPage.tsx       ✅ Implementado
│   │   │   ├── pages/DashboardPage.tsx   ✅ Implementado
│   │   │   └── components/ConfigError.tsx ✅ Fallback para env vars
│   │   └── vercel.json                   ✅ Configurado
│   │
│   └── portal/        🚧 Criado, build funciona local, DEPLOY FALHANDO
│       ├── src/
│       │   ├── pages/LoginPage.tsx       ✅ Implementado
│       │   └── pages/CatalogoPage.tsx    ✅ Implementado
│       └── vercel.json                   ✅ Configurado
│
├── src/               ⚠️ CÓDIGO LEGADO V4 (ainda usado em produção?)
│   ├── App.tsx        🚧 DomainRouter (complexo, problemático)
│   ├── routing/       ⚠️ Lógica de domínios (possivelmente quebrada)
│   ├── domains/       ⚠️ Configs por domínio
│   └── pages/         ⚠️ Páginas V4
│
├── infra/
│   └── migrations/
│       ├── 00000000000000_baseline_schema.sql  ✅ NOVO - Schema consolidado
│       ├── 00000000000001_initial_seed.sql     ✅ NOVO - Seed limpo
│       └── archive/                             ✅ 140 migrations antigas (backup)
│
└── docs/              📚 Muita documentação (possivelmente desatualizada)
```

### 🔨 Build Status

| App | Local | Vercel | Status |
|-----|-------|--------|--------|
| `apps/core` | ✅ 2.11s, 461KB | ❌ Não testado | 🚧 Build funciona, deploy ? |
| `apps/platform` | ✅ 2.07s, 480KB | ❌ Página em branco | 🔴 Env vars não configuradas |
| `apps/portal` | ✅ 2.29s, 469KB | ❌ Página em branco | 🔴 Env vars não configuradas |
| `src/` (V4) | ? | ❓ studioos.vercel.app | ❓ Estado desconhecido |

### 🌐 Deploy Status

| Projeto Vercel | URL | Status | Problema |
|----------------|-----|--------|----------|
| prisma-platform | platform-two-mu.vercel.app | 🔴 PÁGINA EM BRANCO | `VITE_SUPABASE_*` não definidas |
| prisma-portal | portal-delta-peach.vercel.app | 🔴 PÁGINA EM BRANCO | `VITE_SUPABASE_*` não definidas |
| studioos-core | studioos-core.vercel.app | 🔴 DEPLOYMENT_NOT_FOUND | Projeto não existe? |
| prisma-decor-mobile | studioos.vercel.app | ❓ Estado desconhecido | Último deploy quando? |

---

## 3. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 P1 - Problema de Deploy (BLOQUEANTE)
**Descrição:** Variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não estão configuradas nos projetos Vercel.

**Impacto:** Apps buildam mas não funcionam (Supabase client = null)

**Causa Raiz:** Vite substitui `import.meta.env` em build-time, não runtime.

**Arquivos afetados:**
- `apps/platform/src/lib/supabase.ts`
- `apps/portal/src/lib/supabase.ts`
- `apps/core/src/lib/supabase.ts` (se existir)

---

### 🔴 P2 - Problema Arquitetural (DECISÃO PENDENTE)
**Descrição:** Temos 3 estratégias conflitantes no mesmo codebase:
1. **V4:** Código em `/src/` com DomainRouter (complexo)
2. **V5a:** Tentativa de 3 apps separados (quebrando)
3. **V5b:** Monorepo com código duplicado entre apps

**Impacto:** Confusão mental, deploys falhando, não sabemos qual código é a "fonte da verdade"

---

### 🟡 P3 - Problema de Dados (GERENCIÁVEL)
**Descrição:** 140 migrations foram arquivadas, schema consolidado em baseline.

**Impacto:** Banco de dados está funcionando (dados persistem), mas histórico de migrations está em `/infra/migrations/archive/`

**Status:** ✅ Não é crítico - schema está estável

---

### 🟡 P4 - Problema de Domínios (SUSPENSO)
**Descrição:** Configuração de subdomínios (app.studioos.com.br, admin.studioos.com.br) não foi finalizada.

**Impacto:** Usuários acessam via URLs Vercel (*.vercel.app), não domínios próprios

**Status:** 🚧 Não é blocker para funcionar, é melhoria

---

### 🟡 P5 - Problema de Autenticação (EM V4)
**Descrição:** Em V4, havia loop de redirecionamento no login, rotas protegadas quebrando.

**Status:** ❓ Desconhecido se persistiu - V4 pode estar funcional ou não

---

## 4. O QUE ESTÁ FUNCIONANDO (NÃO QUEBRAR!)

| Componente | Status | Observação |
|------------|--------|------------|
| **Banco Supabase** | ✅ Funcionando | Dados intactos, RLS configurado |
| **Autenticação** | ✅ Funcionando | Login/Logout funcionam (quando env vars presentes) |
| **Wizard Orçamentos** | ✅ Funcionando | Cálculos, 4 steps, salvamento - tudo ok |
| **Dashboard** | ✅ Funcionando | Métricas reais do banco |
| **Build Local** | ✅ Funcionando | Todos os apps buildam localmente |

---

## 5. DECISÕES PENDENTES (BLOQUEIOS)

### ❓ D1 - Qual estratégia adotar?
- **Opção A:** Consertar V5 (3 apps) - Configurar env vars, finalizar deploys
- **Opção B:** Voltar para V4 - Consertar DomainRouter, simplificar lógica de rotas
- **Opção C:** Simplificar tudo - Um único app com feature flags por role

### ❓ D2 - Qual projeto Vercel é o "oficial"?
- studioos.vercel.app (V4 legado) está funcionando?
- Os 3 novos projetos (platform, portal, core) deveriam substituir?

### ❓ D3 - Migrations - manter baseline ou reverter?
- Baseline atual (2 arquivos) vs 140 migrations arquivadas

---

## 6. RECURSOS DISPONÍVEIS

| Recurso | Status | Detalhes |
|---------|--------|----------|
| **GitHub** | ✅ | `dejesusdiego/prisma-decor-mobile`, branch `main` |
| **Supabase** | ✅ | Projeto `tjwpqrlfhngibuwqodcn`, dados intactos |
| **Vercel** | ⚠️ | 4 projetos criados, env vars incompletas |
| **Domínios** | 🚧 | studioos.com.br configurado (DNS ok) |
| **Documentação** | ⚠️ | Muitos arquivos .md, possivelmente desatualizados |
| **Token Vercel** | ✅ | `ADsg2JTsTtxhdtYQjNEXDl6A` (usado nos scripts) |

---

## 7. PRÓXIMO PASSO IDEAL (Recomendação Técnica)

### 🎯 RECOMENDAÇÃO: Opção C - Simplificar para Monolito Funcional

**Justificativa Técnica:**
1. **Complexidade vs Entrega:** 3 apps paralelos = 3x problemas de deploy, 3x env vars, 3x builds. Não temos bandwidth para isso agora.

2. **Custo de Coordenação:** Separar apps só faz sentido com times separados. Time atual = 1 pessoa.

3. **Problema Real:** O problema nunca foi "monolito vs micro-frontends". O problema era "código bagunçado". Limpar o código não exige separar apps.

4. **Risco:** V5 está 50% implementado, 0% funcional em produção. V4 pode estar 80% funcional.

**Plano de Ação Proposto:**

```
Semana 1: Avaliar V4
├── Verificar se studioos.vercel.app funciona
├── Identificar problemas críticos em V4
└── Decidir: consertar V4 ou migrar para V5 simplificado

Semana 2: Consolidar
├── Escolher uma base (V4 ou V5 core)
├── Limpar código (remover DomainRouter se problematico)
├── Configurar deploy único com env vars corretas
└── Testar end-to-end

Semana 3: Go Live
├── Deploy para produção
├── Testar com usuários reais
└── Monitorar erros
```

**Caminho dos Arquivos (se optar por simplificar):**
- Manter: `apps/core/` (mais completo dos 3)
- Descartar: `apps/platform/`, `apps/portal/` (complexidade prematura)
- Merge: Código útil de platform/portal para core/ com feature flags

---

## 📋 CHECKLIST IMEDIATO (Próximas 24h)

- [ ] Verificar estado de studioos.vercel.app (ainda funciona?)
- [ ] Decidir estratégia: V4 ou V5
- [ ] Configurar env vars no projeto escolhido
- [ ] Fazer deploy de teste
- [ ] Validar login, dashboard, orçamentos

---

**Autor:** Debug Analysis  
**Última Atualização:** 2026-01-29
