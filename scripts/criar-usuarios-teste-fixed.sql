-- ============================================================
-- SCRIPT: Criação de Usuários de Teste - StudioOS QA
-- VERSÃO CORRIGIDA (sem ON CONFLICT)
-- Executar no: Supabase Dashboard > SQL Editor
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
    v_exists BOOLEAN;
BEGIN
    -- Verificar se usuário já existe
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.superadmin@studioos.local';
    
    IF v_user_id IS NULL THEN
        -- Criar usuário no Auth
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
        
        RAISE NOTICE 'Super Admin criado com ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Super Admin já existe, atualizando senha...';
        UPDATE auth.users
        SET encrypted_password = crypt('Teste@123456', gen_salt('bf'))
        WHERE id = v_user_id;
    END IF;
    
    -- Verificar se role já existe
    SELECT EXISTS(
        SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin'
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        INSERT INTO user_roles (user_id, role, created_at)
        VALUES (v_user_id, 'admin', NOW());
        RAISE NOTICE 'Role admin adicionada';
    ELSE
        RAISE NOTICE 'Role admin já existe';
    END IF;
    
END $$;

-- ==========================================
-- 2. ADMIN DE ORGANIZAÇÃO (Tenant)
-- ==========================================
-- Email: teste.admin@prisma.local
-- Senha: Teste@123456
-- Acesso: prisma-app.studioos.pro

DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Buscar ID da organização Prisma
    SELECT id INTO v_org_id
    FROM organizations
    WHERE slug = 'prisma'
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE NOTICE 'Organização Prisma não encontrada. Criando...';
        
        INSERT INTO organizations (
            id, name, slug, plan, email, phone, active, created_at, updated_at
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
            id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
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
    
    -- Verificar se já é membro
    SELECT EXISTS(
        SELECT 1 FROM organization_members 
        WHERE organization_id = v_org_id AND user_id = v_user_id
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        INSERT INTO organization_members (organization_id, user_id, role, created_at)
        VALUES (v_org_id, v_user_id, 'admin', NOW());
        RAISE NOTICE 'Admin Org vinculado à organização: %', v_org_id;
    ELSE
        UPDATE organization_members 
        SET role = 'admin', updated_at = NOW()
        WHERE organization_id = v_org_id AND user_id = v_user_id;
        RAISE NOTICE 'Membro atualizado para admin';
    END IF;
    
END $$;

-- ==========================================
-- 3. USUÁRIO COMUM (Funcionário)
-- ==========================================
-- Email: teste.usuario@prisma.local
-- Senha: Teste@123456
-- Mesma org do admin

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
        RAISE EXCEPTION 'Organização Prisma não encontrada.';
    END IF;
    
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.usuario@prisma.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
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
    
    SELECT EXISTS(
        SELECT 1 FROM organization_members 
        WHERE organization_id = v_org_id AND user_id = v_user_id
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        INSERT INTO organization_members (organization_id, user_id, role, created_at)
        VALUES (v_org_id, v_user_id, 'member', NOW());
        RAISE NOTICE 'Usuario vinculado à org';
    ELSE
        UPDATE organization_members 
        SET role = 'member', updated_at = NOW()
        WHERE organization_id = v_org_id AND user_id = v_user_id;
        RAISE NOTICE 'Membro atualizado para member';
    END IF;
    
END $$;

-- ==========================================
-- 4. FORNECEDOR (Supplier)
-- ==========================================
-- Email: teste.fornecedor@studioos.local
-- Senha: Teste@123456
-- Status: approved

DO $$
DECLARE
    v_user_id UUID;
    v_supplier_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'teste.fornecedor@studioos.local';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
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
        
        RAISE NOTICE 'Usuario fornecedor criado: %', v_user_id;
    ELSE
        RAISE NOTICE 'Usuario fornecedor existe, atualizando senha...';
        UPDATE auth.users
        SET encrypted_password = crypt('Teste@123456', gen_salt('bf'))
        WHERE id = v_user_id;
    END IF;
    
    -- Criar fornecedor
    INSERT INTO suppliers (
        id, razao_social, nome_fantasia, email, cnpj, phone,
        status, categories, endereco, cidade, estado, cep, created_at, updated_at
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
    
    RAISE NOTICE 'Fornecedor criado: %', v_supplier_id;
    
    -- Vincular
    SELECT EXISTS(
        SELECT 1 FROM supplier_users 
        WHERE supplier_id = v_supplier_id AND user_id = v_user_id
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        INSERT INTO supplier_users (supplier_id, user_id, active, created_at)
        VALUES (v_supplier_id, v_user_id, true, NOW());
        RAISE NOTICE 'Usuario vinculado ao fornecedor';
    ELSE
        UPDATE supplier_users SET active = true 
        WHERE supplier_id = v_supplier_id AND user_id = v_user_id;
        RAISE NOTICE 'Vinculo atualizado';
    END IF;
    
END $$;

-- ==========================================
-- RESUMO
-- ==========================================
SELECT 'SUPER ADMIN' as perfil, 'teste.superadmin@studioos.local' as email, 'Teste@123456' as senha, 'admin.studioos.pro' as dominio
UNION ALL SELECT 'ADMIN ORG', 'teste.admin@prisma.local', 'Teste@123456', 'prisma-app.studioos.pro'
UNION ALL SELECT 'USUARIO', 'teste.usuario@prisma.local', 'Teste@123456', 'prisma-app.studioos.pro'
UNION ALL SELECT 'FORNECEDOR', 'teste.fornecedor@studioos.local', 'Teste@123456', 'fornecedores.studioos.pro';
