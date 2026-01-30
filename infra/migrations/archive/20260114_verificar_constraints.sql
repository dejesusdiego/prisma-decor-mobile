-- =============================================
-- VERIFICAÇÃO: Listar todas as constraints que referenciam orcamentos
-- Execute este SQL ANTES e DEPOIS do fix para comparar
-- =============================================

SELECT 
  tc.table_name AS "Tabela",
  kcu.column_name AS "Coluna",
  ccu.table_name AS "Tabela Referenciada",
  ccu.column_name AS "Coluna Referenciada",
  rc.delete_rule AS "Regra de Delete",
  CASE 
    WHEN rc.delete_rule = 'CASCADE' THEN '✅ CORRETO'
    WHEN rc.delete_rule = 'SET NULL' THEN '❌ PRECISA CORRIGIR'
    WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOQUEIA DELETE'
    ELSE '⚠️  ' || rc.delete_rule
  END AS "Status",
  tc.constraint_name AS "Nome da Constraint"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'orcamentos'
  AND ccu.column_name = 'id'
ORDER BY tc.table_name, kcu.column_name;
