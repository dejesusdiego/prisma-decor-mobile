-- Trigger preventivo: cria conta a receber automaticamente quando o status do orçamento muda para pagamento
-- e ainda não existe conta a receber vinculada

CREATE OR REPLACE FUNCTION public.ensure_conta_receber_on_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_status_com_pagamento text[] := ARRAY['pago_40', 'pago_parcial', 'pago_60', 'pago'];
  v_status_anteriores_sem_pagamento text[] := ARRAY['rascunho', 'enviado', 'vencido'];
BEGIN
  -- Só executa se:
  -- 1. O status mudou para um status de pagamento
  -- 2. O status anterior NÃO era um status de pagamento
  -- 3. Não existe conta a receber para este orçamento
  IF NEW.status = ANY(v_status_com_pagamento) 
     AND (OLD.status IS NULL OR OLD.status = ANY(v_status_anteriores_sem_pagamento))
     AND NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE orcamento_id = NEW.id) THEN
    
    -- Criar conta a receber automaticamente com 1 parcela
    INSERT INTO public.contas_receber (
      orcamento_id, 
      cliente_nome, 
      cliente_telefone,
      valor_total, 
      valor_pago, 
      numero_parcelas,
      status, 
      data_vencimento, 
      descricao, 
      organization_id,
      created_by_user_id
    ) VALUES (
      NEW.id, 
      NEW.cliente_nome,
      NEW.cliente_telefone,
      COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      0,
      1,
      'pendente',
      (CURRENT_DATE + INTERVAL '30 days'),
      'Conta criada automaticamente - ' || NEW.codigo,
      NEW.organization_id,
      NEW.created_by_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_ensure_conta_receber ON public.orcamentos;

-- Criar trigger
CREATE TRIGGER trigger_ensure_conta_receber
AFTER UPDATE OF status ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_conta_receber_on_payment_status();

-- Comentário explicativo
COMMENT ON FUNCTION public.ensure_conta_receber_on_payment_status() IS 
'Garante que todo orçamento com status de pagamento tenha uma conta a receber associada. Previne inconsistências entre módulos.';