-- Adicionar campos para ignorar lançamentos que não precisam conciliação
ALTER TABLE lancamentos_financeiros 
ADD COLUMN IF NOT EXISTS ignorado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_ignorado text DEFAULT NULL;

-- Índice para filtrar ignorados rapidamente
CREATE INDEX IF NOT EXISTS idx_lancamentos_ignorado ON lancamentos_financeiros(ignorado) WHERE ignorado = false;