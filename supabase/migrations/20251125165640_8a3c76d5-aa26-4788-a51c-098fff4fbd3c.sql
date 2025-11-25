-- Add fornecedor column to materiais table for supplier tracking
ALTER TABLE public.materiais ADD COLUMN fornecedor text;

-- Create index for better filtering performance
CREATE INDEX idx_materiais_fornecedor ON public.materiais(fornecedor);