-- =====================================================
-- PRISMA ERP - DADOS BASE - ORGANIZATIONS & PLANS
-- Gerado em: 2026-01-13
-- =====================================================

-- =====================================================
-- ORGANIZATIONS
-- =====================================================

INSERT INTO public.organizations (id, name, slug, active, email, phone, whatsapp, website, cnpj, tagline, address, primary_color, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Prisma Interiores', 'prisma', true, 'somosprismainteriores@gmail.com', '(47) 99262-4706', '(47) 99262-4706', 'Prismadecorlab.com', '44.840.624/0001-92', 'Transformando ambientes em experiências únicas', '', '#111111', '2026-01-07 19:10:38.669457+00', '2026-01-13 17:38:39.966097+00'),
  ('22222222-2222-2222-2222-222222222222', 'CM HOME DECOR', 'andreia-weber', true, 'cmhomedecor1@gmail.com', '(47) 98404-6378', '(47) 98404-6378', '@CORTINASCMDECOR', '50.060.350/0001-11', 'Detalhes que transformam.', 'Rua Marrocos, 540, sala - 1', '#22324c', '2026-01-07 19:10:38.669457+00', '2026-01-13 15:26:16.949878+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- =====================================================
-- PLANS
-- =====================================================

INSERT INTO public.plans (id, nome, codigo, descricao, preco_mensal, preco_implementacao, max_usuarios, max_usuarios_expansivel, preco_usuario_adicional, max_orcamentos_mes, max_storage_gb, features, ativo, destaque, ordem)
VALUES 
  ('f0edfea3-d293-4978-9f61-7702aca7e329', 'Starter', 'starter_3', 'Ideal para pequenas empresas começando a organizar seus processos', 499.00, 3000.00, 3, true, 69.90, 100, 5, '["orcamentos", "crm_basico", "producao", "calendario"]'::jsonb, true, false, 1),
  ('1d5a1b14-d8b6-45f1-a5ab-4fd43bb80c6d', 'Profissional', 'pro_10', 'Para empresas em crescimento que precisam de mais controle', 899.00, 4500.00, 10, true, 69.90, 500, 5, '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "calendario"]'::jsonb, true, true, 2),
  ('b2304ed5-53cd-46b8-b9c1-2b797bfc480c', 'Business', 'business_25', 'Solução completa para operações de médio porte', 1499.00, 7000.00, 25, true, 69.90, NULL, 5, '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "calendario", "suporte_prioritario"]'::jsonb, true, false, 3),
  ('582fccac-28de-46f5-bf54-1a8b77535db0', 'Enterprise', 'enterprise_50', 'Máxima performance para grandes operações', 2499.00, 12000.00, 50, true, 59.90, NULL, 5, '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "integracao_whatsapp", "api_acesso", "calendario", "suporte_prioritario", "customizacoes"]'::jsonb, true, false, 4)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- USER ROLES (precisam ser ajustados para novos user_ids)
-- =====================================================

-- NOTA: Estes user_ids são do Supabase original. 
-- Você precisará criar novos usuários e ajustar os IDs.

-- INSERT INTO public.user_roles (user_id, role) VALUES 
--   ('NOVO_USER_ID_AQUI', 'admin');

-- =====================================================
-- ORGANIZATION MEMBERS (precisam ser ajustados)
-- =====================================================

-- NOTA: Ajuste os user_ids após criar os usuários no novo projeto.

-- INSERT INTO public.organization_members (organization_id, user_id, role) VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'NOVO_USER_ID', 'owner');

-- =====================================================
-- FORMAS DE PAGAMENTO
-- =====================================================

INSERT INTO public.formas_pagamento (id, nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, organization_id) VALUES
  ('0ffcb307-71de-433a-bba9-8170fe332011', 'PIX', 'pix', false, 1, 0, true, '11111111-1111-1111-1111-111111111111'),
  ('0bfe1a84-3af3-486c-80c2-33efaea8fcda', 'Dinheiro', 'dinheiro', false, 1, 0, true, '11111111-1111-1111-1111-111111111111'),
  ('be6bdd03-5b7a-4814-975a-e3510d816338', 'Cartão de Crédito', 'cartao_credito', true, 12, 0, true, '11111111-1111-1111-1111-111111111111'),
  ('0768d808-c2d9-4aa3-be31-6fd5dbbb387d', 'Cartão de Débito', 'cartao_debito', true, 12, 0, true, '11111111-1111-1111-1111-111111111111'),
  ('6ad7842c-bb68-4975-889a-9487cf8fc228', 'Boleto Bancário', 'boleto', true, 6, 0, true, '11111111-1111-1111-1111-111111111111'),
  ('51c0d28f-3611-4fce-b609-19615e04a54c', 'Cheque', 'cheque', true, 3, 0, true, '11111111-1111-1111-1111-111111111111'),
  ('f69464eb-ca07-44f5-99df-7983e5a5079f', 'Transferência Bancária', 'transferencia', false, 1, 0, true, '11111111-1111-1111-1111-111111111111'),
  ('5f4d9735-a77e-4416-a8e4-bba7cf3dc945', 'PIX', 'pix', false, 1, 0, true, '22222222-2222-2222-2222-222222222222'),
  ('cf20d2fa-66ed-4c89-8a61-169cfea1440a', 'Dinheiro', 'dinheiro', false, 1, 0, true, '22222222-2222-2222-2222-222222222222'),
  ('68de506a-4f0f-4524-be60-8b5193b46ee2', 'Cartão de Crédito', 'cartao_credito', true, 12, 0, true, '22222222-2222-2222-2222-222222222222'),
  ('f9f0bfa6-84e4-416e-a078-b1b7ed53ce94', 'Cartão de Débito', 'cartao_debito', true, 12, 0, true, '22222222-2222-2222-2222-222222222222'),
  ('5742d619-01ff-4846-a068-ffee64ac9a97', 'Boleto Bancário', 'boleto', true, 6, 0, true, '22222222-2222-2222-2222-222222222222'),
  ('b1fd483f-86f1-47f6-bb19-7275a387a6c0', 'Cheque', 'cheque', true, 3, 0, true, '22222222-2222-2222-2222-222222222222'),
  ('8d2548ad-a96e-4715-bac9-2a33cdaadfb6', 'Transferência Bancária', 'transferencia', false, 1, 0, true, '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CONFIGURAÇÕES DO SISTEMA
-- =====================================================

INSERT INTO public.configuracoes_sistema (id, chave, valor, descricao, organization_id) VALUES
  ('29927325-9a86-4537-ac11-b2b5ddb3af7a', 'coeficientes_forro', '{"celular":1,"horizontal":1,"madeira":1,"outro":1,"painel":2.5,"prega":2.5,"rolo":2.5,"romana":1,"vertical":1,"wave":2.5}'::jsonb, 'Coeficientes de consumo de forro por tipo de cortina', '11111111-1111-1111-1111-111111111111'),
  ('9be53fd6-db29-4303-92ce-2d9ccb322047', 'coeficientes_tecido', '{"celular":1,"horizontal":1,"madeira":1,"outro":1,"painel":2.5,"prega":3.5,"rolo":3.5,"romana":1,"vertical":1,"wave":3.5}'::jsonb, 'Coeficientes de consumo de tecido por tipo de cortina', '11111111-1111-1111-1111-111111111111'),
  ('08434f6d-e69a-4632-b0cf-0dd94c5f528f', 'dias_sem_resposta', '7'::jsonb, 'Número de dias após envio para considerar orçamento sem resposta', '11111111-1111-1111-1111-111111111111'),
  ('5afaccd3-c369-47d6-b1e8-a39c9d2c3d78', 'dias_sem_resposta_visitas', '3'::jsonb, 'Dias até marcar solicitação de visita como sem resposta', '11111111-1111-1111-1111-111111111111'),
  ('d0b49aa8-6bfb-4b3b-bda7-128d820d8c34', 'metas_vendas', '{"metaConversao":30,"metaNovosClientes":20,"metaTicketMedio":5000,"metaVendasMensal":30000}'::jsonb, 'Metas de vendas configuráveis', '11111111-1111-1111-1111-111111111111'),
  ('7a545cd0-b15d-411e-8018-f2281cb5204b', 'opcoes_ambiente', '["Sala de Estar","Sala de Jantar","Quarto","Cozinha","Escritório","Varanda","Banheiro","Lavanderia","Área Externa","Outros"]'::jsonb, 'Opções de ambiente disponíveis', '11111111-1111-1111-1111-111111111111'),
  ('1ec03a51-0b6d-4100-a139-1b7b0a84c3b7', 'opcoes_margem', '[{"label":"Baixa (40%)","valor":40},{"label":"Padrão (61.5%)","valor":61.5},{"label":"Premium (80%)","valor":80}]'::jsonb, 'Opções de margem disponíveis', '11111111-1111-1111-1111-111111111111'),
  ('d3ddc7a6-b521-41b5-aabb-f408f7f87cb3', 'servico_forro_padrao', 'null'::jsonb, 'UUID do serviço de forro padrão (Forro Costurado Junto ou Forro Com Botões)', '11111111-1111-1111-1111-111111111111'),
  ('a9bc41fb-2bbb-462f-bc21-6c79721f7447', 'servicos_por_tipo_cortina', '{"painel":[],"prega":[],"rolo":[],"wave":[]}'::jsonb, 'Mapeamento de serviços de confecção por tipo de cortina (array de UUIDs de serviços)', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SERVIÇO DE INSTALAÇÃO PADRÃO
-- =====================================================

INSERT INTO public.servicos_instalacao (id, nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent, codigo_item, ativo, organization_id) VALUES
  ('6db93040-8cb4-4062-a9c4-31cdd8a05de3', 'Instalação padrão de cortinas', 129.00, 208.34, 61.50, 'INST-CORTINA-PADRAO', true, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
