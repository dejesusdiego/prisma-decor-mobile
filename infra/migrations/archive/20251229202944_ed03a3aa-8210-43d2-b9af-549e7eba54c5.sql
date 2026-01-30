-- Remover constraint de categorias e lançamentos
ALTER TABLE categorias_financeiras DROP CONSTRAINT IF EXISTS categorias_financeiras_tipo_check;
ALTER TABLE lancamentos_financeiros DROP CONSTRAINT IF EXISTS lancamentos_financeiros_tipo_check;

-- Adicionar novas constraints que permitem 'emprestimo'
ALTER TABLE categorias_financeiras ADD CONSTRAINT categorias_financeiras_tipo_check 
  CHECK (tipo IN ('receita', 'despesa', 'emprestimo'));

ALTER TABLE lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_tipo_check 
  CHECK (tipo IN ('entrada', 'saida', 'emprestimo'));

-- Atualizar categorias de empréstimo para o novo tipo 'emprestimo'
UPDATE categorias_financeiras 
SET tipo = 'emprestimo' 
WHERE nome ILIKE '%empréstimo%' OR nome ILIKE '%emprestimo%';

-- Atualizar lançamentos vinculados a categorias de empréstimo para o novo tipo
UPDATE lancamentos_financeiros lf
SET tipo = 'emprestimo'
FROM categorias_financeiras cf
WHERE lf.categoria_id = cf.id
AND cf.tipo = 'emprestimo';

-- Criar contas a receber retroativas para empréstimos existentes que não possuem
INSERT INTO contas_receber (cliente_nome, descricao, valor_total, valor_pago, numero_parcelas, status, data_vencimento, created_by_user_id)
SELECT 
  'Empréstimo - ' || lf.descricao,
  'Devolução: ' || lf.descricao,
  lf.valor,
  0,
  1,
  CASE 
    WHEN lf.data_lancamento + INTERVAL '30 days' < CURRENT_DATE THEN 'atrasado'
    ELSE 'pendente'
  END,
  lf.data_lancamento + INTERVAL '30 days',
  lf.created_by_user_id
FROM lancamentos_financeiros lf
INNER JOIN categorias_financeiras cf ON cf.id = lf.categoria_id
WHERE cf.tipo = 'emprestimo'
AND NOT EXISTS (
  SELECT 1 FROM contas_receber cr 
  WHERE cr.descricao = 'Devolução: ' || lf.descricao
  AND cr.valor_total = lf.valor
);

-- Criar parcelas para as contas a receber de empréstimo que não possuem
INSERT INTO parcelas_receber (conta_receber_id, numero_parcela, valor, data_vencimento, status)
SELECT 
  cr.id,
  1,
  cr.valor_total,
  cr.data_vencimento,
  cr.status
FROM contas_receber cr
WHERE cr.cliente_nome LIKE 'Empréstimo -%'
AND NOT EXISTS (
  SELECT 1 FROM parcelas_receber pr WHERE pr.conta_receber_id = cr.id
);