# 🚀 Rotas: Produção vs Desenvolvimento

## 📋 Contrato de Rotas

### ✅ Produção (Domínios Reais)

Em produção, **TODAS** as rotas são baseadas em **subdomínios**:

| Domínio | Role | Componente |
|---------|------|------------|
| `studioos.pro` | marketing | `LandingPageStudioOS` |
| `panel.studioos.pro` | admin | `AdminDashboard` |
| `fornecedores.studioos.pro` | supplier | `SupplierPortal` |
| `cliente.com.br` | marketing | `LandingPageOrganizacao` |
| `app.cliente.com.br` | app | `GerarOrcamento` |

**Regra:** Em produção, **não usar** rotas `/studioos` ou `/lp/:slug`.

---

### 🔧 Desenvolvimento (Fallback)

As rotas `/studioos` e `/lp/:slug` existem **APENAS** para:

1. **Desenvolvimento local** (`localhost:8080`)
2. **Testes sem domínio configurado**
3. **Preview/Staging** antes de configurar DNS

**Quando usar:**
- ✅ Desenvolvimento local
- ✅ Testes de componentes
- ✅ Preview de landing pages
- ❌ **NÃO usar em produção**

---

## 🔒 Validação de Ambiente

### Como Detectar Produção

```typescript
const isProduction = 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1' &&
  !window.location.hostname.includes('.vercel.app') && // Preview
  !window.location.hostname.includes('.local'); // Dev local
```

### Bloquear Rotas em Produção (Opcional)

```typescript
// Em App.tsx
if (isProduction && (location.pathname === '/studioos' || location.pathname.startsWith('/lp/'))) {
  return <Navigate to="/" replace />;
}
```

---

## 📝 Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Todos os domínios configurados no Vercel
- [ ] DNS apontando corretamente
- [ ] Domínios inseridos na tabela `domains`
- [ ] Testar cada subdomínio:
  - [ ] `studioos.pro` → LP StudioOS
  - [ ] `panel.studioos.pro` → Admin
  - [ ] `fornecedores.studioos.pro` → Fornecedores
  - [ ] `cliente.com.br` → LP Cliente
  - [ ] `app.cliente.com.br` → Sistema Cliente

---

## 🎯 Recomendação: app.studioos.pro (Pós-MVP)

**Considerar adicionar** `app.studioos.pro` como fallback/demo:

**Motivos:**
- ✅ Facilita suporte
- ✅ QA e testes
- ✅ Onboarding de clientes
- ✅ Acesso quando cliente ainda não configurou DNS

**Implementação:**
```sql
INSERT INTO domains (hostname, role, organization_id)
VALUES (
  'app.studioos.pro',
  'app',
  '00000000-0000-0000-0000-000000000001' -- Org interna StudioOS
);
```

**Status:** P1 pós-MVP (não crítico agora)

---

**Última atualização:** 2025-01-16
