CREATE OR REPLACE FUNCTION public.process_visit_request_to_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contato_id uuid;
  v_user_id uuid;
  v_horario_inicial text;
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

  -- Extrair apenas o horário inicial do intervalo (ex: "16:00" de "16:00 - 17:00")
  v_horario_inicial := split_part(NEW.horario_agendado, ' - ', 1);

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
      CASE WHEN NEW.email LIKE '%@whatsapp.manual' THEN NULL ELSE NEW.email END,
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

  -- Criar atividade de visita com horário corrigido
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
    (NEW.data_agendada || ' ' || v_horario_inicial || ':00')::timestamp with time zone,
    (NEW.data_agendada || ' ' || v_horario_inicial || ':00')::timestamp with time zone - interval '1 hour',
    'Endereço: ' || COALESCE(NEW.endereco, 'Não informado') || E'\n' || 
    'Cidade: ' || NEW.cidade || E'\n' ||
    'Mensagem: ' || COALESCE(NEW.mensagem, 'Sem mensagem'),
    v_user_id
  );

  RETURN NEW;
END;
$function$;