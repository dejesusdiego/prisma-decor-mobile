-- Adicionar campo lancamento_origem_id na tabela contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN lancamento_origem_id uuid REFERENCES public.lancamentos_financeiros(id);

-- Criar índice para melhorar performance
CREATE INDEX idx_contas_receber_lancamento_origem ON public.contas_receber(lancamento_origem_id);

-- Atualizar a função auto_criar_conta_receber_emprestimo para vincular o lançamento
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber_emprestimo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Criar conta a receber para 30 dias vinculada ao lançamento
  INSERT INTO contas_receber (
    cliente_nome,
    descricao,
    valor_total,
    valor_pago,
    numero_parcelas,
    status,
    data_vencimento,
    created_by_user_id,
    lancamento_origem_id
  ) VALUES (
    'Empréstimo - ' || NEW.descricao,
    'Devolução: ' || NEW.descricao,
    NEW.valor,
    0,
    1,
    'pendente',
    NEW.data_lancamento + INTERVAL '30 days',
    NEW.created_by_user_id,
    NEW.id
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
$function$;

-- Migrar dados existentes: vincular lançamentos de empréstimo às contas a receber criadas
-- Encontrar lançamentos de empréstimo e suas contas correspondentes por descrição e valor
UPDATE contas_receber cr
SET lancamento_origem_id = lf.id
FROM lancamentos_financeiros lf
JOIN categorias_financeiras cf ON cf.id = lf.categoria_id
WHERE cf.nome ILIKE '%empréstimo%' OR cf.nome ILIKE '%emprestimo%'
AND cr.descricao = 'Devolução: ' || lf.descricao
AND cr.valor_total = lf.valor
AND cr.lancamento_origem_id IS NULL;