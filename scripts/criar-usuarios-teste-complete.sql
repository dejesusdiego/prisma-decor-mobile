-- ============================================================
-- SCRIPT: Criação de Usuários de Teste - StudioOS QA
-- Executar no: Supabase Dashboard > SQL Editor
-- Data: 2026-01-29
-- ============================================================

-- ==========================================
-- 1. SUPER ADMIN (Plataforma)
-- ==========================================
-- Email: teste.superadmin@studioos.local
-- Senha: Teste@123456
-- Acesso: admin.studioos.pro / panel.studioos.pro

DO $$
DECLARE
    v_user_id UUID;
    v_org_platform_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Verificar se usuário já existe
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.superadmin@studioos.local';
    
    IF v_user_id IS NULL THEN
        -- Criar usuário no Auth
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            gen_random_uuid(),
            'teste.superadmin@studioos.local',
            crypt('Teste@123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Teste Super Admin"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Super Admin criado com ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Super Admin já existe, atualizando senha...';
        UPDATE auth.users
        SET encrypted_password = crypt('Teste@123456', gen_salt('bf'))
        WHERE id = v_user_id;
    END IF;
    
    -- Criar/Atualizar entrada em user_roles
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (v_user_id, 'admin', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
END $$;

-- ==========================================
-- 2. ADMIN DE ORGANIZAÇÃO (Tenant)
-- ==========================================
-- Email: teste.admin@prisma.local
-- Senha: Teste@123456
-- Acesso: prisma-app.studioos.pro
-- Org: Prisma Decorações (assumindo slug 'prisma')

DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Buscar ID da organização Prisma
    SELECT id INTO v_org_id
    FROM organizations
    WHERE slug = 'prisma'
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE NOTICE 'Organização Prisma não encontrada. Criando organização de teste...';
        
        INSERT INTO organizations (
            id,
            name,
            slug,
            plan,
            email,
            phone,
            active,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            'Prisma Decorações (Teste)',
            'prisma',
            'pro',
            'contato@prisma.local',
            '(11) 99999-8888',
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_org_id;
    END IF;
    
    -- Verificar se usuário já existe
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.admin@prisma.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            'teste.admin@prisma.local',
            crypt('Teste@123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Teste Admin Org"}',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Admin Org criado com ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Admin Org já existe, atualizando senha...';
        UPDATE auth.users
        SET encrypted_password = crypt('Teste@123456', gen_salt('bf'))
        WHERE id = v_user_id;
    END IF;
    
    -- Adicionar como membro da organização com role admin
    INSERT INTO organization_members (organization_id, user_id, role, created_at)
    VALUES (v_org_id, v_user_id, 'admin', NOW())
    ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = 'admin', updated_at = NOW();
    
    RAISE NOTICE 'Admin Org vinculado à organização: %', v_org_id;
    
END $$;

-- ==========================================
-- 3. USUÁRIO COMUM (Funcionário)
-- ==========================================
-- Email: teste.usuario@prisma.local
-- Senha: Teste@123456
-- Acesso: prisma-app.studioos.pro
-- Mesma org do admin acima

DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Buscar ID da organização Prisma
    SELECT id INTO v_org_id
    FROM organizations
    WHERE slug = 'prisma'
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Organização Prisma não encontrada. Execute a seção 2 primeiro.';
    END IF;
    
    -- Verificar se usuário já existe
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.usuario@prisma.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            'teste.usuario@prisma.local',
            crypt('Teste@123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Teste Usuario"}',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Usuario criado com ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Usuario já existe, atualizando senha...';
        UPDATE auth.users
        SET encrypted_password = crypt('Teste@123456', gen_salt('bf'))
        WHERE id = v_user_id;
    END IF;
    
    -- Adicionar como membro da organização com role member
    INSERT INTO organization_members (organization_id, user_id, role, created_at)
    VALUES (v_org_id, v_user_id, 'member', NOW())
    ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = 'member', updated_at = NOW();
    
    RAISE NOTICE 'Usuario vinculado à organização: %', v_org_id;
    
END $$;

-- ==========================================
-- 4. FORNECEDOR (Supplier)
-- ==========================================
-- Email: teste.fornecedor@studioos.local
-- Senha: Teste@123456
-- Acesso: fornecedores.studioos.pro
-- Status: approved

DO $$
DECLARE
    v_user_id UUID;
    v_supplier_id UUID;
BEGIN
    -- Verificar se usuário já existe
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.fornecedor@studioos.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            'teste.fornecedor@studioos.local',
            crypt('Teste@123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Teste Fornecedor"}',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Usuario fornecedor criado com ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Usuario fornecedor já existe, atualizando senha...';
        UPDATE auth.users
        SET encrypted_password = crypt('Teste@123456', gen_salt('bf'))
        WHERE id = v_user_id;
    END IF;
    
    -- Criar registro de fornecedor
    INSERT INTO suppliers (
        id,
        razao_social,
        nome_fantasia,
        email,
        cnpj,
        phone,
        status,
        categories,
        endereco,
        cidade,
        estado,
        cep,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'Fornecedor Teste StudioOS LTDA',
        'Fornecedor Teste',
        'teste.fornecedor@studioos.local',
        '12.345.678/0001-90',
        '(11) 98888-7777',
        'approved',
        ARRAY['tecidos', 'trilhos', 'acessorios'],
        'Rua dos Testes, 123',
        'São Paulo',
        'SP',
        '01000-000',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_supplier_id;
    
    -- Criar vínculo supplier_users
    INSERT INTO supplier_users (supplier_id, user_id, active, created_at)
    VALUES (v_supplier_id, v_user_id, true, NOW())
    ON CONFLICT (supplier_id, user_id) DO UPDATE
    SET active = true;
    
    RAISE NOTICE 'Fornecedor criado com ID: % e vinculado ao usuario: %', v_supplier_id, v_user_id;
    
END $$;

-- ==========================================
-- RESUMO DOS USUÁRIOS CRIADOS
-- ==========================================
SELECT 
    'SUPER ADMIN' as perfil,
    'teste.superadmin@studioos.local' as email,
    'Teste@123456' as senha,
    'admin.studioos.pro ou panel.studioos.pro' as dominio_acesso
UNION ALL
SELECT 
    'ADMIN ORG',
    'teste.admin@prisma.local',
    'Teste@123456',
    'prisma-app.studioos.pro'
UNION ALL
SELECT 
    'USUARIO COMUM',
    'teste.usuario@prisma.local',
    'Teste@123456',
    'prisma-app.studioos.pro'
UNION ALL
SELECT 
    'FORNECEDOR',
    'teste.fornecedor@studioos.local',
    'Teste@123456',
    'fornecedores.studioos.pro';
