-- Adicionar coluna para serviços adicionais no cortina_items
ALTER TABLE public.cortina_items 
ADD COLUMN servicos_adicionais_ids TEXT[] DEFAULT '{}';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.cortina_items.servicos_adicionais_ids IS 'IDs dos serviços de confecção adicionais aplicados a este item';

-- Atualizar configuração para suportar múltiplos serviços por tipo
UPDATE public.configuracoes_sistema 
SET valor = '{"wave": [], "prega": [], "painel": [], "rolo": []}'::jsonb,
    descricao = 'Mapeamento de serviços de confecção por tipo de cortina (array de UUIDs de serviços)'
WHERE chave = 'servicos_por_tipo_cortina';