-- Criar função para verificar e notificar pedidos atrasados ou próximos do vencimento
CREATE OR REPLACE FUNCTION public.verificar_atrasos_producao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido RECORD;
  v_dias_restantes INTEGER;
BEGIN
  -- Processar pedidos ativos (não entregues/cancelados)
  FOR v_pedido IN 
    SELECT 
      p.id,
      p.numero_pedido,
      p.previsao_entrega,
      p.created_by_user_id,
      o.cliente_nome
    FROM pedidos p
    JOIN orcamentos o ON p.orcamento_id = o.id
    WHERE p.status_producao NOT IN ('entregue', 'cancelado', 'pronto_instalacao', 'pronto_entrega')
    AND p.previsao_entrega IS NOT NULL
  LOOP
    v_dias_restantes := v_pedido.previsao_entrega - CURRENT_DATE;
    
    -- Pedido atrasado (passou da previsão)
    IF v_dias_restantes < 0 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_pedido.created_by_user_id,
        'pedido_atrasado',
        'Pedido em ATRASO',
        'O pedido ' || v_pedido.numero_pedido || ' de ' || v_pedido.cliente_nome || 
        ' está ' || ABS(v_dias_restantes) || ' dia(s) atrasado!',
        'urgente',
        'pedido',
        v_pedido.id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
      
    -- Pedido vence hoje
    ELSIF v_dias_restantes = 0 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_pedido.created_by_user_id,
        'pedido_vence_hoje',
        'Pedido vence HOJE',
        'O pedido ' || v_pedido.numero_pedido || ' de ' || v_pedido.cliente_nome || 
        ' tem previsão de entrega para hoje!',
        'urgente',
        'pedido',
        v_pedido.id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
      
    -- Pedido vence em 2 dias
    ELSIF v_dias_restantes <= 2 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_pedido.created_by_user_id,
        'pedido_prazo_curto',
        'Pedido com prazo curto',
        'O pedido ' || v_pedido.numero_pedido || ' de ' || v_pedido.cliente_nome || 
        ' vence em ' || v_dias_restantes || ' dia(s).',
        'alta',
        'pedido',
        v_pedido.id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Criar trigger que verifica itens parados na mesma etapa por muito tempo
CREATE OR REPLACE FUNCTION public.verificar_itens_parados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_dias_parado INTEGER;
BEGIN
  -- Buscar itens que não estão prontos e verificar última movimentação
  FOR v_item IN 
    SELECT 
      ip.id,
      ip.status_item,
      ip.updated_at,
      p.id as pedido_id,
      p.numero_pedido,
      p.created_by_user_id,
      ci.nome_identificacao,
      o.cliente_nome
    FROM itens_pedido ip
    JOIN pedidos p ON ip.pedido_id = p.id
    JOIN cortina_items ci ON ip.cortina_item_id = ci.id
    JOIN orcamentos o ON p.orcamento_id = o.id
    WHERE ip.status_item NOT IN ('pronto', 'fila')
    AND p.status_producao NOT IN ('entregue', 'cancelado')
  LOOP
    v_dias_parado := CURRENT_DATE - ip.updated_at::date;
    
    -- Item parado há mais de 3 dias úteis (considerando 5 dias para margem)
    IF v_dias_parado >= 5 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_item.created_by_user_id,
        'item_parado',
        'Item parado há ' || v_dias_parado || ' dias',
        'O item "' || COALESCE(v_item.nome_identificacao, 'Sem nome') || '" do pedido ' || 
        v_item.numero_pedido || ' está na etapa "' || v_item.status_item || '" há ' || 
        v_dias_parado || ' dias. Possível gargalo!',
        CASE WHEN v_dias_parado >= 7 THEN 'urgente' ELSE 'alta' END,
        'pedido',
        v_item.pedido_id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION public.verificar_atrasos_producao() IS 
  'Verifica pedidos atrasados ou próximos do vencimento e cria notificações. Deve ser chamada periodicamente via cron.';

COMMENT ON FUNCTION public.verificar_itens_parados() IS 
  'Verifica itens parados na mesma etapa por mais de 5 dias e cria notificações de possível gargalo.';