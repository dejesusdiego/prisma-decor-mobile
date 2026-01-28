# APLICAR FIX: Recursão Infinita em supplier_users (42P17)

## Problema
Erro `42P17: infinite recursion detected in policy for relation "supplier_users"` ao tentar acessar o portal de fornecedores.

## Causa
A política RLS de `supplier_users` está causando recursão infinita porque verifica `supplier_users` dentro de uma query que já acessa `supplier_users`.

## Solução
Execute o SQL abaixo no **Supabase Dashboard → SQL Editor**:

```sql
-- ============================================================
-- FIX: Recursão infinita na política RLS de supplier_users
-- ============================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Suppliers can view own users" ON public.supplier_users;
DROP POLICY IF EXISTS "Organizations can view their suppliers" ON public.supplier_users;

-- 2. Criar política simplificada SEM recursão
-- Usuário pode ver apenas seu próprio vínculo (user_id = auth.uid())
CREATE POLICY "Suppliers can view own users"
  ON public.supplier_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Criar política para organizações usando join direto (sem recursão)
-- Organizações podem ver supplier_users de fornecedores vinculados
CREATE POLICY "Organizations can view linked supplier users"
  ON public.supplier_users
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND so.active = true
    )
  );

-- 4. Comentários para documentação
COMMENT ON POLICY "Suppliers can view own users" ON public.supplier_users IS 
'Permite que fornecedores vejam apenas seu próprio vínculo (user_id = auth.uid()). Sem recursão.';

COMMENT ON POLICY "Organizations can view linked supplier users" ON public.supplier_users IS 
'Permite que organizações vejam supplier_users de fornecedores vinculados. Usa join direto sem recursão.';
```

## Como Aplicar

1. Acesse: **Supabase Dashboard** → **SQL Editor**
2. Cole o SQL acima
3. Clique em **Run** (ou pressione `Ctrl+Enter`)
4. Verifique se aparece "Success. No rows returned"
5. Tente acessar o portal novamente: `fornecedores.studioos.pro` ou `/fornecedores`

## Verificação

Após aplicar, verifique se as políticas foram criadas corretamente:

```sql
-- Ver políticas de supplier_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'supplier_users';
```

Você deve ver 2 políticas:
- `Suppliers can view own users`
- `Organizations can view linked supplier users`

## Se Ainda Não Funcionar

Se o erro persistir, verifique:

1. **Cache do Supabase:** Aguarde 1-2 minutos e tente novamente
2. **Sessão do usuário:** Faça logout e login novamente
3. **Verificar vínculo:** Confirme que existe registro em `supplier_users`:
   ```sql
   SELECT * FROM supplier_users WHERE user_id = 'SEU_USER_ID';
   ```
