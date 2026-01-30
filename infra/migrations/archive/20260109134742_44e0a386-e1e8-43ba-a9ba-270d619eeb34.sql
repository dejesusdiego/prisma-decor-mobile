-- FASE 1A: Corrigir auto_set_organization_id para não quebrar em tabelas sem created_by_user_id
CREATE OR REPLACE FUNCTION public.auto_set_organization_id()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_record_json JSONB;
BEGIN
  -- Se já tem organization_id, não fazer nada
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Converter NEW para JSONB para verificar campos dinamicamente
  v_record_json := to_jsonb(NEW);
  
  -- Tentar obter user_id de diferentes formas
  IF v_record_json ? 'created_by_user_id' AND (v_record_json->>'created_by_user_id') IS NOT NULL THEN
    v_user_id := (v_record_json->>'created_by_user_id')::UUID;
  ELSIF v_record_json ? 'user_id' AND (v_record_json->>'user_id') IS NOT NULL THEN
    v_user_id := (v_record_json->>'user_id')::UUID;
  ELSE
    -- Fallback para auth.uid() se existir sessão
    v_user_id := auth.uid();
  END IF;
  
  -- Se não conseguiu user_id, retornar sem modificar
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar organization_id do usuário
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    NEW.organization_id := v_org_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FASE 1B: Corrigir criar_notificacao_visita para passar organization_id explicitamente
-- e filtrar admins pela organização correta
CREATE OR REPLACE FUNCTION public.criar_notificacao_visita()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_org_id UUID;
BEGIN
  -- Usar organization_id da visita
  v_org_id := NEW.organization_id;
  
  -- Buscar admins da mesma organização
  FOR v_admin_id IN 
    SELECT om.user_id 
    FROM public.organization_members om
    INNER JOIN public.user_roles ur ON ur.user_id = om.user_id
    WHERE ur.role = 'admin'
    AND (v_org_id IS NULL OR om.organization_id = v_org_id)
  LOOP
    INSERT INTO public.notificacoes (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      referencia_tipo,
      referencia_id,
      data_lembrete,
      organization_id
    ) VALUES (
      v_admin_id,
      'visita_nova',
      'Nova solicitação de visita',
      'Cliente ' || NEW.nome || ' solicitou visita para ' || to_char(NEW.data_agendada, 'DD/MM/YYYY'),
      'alta',
      'visita',
      NEW.id,
      NOW(),
      v_org_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FASE 2: Atualizar constraint de status para incluir 'sem_resposta'
ALTER TABLE public.solicitacoes_visita 
DROP CONSTRAINT IF EXISTS solicitacoes_visita_status_check;

ALTER TABLE public.solicitacoes_visita 
ADD CONSTRAINT solicitacoes_visita_status_check 
CHECK (status IN ('pendente', 'confirmada', 'sem_resposta', 'realizada', 'cancelada'));