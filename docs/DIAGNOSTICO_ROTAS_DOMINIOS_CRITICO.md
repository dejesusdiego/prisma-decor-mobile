# 🚨 DIAGNÓSTICO CRÍTICO: Sistema de Rotas e Domínios

**Data:** 2026-01-29  
**Status:** CRÍTICO - Múltiplos pontos de falha identificados

---

## 📸 Problemas Reportados

### 1. Página em branco em `admin.studioos.pro` após login
![Problema 1](../screenshots/admin-blank.png)

### 2. `studioos.pro/admin-supremo` redireciona para `/gerarorcamento` mostrando LP
![Problema 2](../screenshots/admin-supremo-redirect.png)

---

## 🔍 ANÁLISE RAIZ (Root Cause Analysis)

### Problema 1: Página em branco no domínio admin

**Cenário:**
1. Usuário acessa `admin.studioos.pro`
2. Faz login com credenciais de admin
3. Sistema redireciona para `/gerarorcamento` (via `redirectAfterLogin.ts:69`)
4. **FALHA:** Domínio `admin.studioos.pro` NÃO tem rota `/gerarorcamento` definida

**Código problemático:**
```typescript
// src/lib/redirectAfterLogin.ts:60-77
if (adminRole) {
  if (isProductionEnv) {
    if (hostname !== 'admin.studioos.pro' && hostname !== 'panel.studioos.pro') {
      window.location.assign('https://admin.studioos.pro');  // ✓ Correto
      return;
    }
  } else {
    // Dev/preview: usar path
    if (navigate) {
      navigate('/gerenciarusuarios');  // ✓ Correto para dev
    }
    return;
  }
  // Já está no domínio correto → NÃO faz nada! ✗ PROBLEMA
  return;
}
```

**O que acontece:**
- Quando já está em `admin.studioos.pro`, a função retorna sem redirecionar
- Mas o `AdminRoute` (linha 68) faz: `return <Navigate to="/gerarorcamento" replace />;`
- Isso redireciona para `/gerarorcamento` no domínio admin
- `App.tsx` não tem rota `/gerarorcamento` para domínio admin
- Resultado: **página em branco**

---

### Problema 2: Redirecionamento incorreto de `/admin-supremo`

**Cenário:**
1. Usuário acessa `studioos.pro/admin-supremo`
2. `isAdminSupremoPath = true` → entra no bloco admin
3. Componente renderiza `<AdminRoute><AdminSupremo /></AdminRoute>`
4. `AdminRoute` verifica role em `user_roles` (tabela antiga?)
5. Se não encontrar, redireciona para `/gerarorcamento`
6. `studioos.pro` é `isStudioOSDomain = true` → renderiza `LandingPageStudioOS`
7. URL fica: `studioos.pro/gerarorcamento` (LP em rota de app!)

**Código problemático:**
```typescript
// src/components/AdminRoute.tsx:67-69
if (!isAdmin) {
  return <Navigate to="/gerarorcamento" replace />;  // ✗ Sempre redireciona para app
}
```

**Problema arquitetural:**
- `AdminRoute` assume que usuários não-admin devem ir para app
- Mas em `studioos.pro`, não existe app - só existe LP

---

### Problema 3: Inconsistência de verificação de role

**Tabelas envolvidas:**
- `user_roles` (tabela legada?) - verificada por `AdminRoute`
- `organization_members` (tabela atual) - tem coluna `role` do tipo `user_role`

**Código em AdminRoute:**
```typescript
// src/components/AdminRoute.tsx:23-28
const { data, error } = await supabase
  .from('user_roles')  // ✗ Tabela antiga?
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .maybeSingle();
```

**Código em redirectAfterLogin:**
```typescript
// src/lib/redirectAfterLogin.ts:53-58
const { data: adminRole } = await supabase
  .from('user_roles')  // Mesma tabela
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .maybeSingle();
```

**Questão:** Qual a fonte da verdade para roles de admin?

---

### Problema 4: Domínio admin sem rotas de fallback

**Arquitetura esperada:**
```
admin.studioos.pro/          → GerenciarUsuarios ou AdminSupremo
admin.studioos.pro/admin-supremo  → AdminSupremo
admin.studioos.pro/*         → 404 ou redirect
```

**Arquitetura atual (quebrada):**
```typescript
// App.tsx:102-141
if (isAdmin || isAdminSupremoPath) {
  return (
    <Routes>
      <Route path="/admin-supremo" element={<AdminSupremo />} />
      <Route path="/gerenciarusuarios" element={<GerenciarUsuarios />} />
      <Route path="/" element={...} />
      <Route path="*" element={...} />  // ✗ Não cobre /gerarorcamento
    </Routes>
  );
}
```

---

### Problema 5: Redirecionamento pós-login não considera super_admin

**Código:**
```typescript
// redirectAfterLogin.ts apenas verifica 'admin' em user_roles
// Mas super_admin pode estar em organization_members.role
```

---

## 📋 MATRIZ DE ROTAS ESPERADAS vs IMPLEMENTADAS

