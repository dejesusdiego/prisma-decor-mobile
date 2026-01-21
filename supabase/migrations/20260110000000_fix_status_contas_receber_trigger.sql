-- =====================================================
-- CORREÇÃO: Trigger para atualizar status de contas_receber
-- quando parcelas_receber são atualizadas
-- =====================================================

-- Função para atualizar contas_receber quando parcela é atualizada
CREATE OR REPLACE FUNCTION public.atualizar_conta_receber_por_parcela()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conta_receber_id UUID;
  v_valor_total NUMERIC;
  v_valor_pago NUMERIC;
  v_novo_status TEXT;
  v_todas_pagas BOOLEAN;
  v_tolerancia_valor NUMERIC := 5.00; -- R$ 5,00
  v_tolerancia_percent NUMERIC := 0.5; -- 0,5%
  v_diferenca NUMERIC;
  v_percentual_diferenca NUMERIC;
BEGIN
  -- Usar NEW.conta_receber_id (após UPDATE) ou OLD.conta_receber_id (após DELETE)
  v_conta_receber_id := COALESCE(NEW.conta_receber_id, OLD.conta_receber_id);
  
  IF v_conta_receber_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Buscar valor_total da conta
  SELECT valor_total INTO v_valor_total
  FROM contas_receber
  WHERE id = v_conta_receber_id;

  IF v_valor_total IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recalcular valor_pago somando todas as parcelas pagas
  SELECT 
    COALESCE(SUM(valor), 0),
    COUNT(*) FILTER (WHERE status = 'pago') = COUNT(*)
  INTO v_valor_pago, v_todas_pagas
  FROM parcelas_receber
  WHERE conta_receber_id = v_conta_receber_id
    AND status = 'pago';

  -- Se não há parcelas pagas, valor_pago = 0
  IF v_valor_pago IS NULL THEN
    v_valor_pago := 0;
  END IF;

  -- Calcular diferença e percentual para tolerância
  v_diferenca := v_valor_total - v_valor_pago;
  IF v_valor_total > 0 THEN
    v_percentual_diferenca := (v_diferenca / v_valor_total) * 100;
  ELSE
    v_percentual_diferenca := 0;
  END IF;

  -- Determinar novo status
  -- Considera pago se:
  -- 1. Todas as parcelas estão pagas, OU
  -- 2. A diferença está dentro da tolerância (R$ 5 ou 0,5%)
  IF v_todas_pagas OR (v_diferenca <= v_tolerancia_valor AND v_percentual_diferenca <= v_tolerancia_percent) THEN
    v_novo_status := 'pago';
  ELSIF v_valor_pago > 0 THEN
    v_novo_status := 'parcial';
  ELSE
    -- Se não está pago e não está parcial, verificar se está atrasado
    -- (isso será feito pelo trigger de atualização de contas atrasadas)
    v_novo_status := 'pendente';
  END IF;

  -- Atualizar conta_receber
  UPDATE contas_receber
  SET 
    valor_pago = v_valor_pago,
    status = v_novo_status,
    updated_at = NOW()
  WHERE id = v_conta_receber_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_atualizar_conta_receber_por_parcela ON public.parcelas_receber;

-- Criar trigger que executa após INSERT, UPDATE ou DELETE de parcelas
CREATE TRIGGER trigger_atualizar_conta_receber_por_parcela
AFTER INSERT OR UPDATE OF status, valor OR DELETE ON public.parcelas_receber
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_conta_receber_por_parcela();

-- Comentário explicativo
COMMENT ON FUNCTION public.atualizar_conta_receber_por_parcela() IS 
'Atualiza automaticamente o valor_pago e status de contas_receber quando parcelas_receber são criadas, atualizadas ou deletadas. Considera tolerância de R$ 5 ou 0,5% para considerar pagamento completo.';
