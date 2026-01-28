-- Script: Promover usuário a Super Admin
-- Uso: Executar no Supabase SQL Editor para dar permissões de super admin
-- Sprint: 7 - Painel Admin Supremo

-- ============================================
-- PROMOVER USUÁRIO ESPECÍFICO A SUPER ADMIN
-- ============================================
-- Substitua o email abaixo pelo email do usuário que será super admin

DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT := 'diego@futurisintelligences.com'; -- ALTERE PARA O EMAIL DESEJADO
BEGIN
    -- Buscar o user_id pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', v_user_email;
    END IF;
    
    -- Inserir ou atualizar o papel de super_admin
    INSERT INTO user_roles (user_id, role, organization_id, created_at, updated_at)
    VALUES (v_user_id, 'super_admin', NULL, now(), now())
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET 
        role = 'super_admin',
        updated_at = now();
    
    RAISE NOTICE 'Usuário % (%) promovido a super_admin com sucesso!', v_user_email, v_user_id;
END $$;

-- ============================================
-- VERIFICAR SUPER ADMINS ATUAIS
-- ============================================
SELECT 
    ur.user_id,
    u.email,
    ur.role,
    ur.created_at,
    ur.updated_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'super_admin';

-- ============================================
-- ALTERNATIVA: Listar todos os usuários para escolher
-- ============================================
-- Descomente a linha abaixo para ver todos os usuários
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;