-- =====================================================
-- FIX CRÍTICO: Corrigir role de studioos.com.br
-- Data: 2026-01-29
-- 
-- PROBLEMA: studioos.com.br estava incorretamente
-- configurado como 'admin' no banco de dados, permitindo
-- acesso ao painel admin via URL path incorreta.
--
-- SOLUÇÃO: Garantir que studioos.com.br seja SEMPRE 'marketing'
-- e apenas admin.studioos.com.br seja 'admin'
-- =====================================================

-- 1. CORREÇÃO PRINCIPAL: Garantir que studioos.com.br seja marketing
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'studioos.com.br';

-- 2. Garantir que www.studioos.com.br também seja marketing
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'www.studioos.com.br';

-- 3. Garantir que studioos.pro seja marketing (se existir)
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'studioos.pro';

-- 4. Garantir que www.studioos.pro seja marketing (se existir)
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'www.studioos.pro';

-- 5. Verificação: Impedir que qualquer domínio principal seja 'admin'
-- Se por algum razão existir outro domínio principal como admin, corrigir
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname IN ('studioos.com.br', 'www.studioos.com.br', 'studioos.pro', 'www.studioos.pro')
  AND role = 'admin';

-- 6. Inserir admin.studioos.com.br se não existir (garantir que admin funcione)
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.com.br', 'admin', NULL, true)
ON CONFLICT (hostname) DO UPDATE SET 
  role = 'admin',
  organization_id = NULL,
  active = true;

-- 7. Inserir admin.studioos.pro se não existir
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.pro', 'admin', NULL, true)
ON CONFLICT (hostname) DO UPDATE SET 
  role = 'admin',
  organization_id = NULL,
  active = true;

-- Comentário explicativo
COMMENT ON TABLE public.domains IS 
'Tabela de domínios para roteamento. 
REGRA CRÍTICA: 
- studioos.com.br/pro = marketing (LP pública)
- admin.studioos.com.br/pro = admin (painel admin)
NUNCA misturar roles entre domínios principais e subdomínios admin.';
