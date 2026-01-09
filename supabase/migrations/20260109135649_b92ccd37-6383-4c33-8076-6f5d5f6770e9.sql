-- FASE 1: Adicionar organization_id às tabelas de extrato bancário para isolamento multi-tenant

-- 1.1 Adicionar coluna organization_id a extratos_bancarios
ALTER TABLE public.extratos_bancarios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 1.2 Adicionar coluna organization_id a movimentacoes_extrato
ALTER TABLE public.movimentacoes_extrato 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 1.3 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_org ON public.extratos_bancarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_extrato_org ON public.movimentacoes_extrato(organization_id);

-- 1.4 Backfill: Associar registros existentes à organização do usuário que criou
UPDATE public.extratos_bancarios eb
SET organization_id = om.organization_id
FROM public.organization_members om
WHERE eb.created_by_user_id = om.user_id
AND eb.organization_id IS NULL;

-- 1.5 Propagar org_id para movimentações via extrato
UPDATE public.movimentacoes_extrato me
SET organization_id = eb.organization_id
FROM public.extratos_bancarios eb
WHERE me.extrato_id = eb.id
AND me.organization_id IS NULL
AND eb.organization_id IS NOT NULL;

-- 1.6 Criar triggers para auto-set organization_id
DROP TRIGGER IF EXISTS auto_set_org_extratos_bancarios ON public.extratos_bancarios;
CREATE TRIGGER auto_set_org_extratos_bancarios
  BEFORE INSERT ON public.extratos_bancarios
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_id();

DROP TRIGGER IF EXISTS auto_set_org_movimentacoes_extrato ON public.movimentacoes_extrato;
CREATE TRIGGER auto_set_org_movimentacoes_extrato
  BEFORE INSERT ON public.movimentacoes_extrato
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_id();

-- 1.7 Habilitar RLS
ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_extrato ENABLE ROW LEVEL SECURITY;

-- 1.8 Políticas RLS para extratos_bancarios
DROP POLICY IF EXISTS "org_select_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_select_extratos" ON public.extratos_bancarios 
FOR SELECT USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_insert_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_insert_extratos" ON public.extratos_bancarios 
FOR INSERT WITH CHECK (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_update_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_update_extratos" ON public.extratos_bancarios 
FOR UPDATE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_delete_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_delete_extratos" ON public.extratos_bancarios 
FOR DELETE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

-- 1.9 Políticas RLS para movimentacoes_extrato
DROP POLICY IF EXISTS "org_select_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_select_movimentacoes" ON public.movimentacoes_extrato 
FOR SELECT USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_insert_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_insert_movimentacoes" ON public.movimentacoes_extrato 
FOR INSERT WITH CHECK (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_update_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_update_movimentacoes" ON public.movimentacoes_extrato 
FOR UPDATE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_delete_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_delete_movimentacoes" ON public.movimentacoes_extrato 
FOR DELETE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);