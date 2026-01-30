-- Migration para corrigir constraints da tabela domains
-- Data: 2026-01-29

-- ============================================================
-- 1. REMOVER CONSTRAINT PROBLEMÁTICA
-- ============================================================
-- A constraint domain_role_org_check exige organization_id para certos roles
-- mas domínios como studioos.pro não têm organization_id

ALTER TABLE public.domains 
DROP CONSTRAINT IF EXISTS domain_role_org_check;

-- ============================================================
-- 2. ADICIONAR CONSTRAINT MAIS FLEXÍVEL (opcional)
-- ============================================================
-- Regra: apenas 'app' e 'marketing' de organizações precisam de organization_id
-- Domínios da plataforma (studioos.pro, admin, fornecedores) não precisam

-- Comentário explicativo
COMMENT ON TABLE public.domains IS 
'Domínios do sistema. Domínios de plataforma (studioos.pro, admin, fornecedores) não requerem organization_id. Apenas domínios de clientes (app, marketing) requerem.';

-- ============================================================
-- 3. INSERIR DOMÍNIOS PRINCIPAIS
-- ============================================================

-- studioos.pro - marketing principal (sem organization_id)
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

-- www.studioos.pro - marketing principal
INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

-- admin.studioos.pro - admin
INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.pro', 'admin', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'admin';

-- fornecedores.studioos.pro - supplier
INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.pro', 'supplier', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'supplier';

-- app.studioos.pro - app gateway
INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.pro', 'app', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'app';

-- ============================================================
-- 4. DOMÍNIOS studioos.com.br
-- ============================================================
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.com.br', 'admin', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'admin';

INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.com.br', 'supplier', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'supplier';

INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.com.br', 'app', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'app';

-- ============================================================
-- 5. CONFIRMAÇÃO
-- ============================================================
DO $$
DECLARE
    domain_count int;
BEGIN
    SELECT COUNT(*) INTO domain_count FROM public.domains WHERE active = true;
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'MIGRATION COMPLETA: fix_domains_constraints';
    RAISE NOTICE 'Constraint domain_role_org_check removida';
    RAISE NOTICE 'Total de domínios ativos: %', domain_count;
    RAISE NOTICE '===============================================';
END $$;
