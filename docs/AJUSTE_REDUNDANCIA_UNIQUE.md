# ✅ Ajuste: Remoção de Redundância UNIQUE

## 📋 Resumo

Removida redundância entre constraint `UNIQUE` na coluna e índice único parcial.

---

## ❌ Problema Identificado

**Redundância:**
```sql
-- Constraint na coluna
hostname TEXT UNIQUE NOT NULL

-- Índice único parcial (redundante)
CREATE UNIQUE INDEX idx_domains_hostname_unique 
ON public.domains(hostname) WHERE active = true;
```

**Problemas:**
- Ambiguidade de constraint
- Confusão em `ON CONFLICT (hostname)`
- Manutenção desnecessária
- `active = false` não deve permitir duplicação de qualquer forma

---

## ✅ Correção Aplicada

### Migration

**Arquivo:** `supabase/migrations/20260116000002_domains_subdomains.sql`

**Alteração:**
```sql
-- ANTES:
CREATE UNIQUE INDEX idx_domains_hostname_unique 
ON public.domains(hostname) WHERE active = true;

-- DEPOIS:
-- ⚠️ NOTA: hostname já tem UNIQUE constraint na coluna, não precisamos de índice único adicional
-- O UNIQUE na coluna garante unicidade global (mesmo para active = false)
-- (índice removido)
```

**Resultado:**
- ✅ Apenas 1 fonte de verdade: `hostname TEXT UNIQUE`
- ✅ `ON CONFLICT (hostname)` funciona corretamente
- ✅ Unicidade garantida globalmente (mesmo para `active = false`)

---

## 📁 Arquivos Modificados

1. **`supabase/migrations/20260116000002_domains_subdomains.sql`**
   - ❌ Removido: `CREATE UNIQUE INDEX idx_domains_hostname_unique`
   - ✅ Adicionado: Comentário explicando que `UNIQUE` na coluna é suficiente

2. **`docs/ESTRUTURA_DOMINIOS_V3_FINAL.md`**
   - ✅ Atualizado: Seção de índices
   - ✅ Atualizado: Regras (menciona constraint na coluna)
   - ✅ Atualizado: Checklist

---

## ✅ Confirmação

- [x] Índice único parcial removido
- [x] Constraint `UNIQUE` na coluna mantida
- [x] `ON CONFLICT (hostname)` continua válido
- [x] Documentação atualizada
- [x] Sem mudança de lógica ou comportamento

---

**Última atualização:** 2025-01-16
**Status:** ✅ Redundância removida - Migration limpa
