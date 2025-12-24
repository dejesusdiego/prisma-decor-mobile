-- =============================================
-- MÓDULO DE PRODUÇÃO - ESTRUTURA DE DADOS
-- =============================================

-- 1. Tabela principal de pedidos (gerados a partir de orçamentos pagos)
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  numero_pedido TEXT NOT NULL UNIQUE,
  status_producao TEXT NOT NULL DEFAULT 'aguardando_materiais',
  prioridade TEXT NOT NULL DEFAULT 'normal',
  data_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  previsao_entrega DATE,
  data_pronto TIMESTAMP WITH TIME ZONE,
  observacoes_producao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  CONSTRAINT pedidos_status_check CHECK (status_producao IN ('aguardando_materiais', 'em_producao', 'qualidade', 'pronto', 'entregue', 'cancelado')),
  CONSTRAINT pedidos_prioridade_check CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente'))
);

-- 2. Tabela de itens do pedido (cada cortina/persiana)
CREATE TABLE public.itens_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cortina_item_id UUID NOT NULL REFERENCES public.cortina_items(id) ON DELETE CASCADE,
  status_item TEXT NOT NULL DEFAULT 'fila',
  responsavel TEXT,
  data_inicio_corte TIMESTAMP WITH TIME ZONE,
  data_fim_corte TIMESTAMP WITH TIME ZONE,
  data_inicio_costura TIMESTAMP WITH TIME ZONE,
  data_fim_costura TIMESTAMP WITH TIME ZONE,
  data_finalizacao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT itens_pedido_status_check CHECK (status_item IN ('fila', 'corte', 'costura', 'acabamento', 'qualidade', 'pronto'))
);

-- 3. Tabela de histórico/timeline de produção
CREATE TABLE public.historico_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  item_pedido_id UUID REFERENCES public.itens_pedido(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  descricao TEXT NOT NULL,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL
);

-- 4. Tabela de instalações
CREATE TABLE public.instalacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  data_agendada DATE NOT NULL,
  turno TEXT NOT NULL DEFAULT 'manha',
  instalador TEXT,
  status TEXT NOT NULL DEFAULT 'agendada',
  endereco TEXT NOT NULL,
  cidade TEXT,
  observacoes TEXT,
  data_realizada TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  CONSTRAINT instalacoes_turno_check CHECK (turno IN ('manha', 'tarde', 'dia_todo')),
  CONSTRAINT instalacoes_status_check CHECK (status IN ('agendada', 'confirmada', 'em_andamento', 'concluida', 'reagendada', 'cancelada'))
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_pedidos_orcamento ON public.pedidos(orcamento_id);
CREATE INDEX idx_pedidos_status ON public.pedidos(status_producao);
CREATE INDEX idx_pedidos_data_entrada ON public.pedidos(data_entrada);
CREATE INDEX idx_itens_pedido_pedido ON public.itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_status ON public.itens_pedido(status_item);
CREATE INDEX idx_historico_pedido ON public.historico_producao(pedido_id);
CREATE INDEX idx_instalacoes_pedido ON public.instalacoes(pedido_id);
CREATE INDEX idx_instalacoes_data ON public.instalacoes(data_agendada);

-- =============================================
-- HABILITAR RLS
-- =============================================
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - PEDIDOS
-- =============================================
CREATE POLICY "Usuários podem ver pedidos de seus orçamentos"
  ON public.pedidos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = pedidos.orcamento_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar pedidos de seus orçamentos"
  ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar pedidos de seus orçamentos"
  ON public.pedidos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = pedidos.orcamento_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Apenas admins podem deletar pedidos"
  ON public.pedidos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- POLÍTICAS RLS - ITENS PEDIDO
-- =============================================
CREATE POLICY "Usuários podem ver itens de seus pedidos"
  ON public.itens_pedido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = itens_pedido.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar itens em seus pedidos"
  ON public.itens_pedido FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = itens_pedido.pedido_id
      AND o.created_by_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens de seus pedidos"
  ON public.itens_pedido FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = itens_pedido.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Apenas admins podem deletar itens"
  ON public.itens_pedido FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- POLÍTICAS RLS - HISTÓRICO PRODUÇÃO
-- =============================================
CREATE POLICY "Usuários podem ver histórico de seus pedidos"
  ON public.historico_producao FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = historico_producao.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar histórico em seus pedidos"
  ON public.historico_producao FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = historico_producao.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- =============================================
