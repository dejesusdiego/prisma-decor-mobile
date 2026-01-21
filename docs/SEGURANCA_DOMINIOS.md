# 🔒 Segurança - Tabela Domains

## 📋 Estado Atual (MVP)

### Policy Atual

```sql
CREATE POLICY "Anyone can view active domains"
  ON public.domains FOR SELECT
  USING (active = true);
```

**Resultado:** Qualquer pessoa (autenticada ou não) pode ver:
- `hostname` → `role` → `organization_id`

---

## ⚠️ Riscos Identificados

### 1. Enumeração de Domínios

**Risco:** Permite descobrir todos os domínios configurados no sistema.

**Impacto:** Baixo (MVP)
- Informação não crítica
- Domínios são públicos de qualquer forma

### 2. Enumeração de Tenants

**Risco:** Permite descobrir `organization_id` de cada domínio.

**Impacto:** Médio
- Permite tentar acessar dados de outras organizações
- Mitigado por RLS (cada org só vê seus próprios dados)

---

## ✅ Mitigações Atuais

### RLS em Outras Tabelas

O RLS nas tabelas principais (`organizations`, `orcamentos`, etc.) previne:
- Acesso a dados de outras organizações
- Mesmo conhecendo o `organization_id`

**Conclusão:** O risco é aceitável para MVP.

---

## 📈 Hardening Pós-MVP

### ⚠️ Por que NÃO usar View Pública

**Problema:** Uma view pública que apenas "esconde" `organization_id` para admin/supplier **NÃO resolve o problema**, porque:
- Para `role='marketing'` e `role='app'`, a view ainda expõe `organization_id`
- O risco de enumeração de tenants continua
- Não adiciona segurança real

**Conclusão:** View pública não é a solução correta para hardening.

---

### ✅ Hardening Correto: RPC ou Edge Middleware

**Solução recomendada:** RPC `SECURITY DEFINER` ou Edge Middleware que retorna apenas:
- `hostname`
- `role`
- `organization_slug` (NÃO `organization_id`)

**Exemplo RPC:**

```sql
CREATE FUNCTION public.resolve_domain(p_hostname TEXT)
RETURNS TABLE (
  hostname TEXT,
  role TEXT,
  organization_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.hostname,
    d.role,
    o.slug as organization_slug  -- Retorna slug, não organization_id
  FROM public.domains d
  LEFT JOIN public.organizations o ON d.organization_id = o.id
  WHERE d.hostname = p_hostname
    AND d.active = true;
END;
$$;
```

**Vantagens:**
- ✅ Não expõe `organization_id` (apenas `slug`)
- ✅ Controle total sobre o que é exposto
- ✅ Pode adicionar rate limiting
- ✅ Pode adicionar cache (Edge Middleware)

**Implementação:**
- Edge Middleware resolve domínio antes do frontend
- Retorna apenas dados necessários para roteamento
- Rate limiting e cache no Edge

---

## 🎯 Recomendação

### MVP (Agora)

✅ **Manter policy atual** (acesso público)

**Motivos:**
- Funciona para MVP
- RLS em outras tabelas mitiga riscos
- Informação não é crítica

### Pós-MVP (Scale)

📌 **Implementar RPC ou Edge Middleware**

**Quando:**
- Após validar MVP
- Antes de scale significativo
- Quando tiver tempo para hardening

**Prioridade:** P2 (não crítico agora)

---

## 📝 Checklist de Hardening

- [ ] Criar RPC `resolve_domain(hostname)` (SECURITY DEFINER) ou Edge Middleware
- [ ] RPC/Edge retorna apenas `role` + `organization_slug` (sem `organization_id`)
- [ ] Atualizar frontend para usar RPC/Edge
- [ ] Remover policy pública da tabela `domains`
- [ ] Adicionar rate limiting (Edge Middleware)
- [ ] Adicionar cache (Edge Middleware)
- [ ] Documentar processo de resolução

---

## 🔐 Outras Considerações de Segurança

### 1. Validação de Slug Reservado

**Problema:** Nenhuma validação previne uso de `slug='studioos'` por clientes.

**Solução Futura:**
```sql
-- Trigger para prevenir uso de slug reservado
CREATE OR REPLACE FUNCTION prevent_reserved_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug = 'studioos' AND NEW.type != 'internal' THEN
    RAISE EXCEPTION 'Slug "studioos" é reservado para a plataforma';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reserved_slug
  BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reserved_slug();
```

**Status:** P2 pós-MVP

---

### 2. Rate Limiting

**Problema:** Resolução de domínio pode ser abusada.

**Solução:** Edge Middleware com rate limiting.

**Status:** P2 pós-MVP

---

### 3. Cache

**Problema:** Muitas queries ao banco para resolução.

**Solução:** Cache no Edge Middleware (Vercel Edge Config ou Redis).

**Status:** P2 pós-MVP

---

**Última atualização:** 2025-01-16
**Status:** ✅ Documentado - Pronto para MVP, hardening planejado pós-MVP
