-- Adicionar novos campos opcionais à tabela materiais para suportar categorias específicas

-- Campos comuns para tecidos, forros, trilhos
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS linha TEXT,
ADD COLUMN IF NOT EXISTS cor TEXT,
ADD COLUMN IF NOT EXISTS tipo TEXT;

-- Campos específicos para acessórios
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS aplicacao TEXT;

-- Campos específicos para motorizados
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS potencia TEXT;

-- Campos específicos para persianas
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS area_min_fat NUMERIC;

-- Criar índices para melhorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_materiais_tipo ON public.materiais(tipo);
CREATE INDEX IF NOT EXISTS idx_materiais_linha ON public.materiais(linha);

COMMENT ON COLUMN public.materiais.linha IS 'Linha do produto (ex: BLACKOUT 100%, MAX UMA VIA, TMT 250)';
COMMENT ON COLUMN public.materiais.cor IS 'Cor do material (ex: BRANCO, PRETO, ESCOVADO)';
COMMENT ON COLUMN public.materiais.tipo IS 'Tipo específico do produto (ex: FORRO, TRILHO MAX, MOTOR ELETRONICO, ROMANA)';
COMMENT ON COLUMN public.materiais.aplicacao IS 'Aplicação do acessório (ex: PERSIANA PESADA, ACRILICO)';
COMMENT ON COLUMN public.materiais.potencia IS 'Potência do motor (ex: UD 1,2N)';
COMMENT ON COLUMN public.materiais.area_min_fat IS 'Área mínima de faturamento para persianas (m²)';