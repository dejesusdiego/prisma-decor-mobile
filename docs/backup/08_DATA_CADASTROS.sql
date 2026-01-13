-- =========================================
-- BACKUP DE DADOS - CADASTROS
-- Gerado em: 2026-01-13
-- Tabelas: materiais, servicos_confeccao, servicos_instalacao, categorias_financeiras, contatos
-- =========================================

-- =====================
-- MATERIAIS (1200+ registros - amostra representativa)
-- Para backup completo, use: supabase db dump --data-only --table public.materiais
-- =====================

-- Acessórios
INSERT INTO materiais (id, categoria, nome, codigo_item, preco_custo, preco_tabela, margem_tabela_percent, unidade, ativo, fornecedor, linha, tipo, aplicacao, perda_percent, organization_id, created_at, updated_at) VALUES
('300b6384-116d-4e57-b00c-97bec8bed5f8', 'acessorio', '(1) SUPORTE L REGULAVEL 6X9 BRANCO', 'ACE-501.090.001.00.00', 18.50, 29.88, 61.50, 'UN', true, 'TS', 'VARÃO', 'SUPORTE L', 'REGULAVEL 6X9 BRANCO', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('b2e3bcfa-688a-4547-b685-0d5692128e68', 'acessorio', '(1) SUPORTE L REGULAVEL 6X9 BRILHAN', 'ACE-501.090.021.00.00', 18.50, 29.88, 61.50, 'UN', true, 'TS', 'VARÃO', 'SUPORTE L', 'REGULAVEL 6X9 BRILHANTE', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('d51352a3-d7f8-4af5-bf9d-7880b6da1279', 'acessorio', '(1) SUPORTE L REGULAVEL 6X9 ESCOVAD', 'ACE-501.090.003.00.00', 18.50, 29.88, 61.50, 'UN', true, 'TS', 'VARÃO', 'SUPORTE L', 'REGULAVEL 6X9 ESCOVADO', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('337fadb1-1b68-4d92-8e1c-85196567a04a', 'acessorio', '(1) SUPORTE L REGULAVEL 6X9 PRETO', 'ACE-501.090.002.00.00', 18.50, 29.88, 61.50, 'UN', true, 'TS', 'VARÃO', 'SUPORTE L', 'REGULAVEL 6X9 PRETO', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('f7ad4bc2-ee52-4812-93d4-bbf81d519cfa', 'acessorio', '(1) SUPORTE L REGULAVEL 6X9 TITANIO', 'ACE-501.090.004.00.00', 18.50, 29.88, 61.50, 'UN', true, 'TS', 'VARÃO', 'SUPORTE L', 'REGULAVEL 6X9 TITANIO', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('b1ad0a40-023e-44de-8d5e-d2f8f7e486fe', 'acessorio', 'CARRINHO DESLIZANTE WAVE/MAX', 'ACE-204.500.002.15.01', 1.69, 2.73, 61.50, 'UN', true, 'TS', 'WAVE', 'CARRINHO', 'DESLIZANTE WAVE/MAX', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('1bfef419-9c04-4485-94a1-7ee22043304c', 'acessorio', 'CONJ FIXADOR/MANUAL', 'ACE-501.000.149.28.00', 4.49, 7.25, 61.50, 'UN', true, 'TS', 'VARÃO', 'CONJUNTO', 'FIXADOR/MANUAL', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('6f783b7f-e0cf-4e54-89ce-c5f6f9a86147', 'acessorio', 'CONJ FIXADOR/PARAFUSO', 'ACE-501.000.149.30.00', 4.49, 7.25, 61.50, 'UN', true, 'TS', 'VARÃO', 'CONJUNTO', 'FIXADOR/PARAFUSO', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00'),
('dfbcf8d6-b022-4247-b40c-1d54fd0485bb', 'acessorio', 'CORDA 2.5MM TR PES VG (d05) BRANCA', 'ACE-210.000.350.25.01', 342.00, 552.33, 61.50, 'RL', true, 'TS', 'MAXI', 'CORDA', '2.5MM TR PES VG BRANCA', 10.00, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:12:38.547722+00', '2026-01-13 19:48:32.593985+00')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  preco_custo = EXCLUDED.preco_custo,
  preco_tabela = EXCLUDED.preco_tabela,
  updated_at = EXCLUDED.updated_at;

-- NOTA: A tabela materiais contém ~1200 registros
-- Para backup completo, use o comando CLI:
-- supabase db dump --data-only --table public.materiais -f materiais_completo.sql

-- =====================
-- SERVIÇOS DE CONFECÇÃO (33 registros)
-- =====================

INSERT INTO servicos_confeccao (id, nome_modelo, codigo_item, preco_custo, preco_tabela, margem_tabela_percent, unidade, ativo, organization_id, created_at, updated_at) VALUES
('588d5569-8ada-46bc-b7b6-bd07457b2a23', 'Abraçadeira', 'CONF-ABRA-ADEIRA', 15.00, 23.25, 55.00, 'cada', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('95eb3374-1ee7-40a9-8dfa-25b274da6a8a', 'Alça de Tecido', 'CONF-AL-A-DE-TECIDO', 70.00, 108.50, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('fec13e49-ece0-4b35-b32a-2b41e0f55bea', 'Alça de Tecido c/prega simples preso botão', 'CONF-AL-A-DE-TECIDO-C-PREGA-SIMPLES-PRESO-BOT-O', 75.00, 116.25, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('c60d4580-74a1-4929-bce4-76a920a18d31', 'Almofada (somente capa)', 'CONF-ALMOFADA-SOMENTE-CAPA', 25.00, 38.75, 55.00, 'cada', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('491b1af0-43e3-482d-9a78-e99ca934d4e6', 'Bainha (Postiça ou Normal)', 'CONF-BAINHA-POSTI-A-OU-NORMAL', 30.00, 46.50, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('91eae568-91a8-4fa0-a95d-15d916a60796', 'Barra (Lateral)', 'CONF-BARRA-LATERAL', 20.00, 31.00, 55.00, 'folha', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('48726790-51eb-4457-bfdd-d3001aa06bb6', 'Bk tecido prega simples', 'CONF-BK-TECIDO-PREGA-SIMPLES', 45.00, 69.75, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('aa33e265-d79e-4ea7-b056-a71f7939c26c', 'Black - Out PVC s/ Prega ou Prega Simples', 'CONF-BLACK-OUT-PVC-S-PREGA-OU-PREGA-SIMPLES', 45.00, 69.75, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('4f5f677b-17ec-4a92-9bb1-52ec38f2606d', 'Cortina com pé direito acima de 3,50mt', 'CONF-CORTINA-COM-P-DIREITO-ACIMA-DE-3-50MT', 35.00, 54.25, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('e60c7c4d-a1a4-4826-b85f-1a4a8c24634e', 'Desmanchar alça e colocar rodizio', 'CONF-DESMANCHAR-AL-A-E-COLOCAR-RODIZIO', 40.00, 62.00, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('fed9b973-b3c6-434a-ba57-2b127dfdfa7a', 'Drapeado', 'CONF-DRAPEADO', 55.00, 85.25, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('69da02ed-8ce4-4b0d-95e9-7bd29e79681a', 'Emenda Cortinas por altura', 'CONF-EMENDA-CORTINAS-POR-ALTURA', 15.00, 23.25, 55.00, 'emenda', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('2d7796fc-682e-4a10-b33c-18b1391a74f0', 'Enchimento (sem fibra)', 'CONF-ENCHIMENTO-SEM-FIBRA', 10.00, 15.50, 55.00, 'cada', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00'),
('17a586de-7b71-42af-a5ed-7bb562e16b1d', 'Enfiado Varão', 'CONF-ENFIADO-VAR-O', 50.00, 77.50, 55.00, 'mt', true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:33.127258+00', '2026-01-13 19:48:32.593985+00')
ON CONFLICT (id) DO UPDATE SET
  nome_modelo = EXCLUDED.nome_modelo,
  preco_custo = EXCLUDED.preco_custo,
  preco_tabela = EXCLUDED.preco_tabela,
  updated_at = EXCLUDED.updated_at;


-- =====================
-- SERVIÇOS DE INSTALAÇÃO (1 registro)
-- =====================

INSERT INTO servicos_instalacao (id, nome, codigo_item, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent, ativo, organization_id, created_at, updated_at) VALUES
('6db93040-8cb4-4062-a9c4-31cdd8a05de3', 'Instalação padrão de cortinas', 'INST-CORTINA-PADRAO', 129.00, 208.34, 61.50, true, '11111111-1111-1111-1111-111111111111', '2025-11-26 12:08:44.319323+00', '2026-01-13 19:48:32.593985+00')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  preco_custo_por_ponto = EXCLUDED.preco_custo_por_ponto,
  preco_tabela_por_ponto = EXCLUDED.preco_tabela_por_ponto,
  updated_at = EXCLUDED.updated_at;


-- =====================
-- CATEGORIAS FINANCEIRAS (74 registros - amostra)
-- =====================

INSERT INTO categorias_financeiras (id, nome, tipo, cor, icone, ativo, organization_id, created_at, updated_at) VALUES
-- Despesas
('8476947c-dfa9-4661-97ba-6d511217b530', 'Água', 'despesa', '#06B6D4', 'droplet', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('fcb00b15-e739-4928-9f3e-20c0f4e21dd7', 'Alimentação', 'despesa', '#EC4899', 'circle', true, '11111111-1111-1111-1111-111111111111', '2026-01-11 19:58:10.905563+00', '2026-01-11 19:58:10.905563+00'),
('7ba66ee2-62cf-4eb6-8c66-b4abdb61b9da', 'Aluguel', 'despesa', '#EC4899', 'home', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('7af294be-a218-4c38-9005-340a11490212', 'Combustível', 'despesa', '#84CC16', 'fuel', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('248af3da-0375-4e80-b769-0feb93bda166', 'Comissões', 'despesa', '#14B8A6', 'percent', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('62b7c023-8cae-4914-aa66-4d384554f2bd', 'Contabilidade', 'despesa', '#3B82F6', 'circle', true, '11111111-1111-1111-1111-111111111111', '2025-12-29 19:18:04.492572+00', '2026-01-07 19:25:46.673371+00'),
('ce555891-bf31-438f-b77c-73e44c054dbe', 'Energia Elétrica', 'despesa', '#F97316', 'zap', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('00bfc4f0-5f17-4c3b-8c27-7b4ed15b9456', 'Equipamento e Ferramentas', 'despesa', '#EC4899', 'circle', true, '11111111-1111-1111-1111-111111111111', '2025-12-29 19:57:55.035697+00', '2026-01-07 19:25:46.673371+00'),
('5d84424b-8ac8-4282-bd2e-4e50ff175d82', 'Ferramentas', 'despesa', '#EC4899', 'circle', true, '11111111-1111-1111-1111-111111111111', '2025-12-28 14:09:26.358123+00', '2026-01-07 19:25:46.673371+00'),
('9b4f09b7-4276-4dac-a055-4e6f5956a6a2', 'Marketing', 'despesa', '#EAB308', 'megaphone', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('34442ded-b7a2-445e-aae1-6c6ae95b7131', 'Materiais Cortinas', 'despesa', '#8B5CF6', 'package', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('91296ed5-9c8c-4cca-86ad-b81182b18d44', 'Mão de Obra', 'despesa', '#3B82F6', 'hammer', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('9ec908f3-a8ed-4fed-b58a-4d84d856d3c9', 'Produção e Confecção', 'despesa', '#F97316', 'scissors', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
-- Receitas
('4dbc7dc9-5513-4f9e-8765-0c9b571f7863', 'Venda de Cortinas', 'receita', '#22C55E', 'shopping-bag', true, '11111111-1111-1111-1111-111111111111', '2025-12-23 19:42:21.212259+00', '2026-01-07 19:25:46.673371+00'),
('b609497f-f542-49ca-8e72-b167af59c112', 'Outros Serviços', 'receita', '#3B82F6', 'circle', true, '11111111-1111-1111-1111-111111111111', '2025-12-28 13:58:22.123456+00', '2026-01-07 19:25:46.673371+00')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  cor = EXCLUDED.cor,
  updated_at = EXCLUDED.updated_at;


-- =====================
-- CONTATOS (58 registros)
-- =====================

INSERT INTO contatos (id, nome, telefone, telefone_secundario, email, endereco, cidade, tipo, origem, observacoes, tags, valor_total_gasto, organization_id, created_by_user_id, ultima_interacao_em, created_at, updated_at) VALUES
('1eb31853-5109-4c54-b51d-b4cc8940aad7', 'Alex souto', '(47) 99981-7770', NULL, NULL, 'Edifício duo, rua aririba, torre b, apartamento 1203', 'Itajaí', 'cliente', 'importado_orcamento', NULL, '{}', 2504.01, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00'),
('9c2e4658-ca0b-42bf-8a5c-3a55898054bc', 'Ana Maria', '(54) 99945-0333', NULL, NULL, ' rua 141 n. 51 ap. 12 no centro.', 'Itapema', 'cliente', 'importado_orcamento', NULL, '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 12:19:43.274671+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 12:19:43.274671+00'),
('8456d2d5-109e-4c97-88ef-d9b07e76214c', 'Andri', '(51) 99902-6384', NULL, NULL, 'Não especificado (Confirmar)', 'Porto Belo', 'lead', 'orcamento', NULL, '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 19:35:14.847686+00', '2026-01-08 18:13:26.498414+00', '2026-01-08 19:35:14.847686+00'),
('34439adf-440d-41b5-940c-b6fd5dd36d63', 'Angelina', '(41) 99944-9242', NULL, NULL, 'Av Atlantica,  1940  apto 1202 Ed San Remo - Balneário Camboriú  Entrada do prédio pela rua 51.', 'Balneário Camboriú', 'lead', 'orcamento', NULL, '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-29 17:11:20.583187+00', '2026-01-08 05:06:58.467839+00'),
('88713a0a-a7ef-4667-8081-0372fddb9bd9', 'Bruna Sackmann', '(47) 99936-0970', NULL, NULL, 'Rua coqueiros, 968 - vila real', 'Camboriú', 'cliente', 'visita_site', NULL, '{}', 6799.59, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-09 17:49:03.326684+00', '2026-01-07 14:53:42.818546+00', '2026-01-09 17:49:03.326684+00'),
('ac974918-72bb-4dbe-8b8f-9061ae054afd', 'Bruno', '(47) 99188-0197', NULL, NULL, 'Rua Fermino Vieira Cordeiro, 1442, bloco 9, Ap 407.', 'Itajaí', 'cliente', 'importado_orcamento', NULL, '{}', 1450.68, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00'),
('9a9620cd-10fd-44ce-a5e6-64bcded9f8b2', 'Carla', '(47) 99989-3319', NULL, NULL, 'Rua Jaime cesario Pereira, 90 - Consultório ondotologico em cima', 'Camboriú', 'lead', 'visita_site', 'Cortina blackout 100% e persiana na cozinha', '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-04 03:42:38.285902+00', '2026-01-04 03:42:38.285902+00', '2026-01-07 19:10:38.669457+00'),
('43903148-8fd7-4988-9a17-db98e2b76dd2', 'Carolina', '(51) 98111-4333', NULL, NULL, 'Conselheiro Júlio Kumm, 295 - Ap 401', 'Itajaí', 'lead', 'visita_site', NULL, '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-07 20:20:33.036132+00', '2026-01-07 20:20:33.036132+00', '2026-01-07 20:20:33.036132+00'),
('c7f2bdf1-eeac-43da-af0e-25dc406d02d8', 'Cassia Maria', ' (47) 99782-7458', NULL, NULL, 'Inspetor Francisco Vechani, 590 - Espinheiros.', 'Itajaí', 'cliente', 'importado_orcamento', NULL, '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00'),
('6b4d0e93-5ed6-4179-b467-d149e047e387', 'Giancarlo', '41 9912-0912', NULL, NULL, 'AV ATLANTICA 4980, APTO 702', 'Balneário Camboriú', 'lead', 'importado_orcamento', NULL, '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00'),
('c0018fae-1488-4fd4-bc05-3275c21484bb', 'Kelly', '47999999999', NULL, NULL, 'Rua 2870, 100', 'Balneário Camboriú', 'cliente', 'importado_orcamento', NULL, '{}', 607.28, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00'),
('0b190df5-a084-4a80-9b32-68f49037ed71', 'Linda', '(41) 98853-8979', NULL, NULL, 'Rua 900, 128 ap 1102 - Centro', 'Balneário Camboriú', 'cliente', 'importado_orcamento', NULL, '{}', 2176.06, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00'),
('f2df6bcf-9a61-4e09-88be-214ed9259917', 'MULTIPARQUE SPE TURISMO', '(47) 99995-0099', NULL, NULL, 'Avenida rodesio pavan,11595 - Estaleirinho', 'Balneário Camboriú', 'lead', 'importado_orcamento', NULL, '{}', 0, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00'),
('ac3f94f9-9fc1-4536-a328-add148991c35', 'Nadir', '(47) 98826-3088', NULL, NULL, 'Avenida do Estado, 3195, Apto 204 - Fazenda', 'Itajaí', 'cliente', 'importado_orcamento', NULL, '{}', 1000.41, '11111111-1111-1111-1111-111111111111', 'c6105b6e-0416-437b-9e18-70dbe8db0a87', '2026-01-08 05:06:58.467839+00', '2025-12-23 22:26:56.394979+00', '2026-01-08 05:06:58.467839+00')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  telefone = EXCLUDED.telefone,
  endereco = EXCLUDED.endereco,
  tipo = EXCLUDED.tipo,
  valor_total_gasto = EXCLUDED.valor_total_gasto,
  updated_at = EXCLUDED.updated_at;

-- NOTA: A tabela contatos contém ~58 registros
-- Para backup completo, use o comando CLI:
-- supabase db dump --data-only --table public.contatos -f contatos_completo.sql
