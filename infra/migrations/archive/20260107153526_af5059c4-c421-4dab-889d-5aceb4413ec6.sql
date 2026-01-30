-- 1. Atualizar trigger create_atividade_from_orcamento_status para:
--    - Evitar duplicatas (verificar se já existe atividade recente)
--    - Adicionar tratamento para status pago_40, pago_60, pago_parcial

CREATE OR REPLACE FUNCTION public.create_atividade_from_orcamento_status()
RETURNS TRIGGER AS $$
DECLARE
  v_contato_id uuid;
  v_atividade_existente uuid;
  v_titulo text;
  v_descricao text;
  v_tipo text;
BEGIN
  -- Só processar se o status mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  v_contato_id := NEW.contato_id;
  
  -- Verificar se já existe atividade similar nos últimos 5 minutos para evitar duplicatas
  SELECT id INTO v_atividade_existente
  FROM atividades_crm
  WHERE orcamento_id = NEW.id
  AND data_atividade > NOW() - INTERVAL '5 minutes'
  AND titulo LIKE '%' || NEW.status || '%'
  LIMIT 1;
  
  IF v_atividade_existente IS NOT NULL THEN
    RETURN NEW; -- Evitar duplicata
  END IF;
  
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
  
  -- Se status mudou para 'pago_40', criar atividade de marco
  IF NEW.status = 'pago_40' AND OLD.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
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
      'Marco 40% - ' || NEW.codigo,
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' atingiu 40% de pagamento. Cliente: ' || NEW.cliente_nome || '. Produção pode ser iniciada.',
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago_parcial', criar atividade
  IF NEW.status = 'pago_parcial' AND OLD.status NOT IN ('pago_parcial', 'pago_60', 'pago') THEN
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
      'Pagamento parcial - ' || NEW.codigo,
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' recebeu pagamento parcial. Cliente: ' || NEW.cliente_nome,
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago_60', criar atividade de marco
  IF NEW.status = 'pago_60' AND OLD.status NOT IN ('pago_60', 'pago') THEN
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
      'Marco 60% - ' || NEW.codigo,
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' atingiu 60% de pagamento. Cliente: ' || NEW.cliente_nome || '. Instalação liberada.',
      true,
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
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' foi TOTALMENTE PAGO. Valor: R$ ' || COALESCE(NEW.total_com_desconto, NEW.total_geral, 0) || '. Cliente: ' || NEW.cliente_nome,
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'recusado', criar atividade
  IF NEW.status = 'recusado' AND OLD.status != 'recusado' THEN
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
      'Proposta recusada - ' || NEW.codigo,
      'outro',
      v_contato_id,
      NEW.id,
      NOW(),
      'O cliente ' || NEW.cliente_nome || ' recusou o orçamento ' || NEW.codigo || '.',
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;