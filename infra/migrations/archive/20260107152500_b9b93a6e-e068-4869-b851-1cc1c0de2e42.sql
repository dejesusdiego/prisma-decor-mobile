-- Atualizar função para cancelar pedido quando orçamento sai de status de pagamento
CREATE OR REPLACE FUNCTION public.auto_cancel_pedido_on_orcamento_recusado()
RETURNS TRIGGER AS $$
DECLARE
  v_status_com_pagamento text[] := ARRAY['pago_40', 'pago_parcial', 'pago_60', 'pago'];
  v_status_sem_producao text[] := ARRAY['rascunho', 'finalizado', 'enviado', 'sem_resposta', 'recusado', 'cancelado'];
BEGIN
  -- Cancelar se status novo indica que não deve ter produção E status anterior era de pagamento
  IF NEW.status = ANY(v_status_sem_producao) 
     AND OLD.status = ANY(v_status_com_pagamento) THEN
    
    -- Cancelar pedidos ativos (não entregues ou já cancelados)
    UPDATE public.pedidos
    SET status_producao = 'cancelado',
        observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
          '[Auto] Cancelado - Orçamento alterado para ' || NEW.status || ' em ' || to_char(now(), 'DD/MM/YYYY'),
        updated_at = now()
    WHERE orcamento_id = NEW.id
    AND status_producao NOT IN ('entregue', 'cancelado');
    
    -- Cancelar instalações pendentes
    UPDATE public.instalacoes
    SET status = 'cancelada',
        updated_at = now()
    WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE orcamento_id = NEW.id)
    AND status NOT IN ('concluida', 'cancelada');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corrigir pedidos de orçamentos que não estão em status de pagamento
UPDATE public.pedidos
SET status_producao = 'cancelado',
    observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
      '[Correção] Cancelado - Status do orçamento incompatível - ' || to_char(now(), 'DD/MM/YYYY'),
    updated_at = now()
WHERE orcamento_id IN (
  SELECT id FROM public.orcamentos 
  WHERE status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago')
)
AND status_producao NOT IN ('entregue', 'cancelado');