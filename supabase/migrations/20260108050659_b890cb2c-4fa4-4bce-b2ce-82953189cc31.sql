-- ============================================
-- FASE A: Função e triggers para consistência de totais
-- ============================================

-- Função para recalcular totais do orçamento
CREATE OR REPLACE FUNCTION public.recalcular_totais_orcamento(p_orcamento_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_soma_custo numeric;
  v_soma_preco_venda numeric;
  v_desconto_tipo text;
  v_desconto_valor numeric;
  v_margem_percent numeric;
  v_total_com_desconto numeric;
BEGIN
  -- Buscar soma dos itens
  SELECT 
    COALESCE(SUM(custo_total), 0),
    COALESCE(SUM(preco_venda), 0)
  INTO v_soma_custo, v_soma_preco_venda
  FROM cortina_items
  WHERE orcamento_id = p_orcamento_id;

  -- Buscar dados de desconto do orçamento
  SELECT desconto_tipo, COALESCE(desconto_valor, 0), margem_percent
  INTO v_desconto_tipo, v_desconto_valor, v_margem_percent
  FROM orcamentos
  WHERE id = p_orcamento_id;

  -- Calcular total com desconto
  IF v_desconto_tipo = 'percentual' THEN
    v_total_com_desconto := v_soma_preco_venda * (1 - v_desconto_valor / 100);
  ELSIF v_desconto_tipo = 'valor' THEN
    v_total_com_desconto := v_soma_preco_venda - v_desconto_valor;
  ELSE
    v_total_com_desconto := v_soma_preco_venda;
  END IF;

  -- Garantir que não fique negativo
  IF v_total_com_desconto < 0 THEN
    v_total_com_desconto := 0;
  END IF;

  -- Atualizar orçamento
  UPDATE orcamentos
  SET 
    custo_total = v_soma_custo,
    total_geral = v_soma_preco_venda,
    total_com_desconto = v_total_com_desconto,
    updated_at = now()
  WHERE id = p_orcamento_id;
END;
$$;

-- Trigger function para chamar recálculo
CREATE OR REPLACE FUNCTION public.trigger_recalcular_totais_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalcular_totais_orcamento(OLD.orcamento_id);
    RETURN OLD;
  ELSE
    PERFORM recalcular_totais_orcamento(NEW.orcamento_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger em cortina_items
DROP TRIGGER IF EXISTS trg_recalcular_totais_orcamento ON cortina_items;
CREATE TRIGGER trg_recalcular_totais_orcamento
AFTER INSERT OR UPDATE OR DELETE ON cortina_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalcular_totais_orcamento();

-- Trigger para recalcular quando desconto/margem mudar no orçamento
CREATE OR REPLACE FUNCTION public.trigger_recalcular_desconto_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só recalcula se desconto mudou
  IF OLD.desconto_tipo IS DISTINCT FROM NEW.desconto_tipo 
     OR OLD.desconto_valor IS DISTINCT FROM NEW.desconto_valor THEN
    PERFORM recalcular_totais_orcamento(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalcular_desconto_orcamento ON orcamentos;
CREATE TRIGGER trg_recalcular_desconto_orcamento
AFTER UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION trigger_recalcular_desconto_orcamento();

-- ============================================
-- DATA REPAIR: Corrigir orçamentos existentes
-- ============================================

-- Atualizar preco_venda dos itens que têm custo mas não têm preço
UPDATE cortina_items ci
SET preco_venda = ci.custo_total * (1 + o.margem_percent / 100)
FROM orcamentos o
WHERE ci.orcamento_id = o.id
  AND (ci.preco_venda IS NULL OR ci.preco_venda = 0)
  AND ci.custo_total > 0;

-- Recalcular todos os orçamentos existentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM orcamentos LOOP
    PERFORM recalcular_totais_orcamento(r.id);
  END LOOP;
END;
$$;