-- =============================================
-- FIX COMPLETO: Verificar e corrigir TODAS as constraints
-- que referenciam orcamentos para ON DELETE CASCADE
-- =============================================

-- Este script corrige TODOS os orçamentos, não apenas um específico
-- Ao alterar as constraints da tabela, todos os registros são afetados

-- 1. Oportunidades
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'oportunidades_orcamento_id_fkey'
    AND table_name = 'oportunidades'
  ) THEN
    ALTER TABLE public.oportunidades 
      DROP CONSTRAINT oportunidades_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.oportunidades
  ADD CONSTRAINT oportunidades_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 2. Contas a Pagar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contas_pagar_orcamento_id_fkey'
    AND table_name = 'contas_pagar'
  ) THEN
    ALTER TABLE public.contas_pagar 
      DROP CONSTRAINT contas_pagar_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.contas_pagar
  ADD CONSTRAINT contas_pagar_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Contas a Receber
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contas_receber_orcamento_id_fkey'
    AND table_name = 'contas_receber'
  ) THEN
    ALTER TABLE public.contas_receber 
      DROP CONSTRAINT contas_receber_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.contas_receber
  ADD CONSTRAINT contas_receber_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Atividades CRM
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'atividades_crm_orcamento_id_fkey'
    AND table_name = 'atividades_crm'
  ) THEN
    ALTER TABLE public.atividades_crm 
      DROP CONSTRAINT atividades_crm_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.atividades_crm
  ADD CONSTRAINT atividades_crm_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- =============================================
-- VERIFICAÇÃO: Listar todas as constraints após a correção
-- =============================================

-- Execute esta query para verificar se todas estão corretas:
/*
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  tc.constraint_name
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
*/

-- Comentários
COMMENT ON CONSTRAINT oportunidades_orcamento_id_fkey ON public.oportunidades IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as oportunidades vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_pagar_orcamento_id_fkey ON public.contas_pagar IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a pagar vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_receber_orcamento_id_fkey ON public.contas_receber IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a receber vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT atividades_crm_orcamento_id_fkey ON public.atividades_crm IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as atividades CRM vinculadas são deletadas automaticamente.';
