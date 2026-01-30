-- Remove o check constraint antigo
ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;

-- Adiciona novo check constraint com todos os status válidos
ALTER TABLE public.orcamentos ADD CONSTRAINT orcamentos_status_check 
CHECK (status IN ('rascunho', 'finalizado', 'enviado', 'aceito', 'recusado', 'pago_parcial', 'pago'));