-- Adicionar campo origem na tabela oportunidades
ALTER TABLE public.oportunidades 
ADD COLUMN IF NOT EXISTS origem text DEFAULT NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.oportunidades.origem IS 'Origem da oportunidade: site, indicacao, instagram, whatsapp, facebook, outro';