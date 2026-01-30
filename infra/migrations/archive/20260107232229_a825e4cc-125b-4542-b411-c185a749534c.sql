-- 1. Remover policy RLS duplicada em solicitacoes_visita
DROP POLICY IF EXISTS "Anyone can create solicitacao_visita" ON public.solicitacoes_visita;

-- 2. Criar trigger para atualizar valor_total_gasto em contatos quando orçamentos são pagos
CREATE OR REPLACE FUNCTION public.atualizar_valor_total_gasto_contato()
RETURNS TRIGGER AS $$
DECLARE
  v_contato_id UUID;
  v_total NUMERIC;
BEGIN
  -- Buscar o contato_id do orçamento relacionado à conta receber
  SELECT o.contato_id INTO v_contato_id
  FROM contas_receber cr
  JOIN orcamentos o ON o.id = cr.orcamento_id
  WHERE cr.id = COALESCE(NEW.id, OLD.id);
  
  -- Se não encontrou contato, retorna
  IF v_contato_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calcular total pago de todos os orçamentos do contato
  SELECT COALESCE(SUM(cr.valor_pago), 0) INTO v_total
  FROM contas_receber cr
  JOIN orcamentos o ON o.id = cr.orcamento_id
  WHERE o.contato_id = v_contato_id;
  
  -- Atualizar o campo valor_total_gasto no contato
  UPDATE contatos
  SET valor_total_gasto = v_total,
      updated_at = NOW()
  WHERE id = v_contato_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_atualizar_valor_total_gasto ON public.contas_receber;
CREATE TRIGGER trg_atualizar_valor_total_gasto
  AFTER INSERT OR UPDATE OF valor_pago OR DELETE
  ON public.contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_valor_total_gasto_contato();

-- 3. Corrigir itens com preco_venda = 0 aplicando margem correta
UPDATE cortina_items
SET preco_venda = ROUND(custo_total * 1.5, 2), -- Aplica margem de 50%
    updated_at = NOW()
WHERE (preco_venda = 0 OR preco_venda IS NULL)
  AND custo_total > 0;