-- Recalcular custo_total e subtotais dos orçamentos baseado na soma real dos itens
UPDATE orcamentos o
SET 
  custo_total = COALESCE(sub.soma_custos, 0),
  subtotal_materiais = COALESCE(sub.soma_materiais, 0),
  subtotal_mao_obra_costura = COALESCE(sub.soma_costura, 0),
  subtotal_instalacao = COALESCE(sub.soma_instalacao, 0)
FROM (
  SELECT 
    ci.orcamento_id,
    SUM(COALESCE(ci.custo_total, 0)) as soma_custos,
    SUM(
      CASE 
        WHEN ci.tipo_produto = 'cortina' THEN 
          COALESCE(ci.custo_tecido, 0) + COALESCE(ci.custo_forro, 0) + COALESCE(ci.custo_trilho, 0)
        ELSE 
          COALESCE(ci.preco_unitario, 0) * COALESCE(ci.quantidade, 1)
      END
    ) as soma_materiais,
    SUM(COALESCE(ci.custo_costura, 0)) as soma_costura,
    SUM(COALESCE(ci.custo_instalacao, 0)) as soma_instalacao
  FROM cortina_items ci
  GROUP BY ci.orcamento_id
) sub
WHERE o.id = sub.orcamento_id;