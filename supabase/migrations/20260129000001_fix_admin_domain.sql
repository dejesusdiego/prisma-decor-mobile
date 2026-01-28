-- =====================================================
-- CORREÇÃO: Adicionar domínio admin.studioos.pro
-- =====================================================
-- Issue: O domínio admin.studioos.pro não estava registrado,
-- apenas panel.studioos.pro (legacy). Isso fazia com que
-- o roteamento isAdmin não funcionasse corretamente.

-- Adicionar domínio canônico admin.studioos.pro
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.pro', 'admin', NULL, true)
ON CONFLICT (hostname) DO NOTHING;

-- Também adicionar para .com.br se necessário
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.com.br', 'admin', NULL, true)
ON CONFLICT (hostname) DO NOTHING;

-- Atualizar panel.studioos.pro para redirecionar (manter compatibilidade)
-- O redirecionamento é feito no domainResolver.ts (client-side)
-- ou via Edge Middleware no futuro
UPDATE public.domains 
SET active = true,
    updated_at = now()
WHERE hostname IN ('panel.studioos.pro', 'panel.studioos.com.br');

-- Garantir que todos os domínios de plataforma estejam ativos
UPDATE public.domains 
SET active = true,
    updated_at = now()
WHERE hostname IN (
    'studioos.pro',
    'www.studioos.pro', 
    'studioos.com.br',
    'www.studioos.com.br',
    'admin.studioos.pro',
    'admin.studioos.com.br',
    'fornecedores.studioos.pro',
    'fornecedores.studioos.com.br',
    'app.studioos.pro',
    'app.studioos.com.br'
);

-- Comentário explicativo
COMMENT ON TABLE public.domains IS 'Tabela de domínios para roteamento. admin.studioos.pro = role admin';
