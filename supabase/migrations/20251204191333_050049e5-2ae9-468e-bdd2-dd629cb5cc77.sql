-- Habilitar REPLICA IDENTITY FULL para capturar dados completos nas atualizações
ALTER TABLE public.solicitacoes_visita REPLICA IDENTITY FULL;

-- Adicionar tabela ao publication de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_visita;