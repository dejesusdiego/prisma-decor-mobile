-- =====================================================
-- FIX: Atualizar constraint CHECK da tabela solicitacoes_visita
-- para incluir status 'sem_resposta'
-- =====================================================

-- Primeiro remover a constraint antiga
ALTER TABLE public.solicitacoes_visita 
DROP CONSTRAINT IF EXISTS solicitacoes_visita_status_check;

-- Criar nova constraint com todos os status válidos
ALTER TABLE public.solicitacoes_visita 
ADD CONSTRAINT solicitacoes_visita_status_check 
CHECK (status IN ('pendente', 'confirmada', 'sem_resposta', 'realizada', 'cancelada'));

-- =====================================================
-- FIX: Garantir que a política de INSERT permite anon e authenticated
-- =====================================================

-- Remover políticas antigas de INSERT
DROP POLICY IF EXISTS "Anyone can create visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacoes_visita" ON solicitacoes_visita;

-- Criar política que permite INSERT para qualquer um (anon e authenticated)
CREATE POLICY "Public and authenticated can create solicitacoes_visita" 
ON public.solicitacoes_visita
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- Garantir que existe a organização Prisma com o slug correto
-- =====================================================

-- Inserir organização Prisma se não existir (usando o UUID fixo)
INSERT INTO public.organizations (id, name, slug)
VALUES ('11111111-1111-1111-1111-111111111111', 'Prisma Interiores', 'prisma')
ON CONFLICT (id) DO UPDATE SET slug = 'prisma', name = 'Prisma Interiores';
