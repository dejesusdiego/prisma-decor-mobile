-- Remover trigger que cria conta a receber no status "enviado"
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber_enviado ON public.orcamentos;

-- Remover a função associada
DROP FUNCTION IF EXISTS public.auto_criar_conta_receber_enviado();

-- Adicionar comentário explicativo na função que deve permanecer
COMMENT ON FUNCTION public.auto_criar_conta_receber() IS 
  'Cria conta a receber automaticamente apenas quando orçamento atinge status de pagamento confirmado (pago_40, pago_parcial, pago_60, pago)';