-- ============================================================
-- SCRIPT: Criação de Usuários de Teste - StudioOS QA
-- VERSÃO 3 (corrigida para schema atual)
-- ============================================================

-- ==========================================
-- 1. SUPER ADMIN (Plataforma)
-- ==========================================
-- Email: teste.superadmin@studioos.local
-- Senha: Teste@123456

DO $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.superadmin@studioos.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        )
        VALUES (
            gen_random_uuid(),
            'teste.superadmin@studioos.local',
            crypt('Teste@123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Teste Super Admin"}',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Super Admin criado: %', v_user_id;
    ELSE
        RAISE NOTICE 'Super Admin existe, atualizando senha...';
        UPDATE auth.users
        SET encrypted_password = crypt('Teste@123456', gen_salt('bf'))
        WHERE id = v_user_id;
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin'
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        INSERT INTO user_roles (user_id, role, created_at)
        VALUES (v_user_id, 'admin', NOW());
        RAISE NOTICE 'Role admin adicionada';
    END IF;
    
END $$;

-- ==========================================
-- 2. ADMIN DE ORGANIZAÇÃO
-- ==========================================
-- Email: teste.admin@prisma.local
-- Senha: Teste@123456

DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT id INTO v_org_id
    FROM organizations
    WHERE slug = 'prisma'
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE NOTICE 'Criando org Prisma...';
        INSERT INTO organizations (id, name, slug, plan, email, phone, active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Prisma Decorações (Teste)', 'prisma', 'pro', 'contato@prisma.local', '(11) 99999-8888', true, NOW(), NOW())
        RETURNING id INTO v_org_id;
    END IF;
    
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.admin@prisma.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (gen_random_uuid(), 'teste.admin@prisma.local', crypt('Teste@123456', gen_salt('bf')), NOW(), '{"provider":"email"}', '{"name":"Teste Admin"}', NOW(), NOW())
        RETURNING id INTO v_user_id;
        RAISE NOTICE 'Admin criado: %', v_user_id;
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('Teste@123456', gen_salt('bf')) WHERE id = v_user_id;
        RAISE NOTICE 'Admin atualizado';
    END IF;
    
    SELECT EXISTS(SELECT 1 FROM organization_members WHERE organization_id = v_org_id AND user_id = v_user_id) INTO v_exists;
    
    IF NOT v_exists THEN
        INSERT INTO organization_members (organization_id, user_id, role, created_at)
        VALUES (v_org_id, v_user_id, 'admin', NOW());
    ELSE
        UPDATE organization_members SET role = 'admin' WHERE organization_id = v_org_id AND user_id = v_user_id;
    END IF;
    
END $$;

-- ==========================================
-- 3. USUÁRIO COMUM
-- ==========================================
-- Email: teste.usuario@prisma.local
-- Senha: Teste@123456

DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'prisma' LIMIT 1;
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Org Prisma não encontrada'; END IF;
    
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'teste.usuario@prisma.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (gen_random_uuid(), 'teste.usuario@prisma.local', crypt('Teste@123456', gen_salt('bf')), NOW(), '{"provider":"email"}', '{"name":"Teste Usuario"}', NOW(), NOW())
        RETURNING id INTO v_user_id;
        RAISE NOTICE 'Usuario criado: %', v_user_id;
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('Teste@123456', gen_salt('bf')) WHERE id = v_user_id;
    END IF;
    
    SELECT EXISTS(SELECT 1 FROM organization_members WHERE organization_id = v_org_id AND user_id = v_user_id) INTO v_exists;
    
    IF NOT v_exists THEN
        INSERT INTO organization_members (organization_id, user_id, role, created_at) VALUES (v_org_id, v_user_id, 'member', NOW());
    ELSE
        UPDATE organization_members SET role = 'member' WHERE organization_id = v_org_id AND user_id = v_user_id;
    END IF;
    
END $$;

-- ==========================================
-- 4. FORNECEDOR (usando schema simplificado)
-- ==========================================
-- Email: teste.fornecedor@studioos.local
-- Senha: Teste@123456

DO $$
DECLARE
    v_user_id UUID;
    v_supplier_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'teste.fornecedor@studioos.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (gen_random_uuid(), 'teste.fornecedor@studioos.local', crypt('Teste@123456', gen_salt('bf')), NOW(), '{"provider":"email"}', '{"name":"Teste Fornecedor"}', NOW(), NOW())
        RETURNING id INTO v_user_id;
        RAISE NOTICE 'Usuario fornecedor criado: %', v_user_id;
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('Teste@123456', gen_salt('bf')) WHERE id = v_user_id;
    END IF;
    
    -- Usar schema simplificado da tabela suppliers
    INSERT INTO suppliers (id, name, slug, email, phone, cnpj, active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Fornecedor Teste StudioOS',
        'fornecedor-teste-studioos',
        'teste.fornecedor@studioos.local',
        '(11) 98888-7777',
        '12.345.678/0001-90',
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_supplier_id;
    
    RAISE NOTICE 'Supplier criado: %', v_supplier_id;
    
    -- Criar vinculo na tabela supplier_users (se existir)
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'supplier_users'
    ) INTO v_exists;
    
    IF v_exists THEN
        INSERT INTO supplier_users (supplier_id, user_id, active, created_at)
        VALUES (v_supplier_id, v_user_id, true, NOW());
        RAISE NOTICE 'Vinculo criado em supplier_users';
    END IF;
    
END $$;

-- ==========================================
-- RESUMO
-- ==========================================
SELECT 'SUPER ADMIN' as perfil, 'teste.superadmin@studioos.local' as email, 'Teste@123456' as senha, 'admin.studioos.pro' as dominio
UNION ALL SELECT 'ADMIN ORG', 'teste.admin@prisma.local', 'Teste@123456', 'prisma-app.studioos.pro'
UNION ALL SELECT 'USUARIO', 'teste.usuario@prisma.local', 'Teste@123456', 'prisma-app.studioos.pro'
UNION ALL SELECT 'FORNECEDOR', 'teste.fornecedor@studioos.local', 'Teste@123456', 'fornecedores.studioos.pro';
