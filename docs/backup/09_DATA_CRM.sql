-- =========================================
-- BACKUP DE DADOS - CRM
-- Gerado em: 2026-01-13
-- Tabelas: orcamentos, cortina_items, oportunidades, atividades_crm
-- =========================================

-- =====================
-- ORÇAMENTOS (52 registros)
-- =====================

INSERT INTO orcamentos (id, codigo, cliente_nome, cliente_telefone, endereco, cidade, status, status_updated_at, margem_percent, margem_tipo, desconto_tipo, desconto_valor, subtotal_materiais, subtotal_mao_obra_costura, subtotal_instalacao, custo_total, total_geral, total_com_desconto, observacoes, validade_dias, custos_gerados, vendedor_id, contato_id, organization_id, created_by_user_id, created_at, updated_at) VALUES
('06e16b13-0e01-40df-a1a5-429cedd2aefc', 'ORC-2025-0001', 'Giancarlo', '41 9912-0912', 'AV ATLANTICA 4980, APTO 702', 'Balneário Camboriú', 'recusado', '2025-12-05 13:23:33.179001+00', 61.50, 'padrao', NULL, 0, 1597.82, 317.25, 180.00, 2095.07, 3241.40, 3241.40, NULL, 7, false, NULL, '6b4d0e93-5ed6-4179-b467-d149e047e387', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-11-25 13:00:38.472354+00', '2026-01-08 05:06:58.467839+00'),
('41951cda-f446-4a75-908f-65e65b967455', 'ORC-2025-0003', 'Kelly', '47999999999', 'Rua 2870, 100', 'Balneário Camboriú', 'finalizado', '2025-12-04 19:37:11.803237+00', 61.50, 'padrao', NULL, 0, 246.02, 130.00, 0.00, 376.02, 607.28, 607.28, NULL, 7, false, NULL, 'c0018fae-1488-4fd4-bc05-3275c21484bb', '11111111-1111-1111-1111-111111111111', '2ff0b7bb-41ea-45b8-a2a3-3c4a9b9704e0', '2025-11-25 15:47:11.023627+00', '2026-01-08 05:06:58.467839+00'),
('fe34c1f4-881c-42df-ad6d-c9292abaf589', 'ORC-2025-0004', 'MULTIPARQUE SPE TURISMO', '(47) 99995-0099', 'Avenida rodesio pavan,11595 - Estaleirinho', 'Balneário Camboriú', 'sem_resposta', '2025-12-12 06:00:06.309676+00', 90.00, 'personalizada', NULL, 0, 4744.97, 0.00, 720.00, 4744.97, 9015.44, 9015.44, 'Persianas Tela solar 3% com bando na cor ivory.', 7, false, NULL, 'f2df6bcf-9a61-4e09-88be-214ed9259917', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-11-26 20:18:25.9899+00', '2026-01-08 05:06:58.467839+00'),
('d701093c-95c9-4f0b-ae8f-263559a415d9', 'ORC-2025-0005', 'Teste', '38373838', 'Teste', 'Itajaí', 'rascunho', '2025-12-04 19:37:11.803237+00', 61.50, 'padrao', NULL, 0, 913.53, 162.50, 0.00, 1076.03, 1614.05, 1614.05, NULL, 7, false, NULL, '04f8b48f-4cf1-426d-b6ce-7d4133fc9b3a', '11111111-1111-1111-1111-111111111111', '2ff0b7bb-41ea-45b8-a2a3-3c4a9b9704e0', '2025-11-27 00:18:28.419967+00', '2026-01-08 05:06:58.467839+00'),
('c8558d04-79da-4d1b-b6c7-5b0a4af726e0', 'ORC-2025-0006', 'Valeria', '(65) 99607-8395', 'Rua Maria Lidia Bento, Numero 72, apartamento 301 - Bairro Centro - Navegantes', 'Navegantes', 'recusado', '2025-12-05 13:22:48.198533+00', 90.00, 'personalizada', NULL, 0, 504.96, 277.55, 258.00, 1040.51, 1976.96, 1976.96, 'Edificio Residencial Malibu', 7, false, NULL, '2e5294b7-881e-456b-9efa-433133b9bb0f', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-11-27 13:16:02.184682+00', '2026-01-08 05:06:58.467839+00'),
('6587caf1-04c6-4e0c-97f9-080177f41c51', 'ORC-2025-0007', 'Fernanda', '(47) 98869-1781', 'Bairro Santa Regina', 'Itajaí', 'recusado', '2025-12-04 19:37:11.803237+00', 100.00, 'personalizada', NULL, 0, 400.00, 0.00, 120.00, 400.00, 800.00, 800.00, NULL, 7, false, NULL, '3c525452-395c-4e44-a99a-4a5476bc431f', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-11-27 15:02:43.623617+00', '2026-01-08 05:06:58.467839+00'),
('e92c142d-a7a1-46ae-8074-7e8e6484d1c0', 'ORC-2025-0018', 'Nadir', '(47) 98826-3088', 'Avenida do Estado, 3195, Apto 204 - Fazenda', 'Itajaí', 'finalizado', '2025-12-05 13:42:30.974422+00', 90.00, 'personalizada', NULL, 0, 513.90, 0.00, 258.00, 526.90, 1000.41, 1000.41, 'Persiana RollerScreen Cinza escuro', 7, false, NULL, 'ac3f94f9-9fc1-4536-a328-add148991c35', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-04 18:15:00.000000+00', '2026-01-08 05:06:58.467839+00'),
('0c24959a-11cd-489e-923e-ce840b156fc4', 'ORC-2025-0021', 'Bruno', '(47) 99188-0197', 'Rua Fermino Vieira Cordeiro, 1442, bloco 9, Ap 407.', 'Itajaí', 'finalizado', '2025-12-09 14:30:16.823474+00', 90.00, 'personalizada', NULL, 0, 785.00, 0.00, 300.00, 785.00, 1450.68, 1450.68, 'Persiana Caixa Box', 7, false, NULL, 'ac974918-72bb-4dbe-8b8f-9061ae054afd', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-08 12:10:00.000000+00', '2026-01-08 05:06:58.467839+00'),
('dc89b3e7-f889-4302-8063-ae6ead5f2dd4', 'ORC-2025-0025', 'Alex souto', '(47) 99981-7770', 'Edifício duo, rua aririba, torre b, apartamento 1203', 'Itajaí', 'finalizado', '2025-12-15 00:00:00+00', 90.00, 'personalizada', NULL, 0, 1318.42, 0.00, 258.00, 1318.42, 2504.01, 2504.01, 'Persiana Double Vision', 7, false, NULL, '1eb31853-5109-4c54-b51d-b4cc8940aad7', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-10 00:00:00.000000+00', '2026-01-08 05:06:58.467839+00'),
('7daa79ad-dcb6-46aa-bf71-f2651d77267d', 'ORC-2025-0026', 'Giovana', '(47) 99961-0770', 'Rua 2870, 100', 'Balneário Camboriú', 'finalizado', '2025-12-10 19:43:54.618244+00', 90.00, 'personalizada', NULL, 0, 1297.11, 0.00, 258.00, 1297.11, 2461.50, 2461.50, NULL, 7, false, NULL, '382cd240-88de-4221-8a09-aa0c14ea4f8d', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-10 00:00:00.000000+00', '2026-01-08 05:06:58.467839+00'),
('eace0cc5-81d3-48ca-9fb9-d2b99e7e4a3a', 'ORC-2025-0027', 'Linda', '(41) 98853-8979', 'Rua 900, 128 ap 1102 - Centro', 'Balneário Camboriú', 'finalizado', '2025-12-12 00:00:00+00', 90.00, 'personalizada', NULL, 0, 1145.29, 0.00, 258.00, 1145.29, 2176.06, 2176.06, NULL, 7, false, NULL, '0b190df5-a084-4a80-9b32-68f49037ed71', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-11 00:00:00.000000+00', '2026-01-08 05:06:58.467839+00'),
('9809802f-2760-4d0c-a75d-fa29f0716b50', 'ORC-2026-0013', 'Bruna Sackmann', '(47) 99936-0970', 'Rua coqueiros, 968 - vila real', 'Camboriú', 'em_producao', '2026-01-09 17:20:25.224754+00', 61.50, 'padrao', NULL, 0, 1017.04, 521.00, 516.00, 2054.04, 6799.59, 6799.59, NULL, 7, true, NULL, '88713a0a-a7ef-4667-8081-0372fddb9bd9', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-07 14:53:42.818546+00', '2026-01-09 17:49:03.326684+00')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  total_geral = EXCLUDED.total_geral,
  updated_at = EXCLUDED.updated_at;

-- NOTA: A tabela orcamentos contém ~52 registros
-- Para backup completo, use o comando CLI:
-- supabase db dump --data-only --table public.orcamentos -f orcamentos_completo.sql


-- =====================
-- CORTINA ITEMS (102 registros - amostra)
-- =====================

INSERT INTO cortina_items (id, orcamento_id, nome_identificacao, tipo_cortina, tipo_produto, largura, altura, ambiente, tecido_id, forro_id, trilho_id, motor_id, motorizada, precisa_instalacao, pontos_instalacao, barra_cm, barra_forro_cm, quantidade, custo_tecido, custo_forro, custo_trilho, custo_motor, custo_acessorios, custo_costura, custo_instalacao, custo_total, preco_venda, preco_unitario, descricao, observacoes_internas, fabrica, is_outro, servicos_adicionais_ids, material_principal_id, created_at, updated_at) VALUES
('05bd918f-52e4-49b0-801f-061a334083da', '06e16b13-0e01-40df-a1a5-429cedd2aefc', 'Cortina 1 - (Filha)', 'prega', 'cortina', 3.82, 2.60, 'Quarto', NULL, 'af75eb70-8b06-45f3-ba2f-ad00f61f1ece', '519cdb80-60a0-4d8e-87a7-0c60d10a5851', NULL, false, true, 1, 40, 0, 1, 0.00, 534.96, 36.34, 0, 0.00, 78.40, 60.00, 709.70, 1064.55, NULL, NULL, NULL, NULL, false, '{}', NULL, '2025-11-25 13:14:06.586085+00', '2026-01-07 23:22:28.416634+00'),
('1b71ca55-341e-44a4-b106-bc82ddb2e1b8', '06e16b13-0e01-40df-a1a5-429cedd2aefc', 'Cortina 2 - (Casal) - Opção 1 Linho Sintético', 'prega', 'cortina', 2.71, 2.61, 'Quarto', NULL, 'af75eb70-8b06-45f3-ba2f-ad00f61f1ece', '519cdb80-60a0-4d8e-87a7-0c60d10a5851', NULL, false, true, 1, 40, 0, 1, 0.00, 384.03, 26.05, 0, 0.00, 56.20, 60.00, 526.28, 789.42, NULL, NULL, NULL, NULL, false, '{}', NULL, '2025-11-25 13:20:37.0991+00', '2026-01-07 23:22:28.416634+00'),
('017ca444-868c-4191-b538-b856fabded05', '0c24959a-11cd-489e-923e-ce840b156fc4', 'Persiana Caixa Box', 'rolo', 'persiana', 1.20, 1.20, 'Quarto', NULL, NULL, NULL, NULL, false, true, 1, 0, 0, 1, 0.00, 0.00, 0.00, 0, 0.00, 0.00, 300.00, 785.00, 1450.68, 485, 'Persiana Caixa Box Blackout 100% Com guias laterais e inferiores.', NULL, 'TS', false, '{}', '090d61f3-d2fe-4dbe-8424-97e897b0fe08', '2025-12-08 12:14:03.02978+00', '2025-12-09 14:30:16.823474+00')
ON CONFLICT (id) DO UPDATE SET
  custo_total = EXCLUDED.custo_total,
  preco_venda = EXCLUDED.preco_venda,
  updated_at = EXCLUDED.updated_at;

-- NOTA: A tabela cortina_items contém ~102 registros
-- Para backup completo, use o comando CLI:
-- supabase db dump --data-only --table public.cortina_items -f cortina_items_completo.sql


-- =====================
-- OPORTUNIDADES (75 registros - amostra)
-- =====================

INSERT INTO oportunidades (id, titulo, contato_id, orcamento_id, etapa, temperatura, valor_estimado, data_previsao_fechamento, origem, observacoes, motivo_perda, organization_id, created_by_user_id, created_at, updated_at) VALUES
('4b3699e2-51df-4b38-b093-ecb987ad3776', 'ORC-2025-0023 - Franciele Marchewsky', '26a33230-baaa-4e52-a6b5-e31f81b3b2ac', '86ece6d4-05ed-437a-a742-872dd2873baa', 'negociacao', 'frio', 4802.43, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('9ff1d512-a20c-4b9b-86c9-7003d793ae53', 'ORC-2025-0034 - Joana', '06647a04-82c5-4072-9ea7-411fa960a45a', 'a2606bf1-6167-47f9-b754-b5c25d7af547', 'fechado_perdido', 'frio', 7061.72, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 20:17:23.804566+00'),
('be7f905d-576d-44c4-a074-a722b08eb2a3', 'ORC-2025-0027 - Linda', '0b190df5-a084-4a80-9b32-68f49037ed71', 'eace0cc5-81d3-48ca-9fb9-d2b99e7e4a3a', 'fechado_ganho', 'quente', 2176.06, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('a083613d-5224-41ac-a71e-8757620e47fe', 'ORC-2025-0018 - Nadir', 'ac3f94f9-9fc1-4536-a328-add148991c35', 'e92c142d-a7a1-46ae-8074-7e8e6484d1c0', 'fechado_ganho', 'quente', 1000.41, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('a9c8c160-1c18-470e-abb8-aa94db78961b', 'ORC-2025-0016 - Lara', 'cd6fcef9-4616-40df-9063-65ee994204da', '1853c777-d77c-41fa-bfa3-471fab4e902c', 'negociacao', 'frio', 1332.63, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('9e67c9cb-16da-4543-9635-e18441df2e9e', 'ORC-2025-0021 - Bruno', 'ac974918-72bb-4dbe-8b8f-9061ae054afd', '0c24959a-11cd-489e-923e-ce840b156fc4', 'fechado_ganho', 'quente', 1450.68, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('01f02fc3-f76f-4257-b9f3-2fcb558f3b20', 'ORC-2025-0015 - Julia Roberta', 'd16e5e51-13a0-49c8-9283-43b770788cbd', '46ed729a-846e-4654-9db8-e46dff5062a9', 'negociacao', 'frio', 481.84, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('a8d0e180-068d-419f-b761-156c36d6589a', 'ORC-2025-0010 - Elizabeth', 'fb2560ac-5ab1-42ed-be8d-f35dc48e2aa7', '34dbb2a4-34ed-47bc-b40f-043d59806c14', 'fechado_perdido', 'frio', 827.04, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('5325a56d-d24c-4260-ae0c-bc8ef3bc56f7', 'ORC-2025-0038 - Mauricio', 'e6e0ef22-9fb9-445a-a444-9017183d3fc0', 'd76cbade-fb89-46c6-af11-48433c064b0e', 'negociacao', 'frio', 6069.89, NULL, 'orcamento', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00')
ON CONFLICT (id) DO UPDATE SET
  etapa = EXCLUDED.etapa,
  temperatura = EXCLUDED.temperatura,
  valor_estimado = EXCLUDED.valor_estimado,
  updated_at = EXCLUDED.updated_at;

-- NOTA: A tabela oportunidades contém ~75 registros
-- Para backup completo, use o comando CLI:
-- supabase db dump --data-only --table public.oportunidades -f oportunidades_completo.sql


-- =====================
-- ATIVIDADES CRM (102 registros - amostra)
-- =====================

INSERT INTO atividades_crm (id, titulo, descricao, tipo, data_atividade, data_lembrete, concluida, contato_id, oportunidade_id, orcamento_id, organization_id, created_by_user_id, created_at, updated_at) VALUES
('64af8404-05a5-4280-b62e-f26c4944e656', 'Proposta enviada - ORC-2025-0007', 'Orçamento ORC-2025-0007 enviado para Fernanda. Valor: R$ 800.00', 'email', '2025-12-04 19:37:11.803237+00', NULL, true, '3c525452-395c-4e44-a99a-4a5476bc431f', NULL, '6587caf1-04c6-4e0c-97f9-080177f41c51', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('5bad505f-8cae-4be2-8df5-b621d70cad56', 'Proposta enviada - ORC-2025-0006', 'Orçamento ORC-2025-0006 enviado para Valeria. Valor: R$ 1976.96', 'email', '2025-12-05 13:22:48.198533+00', NULL, true, '2e5294b7-881e-456b-9efa-433133b9bb0f', NULL, 'c8558d04-79da-4d1b-b6c7-5b0a4af726e0', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('b5590f8c-a828-4a5d-a005-65e8fe4b2e17', 'Proposta enviada - ORC-2025-0001', 'Orçamento ORC-2025-0001 enviado para Giancarlo. Valor: R$ 4205.92', 'email', '2025-12-05 13:23:33.179001+00', NULL, true, '6b4d0e93-5ed6-4179-b467-d149e047e387', NULL, '06e16b13-0e01-40df-a1a5-429cedd2aefc', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('4ef72b90-2894-4572-955c-36898f6b75ea', 'Venda fechada - ORC-2025-0018', 'Orçamento ORC-2025-0018 foi pago. Valor: R$ 1000.41', 'outro', '2025-12-05 13:42:30.974422+00', NULL, true, 'ac3f94f9-9fc1-4536-a328-add148991c35', NULL, 'e92c142d-a7a1-46ae-8074-7e8e6484d1c0', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('4b5e58b3-71ef-407c-8c15-f9db48387d30', 'Proposta enviada - ORC-2025-0018', 'Orçamento ORC-2025-0018 enviado para Nadir. Valor: R$ 1000.41', 'email', '2025-12-05 13:42:30.974422+00', NULL, true, 'ac3f94f9-9fc1-4536-a328-add148991c35', NULL, 'e92c142d-a7a1-46ae-8074-7e8e6484d1c0', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('783f0d06-402a-403f-9ac1-7d6b6952ef5d', 'Proposta enviada - ORC-2025-0026', 'Orçamento ORC-2025-0026 enviado para Giovana. Valor: R$ 2461.50', 'email', '2025-12-10 19:43:54.618244+00', NULL, true, '382cd240-88de-4221-8a09-aa0c14ea4f8d', NULL, '7daa79ad-dcb6-46aa-bf71-f2651d77267d', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('bfd51d37-efc1-4761-8401-8d656975a994', 'Venda fechada - ORC-2025-0026', 'Orçamento ORC-2025-0026 foi pago. Valor: R$ 2461.50', 'outro', '2025-12-10 19:43:54.618244+00', NULL, true, '382cd240-88de-4221-8a09-aa0c14ea4f8d', NULL, '7daa79ad-dcb6-46aa-bf71-f2651d77267d', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00'),
('fcd94505-2aa3-4968-845f-278f987a30e0', 'Proposta enviada - ORC-2025-0004', 'Orçamento ORC-2025-0004 enviado para MULTIPARQUE SPE TURISMO. Valor: R$ 9015.44', 'email', '2025-12-12 06:00:06.309676+00', NULL, true, 'f2df6bcf-9a61-4e09-88be-214ed9259917', NULL, 'fe34c1f4-881c-42df-ad6d-c9292abaf589', '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2025-12-23 23:26:07.586964+00', '2026-01-07 19:10:38.669457+00')
ON CONFLICT (id) DO UPDATE SET
  concluida = EXCLUDED.concluida,
  updated_at = EXCLUDED.updated_at;

-- NOTA: A tabela atividades_crm contém ~102 registros
-- Para backup completo, use o comando CLI:
-- supabase db dump --data-only --table public.atividades_crm -f atividades_crm_completo.sql
