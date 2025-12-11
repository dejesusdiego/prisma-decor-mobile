-- Drop the existing check constraint and recreate with all valid statuses
ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;

ALTER TABLE public.orcamentos ADD CONSTRAINT orcamentos_status_check 
CHECK (status IN ('rascunho', 'finalizado', 'enviado', 'sem_resposta', 'recusado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'));