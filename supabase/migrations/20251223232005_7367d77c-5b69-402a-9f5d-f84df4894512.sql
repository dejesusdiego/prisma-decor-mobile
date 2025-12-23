-- Trigger para sincronizar contato quando orçamento é criado/atualizado
CREATE OR REPLACE FUNCTION public.sync_contato_from_orcamento_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contato_id uuid;
  v_valor_orcamento numeric;
BEGIN
  -- Se o status mudou para 'pago'
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
    -- Buscar contato_id do orçamento
    v_contato_id := NEW.contato_id;
    
    -- Se não tem contato vinculado, tentar encontrar pelo telefone
    IF v_contato_id IS NULL THEN
      SELECT id INTO v_contato_id
      FROM contatos
      WHERE telefone = NEW.cliente_telefone
      LIMIT 1;
      
      -- Se encontrou, vincular ao orçamento
      IF v_contato_id IS NOT NULL THEN
        NEW.contato_id := v_contato_id;
      END IF;
    END IF;
    
    -- Se temos contato_id, atualizar o contato
    IF v_contato_id IS NOT NULL THEN
      v_valor_orcamento := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      -- Atualizar tipo para 'cliente' e somar valor_total_gasto
      UPDATE contatos
      SET 
        tipo = 'cliente',
        valor_total_gasto = COALESCE(valor_total_gasto, 0) + v_valor_orcamento,
        updated_at = NOW()
      WHERE id = v_contato_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar contato
DROP TRIGGER IF EXISTS trg_sync_contato_from_orcamento ON orcamentos;
CREATE TRIGGER trg_sync_contato_from_orcamento
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION sync_contato_from_orcamento_changes();

-- Trigger para criar atividades automaticamente quando status do orçamento muda
CREATE OR REPLACE FUNCTION public.create_atividade_from_orcamento_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contato_id uuid;
BEGIN
  -- Só processar se o status mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  v_contato_id := NEW.contato_id;
  
  -- Se status mudou para 'enviado', criar atividade de proposta enviada
  IF NEW.status = 'enviado' AND OLD.status != 'enviado' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Proposta enviada - ' || NEW.codigo,
      'email',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' enviado para ' || NEW.cliente_nome || '. Valor: R$ ' || COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'sem_resposta', criar atividade de follow-up pendente
  IF NEW.status = 'sem_resposta' AND OLD.status != 'sem_resposta' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      data_lembrete,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Follow-up: ' || NEW.codigo,
      'ligacao',
      v_contato_id,
      NEW.id,
      NOW() + INTERVAL '3 days',
      NOW() + INTERVAL '3 days',
      'Ligar para cliente sobre orçamento ' || NEW.codigo || ' que está sem resposta.',
      false,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago', criar atividade de fechamento
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Venda fechada - ' || NEW.codigo,
      'outro',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' foi pago. Valor: R$ ' || COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para criar atividades
DROP TRIGGER IF EXISTS trg_create_atividade_from_orcamento ON orcamentos;
CREATE TRIGGER trg_create_atividade_from_orcamento
  AFTER UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION create_atividade_from_orcamento_status();