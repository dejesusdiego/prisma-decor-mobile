-- Fase 4: Sistema de Empréstimo com Automação

-- 1. Verificar se categoria de empréstimo existe, se não, criar
INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo)
SELECT 'Empréstimo Sócio', 'despesa', '#8B5CF6', 'wallet', true
WHERE NOT EXISTS (
  SELECT 1 FROM categorias_financeiras 
  WHERE nome ILIKE '%empréstimo%' OR nome ILIKE '%emprestimo%'
);

-- 2. Criar função para auto-criar conta a receber quando empréstimo é lançado
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber_emprestimo()
RETURNS TRIGGER AS $$
DECLARE
  v_categoria_emprestimo_id UUID;
  v_conta_receber_id UUID;
BEGIN
  -- Verificar se a categoria é de empréstimo
  SELECT id INTO v_categoria_emprestimo_id
  FROM categorias_financeiras
  WHERE (nome ILIKE '%empréstimo%' OR nome ILIKE '%emprestimo%')
  AND id = NEW.categoria_id;
  
  IF v_categoria_emprestimo_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Criar conta a receber para 30 dias
  INSERT INTO contas_receber (
    cliente_nome,
    descricao,
    valor_total,
    valor_pago,
    numero_parcelas,
    status,
    data_vencimento,
    created_by_user_id
  ) VALUES (
    'Empréstimo - ' || NEW.descricao,
    'Devolução: ' || NEW.descricao,
    NEW.valor,
    0,
    1,
    'pendente',
    NEW.data_lancamento + INTERVAL '30 days',
    NEW.created_by_user_id
  )
  RETURNING id INTO v_conta_receber_id;
  
  -- Criar parcela única
  INSERT INTO parcelas_receber (
    conta_receber_id,
    numero_parcela,
    valor,
    data_vencimento,
    status
  ) VALUES (
    v_conta_receber_id,
    1,
    NEW.valor,
    NEW.data_lancamento + INTERVAL '30 days',
    'pendente'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger para auto-criar conta a receber
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber_emprestimo ON lancamentos_financeiros;
CREATE TRIGGER trigger_auto_criar_conta_receber_emprestimo
AFTER INSERT ON lancamentos_financeiros
FOR EACH ROW
EXECUTE FUNCTION public.auto_criar_conta_receber_emprestimo();