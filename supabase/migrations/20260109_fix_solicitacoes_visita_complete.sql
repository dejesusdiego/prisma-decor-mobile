-- =====================================================
-- FIX COMPLETO: SOLICITACOES_VISITA
-- Resolve problemas de INSERT tanto da LP quanto do sistema interno
-- =====================================================

-- =====================================================
-- 1. GARANTIR QUE A ORGANIZAÇÃO PRISMA EXISTE
-- =====================================================
INSERT INTO public.organizations (id, name, slug)
VALUES ('11111111-1111-1111-1111-111111111111', 'Prisma Interiores', 'prisma')
ON CONFLICT (id) DO UPDATE SET slug = 'prisma', name = 'Prisma Interiores';

-- =====================================================
-- 2. ATUALIZAR CONSTRAINT CHECK DO STATUS
-- =====================================================
-- Primeiro remover a constraint antiga
ALTER TABLE public.solicitacoes_visita 
DROP CONSTRAINT IF EXISTS solicitacoes_visita_status_check;

-- Criar nova constraint com todos os status válidos incluindo 'sem_resposta'
ALTER TABLE public.solicitacoes_visita 
ADD CONSTRAINT solicitacoes_visita_status_check 
CHECK (status IN ('pendente', 'confirmada', 'sem_resposta', 'realizada', 'cancelada'));

-- =====================================================
-- 3. REMOVER TODAS AS POLÍTICAS EXISTENTES DE SOLICITACOES_VISITA
-- =====================================================
DROP POLICY IF EXISTS "Anyone can create visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacao_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Public and authenticated can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Authenticated users can view visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Authenticated users can update visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Only admins can delete visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can view solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can update solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can delete solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Users can view solicitacoes" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Users can update solicitacoes" ON solicitacoes_visita;

-- =====================================================
-- 4. CRIAR POLÍTICAS NOVAS E SIMPLES
-- =====================================================

-- 4.1 INSERT: Qualquer um pode criar (LP pública e sistema interno)
CREATE POLICY "insert_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 4.2 SELECT: Usuários autenticados podem ver da sua organização
CREATE POLICY "select_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR SELECT 
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
  OR organization_id IS NULL
);

-- 4.3 UPDATE: Usuários autenticados podem atualizar da sua organização
CREATE POLICY "update_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
  OR organization_id IS NULL
);

-- 4.4 DELETE: Usuários autenticados podem deletar da sua organização
CREATE POLICY "delete_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
  OR organization_id IS NULL
);

-- =====================================================
-- 5. GARANTIR QUE RLS ESTÁ HABILITADO
-- =====================================================
ALTER TABLE public.solicitacoes_visita ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CRIAR FUNÇÃO PARA AUTO-PREENCHER organization_id 
-- (caso o frontend não passe, usa Prisma como default)
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_default_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se organization_id não foi passado, usar Prisma como default
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := '11111111-1111-1111-1111-111111111111';
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para auto-preencher
DROP TRIGGER IF EXISTS set_solicitacoes_visita_org_id ON solicitacoes_visita;
CREATE TRIGGER set_solicitacoes_visita_org_id
  BEFORE INSERT ON solicitacoes_visita
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_organization_id();

-- =====================================================
-- 7. ATUALIZAR REGISTROS EXISTENTES SEM organization_id
-- =====================================================
UPDATE public.solicitacoes_visita 
SET organization_id = '11111111-1111-1111-1111-111111111111' 
WHERE organization_id IS NULL;

-- =====================================================
-- 8. GARANTIR QUE TODOS OS USUÁRIOS EXISTENTES ESTÃO NA ORGANIZAÇÃO PRISMA
-- (Resolve problema de usuários sem membership que não conseguem fazer INSERT)
-- =====================================================
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  id,
  'member'
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM public.organization_members
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. CRIAR FUNÇÃO get_user_organization_id COM FALLBACK PARA PRISMA
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT organization_id 
     FROM public.organization_members 
     WHERE user_id = auth.uid()
     LIMIT 1),
    '11111111-1111-1111-1111-111111111111'::uuid -- Fallback para Prisma
  );
$$;
