-- 1. Atualizar solicitações existentes para Prisma
UPDATE solicitacoes_visita 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

-- 2. Remover políticas com brecha de segurança
DROP POLICY IF EXISTS "Org users can view solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can update solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create visit requests" ON solicitacoes_visita;

-- 3. Criar políticas mais restritivas (sem OR organization_id IS NULL)
CREATE POLICY "Org members view own solicitacoes" ON solicitacoes_visita
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org members update own solicitacoes" ON solicitacoes_visita
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- 4. Política para inserção pública (edge function usa service role, mas manter para segurança)
CREATE POLICY "Public can create visit requests" ON solicitacoes_visita
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);