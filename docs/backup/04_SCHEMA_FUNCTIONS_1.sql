-- =====================================================
-- PRISMA ERP - FUNÇÕES DO BANCO DE DADOS (PARTE 1)
-- Gerado em: 2026-01-13
-- =====================================================

-- =====================================================
-- FUNÇÕES AUXILIARES DE ORGANIZAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_id_direct()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_org_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- FUNÇÕES DE GERAÇÃO DE CÓDIGO
-- =====================================================

CREATE OR REPLACE FUNCTION public.gerar_codigo_orcamento()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  novo_codigo TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo ~ ('^ORC-' || ano || '-[0-9]+$')
      THEN CAST(SUBSTRING(codigo FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequencia
  FROM public.orcamentos
  WHERE codigo LIKE 'ORC-' || ano || '-%';
  
  novo_codigo := 'ORC-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN novo_codigo;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_gerar_codigo_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.gerar_codigo_orcamento();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_numero_pedido()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  novo_numero TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN numero_pedido ~ ('^PED-' || ano || '-[0-9]+$')
      THEN CAST(SUBSTRING(numero_pedido FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequencia
  FROM public.pedidos
  WHERE numero_pedido LIKE 'PED-' || ano || '-%';
  
  novo_numero := 'PED-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN novo_numero;
END;
$$;

-- =====================================================
-- FUNÇÕES DE ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_status_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_visita_status_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNÇÕES DE CÁLCULO DE ORÇAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.recalcular_totais_orcamento(p_orcamento_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_soma_custo numeric;
  v_soma_preco_venda numeric;
  v_desconto_tipo text;
  v_desconto_valor numeric;
  v_margem_percent numeric;
  v_total_com_desconto numeric;
BEGIN
  SELECT 
    COALESCE(SUM(custo_total), 0),
    COALESCE(SUM(preco_venda), 0)
  INTO v_soma_custo, v_soma_preco_venda
  FROM cortina_items
  WHERE orcamento_id = p_orcamento_id;

  SELECT desconto_tipo, COALESCE(desconto_valor, 0), margem_percent
  INTO v_desconto_tipo, v_desconto_valor, v_margem_percent
  FROM orcamentos
  WHERE id = p_orcamento_id;

  IF v_desconto_tipo = 'percentual' THEN
    v_total_com_desconto := v_soma_preco_venda * (1 - v_desconto_valor / 100);
  ELSIF v_desconto_tipo = 'valor' THEN
    v_total_com_desconto := v_soma_preco_venda - v_desconto_valor;
  ELSE
    v_total_com_desconto := v_soma_preco_venda;
  END IF;

  IF v_total_com_desconto < 0 THEN
    v_total_com_desconto := 0;
  END IF;

  UPDATE orcamentos
  SET 
    custo_total = v_soma_custo,
    total_geral = v_soma_preco_venda,
    total_com_desconto = v_total_com_desconto,
    updated_at = now()
  WHERE id = p_orcamento_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalcular_totais_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalcular_totais_orcamento(OLD.orcamento_id);
    RETURN OLD;
  ELSE
    PERFORM recalcular_totais_orcamento(NEW.orcamento_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalcular_desconto_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.desconto_tipo IS DISTINCT FROM NEW.desconto_tipo 
     OR OLD.desconto_valor IS DISTINCT FROM NEW.desconto_valor THEN
    PERFORM recalcular_totais_orcamento(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calcular_previsao_entrega(p_orcamento_id uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_days INTEGER := 5;
  v_total_items INTEGER;
  v_motorizados INTEGER;
  v_fabricas INTEGER;
  v_carga_etapas INTEGER;
  v_dias_totais INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE motorizada = true),
    COUNT(*) FILTER (WHERE fabrica IS NOT NULL AND fabrica != '')
  INTO v_total_items, v_motorizados, v_fabricas
  FROM cortina_items
  WHERE orcamento_id = p_orcamento_id;

  SELECT COUNT(*)
  INTO v_carga_etapas
  FROM itens_pedido ip
  JOIN pedidos p ON ip.pedido_id = p.id
  WHERE ip.status_item NOT IN ('pronto', 'fila')
  AND p.status_producao NOT IN ('entregue', 'cancelado');

  v_dias_totais := v_base_days;
  v_dias_totais := v_dias_totais + (GREATEST(v_total_items - 1, 0) * 2);
  v_dias_totais := v_dias_totais + (v_motorizados * 3);
  v_dias_totais := v_dias_totais + (v_fabricas * 5);
  
  IF v_carga_etapas > 10 THEN
    v_dias_totais := v_dias_totais + 2;
  END IF;

  RETURN CURRENT_DATE + v_dias_totais;
END;
$$;

-- =====================================================
-- FUNÇÕES DE ATUALIZAÇÃO DE CONTAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.atualizar_contas_atrasadas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.contas_pagar
  SET status = 'atrasado'
  WHERE status = 'pendente' 
  AND data_vencimento < CURRENT_DATE;

  UPDATE public.contas_receber
  SET status = 'atrasado'
  WHERE status IN ('pendente', 'parcial') 
  AND data_vencimento < CURRENT_DATE;

  UPDATE public.parcelas_receber
  SET status = 'atrasado'
  WHERE status = 'pendente' 
  AND data_vencimento < CURRENT_DATE;
END;
$$;

-- =====================================================
-- FUNÇÕES DE SINCRONIZAÇÃO CRM
-- =====================================================

CREATE OR REPLACE FUNCTION public.atualizar_ultima_interacao_contato()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.contato_id IS NOT NULL THEN
    UPDATE contatos
    SET ultima_interacao_em = NOW()
    WHERE id = NEW.contato_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_contato_from_orcamento_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contato_id uuid;
  v_valor_orcamento numeric;
BEGIN
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
    v_contato_id := NEW.contato_id;
    
    IF v_contato_id IS NULL THEN
      SELECT id INTO v_contato_id
      FROM contatos
      WHERE telefone = NEW.cliente_telefone
      LIMIT 1;
      
      IF v_contato_id IS NOT NULL THEN
        NEW.contato_id := v_contato_id;
      END IF;
    END IF;
    
    IF v_contato_id IS NOT NULL THEN
      v_valor_orcamento := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      UPDATE contatos
      SET 
        tipo = 'cliente',
        valor_total_gasto = COALESCE(valor_total_gasto, 0) + v_valor_orcamento,
        updated_at = NOW()
      WHERE id = v_contato_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNÇÕES DE ASSINATURA/PLANOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.org_has_feature(p_org_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_features JSONB;
BEGIN
  SELECT p.features INTO v_features
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  RETURN v_features ? p_feature;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_max_usuarios_base INT;
  v_usuarios_adicionais INT;
  v_max_usuarios_total INT;
  v_usuarios_atuais INT;
  v_expansivel BOOLEAN;
BEGIN
  SELECT 
    COALESCE(s.custom_max_usuarios, p.max_usuarios),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(p.max_usuarios_expansivel, true)
  INTO v_max_usuarios_base, v_usuarios_adicionais, v_expansivel
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = NEW.organization_id
    AND s.status IN ('trial', 'active');
  
  v_max_usuarios_total := v_max_usuarios_base + v_usuarios_adicionais;
  
  SELECT COUNT(*) INTO v_usuarios_atuais
  FROM organization_members
  WHERE organization_id = NEW.organization_id;
  
  IF v_max_usuarios_total IS NOT NULL AND v_usuarios_atuais >= v_max_usuarios_total THEN
    IF v_expansivel THEN
      RAISE EXCEPTION 'Limite de usuários atingido (% de %). Adicione mais usuários ao seu plano por R$ 69,90/mês cada.', v_usuarios_atuais, v_max_usuarios_total;
    ELSE
      RAISE EXCEPTION 'Limite de usuários atingido para este plano (% de %)', v_usuarios_atuais, v_max_usuarios_total;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calcular_preco_mensal_assinatura(p_org_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_preco_base DECIMAL(10,2);
  v_usuarios_adicionais INT;
  v_preco_usuario_adicional DECIMAL(10,2);
  v_preco_total DECIMAL(10,2);
BEGIN
  SELECT 
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)
  INTO v_preco_base, v_usuarios_adicionais, v_preco_usuario_adicional
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  v_preco_total := COALESCE(v_preco_base, 0) + (COALESCE(v_usuarios_adicionais, 0) * COALESCE(v_preco_usuario_adicional, 69.90));
  
  RETURN v_preco_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subscription_details(p_org_id uuid)
RETURNS TABLE(
  plano_nome text, 
  plano_codigo text, 
  preco_base numeric, 
  usuarios_inclusos integer, 
  usuarios_adicionais integer, 
  usuarios_total integer, 
  preco_usuario_adicional numeric, 
  valor_usuarios_adicionais numeric, 
  preco_total_mensal numeric, 
  status text, 
  trial_ends_at timestamp with time zone, 
  current_period_end timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.nome,
    p.codigo,
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    p.max_usuarios,
    COALESCE(s.usuarios_adicionais, 0),
    p.max_usuarios + COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90),
    (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    COALESCE(s.custom_preco_mensal, p.preco_mensal) + (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    s.status,
    s.trial_ends_at,
    s.current_period_end
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.adicionar_usuarios_assinatura(p_org_id uuid, p_quantidade integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE subscriptions
  SET 
    usuarios_adicionais = COALESCE(usuarios_adicionais, 0) + p_quantidade,
    updated_at = now()
  WHERE organization_id = p_org_id
    AND status IN ('trial', 'active');
END;
$$;

-- =====================================================
-- FUNÇÃO SETUP NEW ORGANIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.setup_new_organization(p_org_id uuid, p_template_org_id uuid DEFAULT '11111111-1111-1111-1111-111111111111'::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Copiar materiais template para nova organização
  INSERT INTO materiais (
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, ativo,
    organization_id
  )
  SELECT 
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, true,
    p_org_id
  FROM materiais
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de confecção
  INSERT INTO servicos_confeccao (
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, ativo, organization_id
  )
  SELECT 
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, true, p_org_id
  FROM servicos_confeccao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de instalação
  INSERT INTO servicos_instalacao (
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, ativo, organization_id
  )
  SELECT 
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, true, p_org_id
  FROM servicos_instalacao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar categorias financeiras padrão
  INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo, organization_id)
  SELECT nome, tipo, cor, icone, true, p_org_id
  FROM categorias_financeiras
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar formas de pagamento padrão
  INSERT INTO formas_pagamento (
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, organization_id
  )
  SELECT 
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, true, p_org_id
  FROM formas_pagamento
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar configurações do sistema
  INSERT INTO configuracoes_sistema (chave, valor, descricao, organization_id)
  SELECT chave, valor, descricao, p_org_id
  FROM configuracoes_sistema
  WHERE organization_id = p_template_org_id;
  
END;
$$;

-- =====================================================
-- FUNÇÃO TRUNCATE MATERIAIS
-- =====================================================

CREATE OR REPLACE FUNCTION public.truncate_materials_and_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.materiais WHERE TRUE;
  DELETE FROM public.servicos_confeccao WHERE TRUE;
  DELETE FROM public.servicos_instalacao WHERE TRUE;
  
  RAISE NOTICE 'All materials and services data cleared successfully';
END;
$$;
