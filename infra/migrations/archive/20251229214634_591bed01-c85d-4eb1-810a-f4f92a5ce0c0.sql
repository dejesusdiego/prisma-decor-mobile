-- Trigger para criar notificações de cobrança para pagamentos parciais e atrasados
CREATE OR REPLACE FUNCTION public.criar_notificacao_cobranca_parcial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_nome TEXT;
  v_user_id UUID;
  v_tipo_notificacao TEXT;
  v_titulo TEXT;
  v_mensagem TEXT;
  v_prioridade TEXT;
BEGIN
  -- Só processar parcelas que mudaram para status 'parcial' ou 'atrasado'
  IF NEW.status NOT IN ('parcial', 'atrasado') THEN
    RETURN NEW;
  END IF;
  
  -- Não notificar se status não mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buscar info do cliente
  SELECT cr.cliente_nome, cr.created_by_user_id 
  INTO v_cliente_nome, v_user_id
  FROM contas_receber cr
  WHERE cr.id = NEW.conta_receber_id;
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Definir tipo e mensagem baseado no status
  IF NEW.status = 'parcial' THEN
    v_tipo_notificacao := 'pagamento_parcial';
    v_titulo := 'Pagamento Parcial Recebido';
    v_mensagem := 'Cliente ' || v_cliente_nome || ' pagou parcialmente a parcela ' || NEW.numero_parcela || 
                  '. Valor pendente a cobrar.';
    v_prioridade := 'normal';
  ELSE -- atrasado
    v_tipo_notificacao := 'pagamento_atrasado';
    v_titulo := 'Parcela em Atraso - Cobrar';
    v_mensagem := 'Parcela ' || NEW.numero_parcela || ' de ' || v_cliente_nome || 
                  ' (R$ ' || NEW.valor || ') está em atraso desde ' || to_char(NEW.data_vencimento, 'DD/MM/YYYY');
    v_prioridade := CASE 
      WHEN NEW.data_vencimento < CURRENT_DATE - INTERVAL '7 days' THEN 'urgente'
      WHEN NEW.data_vencimento < CURRENT_DATE - INTERVAL '3 days' THEN 'alta'
      ELSE 'normal'
    END;
  END IF;
  
  -- Criar notificação (evitar duplicatas)
  INSERT INTO notificacoes (
    user_id, tipo, titulo, mensagem, prioridade,
    referencia_tipo, referencia_id, data_lembrete
  ) VALUES (
    v_user_id,
    v_tipo_notificacao,
    v_titulo,
    v_mensagem,
    v_prioridade,
    'parcela_receber',
    NEW.id,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_notificacao_cobranca_parcial ON parcelas_receber;
CREATE TRIGGER trigger_notificacao_cobranca_parcial
  AFTER UPDATE ON parcelas_receber
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_cobranca_parcial();

-- Trigger para contas_receber também (quando status muda para parcial/atrasado)
CREATE OR REPLACE FUNCTION public.criar_notificacao_conta_atrasada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só processar se status mudou para atrasado
  IF NEW.status != 'atrasado' OR OLD.status = 'atrasado' THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO notificacoes (
    user_id, tipo, titulo, mensagem, prioridade,
    referencia_tipo, referencia_id, data_lembrete
  ) VALUES (
    NEW.created_by_user_id,
    'pagamento_atrasado',
    'Conta a Receber em Atraso',
    'Conta de ' || NEW.cliente_nome || ' (R$ ' || (NEW.valor_total - NEW.valor_pago) || ' pendente) está em atraso',
    CASE 
      WHEN NEW.data_vencimento < CURRENT_DATE - INTERVAL '7 days' THEN 'urgente'
      ELSE 'alta'
    END,
    'conta_receber',
    NEW.id,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificacao_conta_atrasada ON contas_receber;
CREATE TRIGGER trigger_notificacao_conta_atrasada
  AFTER UPDATE ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_conta_atrasada();