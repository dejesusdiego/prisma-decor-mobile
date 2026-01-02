-- ============================================
-- 1. Função para calcular previsão de entrega inteligente
-- ============================================
CREATE OR REPLACE FUNCTION public.calcular_previsao_entrega(p_orcamento_id uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_days INTEGER := 5;
  v_total_items INTEGER;
  v_motorizados INTEGER;
  v_fabricas INTEGER;
  v_carga_etapas INTEGER;
  v_dias_totais INTEGER;
BEGIN
  -- Contar itens do orçamento
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE motorizada = true),
    COUNT(*) FILTER (WHERE fabrica IS NOT NULL AND fabrica != '')
  INTO v_total_items, v_motorizados, v_fabricas
  FROM cortina_items
  WHERE orcamento_id = p_orcamento_id;

  -- Verificar carga atual nas etapas (itens não prontos em produção)
  SELECT COUNT(*)
  INTO v_carga_etapas
  FROM itens_pedido ip
  JOIN pedidos p ON ip.pedido_id = p.id
  WHERE ip.status_item NOT IN ('pronto', 'fila')
  AND p.status_producao NOT IN ('entregue', 'cancelado');

  -- Calcular dias totais
  v_dias_totais := v_base_days;
  v_dias_totais := v_dias_totais + (GREATEST(v_total_items - 1, 0) * 2); -- +2 por item adicional
  v_dias_totais := v_dias_totais + (v_motorizados * 3); -- +3 por motorizado
  v_dias_totais := v_dias_totais + (v_fabricas * 5); -- +5 por fábrica externa
  
  IF v_carga_etapas > 10 THEN
    v_dias_totais := v_dias_totais + 2; -- Carga alta nas etapas
  END IF;

  RETURN CURRENT_DATE + v_dias_totais;
END;
$$;

-- ============================================
-- 2. Atualizar trigger para usar previsão inteligente
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_create_pedido_from_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id UUID;
  v_numero_pedido TEXT;
  v_item RECORD;
  v_previsao_entrega DATE;
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
  
  -- Calcular previsão de entrega inteligente
  v_previsao_entrega := public.calcular_previsao_entrega(NEW.id);
  
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
    v_previsao_entrega,
    'Pedido gerado automaticamente a partir do orçamento ' || NEW.codigo || '. Previsão calculada baseada em: itens, motorizados, fábrica externa e carga de produção.',
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
    'Pedido criado automaticamente a partir do orçamento ' || NEW.codigo || ' (status: ' || NEW.status || '). Previsão: ' || v_previsao_entrega,
    NEW.created_by_user_id,
    (SELECT COALESCE(email, 'Sistema') FROM auth.users WHERE id = NEW.created_by_user_id)
  );
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 3. Tabela de materiais por pedido
-- ============================================
CREATE TABLE IF NOT EXISTS public.materiais_pedido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  material_id text NOT NULL,
  nome_material text NOT NULL,
  categoria text NOT NULL,
  quantidade_necessaria numeric NOT NULL DEFAULT 1,
  unidade text DEFAULT 'm',
  recebido boolean DEFAULT false,
  data_recebimento timestamp with time zone,
  recebido_por uuid,
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_materiais_pedido_pedido ON public.materiais_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_materiais_pedido_recebido ON public.materiais_pedido(recebido);

-- Habilitar RLS
ALTER TABLE public.materiais_pedido ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso para usuários autenticados via pedidos)
CREATE POLICY "Usuarios podem ver materiais de seus pedidos"
  ON public.materiais_pedido FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pedidos p
    JOIN orcamentos o ON o.id = p.orcamento_id
    WHERE p.id = materiais_pedido.pedido_id
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Usuarios podem inserir materiais em seus pedidos"
  ON public.materiais_pedido FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pedidos p
    JOIN orcamentos o ON o.id = p.orcamento_id
    WHERE p.id = materiais_pedido.pedido_id
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Usuarios podem atualizar materiais de seus pedidos"
  ON public.materiais_pedido FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM pedidos p
    JOIN orcamentos o ON o.id = p.orcamento_id
    WHERE p.id = materiais_pedido.pedido_id
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Admins podem deletar materiais"
  ON public.materiais_pedido FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 4. Trigger para popular materiais automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.popular_materiais_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_material_nome TEXT;
BEGIN
  -- Para cada item da cortina do orçamento
  FOR v_item IN 
    SELECT ci.* 
    FROM cortina_items ci
    WHERE ci.orcamento_id = NEW.orcamento_id
  LOOP
    -- Tecido
    IF v_item.tecido_id IS NOT NULL AND v_item.tecido_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.tecido_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.tecido_id, COALESCE(v_material_nome, 'Tecido'), 'Tecido', 
              ROUND((v_item.largura * v_item.altura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm²')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Forro
    IF v_item.forro_id IS NOT NULL AND v_item.forro_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.forro_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.forro_id, COALESCE(v_material_nome, 'Forro'), 'Forro',
              ROUND((v_item.largura * v_item.altura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm²')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Trilho
    IF v_item.trilho_id IS NOT NULL AND v_item.trilho_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.trilho_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.trilho_id, COALESCE(v_material_nome, 'Trilho'), 'Trilho',
              ROUND((v_item.largura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Material principal (para persianas)
    IF v_item.material_principal_id IS NOT NULL AND v_item.material_principal_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.material_principal_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.material_principal_id, COALESCE(v_material_nome, 'Persiana'), 'Persiana',
              ROUND((v_item.largura * v_item.altura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm²')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_popular_materiais_pedido ON public.pedidos;
CREATE TRIGGER trigger_popular_materiais_pedido
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.popular_materiais_pedido();

-- ============================================
-- 5. Trigger para verificar materiais completos e avançar status
-- ============================================
CREATE OR REPLACE FUNCTION public.verificar_materiais_completos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_todos_recebidos boolean;
  v_pedido_status text;
BEGIN
  -- Verificar status atual do pedido
  SELECT status_producao INTO v_pedido_status
  FROM pedidos WHERE id = NEW.pedido_id;
  
  -- Só processar se pedido está aguardando materiais
  IF v_pedido_status != 'aguardando_materiais' THEN
    RETURN NEW;
  END IF;

  -- Verificar se todos os materiais foram recebidos
  SELECT NOT EXISTS (
    SELECT 1 FROM materiais_pedido 
    WHERE pedido_id = NEW.pedido_id AND recebido = false
  ) INTO v_todos_recebidos;
  
  -- Se todos recebidos, mudar status para em_producao
  IF v_todos_recebidos THEN
    UPDATE pedidos
    SET status_producao = 'em_producao',
        updated_at = NOW()
    WHERE id = NEW.pedido_id;
    
    -- Registrar no histórico
    INSERT INTO historico_producao (
      pedido_id,
      tipo_evento,
      status_anterior,
      status_novo,
      descricao,
      usuario_id,
      usuario_nome
    ) VALUES (
      NEW.pedido_id,
      'mudanca_status',
      'aguardando_materiais',
      'em_producao',
      'Status alterado automaticamente: todos os materiais foram recebidos',
      COALESCE(NEW.recebido_por, auth.uid()),
      COALESCE((SELECT email FROM auth.users WHERE id = COALESCE(NEW.recebido_por, auth.uid())), 'Sistema')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_verificar_materiais_completos ON public.materiais_pedido;
CREATE TRIGGER trigger_verificar_materiais_completos
  AFTER UPDATE OF recebido ON public.materiais_pedido
  FOR EACH ROW
  WHEN (NEW.recebido = true AND OLD.recebido = false)
  EXECUTE FUNCTION public.verificar_materiais_completos();