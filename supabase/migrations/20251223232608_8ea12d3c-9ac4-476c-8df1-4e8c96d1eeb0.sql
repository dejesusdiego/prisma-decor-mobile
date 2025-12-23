-- 1. Criar Oportunidades para Orçamentos Existentes que não têm oportunidade vinculada
INSERT INTO oportunidades (titulo, contato_id, orcamento_id, valor_estimado, etapa, temperatura, origem, created_by_user_id)
SELECT 
  codigo || ' - ' || cliente_nome,
  contato_id,
  id,
  COALESCE(total_com_desconto, total_geral, 0),
  CASE status
    WHEN 'rascunho' THEN 'qualificacao'
    WHEN 'finalizado' THEN 'proposta'
    WHEN 'enviado' THEN 'proposta'
    WHEN 'sem_resposta' THEN 'negociacao'
    WHEN 'pago_40' THEN 'negociacao'
    WHEN 'pago_parcial' THEN 'negociacao'
    WHEN 'pago_60' THEN 'negociacao'
    WHEN 'pago' THEN 'fechado_ganho'
    WHEN 'recusado' THEN 'fechado_perdido'
    WHEN 'cancelado' THEN 'fechado_perdido'
    ELSE 'qualificacao'
  END,
  CASE status
    WHEN 'pago' THEN 'quente'
    WHEN 'pago_40' THEN 'quente'
    WHEN 'pago_parcial' THEN 'quente'
    WHEN 'pago_60' THEN 'quente'
    WHEN 'recusado' THEN 'frio'
    WHEN 'cancelado' THEN 'frio'
    WHEN 'sem_resposta' THEN 'frio'
    ELSE 'morno'
  END,
  'orcamento',
  created_by_user_id
FROM orcamentos
WHERE NOT EXISTS (SELECT 1 FROM oportunidades WHERE orcamento_id = orcamentos.id);

-- 2. Promover Contatos com Orçamentos Pagos para "Cliente"
UPDATE contatos
SET tipo = 'cliente', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT contato_id FROM orcamentos WHERE status = 'pago' AND contato_id IS NOT NULL
)
AND tipo != 'cliente';

-- 3. Recalcular valor_total_gasto dos Contatos baseado em orçamentos pagos
UPDATE contatos
SET valor_total_gasto = subquery.total, updated_at = NOW()
FROM (
  SELECT contato_id, COALESCE(SUM(COALESCE(total_com_desconto, total_geral, 0)), 0) as total
  FROM orcamentos
  WHERE status = 'pago' AND contato_id IS NOT NULL
  GROUP BY contato_id
) as subquery
WHERE contatos.id = subquery.contato_id;

-- 4. Criar Atividades Históricas para orçamentos enviados
INSERT INTO atividades_crm (titulo, tipo, contato_id, orcamento_id, data_atividade, descricao, concluida, created_by_user_id)
SELECT 
  'Proposta enviada - ' || codigo,
  'email',
  contato_id,
  id,
  COALESCE(status_updated_at, updated_at),
  'Orçamento ' || codigo || ' enviado para ' || cliente_nome || '. Valor: R$ ' || COALESCE(total_com_desconto, total_geral, 0),
  true,
  created_by_user_id
FROM orcamentos
WHERE status IN ('enviado', 'sem_resposta', 'pago_40', 'pago_parcial', 'pago_60', 'pago', 'recusado')
AND contato_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM atividades_crm WHERE orcamento_id = orcamentos.id AND tipo = 'email'
);

-- 5. Criar Atividades de Venda Fechada para orçamentos pagos
INSERT INTO atividades_crm (titulo, tipo, contato_id, orcamento_id, data_atividade, descricao, concluida, created_by_user_id)
SELECT 
  'Venda fechada - ' || codigo,
  'outro',
  contato_id,
  id,
  COALESCE(status_updated_at, updated_at),
  'Orçamento ' || codigo || ' foi pago. Valor: R$ ' || COALESCE(total_com_desconto, total_geral, 0),
  true,
  created_by_user_id
FROM orcamentos
WHERE status = 'pago'
AND contato_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM atividades_crm WHERE orcamento_id = orcamentos.id AND tipo = 'outro' AND titulo LIKE 'Venda fechada%'
);