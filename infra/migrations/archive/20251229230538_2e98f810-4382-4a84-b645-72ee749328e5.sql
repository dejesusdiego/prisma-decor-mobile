-- Função para auto-criar conta a receber quando orçamento for enviado
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber_enviado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_valor_total numeric;
  v_conta_receber_id uuid;
BEGIN
  -- Só processar se status mudou para 'enviado' e não tinha conta ainda
  IF NEW.status = 'enviado' AND (OLD.status IS NULL OR OLD.status != 'enviado') THEN
    -- Verificar se já existe conta para este orçamento
    IF NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE orcamento_id = NEW.id) THEN
      -- Usar valor com desconto ou valor geral
      v_valor_total := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      -- Só criar se tiver valor
      IF v_valor_total > 0 THEN
        -- Criar conta a receber com status 'aguardando' (diferente de pendente)
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
          observacoes,
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
          'Conta criada automaticamente ao enviar orçamento. Aguardando confirmação do cliente.',
          NEW.created_by_user_id
        )
        RETURNING id INTO v_conta_receber_id;
        
        -- Criar parcela única inicial
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
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para auto-criar conta a receber no status enviado
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber_enviado ON public.orcamentos;
CREATE TRIGGER trigger_auto_criar_conta_receber_enviado
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_criar_conta_receber_enviado();