| Domínio | Rota | Esperado | Implementado | Status |
|---------|------|----------|--------------|--------|
| `studioos.pro` | `/` | LandingPageStudioOS | ✓ | ✅ |
| `studioos.pro` | `/admin-supremo` | AdminSupremo | ✓ | ⚠️ Verificar permissões |
| `studioos.pro` | `/cadastro-fornecedor` | CadastroFornecedor | ✓ | ✅ |
| `admin.studioos.pro` | `/` | GerenciarUsuarios | ✓ | ✅ |
| `admin.studioos.pro` | `/admin-supremo` | AdminSupremo | ✓ | ✅ |
| `admin.studioos.pro` | `/gerarorcamento` | **NÃO EXISTE** | ✗ | ❌ **CAUSA PÁGINA EM BRANCO** |
| `app.studioos.pro` | `/` | LoginGateway | ✓ | ✅ |
| `app.studioos.pro` | `/gerarorcamento` | GerarOrcamento | ✓ | ✅ |
| `fornecedores.studioos.pro` | `/` | SupplierPortal | ✓ | ✅ |
| `{slug}.studioos.pro` | `/` | LandingPageOrganizacao | ✓ | ✅ |
| `{slug}-app.studioos.pro` | `/gerarorcamento` | GerarOrcamento | ✓ | ✅ |

---

## 🎯 CORREÇÕES NECESSÁRIAS

### Correção 1: AdminRoute não deve redirecionar para /gerarorcamento em domínios sem app

```typescript
// src/components/AdminRoute.tsx
if (!isAdmin) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAdminDomain = hostname.includes('admin') || hostname.includes('panel');
  
  if (isAdminDomain) {
    // Em domínio admin, não redirecionar para app
    return <Navigate to="/" replace />;
  }
  
  return <Navigate to="/gerarorcamento" replace />;
}
```

### Correção 2: redirectAfterLogin deve reconhecer quando já está no domínio correto

```typescript
// src/lib/redirectAfterLogin.ts
if (adminRole) {
  if (hostname === 'admin.studioos.pro' || hostname === 'panel.studioos.pro') {
    // Já está no domínio admin, verificar se está na rota correta
    const pathname = window.location.pathname;
    if (pathname === '/' || pathname === '/admin-supremo') {
      return; // Já está correto
    }
    // Redirecionar para home do admin
    window.location.assign('https://admin.studioos.pro/');
    return;
  }
  // ... resto do código
}
```

### Correção 3: Verificar organization_members.role para super_admin

```typescript
// Adicionar verificação de super_admin
const { data: superAdminRole } = await supabase
  .from('organization_members')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'super_admin')
  .maybeSingle();

const isPlatformAdmin = adminRole || superAdminRole;
```

### Correção 4: Adicionar catch-all no domínio admin

```typescript
// App.tsx - bloco do admin
<Route path="/gerarorcamento" element={<Navigate to="/" replace />} />
<Route path="*" element={<Navigate to="/" replace />} />
```

---

## 🧪 TESTES RECOMENDADOS

### Cenário 1: Login como admin em admin.studioos.pro
```
1. Acessar https://admin.studioos.pro
2. Fazer login com conta de admin
3. Esperado: Dashboard admin carrega
4. Atual: Página em branco ❌
```

### Cenário 2: Acesso a /admin-supremo em studioos.pro
```
1. Acessar https://studioos.pro/admin-supremo
2. Fazer login com super_admin
3. Esperado: Painel super admin carrega
4. Atual: Redireciona para /gerarorcamento mostrando LP ❌
```

### Cenário 3: Login em app.studioos.pro
```
1. Acessar https://app.studioos.pro
2. Fazer login
3. Esperado: Redireciona para gerarorcamento
4. Atual: ??? (não testado)
```

---

## 📊 SEVERIDADE

| Problema | Severidade | Impacto | Complexidade de Fix |
|----------|------------|---------|---------------------|
| Página em branco no admin | 🔴 CRÍTICO | Alto | Média |
| Redirecionamento incorreto /admin-supremo | 🔴 CRÍTICO | Alto | Média |
| Inconsistência de roles | 🟡 ALTO | Médio | Alta |
| Falta de rotas no admin | 🟡 ALTO | Médio | Baixa |

---

## 🚀 PLANO DE AÇÃO

### Fase 1: Hotfix imediato (1 hora)
1. [ ] Corrigir `AdminRoute.tsx` - não redirecionar para /gerarorcamento
2. [ ] Corrigir `redirectAfterLogin.ts` - tratar domínio admin corretamente
3. [ ] Adicionar catch-all em App.tsx para domínio admin
4. [ ] Deploy

### Fase 2: Consolidação de roles (2 horas)
1. [ ] Definir fonte da verdade para roles
2. [ ] Atualizar todas as verificações de role
3. [ ] Migration para sincronizar roles
4. [ ] Testes

### Fase 3: Refatoração (futuro)
1. [ ] Unificar lógica de roteamento
2. [ ] Middleware de domínio no Edge
3. [ ] Documentação completa

---

## 📝 NOTAS TÉCNICAS

### Fontes de role atuais:
- `user_roles` - tabela legada?
- `organization_members.role` - enum user_role
- `auth.users.app_metadata` - possível alternativa

### Domínios ativos:
- studioos.pro (marketing)
- www.studioos.pro (marketing)
- admin.studioos.pro (admin)
- app.studioos.pro (app gateway)
- fornecedores.studioos.pro (supplier)
- {slug}.studioos.pro (marketing org)
- {slug}-app.studioos.pro (app org)

### Ambiente:
- Produção: vercel.app com alias studioos.pro
- Supabase: tjwpqrlfhngibuwqodcn
