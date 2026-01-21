-- =====================================================
-- MELHORIA: Sincronização bidirecional Orçamento ↔ Contas Receber
-- =====================================================

-- Melhorar função de sincronização para considerar tolerância e ser mais robusta
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
  v_status_atual text;
  v_tolerancia_valor numeric := 5.00; -- R$ 5,00
  v_tolerancia_percent numeric := 0.5; -- 0,5%
  v_diferenca numeric;
  v_percentual_diferenca numeric;
BEGIN
  -- Buscar orcamento_id e dados da conta receber
  SELECT orcamento_id, valor_total, valor_pago 
  INTO v_orcamento_id, v_valor_total, v_valor_pago
  FROM contas_receber
  WHERE id = NEW.id;
  
  -- Se não tem orçamento vinculado, não faz nada
  IF v_orcamento_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar status atual do orçamento para evitar atualizações desnecessárias
  SELECT status INTO v_status_atual
  FROM orcamentos
  WHERE id = v_orcamento_id;

  -- Se já está cancelado, não atualizar
  IF v_status_atual = 'cancelado' THEN
    RETURN NEW;
  END IF;

  -- Calcular percentual pago
  IF v_valor_total > 0 THEN
    v_percentual := (v_valor_pago / v_valor_total) * 100;
  ELSE
    v_percentual := 0;
  END IF;

  -- Calcular diferença e percentual para tolerância
  v_diferenca := v_valor_total - v_valor_pago;
  IF v_valor_total > 0 THEN
    v_percentual_diferenca := (v_diferenca / v_valor_total) * 100;
  ELSE
    v_percentual_diferenca := 0;
  END IF;

  -- Determinar novo status baseado no percentual E tolerância
  -- Considera pago se:
  -- 1. Status da conta é 'pago', OU
  -- 2. Percentual >= 100%, OU
  -- 3. Diferença está dentro da tolerância (R$ 5 ou 0,5%)
  IF NEW.status = 'pago' OR v_percentual >= 100 OR 
     (v_diferenca <= v_tolerancia_valor AND v_percentual_diferenca <= v_tolerancia_percent) THEN
    v_novo_status := 'pago';
  ELSIF v_percentual >= 60 THEN
    v_novo_status := 'pago_60';
  ELSIF v_percentual >= 50 THEN
    v_novo_status := 'pago_parcial';
  ELSIF v_percentual >= 40 THEN
    v_novo_status := 'pago_40';
  ELSE
    -- Se menos de 40%, não atualizar status do orçamento
    -- (mantém status atual, pode ser 'enviado', 'finalizado', etc.)
    RETURN NEW;
  END IF;

  -- Só atualizar se o status mudou (evitar loops infinitos e atualizações desnecessárias)
  IF v_status_atual = v_novo_status THEN
    RETURN NEW;
  END IF;

  -- Atualizar status do orçamento
  -- Não sobrescrever se já está cancelado ou se já está pago e o novo status não é pago
  UPDATE orcamentos
  SET 
    status = v_novo_status,
    status_updated_at = NOW()
  WHERE id = v_orcamento_id
    AND status NOT IN ('cancelado')
    AND (status != 'pago' OR v_novo_status = 'pago'); -- Só atualizar se não está pago OU se novo status é pago

  RETURN NEW;
END;
$$;

-- Garantir que o trigger está configurado corretamente
DROP TRIGGER IF EXISTS trigger_sincronizar_status_orcamento ON contas_receber;

-- Criar trigger que executa após UPDATE de status ou valor_pago
-- IMPORTANTE: Este trigger será chamado automaticamente quando o trigger
-- 'atualizar_conta_receber_por_parcela' atualizar contas_receber
CREATE TRIGGER trigger_sincronizar_status_orcamento
  AFTER UPDATE OF status, valor_pago ON contas_receber
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.valor_pago IS DISTINCT FROM NEW.valor_pago)
  EXECUTE FUNCTION sincronizar_status_orcamento();

-- Comentário explicativo
COMMENT ON FUNCTION public.sincronizar_status_orcamento() IS 
'Sincroniza automaticamente o status do orçamento quando contas_receber é atualizado. Considera tolerância de R$ 5 ou 0,5% para considerar pagamento completo. Evita loops infinitos verificando se o status mudou antes de atualizar.';

-- =====================================================
-- MELHORIA: Garantir que contas_receber seja criada quando orçamento muda para status de pagamento
-- =====================================================

-- Melhorar função que cria conta a receber quando orçamento muda para status de pagamento
CREATE OR REPLACE FUNCTION public.ensure_conta_receber_on_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_status_com_pagamento text[] := ARRAY['pago_40', 'pago_parcial', 'pago_60', 'pago'];
  v_status_anteriores_sem_pagamento text[] := ARRAY['rascunho', 'enviado', 'vencido', 'finalizado', 'sem_resposta'];
  v_conta_existente_id uuid;
  v_valor_total numeric;
BEGIN
  -- Só executa se:
  -- 1. O status mudou para um status de pagamento
  -- 2. O status anterior NÃO era um status de pagamento
  IF NEW.status = ANY(v_status_com_pagamento) 
     AND (OLD.status IS NULL OR OLD.status = ANY(v_status_anteriores_sem_pagamento))
  THEN
    -- Verificar se já existe conta a receber para este orçamento
    SELECT id INTO v_conta_existente_id
    FROM public.contas_receber 
    WHERE orcamento_id = NEW.id
    LIMIT 1;
    
    -- Se não existe, criar
    IF v_conta_existente_id IS NULL THEN
      v_valor_total := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
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
        v_valor_total,
        0,
        1,
        'pendente',
        (CURRENT_DATE + INTERVAL '30 days'),
        'Conta criada automaticamente - ' || NEW.codigo,
        NEW.organization_id,
        NEW.created_by_user_id
      )
      RETURNING id INTO v_conta_existente_id;
      
      -- Criar a parcela única
      INSERT INTO public.parcelas_receber (
        conta_receber_id,
        numero_parcela,
        valor,
        data_vencimento,
        status
      ) VALUES (
        v_conta_existente_id,
        1,
        v_valor_total,
        CURRENT_DATE + INTERVAL '30 days',
        'pendente'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garantir que o trigger está configurado
DROP TRIGGER IF EXISTS trigger_ensure_conta_receber ON public.orcamentos;

CREATE TRIGGER trigger_ensure_conta_receber
AFTER UPDATE OF status ON public.orcamentos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.ensure_conta_receber_on_payment_status();

-- Comentário explicativo
COMMENT ON FUNCTION public.ensure_conta_receber_on_payment_status() IS 
'Cria automaticamente uma conta a receber quando o status do orçamento muda para um status de pagamento (pago_40, pago_parcial, pago_60, pago) e ainda não existe conta a receber vinculada.';
