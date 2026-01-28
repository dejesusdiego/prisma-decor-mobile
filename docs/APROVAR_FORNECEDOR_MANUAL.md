# 📋 Como Aprovar Fornecedor Manualmente (MVP)

**Data:** 2026-01-17  
**Versão:** 1.0 (MVP - Aprovação Manual)

---

## 🎯 Objetivo

Este documento explica como aprovar manualmente o cadastro de um fornecedor via Supabase Dashboard, já que o Painel Admin StudioOS ainda não foi implementado.

---

## 📍 Pré-requisitos

- ✅ Acesso ao Supabase Dashboard
- ✅ Fornecedor já se cadastrou via `/cadastro-fornecedor`
- ✅ Migration `20260117000001_supplier_self_service_registration.sql` aplicada

---

## 🔍 Passo 1: Encontrar Fornecedor Pendente

### Opção A: Via View (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn
2. Vá em **Table Editor** → **Views**
3. Abra a view `supplier_pending_registrations`
4. ✅ Você verá todos os fornecedores com `status = 'pending'`

### Opção B: Via Tabela suppliers

1. Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn
2. Vá em **Table Editor** → **suppliers**
3. Filtre por `status = 'pending'`
4. ✅ Você verá os fornecedores pendentes

---

## 🔍 Passo 2: Encontrar User ID do Fornecedor

1. Na view ou tabela, copie o **email** do fornecedor
2. Vá em **Authentication** → **Users**
3. Busque pelo email
4. ✅ Copie o **User ID** (UUID)

**Alternativa:** Se a view `supplier_pending_registrations` já mostrar `user_id`, use esse valor.

---

## ✅ Passo 3: Aprovar Fornecedor

### Opção A: Via Função RPC (Recomendado)

1. Vá em **SQL Editor** no Supabase Dashboard
2. Execute o seguinte SQL:

```sql
-- Substitua os valores:
-- p_supplier_id: UUID do fornecedor (da tabela suppliers)
-- p_user_id: UUID do usuário (de auth.users)

SELECT public.approve_supplier(
  'SUPPLIER_ID_AQUI'::uuid,
  'USER_ID_AQUI'::uuid
);
```

**Exemplo:**
```sql
SELECT public.approve_supplier(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '987fcdeb-51a2-43d7-8f9e-123456789abc'::uuid
);
```

✅ Se retornar `true`, o fornecedor foi aprovado com sucesso!

### Opção B: Via SQL Manual (Passo a Passo)

1. **Atualizar status do supplier:**
```sql
UPDATE public.suppliers
SET 
  status = 'approved',
  approved_at = now()
WHERE id = 'SUPPLIER_ID_AQUI'::uuid
  AND status = 'pending';
```

2. **Criar vínculo supplier_users:**
```sql
INSERT INTO public.supplier_users (
  supplier_id,
  user_id,
  role,
  active
) VALUES (
  'SUPPLIER_ID_AQUI'::uuid,
  'USER_ID_AQUI'::uuid,
  'supplier',
  true
)
ON CONFLICT (supplier_id, user_id) DO UPDATE SET
  active = true,
  role = 'supplier';
```

---

## 🧪 Passo 4: Verificar Aprovação

1. Vá em **Table Editor** → **suppliers**
2. Busque o fornecedor pelo ID
3. ✅ Verifique que `status = 'approved'`
4. ✅ Verifique que `approved_at` foi preenchido

5. Vá em **Table Editor** → **supplier_users**
6. ✅ Verifique que existe registro com:
   - `supplier_id` = ID do fornecedor
   - `user_id` = ID do usuário
   - `active = true`
   - `role = 'supplier'`

---

## 🧪 Passo 5: Testar Acesso do Fornecedor

1. Peça para o fornecedor acessar: `fornecedores.studioos.pro` (ou fallback)
2. Faça login com o email e senha cadastrados
3. ✅ Deve acessar o Portal de Fornecedores normalmente
4. ✅ Deve ver a aba "Catálogo" e poder gerenciar materiais

---

## 🚫 Rejeitar Fornecedor (Opcional)

Se precisar rejeitar um cadastro:

```sql
UPDATE public.suppliers
SET 
  status = 'rejected',
  rejected_at = now()
WHERE id = 'SUPPLIER_ID_AQUI'::uuid;
```

**Nota:** Rejeitar não remove o usuário do Auth, apenas marca o supplier como rejeitado. O fornecedor não conseguirá acessar o portal.

---

## 📝 Script SQL Completo (Copy-Paste)

Aqui está um script completo para aprovar um fornecedor (substitua os valores):

```sql
-- ============================================================
-- APROVAR FORNECEDOR - SCRIPT COMPLETO
-- ============================================================
-- Substitua:
-- @supplier_id: UUID do fornecedor (tabela suppliers)
-- @user_id: UUID do usuário (tabela auth.users)
-- ============================================================

DO $$
DECLARE
  v_supplier_id UUID := 'SUPPLIER_ID_AQUI'::uuid;
  v_user_id UUID := 'USER_ID_AQUI'::uuid;
BEGIN
  -- 1. Atualizar status
  UPDATE public.suppliers
  SET 
    status = 'approved',
    approved_at = now()
  WHERE id = v_supplier_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fornecedor não encontrado ou já aprovado/rejeitado';
  END IF;

  -- 2. Criar vínculo
  INSERT INTO public.supplier_users (
    supplier_id,
    user_id,
    role,
    active
  ) VALUES (
    v_supplier_id,
    v_user_id,
    'supplier',
    true
  )
  ON CONFLICT (supplier_id, user_id) DO UPDATE SET
    active = true,
    role = 'supplier';

  RAISE NOTICE 'Fornecedor aprovado com sucesso!';
END $$;
```

---

## 🔍 Consultas Úteis

### Ver todos os fornecedores pendentes com user_id:

```sql
SELECT * FROM public.supplier_pending_registrations
ORDER BY created_at DESC;
```

### Ver fornecedor específico por email:

```sql
SELECT 
  s.*,
  (SELECT id FROM auth.users WHERE email = s.email LIMIT 1) AS user_id
FROM public.suppliers s
WHERE s.email = 'email@fornecedor.com';
```

### Verificar se fornecedor já tem vínculo:

```sql
SELECT 
  s.name,
  s.status,
  su.user_id,
  su.active AS user_active
FROM public.suppliers s
LEFT JOIN public.supplier_users su ON s.id = su.supplier_id
WHERE s.email = 'email@fornecedor.com';
```

---

## ⚠️ Troubleshooting

### Problema: "Fornecedor não encontrado ou já aprovado/rejeitado"
**Solução:** Verifique se o `supplier_id` está correto e se o status ainda é `pending`.

### Problema: "User ID não encontrado"
**Solução:** Verifique se o usuário foi criado no Auth. Se não foi, o fornecedor precisa fazer o cadastro novamente.

### Problema: "Fornecedor aprovado mas não consegue acessar"
**Solução:** 
1. Verifique se `supplier_users` foi criado corretamente
2. Verifique se `supplier_users.active = true`
3. Verifique se o `user_id` corresponde ao usuário correto

### Problema: "Erro ao executar função approve_supplier"
**Solução:** Verifique se a migration foi aplicada corretamente. A função deve existir em `public.approve_supplier`.

---

## 🔮 Futuro: Painel Admin

Quando o Painel Admin StudioOS for implementado, este processo será automatizado:
- Lista de fornecedores pendentes na UI
- Botão "Aprovar" / "Rejeitar"
- Aprovação com um clique
- Notificação automática por e-mail

Por enquanto, use este processo manual.

---

**Última atualização:** 2026-01-17
