-- Adicionar campo codigo_item às tabelas para suportar importação e upsert
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS codigo_item TEXT UNIQUE;

ALTER TABLE public.servicos_confeccao 
ADD COLUMN IF NOT EXISTS codigo_item TEXT UNIQUE;

ALTER TABLE public.servicos_instalacao 
ADD COLUMN IF NOT EXISTS codigo_item TEXT UNIQUE;

-- Criar índices para melhorar performance de busca por codigo_item
CREATE INDEX IF NOT EXISTS idx_materiais_codigo_item ON public.materiais(codigo_item);
CREATE INDEX IF NOT EXISTS idx_servicos_confeccao_codigo_item ON public.servicos_confeccao(codigo_item);
CREATE INDEX IF NOT EXISTS idx_servicos_instalacao_codigo_item ON public.servicos_instalacao(codigo_item);