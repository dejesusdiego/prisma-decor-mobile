# Checklist QA — Contrato de Domínios/Rotas em Produção

## 🎯 Objetivo

Validar que o contrato de domínios/rotas está funcionando corretamente em produção após deploy.

## ✅ Checklist de Teste

### 1. Domínios Principais (Produção)

#### StudioOS Marketing
- [ ] `https://studioos.pro/` → Landing page StudioOS
- [ ] `https://studioos.pro/cadastro-fornecedor` → Cadastro público de fornecedor
- [ ] Refresh direto em `https://studioos.pro/cadastro-fornecedor` → não dá 404

#### Gateway de Autenticação
- [ ] `https://app.studioos.pro/login` → Tela de login (gateway)
- [ ] `https://app.studioos.pro/auth` → Tela de login (gateway, canônico)
- [ ] `https://app.studioos.pro/` → Redireciona para `/login` ou mostra login
- [ ] Usuário não autenticado em `app.studioos.pro/login` → mostra login
- [ ] Usuário autenticado em `app.studioos.pro/login` → redireciona automaticamente

#### Admin
- [ ] `https://admin.studioos.pro/` → Admin (requer auth + role admin)
- [ ] `https://admin.studioos.pro/gerenciarusuarios` → Admin (requer auth + role admin)
- [ ] Refresh direto em `https://admin.studioos.pro/gerenciarusuarios` → não dá 404
- [ ] Usuário sem role admin → bloqueado ou redirecionado

#### Redirect Legacy
- [ ] `https://panel.studioos.pro/` → Redireciona 301 para `admin.studioos.pro`
- [ ] `https://panel.studioos.pro/gerenciarusuarios` → Redireciona 301 para `admin.studioos.pro/gerenciarusuarios`
- [ ] Verificar código HTTP: deve ser 301 (permanente)

#### Supplier Portal
- [ ] `https://fornecedores.studioos.pro/` → Supplier Portal (requer auth)
- [ ] `https://fornecedores.studioos.pro/dashboard` → Dashboard (se suportado)
- [ ] `https://fornecedores.studioos.pro/catalogo` → Catálogo (se suportado)
- [ ] Usuário não autenticado → mostra tela de login
- [ ] Usuário não supplier → bloqueado ou redirecionado

#### App da Organização
- [ ] `https://{slug}-app.studioos.pro/` → App da organização (requer auth)
- [ ] `https://{slug}-app.studioos.pro/gerarorcamento` → App protegido
- [ ] `https://{slug}-app.studioos.pro/configuracoes/organizacao` → Configurações
- [ ] Refresh direto em rotas internas → não dá 404
- [ ] Usuário não autenticado → redireciona para login

### 2. Redirects por Role (Após Login)

#### Supplier
- [ ] Login como supplier em `app.studioos.pro/login` → redireciona para `fornecedores.studioos.pro`
- [ ] Login como supplier em qualquer domínio → redireciona para `fornecedores.studioos.pro`
- [ ] Supplier já em `fornecedores.studioos.pro` → não redireciona (sem loop)

#### Platform Admin
- [ ] Login como admin em `app.studioos.pro/login` → redireciona para `admin.studioos.pro`
- [ ] Login como admin em qualquer domínio → redireciona para `admin.studioos.pro`
- [ ] Admin já em `admin.studioos.pro` → não redireciona (sem loop)

#### Organization User
- [ ] Login como org user em `app.studioos.pro/login` → redireciona para `{slug}-app.studioos.pro`
- [ ] Login como org user com domínio custom → redireciona para `app.{slug}.com`
- [ ] Org user já no domínio correto → não redireciona (sem loop)

#### Fallback
- [ ] Usuário sem role definido → redireciona para `app.studioos.pro/gerarorcamento` ou fallback

### 3. Rotas Públicas

- [ ] `/cadastro-fornecedor` funciona em qualquer domínio
- [ ] `/fornecedores/cadastro` funciona em qualquer domínio
- [ ] Rotas públicas não requerem autenticação
- [ ] Rotas públicas não são capturadas por supplier portal

### 4. SPA (Single Page Application)

#### Refresh Direto
- [ ] `https://{dominio}/gerarorcamento` → não dá 404 (serve index.html)
- [ ] `https://admin.studioos.pro/gerenciarusuarios` → não dá 404
- [ ] `https://{slug}-app.studioos.pro/configuracoes/organizacao` → não dá 404

#### Navegação Interna
- [ ] Navegação entre rotas funciona sem reload completo
- [ ] Histórico do browser funciona (voltar/avançar)
- [ ] URLs são atualizadas corretamente

### 5. Casos de Borda

- [ ] Domínio não configurado → mostra "Domínio não configurado"
- [ ] Subdomínio inválido (ex: `lixo.studioos.pro`) → mostra "Domínio não configurado"
- [ ] Slug reservado (`studioos-app.studioos.pro`) → bloqueado
- [ ] Usuário com múltiplas organizações → usa primeira encontrada
- [ ] Usuário sem organização → fallback para `app.studioos.pro`

### 6. Segurança

- [ ] Admin domain requer role `admin`
- [ ] Supplier portal requer registro em `supplier_users`
- [ ] App da organização requer `organization_members`
- [ ] Rotas protegidas redirecionam para login se não autenticado
- [ ] RLS no banco funciona corretamente

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 📊 Resultados Esperados

### ✅ Sucesso
- Todos os domínios abrem o app correto
- Redirects funcionam sem loops
- Rotas internas funcionam com refresh direto
- SPA rewrites funcionam corretamente

### ❌ Falha
- Domínio não abre app correto
- Loops de redirect
- 404 em rotas internas
- Rotas públicas quebradas

## 📝 Notas de Teste

**Ambiente:** Produção  
**Data:** [DATA DO TESTE]  
**Testado por:** [NOME]  
**Resultado:** ✅ Passou / ❌ Falhou

---

**Última atualização:** 2026-01-23
