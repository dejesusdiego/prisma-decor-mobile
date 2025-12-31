-- Adicionar coluna para controlar se custos já foram gerados
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS custos_gerados boolean DEFAULT false;

-- Função para gerar contas a pagar automaticamente baseado nos custos do orçamento
CREATE OR REPLACE FUNCTION public.auto_criar_contas_pagar_custos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_custo_materiais numeric;
  v_custo_mao_obra numeric;
  v_custo_instalacao numeric;
  v_categoria_materiais_id uuid;
  v_categoria_mao_obra_id uuid;
  v_categoria_instalacao_id uuid;
BEGIN
  -- Só processar se status mudou para um status de pagamento e custos ainda não foram gerados
  IF NEW.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já gerou custos
  IF NEW.custos_gerados = true OR OLD.custos_gerados = true THEN
    RETURN NEW;
  END IF;
  
  -- Só gerar se tinha status diferente antes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buscar categorias financeiras
  SELECT id INTO v_categoria_materiais_id 
  FROM categorias_financeiras 
  WHERE nome ILIKE '%material%' OR nome ILIKE '%materia%' 
  AND tipo = 'saida' AND ativo = true
  LIMIT 1;
  
  SELECT id INTO v_categoria_mao_obra_id 
  FROM categorias_financeiras 
  WHERE nome ILIKE '%mão de obra%' OR nome ILIKE '%costura%' OR nome ILIKE '%confeccao%'
  AND tipo = 'saida' AND ativo = true
  LIMIT 1;
  
  SELECT id INTO v_categoria_instalacao_id 
  FROM categorias_financeiras 
  WHERE nome ILIKE '%instalacao%' OR nome ILIKE '%servico%'
  AND tipo = 'saida' AND ativo = true
  LIMIT 1;

  -- Calcular custos a partir dos subtotais do orçamento
  v_custo_materiais := COALESCE(NEW.subtotal_materiais, 0) * 0.6; -- Estimar custo como 60% do preço
  v_custo_mao_obra := COALESCE(NEW.subtotal_mao_obra_costura, 0) * 0.7;
  v_custo_instalacao := COALESCE(NEW.subtotal_instalacao, 0) * 0.7;

  -- Criar conta a pagar para materiais (se houver valor)
  IF v_custo_materiais > 0 THEN
    INSERT INTO contas_pagar (
      descricao,
      valor,
      data_vencimento,
      status,
      categoria_id,
      orcamento_id,
      fornecedor,
      observacoes,
      created_by_user_id
    ) VALUES (
      'Materiais - ' || NEW.codigo || ' (' || NEW.cliente_nome || ')',
      v_custo_materiais,
      CURRENT_DATE + INTERVAL '30 days',
      'pendente',
      v_categoria_materiais_id,
      NEW.id,
      'Fornecedor de Materiais',
      'Custo gerado automaticamente do orçamento',
      NEW.created_by_user_id
    );
  END IF;

  -- Criar conta a pagar para mão de obra (se houver valor)
  IF v_custo_mao_obra > 0 THEN
    INSERT INTO contas_pagar (
      descricao,
      valor,
      data_vencimento,
      status,
      categoria_id,
      orcamento_id,
      fornecedor,
      observacoes,
      created_by_user_id
    ) VALUES (
      'Mão de Obra - ' || NEW.codigo || ' (' || NEW.cliente_nome || ')',
      v_custo_mao_obra,
      CURRENT_DATE + INTERVAL '15 days',
      'pendente',
      v_categoria_mao_obra_id,
      NEW.id,
      'Confecção',
      'Custo gerado automaticamente do orçamento',
      NEW.created_by_user_id
    );
  END IF;

  -- Criar conta a pagar para instalação (se houver valor)
  IF v_custo_instalacao > 0 THEN
    INSERT INTO contas_pagar (
      descricao,
      valor,
      data_vencimento,
      status,
      categoria_id,
      orcamento_id,
      fornecedor,
      observacoes,
      created_by_user_id
    ) VALUES (
      'Instalação - ' || NEW.codigo || ' (' || NEW.cliente_nome || ')',
      v_custo_instalacao,
      CURRENT_DATE + INTERVAL '45 days',
      'pendente',
      v_categoria_instalacao_id,
      NEW.id,
      'Instalador',
      'Custo gerado automaticamente do orçamento',
      NEW.created_by_user_id
    );
  END IF;

  -- Marcar que custos foram gerados
  NEW.custos_gerados := true;

  RETURN NEW;
END;
$function$;

-- Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_auto_criar_custos ON orcamentos;
CREATE TRIGGER trigger_auto_criar_custos
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION auto_criar_contas_pagar_custos();

-- Adicionar comentário explicativo
COMMENT ON FUNCTION auto_criar_contas_pagar_custos() IS 'Gera contas a pagar automaticamente quando orçamento muda para status de pagamento';