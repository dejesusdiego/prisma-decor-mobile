-- Cancelar contas a receber de orçamentos recusados/cancelados sem pagamentos
UPDATE contas_receber
SET 
  status = 'cancelado',
  observacoes = COALESCE(observacoes || E'\n', '') || '[Auto] Cancelado pois orçamento foi recusado/cancelado - ' || to_char(now(), 'DD/MM/YYYY HH24:MI')
WHERE orcamento_id IN (
  SELECT id FROM orcamentos 
  WHERE status IN ('recusado', 'cancelado')
)
AND valor_pago = 0
AND status NOT IN ('cancelado', 'pago');

-- Também cancelar as parcelas dessas contas
UPDATE parcelas_receber
SET 
  status = 'cancelado',
  observacoes = COALESCE(observacoes || E'\n', '') || '[Auto] Cancelado pois orçamento foi recusado/cancelado'
WHERE conta_receber_id IN (
  SELECT cr.id FROM contas_receber cr
  JOIN orcamentos o ON o.id = cr.orcamento_id
  WHERE o.status IN ('recusado', 'cancelado')
  AND cr.valor_pago = 0
)
AND status NOT IN ('cancelado', 'pago');