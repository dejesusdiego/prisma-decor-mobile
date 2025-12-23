-- Add column to track original recurring bill
ALTER TABLE public.contas_pagar 
ADD COLUMN conta_origem_id uuid REFERENCES public.contas_pagar(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_contas_pagar_conta_origem ON public.contas_pagar(conta_origem_id);

-- Add comment for documentation
COMMENT ON COLUMN public.contas_pagar.conta_origem_id IS 'ID da conta recorrente original que gerou esta conta';