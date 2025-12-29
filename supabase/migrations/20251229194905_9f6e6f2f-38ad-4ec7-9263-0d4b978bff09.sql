-- Função para notificar parcelas a receber vencendo (3 dias antes)
CREATE OR REPLACE FUNCTION public.criar_notificacao_parcela_receber_vencer()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_nome TEXT;
  v_user_id UUID;
BEGIN
  -- Só processar parcelas pendentes que vencem em até 3 dias
  IF NEW.status = 'pendente' 
     AND NEW.data_vencimento <= CURRENT_DATE + INTERVAL '3 days' 
     AND NEW.data_vencimento >= CURRENT_DATE 
  THEN
    -- Buscar nome do cliente e usuário criador
    SELECT cr.cliente_nome, cr.created_by_user_id 
    INTO v_cliente_nome, v_user_id
    FROM contas_receber cr
    WHERE cr.id = NEW.conta_receber_id;
    
    IF v_user_id IS NOT NULL THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_user_id,
        'parcela_vencer',
        'Parcela a receber vencendo',
        'Parcela ' || NEW.numero_parcela || ' de ' || COALESCE(v_cliente_nome, 'Cliente') || 
        ' (R$ ' || NEW.valor || ') vence em ' || to_char(NEW.data_vencimento, 'DD/MM/YYYY'),
        CASE 
          WHEN NEW.data_vencimento = CURRENT_DATE THEN 'urgente'
          WHEN NEW.data_vencimento <= CURRENT_DATE + INTERVAL '1 day' THEN 'alta'
          ELSE 'normal'
        END,
        'parcela_receber',
        NEW.id,
        NEW.data_vencimento::timestamp with time zone
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger na tabela parcelas_receber
CREATE TRIGGER trigger_notificacao_parcela_receber_vencer
AFTER INSERT OR UPDATE ON public.parcelas_receber
FOR EACH ROW
EXECUTE FUNCTION public.criar_notificacao_parcela_receber_vencer();