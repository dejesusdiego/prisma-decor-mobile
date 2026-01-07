-- Função para cancelar pedido automaticamente quando orçamento é recusado/cancelado
CREATE OR REPLACE FUNCTION public.auto_cancel_pedido_on_orcamento_recusado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('recusado', 'cancelado') 
     AND OLD.status NOT IN ('recusado', 'cancelado') THEN
    
    -- Cancelar pedidos ativos
    UPDATE public.pedidos
    SET status_producao = 'cancelado',
        observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
          '[Auto] Cancelado - Orçamento ' || NEW.status || ' em ' || to_char(now(), 'DD/MM/YYYY'),
        updated_at = now()
    WHERE orcamento_id = NEW.id
    AND status_producao NOT IN ('entregue', 'cancelado');
    
    -- Cancelar instalações agendadas
    UPDATE public.instalacoes
    SET status = 'cancelada',
        updated_at = now()
    WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE orcamento_id = NEW.id)
    AND status NOT IN ('concluida', 'cancelada');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
CREATE TRIGGER trigger_cancel_pedido_on_orcamento_recusado
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.auto_cancel_pedido_on_orcamento_recusado();

-- Corrigir pedidos existentes de orçamentos já recusados/cancelados
UPDATE public.pedidos
SET status_producao = 'cancelado',
    observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
      '[Correção] Cancelado - Orçamento já estava recusado/cancelado - ' || to_char(now(), 'DD/MM/YYYY'),
    updated_at = now()
WHERE orcamento_id IN (
  SELECT id FROM public.orcamentos WHERE status IN ('recusado', 'cancelado')
)
AND status_producao NOT IN ('entregue', 'cancelado');