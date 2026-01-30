-- =============================================
-- FIX: Corrigir TODAS as constraints com NO ACTION para CASCADE
-- =============================================

-- 1. Atividades CRM
ALTER TABLE public.atividades_crm 
  DROP CONSTRAINT IF EXISTS atividades_crm_orcamento_id_fkey;

ALTER TABLE public.atividades_crm
  ADD CONSTRAINT atividades_crm_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 2. Comissões
ALTER TABLE public.comissoes 
  DROP CONSTRAINT IF EXISTS comissoes_orcamento_id_fkey;

ALTER TABLE public.comissoes
  ADD CONSTRAINT comissoes_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Histórico de Descontos
ALTER TABLE public.historico_descontos 
  DROP CONSTRAINT IF EXISTS historico_descontos_orcamento_id_fkey;

ALTER TABLE public.historico_descontos
  ADD CONSTRAINT historico_descontos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Log de Alterações de Status
ALTER TABLE public.log_alteracoes_status 
  DROP CONSTRAINT IF EXISTS log_alteracoes_status_orcamento_id_fkey;

ALTER TABLE public.log_alteracoes_status
  ADD CONSTRAINT log_alteracoes_status_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 5. Pedidos
ALTER TABLE public.pedidos 
  DROP CONSTRAINT IF EXISTS pedidos_orcamento_id_fkey;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;
