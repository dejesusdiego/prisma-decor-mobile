-- Migration para criar user_role enum e adicionar super_admin
-- Data: 2026-01-29

-- ============================================================
-- 1. CRIAR TIPO user_role SE NÃO EXISTIR
-- ============================================================
DO $$
BEGIN
    -- Verificar se o tipo user_role já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'user_role' 
        AND typtype = 'e'
    ) THEN
        -- Criar o enum com os valores básicos
        CREATE TYPE user_role AS ENUM ('admin', 'user');
        RAISE NOTICE 'Tipo user_role criado com valores: admin, user';
    ELSE
        RAISE NOTICE 'Tipo user_role já existe';
    END IF;
END $$;

-- ============================================================
-- 2. ADICIONAR super_admin AO ENUM SE AINDA NÃO EXISTIR
-- ============================================================
DO $$
DECLARE
    enum_exists boolean;
BEGIN
    -- Verificar se super_admin já existe no enum
    SELECT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumtypid = 'user_role'::regtype 
        AND enumlabel = 'super_admin'
    ) INTO enum_exists;
    
    IF NOT enum_exists THEN
        -- Adicionar super_admin ao enum
        ALTER TYPE user_role ADD VALUE 'super_admin';
        RAISE NOTICE 'Valor super_admin adicionado ao tipo user_role';
    ELSE
        RAISE NOTICE 'Valor super_admin já existe no tipo user_role';
    END IF;
END $$;

-- ============================================================
-- 3. VERIFICAR COLUNA role NA TABELA organization_members
-- ============================================================
DO $$
BEGIN
    -- Verificar se a coluna existe e é do tipo correto
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_members' 
        AND column_name = 'role'
    ) THEN
        -- Verificar o tipo da coluna
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'organization_members' 
            AND column_name = 'role'
            AND data_type = 'USER-DEFINED'
            AND udt_name = 'user_role'
        ) THEN
            RAISE NOTICE 'Coluna organization_members.role já é do tipo user_role';
        ELSE
            RAISE WARNING 'Coluna organization_members.role existe mas não é do tipo user_role. Pode ser necessário converter.';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna role não encontrada em organization_members - será necessário adicionar manualmente se necessário';
    END IF;
END $$;

-- ============================================================
-- 4. VERIFICAR SE HÁ POLÍTICAS RLS QUE DEPENDEM DO user_role
-- ============================================================
-- Listar políticas atuais para referência
DO $$
DECLARE
    policy_rec record;
BEGIN
    RAISE NOTICE 'Políticas RLS em organization_members:';
    FOR policy_rec IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_members'
    LOOP
        RAISE NOTICE '  - %: % (%)', policy_rec.policyname, policy_rec.cmd, policy_rec.permissive;
    END LOOP;
END $$;

-- ============================================================
-- 5. LOG DE CONFIRMAÇÃO
-- ============================================================
DO $$
DECLARE
    enum_values text;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype;
    
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'MIGRATION COMPLETA: user_role enum';
    RAISE NOTICE 'Valores atuais do enum: %', enum_values;
    RAISE NOTICE '===============================================';
END $$;
