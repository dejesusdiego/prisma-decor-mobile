-- Atualizar contas a receber onde a diferença é pequena (até R$ 5,00 E até 0.5% do total)
-- Isso corrige contas que deveriam estar marcadas como "pagas" mas ficaram como "parcial"

UPDATE contas_receber
SET status = 'pago'
WHERE status = 'parcial'
  AND valor_total > 0
  AND (valor_total - valor_pago) <= 5.00
  AND ((valor_total - valor_pago) / valor_total * 100) <= 0.5;