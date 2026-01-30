-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar função para sincronizar status do orçamento com pagamentos
CREATE OR REPLACE FUNCTION public.sincronizar_status_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento_id uuid;
  v_valor_total numeric;
  v_valor_pago numeric;
  v_percentual numeric;
  v_novo_status text;
BEGIN
  -- Buscar orcamento_id da conta receber
  SELECT orcamento_id, valor_total, valor_pago 
  INTO v_orcamento_id, v_valor_total, v_valor_pago
  FROM contas_receber
  WHERE id = NEW.id;
  
  -- Se não tem orçamento vinculado, não faz nada
  IF v_orcamento_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calcular percentual pago
  IF v_valor_total > 0 THEN
    v_percentual := (v_valor_pago / v_valor_total) * 100;
  ELSE
    v_percentual := 0;
  END IF;
  
  -- Determinar novo status baseado no percentual
  IF NEW.status = 'pago' OR v_percentual >= 100 THEN
    v_novo_status := 'pago';
  ELSIF v_percentual >= 60 THEN
    v_novo_status := 'pago_60';
  ELSIF v_percentual >= 50 THEN
    v_novo_status := 'pago_parcial';
  ELSIF v_percentual >= 40 THEN
    v_novo_status := 'pago_40';
  ELSE
    -- Mantém o status atual se menos de 40%
    RETURN NEW;
  END IF;
  
  -- Atualizar status do orçamento
  UPDATE orcamentos
  SET status = v_novo_status
  WHERE id = v_orcamento_id
  AND status NOT IN ('cancelado', 'pago'); -- Não sobrescrever se já está cancelado ou pago
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar quando conta_receber é atualizada
DROP TRIGGER IF EXISTS trigger_sincronizar_status_orcamento ON contas_receber;
CREATE TRIGGER trigger_sincronizar_status_orcamento
  AFTER UPDATE OF status, valor_pago ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_status_orcamento();