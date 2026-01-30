-- Função para sincronizar status do orçamento com etapa da oportunidade
CREATE OR REPLACE FUNCTION public.sync_orcamento_to_oportunidade()
RETURNS TRIGGER AS $$
DECLARE
  nova_etapa TEXT;
  nova_temperatura TEXT;
BEGIN
  -- Só processar se o status mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Mapear status para etapa
  CASE NEW.status
    WHEN 'rascunho' THEN nova_etapa := 'qualificacao'; nova_temperatura := 'morno';
    WHEN 'finalizado' THEN nova_etapa := 'proposta'; nova_temperatura := 'morno';
    WHEN 'enviado' THEN nova_etapa := 'proposta'; nova_temperatura := 'morno';
    WHEN 'sem_resposta' THEN nova_etapa := 'negociacao'; nova_temperatura := 'frio';
    WHEN 'pago_40' THEN nova_etapa := 'negociacao'; nova_temperatura := 'quente';
    WHEN 'pago_parcial' THEN nova_etapa := 'negociacao'; nova_temperatura := 'quente';
    WHEN 'pago_60' THEN nova_etapa := 'negociacao'; nova_temperatura := 'quente';
    WHEN 'pago' THEN nova_etapa := 'fechado_ganho'; nova_temperatura := 'quente';
    WHEN 'recusado' THEN nova_etapa := 'fechado_perdido'; nova_temperatura := 'frio';
    WHEN 'cancelado' THEN nova_etapa := 'fechado_perdido'; nova_temperatura := 'frio';
    ELSE nova_etapa := 'qualificacao'; nova_temperatura := 'morno';
  END CASE;

  -- Atualizar oportunidade vinculada
  UPDATE oportunidades 
  SET 
    etapa = nova_etapa,
    temperatura = nova_temperatura,
    valor_estimado = COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
    updated_at = NOW()
  WHERE orcamento_id = NEW.id
  AND etapa NOT IN ('fechado_ganho', 'fechado_perdido');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para sincronizar quando status do orçamento mudar
DROP TRIGGER IF EXISTS trg_sync_orcamento_to_oportunidade ON orcamentos;
CREATE TRIGGER trg_sync_orcamento_to_oportunidade
AFTER UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.sync_orcamento_to_oportunidade();

-- Função para criar oportunidade automaticamente ao criar orçamento
CREATE OR REPLACE FUNCTION public.auto_create_oportunidade_from_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Só criar se não existir oportunidade vinculada
  IF NOT EXISTS (SELECT 1 FROM oportunidades WHERE orcamento_id = NEW.id) THEN
    INSERT INTO oportunidades (
      titulo,
      contato_id,
      orcamento_id,
      valor_estimado,
      etapa,
      temperatura,
      origem,
      created_by_user_id
    ) VALUES (
      NEW.codigo || ' - ' || NEW.cliente_nome,
      NEW.contato_id,
      NEW.id,
      COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      'qualificacao',
      'morno',
      'orcamento',
      NEW.created_by_user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar oportunidade ao criar orçamento
DROP TRIGGER IF EXISTS trg_auto_create_oportunidade ON orcamentos;
CREATE TRIGGER trg_auto_create_oportunidade
AFTER INSERT ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_oportunidade_from_orcamento();

-- Função para criar contato e oportunidade a partir de solicitação de visita
CREATE OR REPLACE FUNCTION public.process_visit_request_to_crm()
RETURNS TRIGGER AS $$
DECLARE
  v_contato_id uuid;
  v_user_id uuid;
BEGIN
  -- Só processar quando status mudar para 'confirmada'
  IF NEW.status != 'confirmada' OR OLD.status = 'confirmada' THEN
    RETURN NEW;
  END IF;

  -- Usar o usuário que visualizou a solicitação como created_by
  v_user_id := COALESCE(NEW.visualizada_por, (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1));
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar se já existe contato com mesmo telefone
  SELECT id INTO v_contato_id
  FROM contatos
  WHERE telefone = NEW.telefone
  LIMIT 1;

  -- Se não existe, criar contato
  IF v_contato_id IS NULL THEN
    INSERT INTO contatos (
      nome,
      email,
      telefone,
      cidade,
      endereco,
      tipo,
      origem,
      observacoes,
      created_by_user_id
    ) VALUES (
      NEW.nome,
      NEW.email,
      NEW.telefone,
      NEW.cidade,
      COALESCE(NEW.endereco, '') || COALESCE(' - ' || NEW.complemento, ''),
      'lead',
      'visita_site',
      NEW.mensagem,
      v_user_id
    )
    RETURNING id INTO v_contato_id;
  END IF;

  -- Criar oportunidade a partir da visita
  INSERT INTO oportunidades (
    titulo,
    contato_id,
    etapa,
    temperatura,
    origem,
    observacoes,
    created_by_user_id
  ) VALUES (
    'Visita - ' || NEW.nome,
    v_contato_id,
    'prospeccao',
    'morno',
    'visita_site',
    'Solicitação de visita para ' || to_char(NEW.data_agendada, 'DD/MM/YYYY') || ' às ' || NEW.horario_agendado,
    v_user_id
  );

  -- Criar atividade de visita
  INSERT INTO atividades_crm (
    titulo,
    tipo,
    contato_id,
    data_atividade,
    data_lembrete,
    descricao,
    created_by_user_id
  ) VALUES (
    'Visita agendada - ' || NEW.nome,
    'visita',
    v_contato_id,
    (NEW.data_agendada || ' ' || NEW.horario_agendado || ':00')::timestamp with time zone,
    (NEW.data_agendada || ' ' || NEW.horario_agendado || ':00')::timestamp with time zone - interval '1 hour',
    'Endereço: ' || COALESCE(NEW.endereco, 'Não informado') || E'\n' || 
    'Cidade: ' || NEW.cidade || E'\n' ||
    'Mensagem: ' || COALESCE(NEW.mensagem, 'Sem mensagem'),
    v_user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para processar solicitação de visita
DROP TRIGGER IF EXISTS trg_process_visit_to_crm ON solicitacoes_visita;
CREATE TRIGGER trg_process_visit_to_crm
AFTER UPDATE ON solicitacoes_visita
FOR EACH ROW
EXECUTE FUNCTION public.process_visit_request_to_crm();