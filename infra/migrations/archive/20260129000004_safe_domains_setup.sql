-- Migration segura para setup de domínios
-- Data: 2026-01-29
-- Trata indexes e constraints existentes

-- ============================================================
-- 1. TABELA DOMAINS (se não existir)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostname TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. INDEXES (criar apenas se não existirem)
-- ============================================================
DO $$
BEGIN
    -- Index em hostname
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_domains_hostname'
    ) THEN
        CREATE INDEX idx_domains_hostname ON public.domains(hostname);
        RAISE NOTICE 'Index idx_domains_hostname criado';
    ELSE
        RAISE NOTICE 'Index idx_domains_hostname já existe';
    END IF;

    -- Index em organization_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_domains_organization'
    ) THEN
        CREATE INDEX idx_domains_organization ON public.domains(organization_id);
        RAISE NOTICE 'Index idx_domains_organization criado';
    ELSE
        RAISE NOTICE 'Index idx_domains_organization já existe';
    END IF;

    -- Index em role
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_domains_role'
    ) THEN
        CREATE INDEX idx_domains_role ON public.domains(role);
        RAISE NOTICE 'Index idx_domains_role criado';
    ELSE
        RAISE NOTICE 'Index idx_domains_role já existe';
    END IF;
END $$;

-- ============================================================
-- 3. TRIGGER PARA updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente para recriar
DROP TRIGGER IF EXISTS handle_domains_updated_at ON public.domains;

CREATE TRIGGER handle_domains_updated_at
    BEFORE UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_domains_updated_at();

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
-- Habilitar RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Policy: select (todos podem ver domínios ativos)
DROP POLICY IF EXISTS "Anyone can view active domains" ON public.domains;
CREATE POLICY "Anyone can view active domains"
    ON public.domains
    FOR SELECT
    USING (active = true);

-- Policy: insert (apenas super_admin)
DROP POLICY IF EXISTS "Only super_admin can insert domains" ON public.domains;
CREATE POLICY "Only super_admin can insert domains"
    ON public.domains
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role = 'super_admin'
        )
    );

-- Policy: update (apenas super_admin)
DROP POLICY IF EXISTS "Only super_admin can update domains" ON public.domains;
CREATE POLICY "Only super_admin can update domains"
    ON public.domains
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role = 'super_admin'
        )
    );

-- ============================================================
-- 5. INSERT DOS DOMÍNIOS PRINCIPAIS (ignorar conflitos)
-- ============================================================
-- studioos.pro - marketing principal
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

-- www.studioos.pro - marketing principal
INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

-- admin.studioos.pro - admin
INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.pro', 'admin', true)
ON CONFLICT (hostname) DO NOTHING;

-- fornecedores.studioos.pro - supplier
INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.pro', 'supplier', true)
ON CONFLICT (hostname) DO NOTHING;

-- app.studioos.pro - app gateway
INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.pro', 'app', true)
ON CONFLICT (hostname) DO NOTHING;

-- ============================================================
-- 6. DOMÍNIOS studioos.com.br (se ainda não existirem)
-- ============================================================
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.com.br', 'admin', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.com.br', 'supplier', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.com.br', 'app', true)
ON CONFLICT (hostname) DO NOTHING;

-- ============================================================
-- 7. CONFIRMAÇÃO
-- ============================================================
DO $$
DECLARE
    domain_count int;
BEGIN
    SELECT COUNT(*) INTO domain_count FROM public.domains WHERE active = true;
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'MIGRATION COMPLETA: safe_domains_setup';
    RAISE NOTICE 'Total de domínios ativos: %', domain_count;
    RAISE NOTICE '===============================================';
END $$;
