-- =============================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA PEDIDOS
-- =============================================
-- 
-- Problema identificado:
-- - Código está tentando usar 'data_prevista' mas schema tem 'previsao_entrega'
-- - Código está tentando usar 'observacoes' mas schema tem 'observacoes_producao'
--
-- Solução: Adicionar colunas faltantes para manter compatibilidade
-- =============================================

-- Adicionar coluna data_prevista (alias para previsao_entrega ou campo separado)
-- Vamos adicionar como TIMESTAMP para ser mais flexível que DATE
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS data_prevista TIMESTAMP WITH TIME ZONE;

-- Se previsao_entrega já tiver dados, copiar para data_prevista
UPDATE public.pedidos 
SET data_prevista = previsao_entrega::TIMESTAMP WITH TIME ZONE
WHERE previsao_entrega IS NOT NULL AND data_prevista IS NULL;

-- Adicionar coluna observacoes (alias para observacoes_producao)
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Se observacoes_producao já tiver dados, copiar para observacoes
UPDATE public.pedidos 
SET observacoes = observacoes_producao
WHERE observacoes_producao IS NOT NULL AND observacoes IS NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pedidos_data_prevista ON public.pedidos(data_prevista);

-- Comentários para documentação
COMMENT ON COLUMN public.pedidos.data_prevista IS 'Data prevista de entrega (alias para previsao_entrega, mantida para compatibilidade)';
COMMENT ON COLUMN public.pedidos.observacoes IS 'Observações do pedido (alias para observacoes_producao, mantida para compatibilidade)';
