-- =============================================
-- FIX COMPLETO: Corrigir TODAS as constraints com NO ACTION
-- para ON DELETE CASCADE
-- =============================================

-- Este script corrige TODOS os orçamentos, não apenas um específico
-- Ao alterar as constraints da tabela, todos os registros são afetados

-- 1. Atividades CRM
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

-- 2. Comissões
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comissoes_orcamento_id_fkey'
    AND table_name = 'comissoes'
  ) THEN
    ALTER TABLE public.comissoes 
      DROP CONSTRAINT comissoes_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.comissoes
  ADD CONSTRAINT comissoes_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Histórico de Descontos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'historico_descontos_orcamento_id_fkey'
    AND table_name = 'historico_descontos'
  ) THEN
    ALTER TABLE public.historico_descontos 
      DROP CONSTRAINT historico_descontos_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.historico_descontos
  ADD CONSTRAINT historico_descontos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Log de Alterações de Status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'log_alteracoes_status_orcamento_id_fkey'
    AND table_name = 'log_alteracoes_status'
  ) THEN
    ALTER TABLE public.log_alteracoes_status 
      DROP CONSTRAINT log_alteracoes_status_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.log_alteracoes_status
  ADD CONSTRAINT log_alteracoes_status_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 5. Pedidos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pedidos_orcamento_id_fkey'
    AND table_name = 'pedidos'
  ) THEN
    ALTER TABLE public.pedidos 
      DROP CONSTRAINT pedidos_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- Comentários
COMMENT ON CONSTRAINT atividades_crm_orcamento_id_fkey ON public.atividades_crm IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as atividades CRM vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT comissoes_orcamento_id_fkey ON public.comissoes IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as comissões vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT historico_descontos_orcamento_id_fkey ON public.historico_descontos IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, o histórico de descontos vinculado é deletado automaticamente.';

COMMENT ON CONSTRAINT log_alteracoes_status_orcamento_id_fkey ON public.log_alteracoes_status IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, o log de alterações de status vinculado é deletado automaticamente.';

COMMENT ON CONSTRAINT pedidos_orcamento_id_fkey ON public.pedidos IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, os pedidos de produção vinculados são deletados automaticamente.';
