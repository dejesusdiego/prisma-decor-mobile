-- ============================================================
-- SCRIPT DE VERIFICAÇÃO: RLS Recursão Supplier
-- ============================================================
-- Execute este script no SQL Editor do Supabase para verificar
-- se a migration 20260117000005 foi aplicada corretamente
-- ============================================================

-- 1. Verificar se as políticas corretas existem
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'supplier_users'
ORDER BY policyname;

-- Resultado esperado:
-- 2 políticas:
-- 1. "Suppliers can view own users" - USING (user_id = auth.uid())
-- 2. "Organizations can view linked supplier users" - USING (subquery com supplier_organizations)

-- 2. Verificar se a política antiga (problemática) NÃO existe
-- Se esta query retornar resultados, a migration NÃO foi aplicada
SELECT 
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'supplier_users'
AND policyname = 'Organizations can view their suppliers';

-- Resultado esperado: 0 rows (a política antiga foi removida)

-- 3. Teste de verificação de recursão (para admin)
-- Execute como service_role ou admin
EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM supplier_users 
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Se der erro de recursão infinita, a migration não foi aplicada