-- POLÍTICAS RLS - INSTALAÇÕES
-- =============================================
CREATE POLICY "Usuários podem ver instalações de seus pedidos"
  ON public.instalacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = instalacoes.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar instalações"
  ON public.instalacoes FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar instalações de seus pedidos"
  ON public.instalacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = instalacoes.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Apenas admins podem deletar instalações"
  ON public.instalacoes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para gerar número do pedido sequencial
CREATE OR REPLACE FUNCTION public.gerar_numero_pedido()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  novo_numero TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN numero_pedido ~ ('^PED-' || ano || '-[0-9]+$')
      THEN CAST(SUBSTRING(numero_pedido FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequencia
  FROM public.pedidos
  WHERE numero_pedido LIKE 'PED-' || ano || '-%';
  
  novo_numero := 'PED-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN novo_numero;
END;
$$;

-- Função para criar pedido automaticamente quando orçamento atinge 40%+
CREATE OR REPLACE FUNCTION public.auto_create_pedido_from_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id UUID;
  v_numero_pedido TEXT;
  v_item RECORD;
BEGIN
  -- Só processar se o status mudou para um dos status de pagamento
  IF NEW.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe pedido para este orçamento
  IF EXISTS (SELECT 1 FROM public.pedidos WHERE orcamento_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Gerar número do pedido
  v_numero_pedido := public.gerar_numero_pedido();
  
  -- Criar o pedido
  INSERT INTO public.pedidos (
    orcamento_id,
    numero_pedido,
    status_producao,
    prioridade,
    previsao_entrega,
    observacoes_producao,
    created_by_user_id
  ) VALUES (
    NEW.id,
    v_numero_pedido,
    'aguardando_materiais',
    CASE 
      WHEN NEW.status = 'pago' THEN 'alta'
      WHEN NEW.status = 'pago_60' THEN 'normal'
      ELSE 'normal'
    END,
    CURRENT_DATE + INTERVAL '15 days',
    'Pedido gerado automaticamente a partir do orçamento ' || NEW.codigo,
    NEW.created_by_user_id
  )
  RETURNING id INTO v_pedido_id;
  
  -- Criar itens do pedido a partir das cortinas do orçamento
  FOR v_item IN 
    SELECT id FROM public.cortina_items WHERE orcamento_id = NEW.id
  LOOP
    INSERT INTO public.itens_pedido (
      pedido_id,
      cortina_item_id,
      status_item
    ) VALUES (
      v_pedido_id,
      v_item.id,
      'fila'
    );
  END LOOP;
  
  -- Registrar no histórico
  INSERT INTO public.historico_producao (
    pedido_id,
    tipo_evento,
    status_novo,
    descricao,
    usuario_id,
    usuario_nome
  ) VALUES (
    v_pedido_id,
    'criacao',
    'aguardando_materiais',
    'Pedido criado automaticamente a partir do orçamento ' || NEW.codigo || ' (status: ' || NEW.status || ')',
    NEW.created_by_user_id,
    (SELECT COALESCE(email, 'Sistema') FROM auth.users WHERE id = NEW.created_by_user_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para criar pedido automaticamente
CREATE TRIGGER trigger_auto_create_pedido
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.auto_create_pedido_from_orcamento();

-- Função para registrar mudanças de status no histórico
CREATE OR REPLACE FUNCTION public.registrar_historico_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status_item IS DISTINCT FROM NEW.status_item THEN
    INSERT INTO public.historico_producao (
      pedido_id,
      item_pedido_id,
      tipo_evento,
      status_anterior,
      status_novo,
      descricao,
      usuario_id,
      usuario_nome
    ) VALUES (
      NEW.pedido_id,
      NEW.id,
      'mudanca_status',
      OLD.status_item,
      NEW.status_item,
      'Item movido de "' || OLD.status_item || '" para "' || NEW.status_item || '"',
      auth.uid(),
      (SELECT COALESCE(email, 'Sistema') FROM auth.users WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar histórico de itens
CREATE TRIGGER trigger_registrar_historico_item
  AFTER UPDATE ON public.itens_pedido
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_item();

-- Triggers para updated_at
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_pedido_updated_at
  BEFORE UPDATE ON public.itens_pedido
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instalacoes_updated_at
  BEFORE UPDATE ON public.instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();