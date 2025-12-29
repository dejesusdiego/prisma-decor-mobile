-- Função para criar conta a receber automaticamente quando orçamento muda para status de pagamento
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_valor_total numeric;
  v_conta_receber_id uuid;
BEGIN
  -- Só processar se status mudou para um status de pagamento
  IF NEW.status IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago'))
  THEN
    -- Verificar se já existe conta para este orçamento
    IF NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE orcamento_id = NEW.id) THEN
      -- Usar valor com desconto ou valor geral
      v_valor_total := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      -- Criar conta a receber com parcela única
      INSERT INTO public.contas_receber (
        orcamento_id,
        cliente_nome,
        cliente_telefone,
        descricao,
        valor_total,
        valor_pago,
        numero_parcelas,
        data_vencimento,
        status,
        created_by_user_id
      ) VALUES (
        NEW.id,
        NEW.cliente_nome,
        NEW.cliente_telefone,
        'Orçamento ' || NEW.codigo,
        v_valor_total,
        0,
        1,
        CURRENT_DATE + INTERVAL '30 days',
        'pendente',
        NEW.created_by_user_id
      )
      RETURNING id INTO v_conta_receber_id;
      
      -- Criar a parcela única
      INSERT INTO public.parcelas_receber (
        conta_receber_id,
        numero_parcela,
        valor,
        data_vencimento,
        status
      ) VALUES (
        v_conta_receber_id,
        1,
        v_valor_total,
        CURRENT_DATE + INTERVAL '30 days',
        'pendente'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para execução automática (se não existir)
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber ON public.orcamentos;
CREATE TRIGGER trigger_auto_criar_conta_receber
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_criar_conta_receber();