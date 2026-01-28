# PR: DOMÍNIOS + ROTAS + REDIRECTS POR ROLE (Vercel-first)

## 📋 Resumo

Este PR implementa o contrato oficial de domínios e roteamento do StudioOS, alinhando o código com a arquitetura Vercel-first e implementando redirecionamento automático pós-login baseado em role.

## ✅ O que mudou

### 1. `src/lib/domainResolver.ts`

- ✅ **Detecção de `{slug}-app.studioos.pro`**: Adicionada lógica para detectar e resolver subdomínios organizacionais antes de consultar o banco
- ✅ **Canonical admin domain**: `panel.studioos.pro` agora redireciona automaticamente para `admin.studioos.pro` (domínio canônico)
- ✅ **Validação de slug reservado**: Impede uso de `studioos-app.studioos.pro` (slug reservado)
- ✅ **Fallback melhorado**: `resolveSubdomainFallback()` agora suporta `{slug}-app.studioos.pro`

### 2. `src/hooks/useAuth.tsx`

- ✅ **Função `redirectAfterLogin()`**: Implementada lógica completa de redirecionamento pós-login
  - **Supplier** → `fornecedores.studioos.pro` (prod) ou `/fornecedores` (dev)
  - **Platform Admin** → `admin.studioos.pro` (prod) ou `/gerenciarusuarios` (dev)
  - **Organization User** → Prioridade:
    1. Domínio custom (`app.{slug}.com`) se existir
    2. Subdomínio StudioOS (`{slug}-app.studioos.pro`)
    3. Fallback (`app.studioos.pro`)
- ✅ **Evita loops**: Verifica `hostname` atual antes de redirecionar
- ✅ **Suporte a dev/preview**: Usa `navigate()` para same-origin, `window.location.assign()` apenas para mudança de domínio

### 3. `src/App.tsx`

- ✅ **Comentários atualizados**: Referências a `panel.studioos.pro` atualizadas para `admin.studioos.pro` (canônico)
- ✅ **Ordem de matching mantida**: Prioridade correta preservada (rotas públicas → supplier → admin → app → marketing → dev fallbacks)

### 4. `src/hooks/useDomainRouting.ts`

- ✅ **Comentários atualizados**: Documentação reflete novo padrão de domínios

### 5. `docs/DOMINIOS_E_ROTAS.md` (NOVO)

- ✅ **Documentação completa**: Contrato oficial de domínios, regras de redirecionamento, configuração Vercel, checklist QA

### 6. `vercel.json`

- ✅ **Sem mudanças necessárias**: Configuração atual já suporta o novo padrão

## 🧪 O que testar

### Produção

- [ ] `studioos.pro` abre LP StudioOS
- [ ] `studioos.pro/cadastro-fornecedor` abre CadastroFornecedor (público)
- [ ] `fornecedores.studioos.pro` abre SupplierPortal (requer auth)
- [ ] `fornecedores.studioos.pro/cadastro` abre CadastroFornecedor (público, não capturado pelo portal)
- [ ] `admin.studioos.pro` abre AdminRoute (requer auth + role admin)
- [ ] `panel.studioos.pro` redireciona 301 para `admin.studioos.pro`
- [ ] `app.studioos.pro` abre app (fallback)
- [ ] `{slug}-app.studioos.pro` resolve `organizationSlug` corretamente
- [ ] Login como supplier redireciona para `fornecedores.studioos.pro`
- [ ] Login como admin redireciona para `admin.studioos.pro`
- [ ] Login como org user redireciona para app da org (custom ou `{slug}-app`)
- [ ] Não existem loops de redirect

### Dev/Preview

- [ ] `localhost:3000/fornecedores` abre SupplierPortal
- [ ] `localhost:3000/fornecedores/cadastro` abre CadastroFornecedor (público)
- [ ] `localhost:3000/gerenciarusuarios` abre AdminRoute (requer auth + role admin)
- [ ] `localhost:3000/gerarorcamento` abre app (requer auth)
- [ ] `localhost:3000/cadastro-fornecedor` abre CadastroFornecedor (público)
- [ ] Login como supplier redireciona para `/fornecedores`
- [ ] Login como admin redireciona para `/gerenciarusuarios`
- [ ] Login como org user redireciona para `/gerarorcamento`
- [ ] Preview Vercel (`*.vercel.app`) funciona igual a localhost

## ⚠️ Riscos

### Baixo Risco

1. **Redirecionamento de `panel.studioos.pro`**: Se algum usuário estiver usando `panel.studioos.pro` diretamente, será redirecionado para `admin.studioos.pro`. Isso é intencional e desejado.

2. **Novo padrão `{slug}-app.studioos.pro`**: Clientes existentes que não têm domínio custom serão redirecionados para este novo padrão. Isso é esperado e melhora a organização.

### Mitigações

- ✅ Verificação de `hostname` atual antes de redirecionar (evita loops)
- ✅ Fallback para `app.studioos.pro` se nenhum domínio específico for encontrado
- ✅ Suporte completo a dev/preview (paths) para não quebrar desenvolvimento

## 📝 Notas Técnicas

### Ordem de Resolução de Domínio

1. **Canonical redirect** (`panel` → `admin`)
2. **Detecção de `{slug}-app.studioos.pro`** (antes de consultar banco)
3. **Consulta ao banco** (`domains` table)
4. **Fallback** (`resolveSubdomainFallback`)

### Prioridade de Redirecionamento (Organization User)

1. Domínio custom (`app.{slug}.com`) - se existir no banco
2. Subdomínio StudioOS (`{slug}-app.studioos.pro`)
3. Fallback comercial (`app.studioos.pro`)

### Ambiente Detection

- **Produção**: `window.location.assign()` para mudança de domínio
- **Dev/Preview**: `navigate()` para same-origin paths

## 🚀 Próximos Passos (Futuro)

1. **Edge Middleware**: Migrar resolução de domínio para Vercel Edge (performance + cache)
2. **RPC `resolve_domain()`**: Hardening de segurança (SECURITY DEFINER, rate limit)
3. **Validação de domínio custom**: Verificar ownership via DNS TXT record
4. **Admin Panel**: UI para gerenciar domínios de clientes

---

**Status:** ✅ Pronto para merge  
**Breaking Changes:** Nenhum (compatível com código existente)  
**Dependências:** Nenhuma nova dependência
