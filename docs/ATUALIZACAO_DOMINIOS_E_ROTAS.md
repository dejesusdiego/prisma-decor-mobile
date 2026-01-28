# Atualização: docs/DOMINIOS_E_ROTAS.md - Alinhado com Vercel Nameservers

## 📋 Resumo das Correções

O documento `docs/DOMINIOS_E_ROTAS.md` foi **completamente atualizado** para refletir o cenário real atual onde `studioos.pro` usa **Vercel Nameservers (Vercel DNS)** e todos os domínios estão configurados.

## ✅ Correções Implementadas

### 1. Seção "Configuração na Vercel" Reformulada

**ANTES:** Instruções genéricas com CNAME manual.
**DEPOIS:** Dois modos claramente separados:

#### Modo 1 — DNS na Vercel (Nameservers) ⭐ ATUAL
- ✅ Explicado que é o modo atual em uso
- ✅ Checklist operacional: o que deve existir no Project Domains
- ✅ Esclarecido que DNS Records são gerenciados automaticamente (NÃO configurar manualmente)
- ✅ SSL automático para todos os domínios
- ✅ Lista completa dos domínios ativos:
  - `studioos.pro`, `www.studioos.pro`, `app.studioos.pro`
  - `admin.studioos.pro`, `panel.studioos.pro`, `fornecedores.studioos.pro`
  - `*.studioos.pro`

#### Modo 2 — DNS Externo (Cloudflare/RegistroBR)
- ✅ Para clientes que querem DNS no provedor atual
- ✅ Exemplos de registros A/CNAME com avisos sobre variação
- ✅ Source of truth: painel da Vercel

### 2. Wildcard e Subdomínios de Organizações Corrigidos

**ANTES:** Menção incorreta a `*-app.studioos.pro`.
**DEPOIS:**
- ✅ **Removido** qualquer sugestão de `*-app.studioos.pro` (não é suportado em DNS)
- ✅ **Explicado corretamente**: `{slug}-app.studioos.pro` é suportado via `*.studioos.pro` + lógica no código
- ✅ **Seção FAQ**: "Por que não `*-app.studioos.pro`?" - explicação simples
- ✅ **Regex documentada**: `/^([a-z0-9-]+)-app\.studioos\.pro$/`

### 3. Redirects "panel → admin" Esclarecidos

**ANTES:** Afirmava "301" sem precisão.
**DEPOIS:**
- ✅ **MVP Atual**: Client-side redirect (`window.location.replace()`) - pode resultar em 302/307
- ✅ **Produção/SEO**: Para 301 real, configurar via Vercel Redirects (UI) ou `vercel.json`
- ✅ **Exemplo** de configuração `vercel.json` para 301 opcional
- ✅ **Seção FAQ**: "301 ou 302?" com explicação técnica

### 4. Ordem de Matching Real do `App.tsx`

**ANTES:** Lista incorreta com "rotas públicas" como prioridade 1.
**DEPOIS:** Ordem exata baseada no código atual:
1. Loading enquanto resolve domínio
2. **Supplier Portal** (com exceção `/fornecedores/cadastro`)
3. **Admin StudioOS**
4. **App do Cliente**
5. **Marketing StudioOS**
6. **Marketing com Organização Cliente**
7. **Rotas Públicas** (`/cadastro-fornecedor`, `/fornecedores/cadastro`)
8. **Marketing StudioOS sem pathname específico**
9. **Dev Fallbacks**

✅ **IMPORTANTE**: Documentado que `/fornecedores/cadastro` NÃO é capturado pelo supplier portal (rota pública).

### 5. Detalhes de Consistência Ajustados

- ✅ **Principais rotas** corrigidas: `app.studioos.pro` serve `/` (app protegido), não apenas `/gerarorcamento`
- ✅ **Última atualização**: 2026-01-23 (hoje)
- ✅ **Versão**: 1.1.0 (atualizada)
- ✅ **Status**: Vercel Nameservers Ativo
- ✅ **Removidas** referências desnecessárias a `cname.vercel-dns.com` no modo Nameservers

### 6. FAQ Adicionada (5 Perguntas Comuns)

1. **Por que o wildcard não funciona para `*-app.studioos.pro`?**
2. **`panel.studioos.pro` redireciona com 301 ou 302?**
3. **Por que aparece "Domínio não configurado"?**
4. **Como funciona o `*.studioos.pro`?**
5. **Posso usar domínio custom para cliente sem configurar na Vercel?**

## 🎯 Cenário Real Documentado

### Vercel Project Domains (Ativo)
```
studioos.pro          ✅ Active
www.studioos.pro      ✅ Active
app.studioos.pro      ✅ Active
admin.studioos.pro    ✅ Active
panel.studioos.pro    ✅ Active
fornecedores.studioos.pro ✅ Active
*.studioos.pro        ✅ Active (Wildcard)
```

### DNS Records (Gerenciado Automaticamente pela Vercel)
- **ALIAS** para apex (`studioos.pro`)
- **CNAME** para subdomínios (automático)
- **SSL** para todos os domínios (automático)
- **Wildcard** resolve qualquer `*.studioos.pro`

## 🚨 Principais Esclarecimentos para Evitar Erros

### ❌ NÃO FAZER (Mitos Desmentidos)
1. **NÃO** tentar configurar `*-app.studioos.pro` no DNS (não existe)
2. **NÃO** configurar CNAME manual quando usando Vercel Nameservers
3. **NÃO** esperar 301 real de redirects client-side
4. **NÃO** assumir que rotas públicas têm prioridade máxima no matching

### ✅ FAZER (Realidade Atual)
1. **SIM** usar `*.studioos.pro` + lógica no código para suporte a `{slug}-app`
2. **SIM** confiar na gestão automática de DNS da Vercel (modo Nameservers)
3. **SIM** entender que supplier portal é verificado ANTES de rotas públicas
4. **SIM** considerar redirect 301 via Vercel UI para SEO (opcional)

## 📊 Impacto

- **Desenvolvedores**: Documentação 100% precisa com o setup atual
- **DevOps**: Instruções claras para ambos os modos de DNS
- **Troubleshooting**: FAQ cobre erros comuns
- **Futuro**: Roadmap claro para Edge Middleware

## 🔍 Validação

- ✅ Ordem de matching conferida no código `src/App.tsx`
- ✅ Domínios ativos verificados contra lista fornecida
- ✅ Explicações técnicas validadas (wildcards DNS, redirects HTTP)
- ✅ Sem erros de lint ou markdown
- ✅ Linguagem objetiva e sem ambiguidades

---

**Status:** ✅ Documento atualizado e alinhado com realidade atual  
**Data:** 2026-01-23  
**Confiança:** 100% - Baseado em código real e setup ativo