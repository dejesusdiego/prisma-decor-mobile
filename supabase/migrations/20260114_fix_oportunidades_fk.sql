-- =============================================
-- FIX: Alterar constraints para ON DELETE CASCADE
-- =============================================

-- O problema: As constraints atuais usam ON DELETE SET NULL, mas a RLS pode bloquear
-- a atualização automática. Vamos mudar para CASCADE para deletar os registros
-- vinculados quando o orçamento for deletado.

-- 1. Oportunidades
ALTER TABLE public.oportunidades 
  DROP CONSTRAINT IF EXISTS oportunidades_orcamento_id_fkey;

ALTER TABLE public.oportunidades
  ADD CONSTRAINT oportunidades_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 2. Contas a Pagar
ALTER TABLE public.contas_pagar 
  DROP CONSTRAINT IF EXISTS contas_pagar_orcamento_id_fkey;

ALTER TABLE public.contas_pagar
  ADD CONSTRAINT contas_pagar_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Contas a Receber (também precisa ser CASCADE para manter consistência)
ALTER TABLE public.contas_receber 
  DROP CONSTRAINT IF EXISTS contas_receber_orcamento_id_fkey;

ALTER TABLE public.contas_receber
  ADD CONSTRAINT contas_receber_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Atividades CRM
ALTER TABLE public.atividades_crm 
  DROP CONSTRAINT IF EXISTS atividades_crm_orcamento_id_fkey;

ALTER TABLE public.atividades_crm
  ADD CONSTRAINT atividades_crm_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- Comentários
COMMENT ON CONSTRAINT oportunidades_orcamento_id_fkey ON public.oportunidades IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as oportunidades vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_pagar_orcamento_id_fkey ON public.contas_pagar IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a pagar vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_receber_orcamento_id_fkey ON public.contas_receber IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a receber vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT atividades_crm_orcamento_id_fkey ON public.atividades_crm IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as atividades CRM vinculadas são deletadas automaticamente.';
