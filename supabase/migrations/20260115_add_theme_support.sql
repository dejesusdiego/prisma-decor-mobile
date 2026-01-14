-- =====================================================
-- Adicionar suporte a temas na tabela organizations
-- =====================================================

-- Adicionar coluna theme_name para armazenar o tema escolhido
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS theme_name TEXT DEFAULT 'default' CHECK (theme_name IN ('default', 'blue', 'green', 'purple', 'red', 'orange', 'teal', 'indigo'));

-- Adicionar comentário
COMMENT ON COLUMN public.organizations.theme_name IS 'Nome do tema de cores escolhido pela organização';

-- Atualizar organizações existentes para usar tema padrão
UPDATE public.organizations 
SET theme_name = 'default' 
WHERE theme_name IS NULL;
