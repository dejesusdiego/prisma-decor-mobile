-- =========================================
-- BACKUP DE DADOS - OPERACIONAL
-- Gerado em: 2026-01-13
-- Tabelas: pedidos, itens_pedido, lancamentos_financeiros, contas_receber, contas_pagar
-- =========================================

-- =====================
-- PEDIDOS (15 registros)
-- =====================

INSERT INTO pedidos (id, numero_pedido, orcamento_id, data_entrada, previsao_entrega, data_pronto, status_producao, prioridade, observacoes_producao, organization_id, created_by_user_id, created_at, updated_at) VALUES
('f70e2eaa-19bc-4a8c-8b6a-39e128d5a3ce', 'PED-2025-0005', 'dc89b3e7-f889-4302-8063-ae6ead5f2dd4', '2025-12-24 20:06:23.434679+00', '2026-01-08', NULL, 'entregue', 'alta', 'Pedido gerado manualmente a partir do orçamento ORC-2025-0025', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-24 20:06:23.434679+00', '2026-01-07 19:10:38.669457+00'),
('f6efcd41-7cbc-472b-ae5f-8e4da2942de3', 'PED-2025-0006', '7daa79ad-dcb6-46aa-bf71-f2651d77267d', '2025-12-24 20:06:23.434679+00', '2026-01-08', NULL, 'entregue', 'alta', 'Pedido gerado manualmente a partir do orçamento ORC-2025-0026', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-24 20:06:23.434679+00', '2026-01-07 19:10:38.669457+00'),
('ea0fe9fe-ac83-4ff6-8e9b-fc0f367f44a9', 'PED-2025-0004', '0c24959a-11cd-489e-923e-ce840b156fc4', '2025-12-24 20:06:23.434679+00', '2026-01-08', NULL, 'entregue', 'alta', 'Pedido gerado manualmente a partir do orçamento ORC-2025-0021', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-24 20:06:23.434679+00', '2026-01-07 19:10:38.669457+00'),
('843566f3-5c41-4ffa-b93a-342d6aff235f', 'PED-2025-0003', 'e92c142d-a7a1-46ae-8074-7e8e6484d1c0', '2025-12-24 20:06:23.434679+00', '2026-01-08', NULL, 'entregue', 'alta', 'Pedido gerado manualmente a partir do orçamento ORC-2025-0018', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-24 20:06:23.434679+00', '2026-01-07 19:10:38.669457+00'),
('33d0023a-ca7e-46e0-aaa7-cbdeffe6424b', 'PED-2025-0002', 'a1a04914-0763-44fb-8680-9c30fcac6b2e', '2025-12-24 20:06:23.434679+00', '2026-01-08', NULL, 'entregue', 'alta', 'Pedido gerado manualmente a partir do orçamento ORC-2025-0017', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-24 20:06:23.434679+00', '2026-01-07 19:10:38.669457+00'),
('7b2bbc0d-8976-4e2f-8344-0782a4dca720', 'PED-2025-0001', '7558caac-7fe8-4034-b342-0a5769633d11', '2025-12-24 20:06:23.434679+00', '2026-01-08', NULL, 'entregue', 'alta', 'Pedido gerado manualmente a partir do orçamento ORC-2025-0008', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-24 20:06:23.434679+00', '2026-01-07 19:10:38.669457+00'),
('718e7cfa-faba-42ea-bfea-0d2f8845e064', 'PED-2025-0007', 'eace0cc5-81d3-48ca-9fb9-d2b99e7e4a3a', '2025-12-24 20:06:23.434679+00', '2026-01-08', NULL, 'entregue', 'baixa', 'Pedido gerado manualmente a partir do orçamento ORC-2025-0027', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-24 20:06:23.434679+00', '2026-01-07 19:24:32.561913+00'),
('9f054dc4-1a3c-4175-ab74-01cdcdcad89b', 'PED-2026-0001', 'bdc62809-b0ac-4f54-9255-0db6c2e132d0', '2026-01-03 00:43:58.457139+00', '2026-01-16', NULL, 'cancelado', 'alta', 'Pedido gerado automaticamente a partir do orçamento ORC-2025-0024', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-03 00:43:58.457139+00', '2026-01-07 19:10:38.669457+00'),
('5a822ad2-9f05-4ae2-82d1-a5be0f6312c8', 'PED-2026-0006', '9809802f-2760-4d0c-a75d-fa29f0716b50', '2026-01-09 17:20:25.224754+00', '2026-01-24', NULL, 'em_producao', 'normal', 'Pedido gerado automaticamente a partir do orçamento ORC-2026-0013 (Bruna Sackmann)', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-09 17:20:25.224754+00', '2026-01-12 18:56:12.12708+00'),
('39d21459-5afe-483d-b099-84abb2857b48', 'PED-2026-0009', '7f16c60e-9a83-4e5f-86ff-5b3bdc69f327', '2026-01-13 17:28:43.944594+00', '2026-01-28', NULL, 'em_producao', 'normal', 'Pedido gerado automaticamente a partir do orçamento ORC-2026-0016 (Cloves)', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-13 17:28:43.944594+00', '2026-01-13 20:49:56.820534+00')
ON CONFLICT (id) DO UPDATE SET
  status_producao = EXCLUDED.status_producao,
  updated_at = EXCLUDED.updated_at;


-- =====================
-- ITENS PEDIDO (27 registros)
-- =====================

INSERT INTO itens_pedido (id, pedido_id, cortina_item_id, status_item, responsavel, data_inicio_corte, data_fim_corte, data_inicio_costura, data_fim_costura, data_finalizacao, observacoes, created_at, updated_at) VALUES
('ad0a964e-890f-48e6-9c58-5aca05b76412', '33d0023a-ca7e-46e0-aaa7-cbdeffe6424b', '10b26664-8372-4c1a-b101-9fa796614834', 'pronto', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-24 20:06:31.524226+00', '2025-12-27 13:55:15.747835+00'),
('274afa01-6691-4527-a937-693aaaf6a1d7', '39d21459-5afe-483d-b099-84abb2857b48', '83ce69ec-b7d5-47c7-8f42-b06ed723bf8e', 'corte', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 17:28:43.944594+00', '2026-01-13 20:49:52.574808+00'),
('fea88f78-623f-4a11-b341-68ec84ba10b0', '39d21459-5afe-483d-b099-84abb2857b48', 'fc59bb35-2384-49d3-9c21-5a0a7b2b2ccb', 'corte', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 17:28:43.944594+00', '2026-01-13 20:49:56.820534+00'),
('fde3b0e8-c503-4e22-a9cd-1fafbaec7812', '39d21459-5afe-483d-b099-84abb2857b48', 'c408b648-6eb9-4593-b958-3f8fce743509', 'corte', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 17:28:43.944594+00', '2026-01-13 20:49:55.310605+00'),
('14435dac-17d2-48d6-8d9f-3326f5df62a1', '39d21459-5afe-483d-b099-84abb2857b48', '75f2b5d0-717e-4d48-9f03-8bc92ebd8a37', 'fila', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 17:28:43.944594+00', '2026-01-13 17:28:43.944594+00'),
('489d2bee-0d0e-4f93-a8bd-c41fdc4806e8', '39d21459-5afe-483d-b099-84abb2857b48', '99fec0c5-5e16-4830-9694-879639018822', 'corte', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 17:28:43.944594+00', '2026-01-13 20:49:50.97711+00'),
('b3fcb5b4-3a40-46c9-8095-8fcad69fd632', '4c0d6119-902e-4f21-9240-8559257f42fd', '5fa0ec53-6cd5-40e8-a2d8-bd88b2cd2baf', 'pronto', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-03 00:44:05.005999+00', '2026-01-05 23:06:50.308149+00'),
('3bf7e071-eea3-4d2a-8d85-e500d4d4bb17', '4c0d6119-902e-4f21-9240-8559257f42fd', 'd8da1992-794e-4584-85ea-6de8d3425c62', 'pronto', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-03 00:44:05.005999+00', '2026-01-05 23:06:44.817536+00'),
('13e7d345-75d6-41a3-8533-2906f5bbf1f9', '5a822ad2-9f05-4ae2-82d1-a5be0f6312c8', 'fa0817ac-a330-4090-9151-2147f008d432', 'costura', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-09 17:20:25.224754+00', '2026-01-12 18:56:09.705998+00'),
('6c452ca4-ca8b-404d-8c5b-d46954cecba7', '5a822ad2-9f05-4ae2-82d1-a5be0f6312c8', '0c9dbffb-fcc3-4824-8c60-21427e47f6af', 'costura', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-09 17:20:25.224754+00', '2026-01-12 18:56:12.12708+00')
ON CONFLICT (id) DO UPDATE SET
  status_item = EXCLUDED.status_item,
  updated_at = EXCLUDED.updated_at;


-- =====================
-- LANÇAMENTOS FINANCEIROS (170 registros - amostra)
-- =====================

INSERT INTO lancamentos_financeiros (id, descricao, tipo, valor, data_lancamento, data_competencia, categoria_id, forma_pagamento_id, conta_pagar_id, parcela_receber_id, observacoes, ignorado, motivo_ignorado, organization_id, created_by_user_id, created_at, updated_at) VALUES
('f38388d1-dcb5-4ea3-bf5c-7f3c2a9ff7d3', 'Ruyz group', 'entrada', 250.00, '2025-11-14', NULL, 'b609497f-f542-49ca-8e72-b167af59c112', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 13:58:57.91434+00', '2026-01-07 19:10:38.669457+00'),
('a239f650-b93e-43f2-a49d-944a3942a0b8', 'Google', 'saida', 80.00, '2025-11-14', NULL, '9b4f09b7-4276-4dac-a055-4e6f5956a6a2', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 14:02:00.649973+00', '2026-01-07 19:10:38.669457+00'),
('52b44e42-8d91-4cf0-9bff-927e51f25e93', 'Sócio Carlos', 'saida', 25.00, '2025-11-14', NULL, '11fea846-7e3b-4272-af87-c85beec7fba9', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 14:01:04.469678+00', '2026-01-07 19:10:38.669457+00'),
('66ff99f0-7b1e-4179-95fc-10b54948a262', 'Sócio João Pedro', 'saida', 25.00, '2025-11-17', NULL, '48655882-5bdf-42ce-aa11-86baa8d95431', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 15:08:55.571918+00', '2026-01-07 19:10:38.669457+00'),
('61fc9d4d-25b5-4ca9-ac72-a529bb6a54f1', 'Entrada NADIR persiana', 'entrada', 600.00, '2025-11-19', NULL, '4dbc7dc9-5513-4f9e-8765-0c9b571f7863', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, 'c8af2b8e-b679-4790-921e-2aa1f675e687', NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 14:03:47.149925+00', '2026-01-07 19:10:38.669457+00'),
('060b45a2-b879-4bf9-8609-edf6828d51b7', 'Pagamento produção persiana Nadir', 'saida', 435.00, '2025-11-19', NULL, '34442ded-b7a2-445e-aae1-6c6ae95b7131', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 14:08:33.514483+00', '2026-01-07 19:10:38.669457+00'),
('10667494-6b7d-46d9-a35d-23a9af7d81ba', 'Trena', 'saida', 45.50, '2025-11-22', NULL, '5d84424b-8ac8-4282-bd2e-4e50ff175d82', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 14:10:01.963607+00', '2026-01-07 19:10:38.669457+00'),
('618c983e-8e28-44a2-86e6-27cc843c63d0', 'Reserva sócio carlos', 'saida', 25.00, '2025-11-24', NULL, '11fea846-7e3b-4272-af87-c85beec7fba9', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 15:11:50.123707+00', '2026-01-07 19:10:38.669457+00'),
('fb775f00-c803-495f-adc1-99ba820e7e15', 'Pagamento Raieny', 'saida', 430.00, '2025-11-24', NULL, '91296ed5-9c8c-4cca-86ad-b81182b18d44', '0ffcb307-71de-433a-bba9-8170fe332011', NULL, NULL, NULL, false, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-28 15:01:02.005137+00', '2026-01-07 19:10:38.669457+00')
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  valor = EXCLUDED.valor,
  updated_at = EXCLUDED.updated_at;

-- NOTA: A tabela lancamentos_financeiros contém ~170 registros
-- Para backup completo, use o comando CLI:
-- supabase db dump --data-only --table public.lancamentos_financeiros -f lancamentos_completo.sql


-- =====================
-- CONTAS A RECEBER (19 registros)
-- =====================

INSERT INTO contas_receber (id, cliente_nome, cliente_telefone, descricao, valor_total, valor_pago, numero_parcelas, data_vencimento, status, observacoes, orcamento_id, lancamento_origem_id, organization_id, created_by_user_id, created_at, updated_at) VALUES
('c7721444-349a-4dbc-b3b3-d9f311b8356d', 'Empréstimo - Tânia diarista', NULL, 'Devolução: Tânia diarista', 150.00, 0, 1, '2026-01-26', 'pendente', NULL, NULL, 'cb302573-3ac8-451b-b028-9c6b308a4b18', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-29 20:29:44.09356+00', '2026-01-07 19:10:38.669457+00'),
('8069ee19-b6bc-4a32-a38e-a265f83b1db2', 'Empréstimo - Empréstimo sócio carlos', NULL, 'Devolução: Empréstimo sócio carlos', 594.82, 0, 1, '2026-01-17', 'pendente', NULL, NULL, 'cb302573-3ac8-451b-b028-9c6b308a4b18', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-29 20:29:44.09356+00', '2026-01-07 19:10:38.669457+00'),
('4c455315-9c5b-4d72-b627-5813e1f4d31e', 'Empréstimo - Empréstimo sócio carlos', NULL, 'Devolução: Empréstimo sócio carlos', 410.00, 0, 1, '2026-01-18', 'pendente', NULL, NULL, 'cb302573-3ac8-451b-b028-9c6b308a4b18', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-29 20:29:44.09356+00', '2026-01-07 19:10:38.669457+00'),
('11b23315-4465-4c69-b82a-5a4f56c3625f', 'João heusy', '(64) 99616-2510', 'Warung', 206.75, 0, 1, '2025-12-31', 'atrasado', NULL, NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-31 18:30:50.153004+00', '2026-01-07 19:10:38.669457+00'),
('a6592a1d-9c49-44a4-b043-51aa20141d39', 'Enzo', '(47) 99215-8282', 'Warung', 138.00, 138, 1, '2025-12-31', 'pago', NULL, NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-31 18:37:51.156676+00', '2026-01-07 19:10:38.669457+00'),
('92c22d4b-87f4-4924-bbc5-529d7fd20004', 'Giovana', NULL, 'Orçamento ORC-2025-0026', 2461.50, 2460, 1, '2025-12-10', 'pago', 'Conta criada ao vincular lançamentos existentes', '7daa79ad-dcb6-46aa-bf71-f2651d77267d', NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-02 15:27:08.04784+00', '2026-01-07 19:10:38.669457+00'),
('2858b4f6-db3e-4cf3-9fb7-ae444ce1c243', 'Alex souto', NULL, 'Orçamento ORC-2025-0025', 2504.01, 2500, 2, '2025-12-15', 'pago', 'Conta criada ao vincular lançamentos existentes', 'dc89b3e7-f889-4302-8063-ae6ead5f2dd4', NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-02 15:36:27.968397+00', '2026-01-07 19:10:38.669457+00'),
('fb3a1bbb-49bc-4aa9-8b19-2d41b3d43ce0', 'Linda', NULL, 'Orçamento ORC-2025-0027', 2176.06, 2176, 1, '2025-12-12', 'pago', 'Conta criada ao vincular lançamentos existentes', 'eace0cc5-81d3-48ca-9fb9-d2b99e7e4a3a', NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-02 15:36:46.521466+00', '2026-01-07 19:10:38.669457+00'),
('792b38aa-4503-4724-aa40-984b0554dde1', 'Nadir', NULL, 'Orçamento ORC-2025-0018', 1000.41, 1000, 2, '2025-12-04', 'pago', 'Conta criada ao vincular lançamentos existentes', 'e92c142d-a7a1-46ae-8074-7e8e6484d1c0', NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-02 15:37:00.471537+00', '2026-01-07 19:10:38.669457+00')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  valor_pago = EXCLUDED.valor_pago,
  updated_at = EXCLUDED.updated_at;


-- =====================
-- CONTAS A PAGAR (7 registros)
-- =====================

INSERT INTO contas_pagar (id, descricao, valor, data_vencimento, data_pagamento, status, fornecedor, categoria_id, forma_pagamento_id, numero_documento, recorrente, frequencia_recorrencia, observacoes, conta_origem_id, orcamento_id, organization_id, created_by_user_id, created_at, updated_at) VALUES
('5efdcc3a-76fe-4f27-be43-2d76f3c12fac', 'Alvara', 898.99, '2026-01-10', NULL, 'atrasado', 'Contabilidade', '62b7c023-8cae-4914-aa66-4d384554f2bd', NULL, NULL, false, NULL, NULL, NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-31 18:44:22.205679+00', '2026-01-11 00:05:00.302633+00'),
('7c9973fd-92cc-4613-a055-7acbe9279ca3', 'Markenting', 1250.00, '2026-01-18', NULL, 'pendente', 'Google', '9b4f09b7-4276-4dac-a055-4e6f5956a6a2', NULL, NULL, true, 'anual', NULL, NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-31 18:47:54.890746+00', '2026-01-07 19:10:38.669457+00'),
('bb1efe9a-614a-4661-b4c4-63ae03309d6f', 'Materiais - ORC-2026-0013 Bruna', 496.04, '2026-02-08', '2026-01-09', 'pago', 'Global port', '34442ded-b7a2-445e-aae1-6c6ae95b7131', NULL, NULL, false, NULL, NULL, NULL, '9809802f-2760-4d0c-a75d-fa29f0716b50', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-09 17:44:20.045434+00', '2026-01-09 17:59:14.172078+00'),
('f05bce58-8ed1-4224-996b-39e8a02d39b2', 'Costura - ORC-2026-0013', 521.00, '2026-02-08', NULL, 'pendente', NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, '9809802f-2760-4d0c-a75d-fa29f0716b50', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-09 17:44:20.045434+00', '2026-01-09 17:44:20.045434+00'),
('7b40ab7b-9a1b-4251-a001-995838218a0a', 'Materiais - ORC-2026-0016 (Cloves)', 651.74, '2026-02-12', '2026-01-13', 'pago', 'Fornecedor de Materiais tecido', '34442ded-b7a2-445e-aae1-6c6ae95b7131', NULL, NULL, false, NULL, 'Custo gerado automaticamente do orçamento', NULL, '7f16c60e-9a83-4e5f-86ff-5b3bdc69f327', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-13 17:28:43.944594+00', '2026-01-13 17:52:40.222293+00'),
('e08c8274-1390-4a14-ba65-5d32e1814ae2', 'Mão de Obra - ORC-2026-0016 (Cloves)', 462.97, '2026-01-28', NULL, 'pendente', 'Confecção', '9ec908f3-a8ed-4fed-b58a-4d84d856d3c9', NULL, NULL, false, NULL, 'Custo gerado automaticamente do orçamento', NULL, '7f16c60e-9a83-4e5f-86ff-5b3bdc69f327', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-13 17:28:43.944594+00', '2026-01-13 17:28:43.944594+00'),
('d9c5b658-e44b-4c8e-83bd-8a31d0944aa8', 'Costura - ORC-2026-0016', 661.39, '2026-02-12', NULL, 'pendente', NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, '7f16c60e-9a83-4e5f-86ff-5b3bdc69f327', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-13 17:28:55.934873+00', '2026-01-13 17:28:55.934873+00')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data_pagamento = EXCLUDED.data_pagamento,
  updated_at = EXCLUDED.updated_at;
