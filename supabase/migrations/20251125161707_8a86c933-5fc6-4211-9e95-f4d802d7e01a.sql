-- Assign admin role to the default admin user
-- This ensures the admin can manage materials through the interface
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin.prismadecor@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;