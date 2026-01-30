-- =====================================================
-- T6.4: FIX - Sincronização Bidirecional Orçamento ↔ Financeiro
-- Adiciona trigger para sincronizar orcamento → contas_receber
-- =====================================================

-- Função para sincronizar status da conta_receber quando orçamento muda
CREATE OR REPLACE FUNCTION public.sync_contas_receber_from_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Só sincroniza quando status muda para um status de pagamento
  IF NEW.status IN ('pago', 'pago_60', 'pago_parcial', 'pago_40') THEN
    -- Atualizar todas as contas_receber vinculadas a este orçamento
    UPDATE public.contas_receber
    SET 
      status = CASE 
        WHEN NEW.status = 'pago' THEN 'pago'
        WHEN NEW.status IN ('pago_60', 'pago_parcial', 'pago_40') THEN 'parcial'
        ELSE status
      END,
      -- Se orçamento está pago, marca valor_pago = valor_total
      valor_pago = CASE 
        WHEN NEW.status = 'pago' THEN valor_total
        ELSE valor_pago
      END,
      updated_at = NOW()
    WHERE orcamento_id = NEW.id
      AND status NOT IN ('pago', 'cancelado'); -- Não sobrescrever já pagos ou cancelados
  END IF;

  -- Se orçamento foi cancelado, cancelar contas_receber também
  IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    UPDATE public.contas_receber
    SET 
      status = 'cancelado',
      updated_at = NOW()
    WHERE orcamento_id = NEW.id
      AND status NOT IN ('pago'); -- Não cancelar contas já pagas
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_sync_contas_receber_from_orcamento ON public.orcamentos;

-- Criar trigger para sincronização orcamento → contas_receber
CREATE TRIGGER trigger_sync_contas_receber_from_orcamento
  AFTER UPDATE OF status ON public.orcamentos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_contas_receber_from_orcamento();

-- Comentário explicativo
COMMENT ON FUNCTION public.sync_contas_receber_from_orcamento() IS 
'Sincroniza o status das contas_receber quando o status do orçamento muda. Se orçamento fica pago, marca conta como paga. Se orçamento é cancelado, cancela a conta (exceto se já está pago).';

-- =====================================================
-- Também garantir sincronização de parcelas quando conta muda
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_parcelas_from_conta_receber()
RETURNS TRIGGER AS $$
BEGIN
  -- Se conta foi paga, marcar todas parcelas pendentes como pagas
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    UPDATE public.parcelas_receber
    SET 
      status = 'pago',
      data_pagamento = COALESCE(NEW.updated_at, NOW()),
      updated_at = NOW()
    WHERE conta_receber_id = NEW.id
      AND status = 'pendente';
  END IF;

  -- Se conta foi cancelada, cancelar parcelas pendentes
  IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    UPDATE public.parcelas_receber
    SET 
      status = 'cancelado',
      updated_at = NOW()
    WHERE conta_receber_id = NEW.id
      AND status IN ('pendente', 'parcial');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_sync_parcelas_from_conta ON public.contas_receber;

-- Criar trigger para sincronização conta_receber → parcelas
CREATE TRIGGER trigger_sync_parcelas_from_conta
  AFTER UPDATE OF status ON public.contas_receber
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_parcelas_from_conta_receber();

-- Comentário
COMMENT ON FUNCTION public.sync_parcelas_from_conta_receber() IS 
'Sincroniza o status das parcelas quando o status da conta_receber muda.';
