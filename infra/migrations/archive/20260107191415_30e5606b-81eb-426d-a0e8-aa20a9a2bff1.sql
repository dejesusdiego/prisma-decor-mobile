-- =====================================================
-- FASE 3: TRIGGER PARA AUTO-PREENCHER organization_id
-- =====================================================

-- Função para auto-preencher organization_id baseado no created_by_user_id
CREATE OR REPLACE FUNCTION public.auto_set_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se organization_id já está preenchido, manter
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Tentar obter organization_id do usuário
  SELECT organization_id INTO NEW.organization_id
  FROM organization_members
  WHERE user_id = COALESCE(NEW.created_by_user_id, auth.uid())
  LIMIT 1;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger em todas as tabelas transacionais
CREATE TRIGGER auto_set_org_orcamentos BEFORE INSERT ON public.orcamentos
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_contatos BEFORE INSERT ON public.contatos
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_pedidos BEFORE INSERT ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_oportunidades BEFORE INSERT ON public.oportunidades
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_atividades BEFORE INSERT ON public.atividades_crm
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_contas_receber BEFORE INSERT ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_contas_pagar BEFORE INSERT ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_lancamentos BEFORE INSERT ON public.lancamentos_financeiros
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_comissoes BEFORE INSERT ON public.comissoes
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_notificacoes BEFORE INSERT ON public.notificacoes
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();