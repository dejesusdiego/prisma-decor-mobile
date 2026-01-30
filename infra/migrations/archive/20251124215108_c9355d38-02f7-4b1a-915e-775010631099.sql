-- Adicionar 'finalizado' aos valores permitidos do status de orçamento
ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;

ALTER TABLE public.orcamentos 
ADD CONSTRAINT orcamentos_status_check 
CHECK (status IN ('rascunho', 'enviado', 'finalizado', 'aprovado', 'perdido'));