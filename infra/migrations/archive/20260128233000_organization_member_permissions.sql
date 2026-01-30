-- Migration: Organization Member Permissions (RBAC Granular)
-- Created: 2026-01-28

-- Table for granular permissions per organization member
CREATE TABLE IF NOT EXISTS organization_member_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Screen-level permissions
    can_access_orcamentos boolean DEFAULT true,
    can_create_orcamentos boolean DEFAULT true,
    can_edit_orcamentos boolean DEFAULT true,
    can_delete_orcamentos boolean DEFAULT false,
    
    can_access_pedidos boolean DEFAULT true,
    can_create_pedidos boolean DEFAULT true,
    can_edit_pedidos boolean DEFAULT true,
    can_delete_pedidos boolean DEFAULT false,
    
    can_access_producao boolean DEFAULT true,
    can_edit_producao boolean DEFAULT true,
    can_manage_producao boolean DEFAULT false,
    
    can_access_financeiro boolean DEFAULT true,
    can_edit_financeiro boolean DEFAULT false,
    can_view_all_financeiro boolean DEFAULT false,
    
    can_access_crm boolean DEFAULT true,
    can_edit_crm boolean DEFAULT true,
    can_delete_crm boolean DEFAULT false,
    
    can_access_estoque boolean DEFAULT true,
    can_edit_estoque boolean DEFAULT false,
    can_manage_estoque boolean DEFAULT false,
    
    can_access_configuracoes boolean DEFAULT false,
    can_manage_users boolean DEFAULT false,
    can_manage_organization boolean DEFAULT false,
    
    can_access_fornecedores boolean DEFAULT true,
    can_edit_fornecedores boolean DEFAULT false,
    
    can_access_relatorios boolean DEFAULT true,
    can_export_relatorios boolean DEFAULT false,
    
    -- Metadata
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Unique constraint
    UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_permissions_org ON organization_member_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_permissions_user ON organization_member_permissions(user_id);

-- Comments
COMMENT ON TABLE organization_member_permissions IS 'Granular permissions for organization members per screen/feature';

-- Function to create default permissions for a new member
CREATE OR REPLACE FUNCTION create_default_member_permissions(
    p_organization_id uuid,
    p_user_id uuid,
    p_role text DEFAULT 'member'
)
RETURNS uuid AS $$
DECLARE
    v_permission_id uuid;
BEGIN
    INSERT INTO organization_member_permissions (
        organization_id,
        user_id,
        can_access_orcamentos,
        can_create_orcamentos,
        can_edit_orcamentos,
        can_delete_orcamentos,
        can_access_pedidos,
        can_create_pedidos,
        can_edit_pedidos,
        can_delete_pedidos,
        can_access_producao,
        can_edit_producao,
        can_manage_producao,
        can_access_financeiro,
        can_edit_financeiro,
        can_view_all_financeiro,
        can_access_crm,
        can_edit_crm,
        can_delete_crm,
        can_access_estoque,
        can_edit_estoque,
        can_manage_estoque,
        can_access_configuracoes,
        can_manage_users,
        can_manage_organization,
        can_access_fornecedores,
        can_edit_fornecedores,
        can_access_relatorios,
        can_export_relatorios
    ) VALUES (
        p_organization_id,
        p_user_id,
        -- Owner/Admin gets full permissions, member gets restricted
        true, true, true, p_role IN ('owner', 'admin'),
        true, true, true, p_role IN ('owner', 'admin'),
        true, true, p_role IN ('owner', 'admin'),
        true, p_role IN ('owner', 'admin'), p_role IN ('owner', 'admin'),
        true, true, p_role IN ('owner', 'admin'),
        true, p_role IN ('owner', 'admin'), p_role IN ('owner', 'admin'),
        p_role IN ('owner', 'admin'), p_role = 'owner', p_role = 'owner',
        true, p_role IN ('owner', 'admin'),
        true, p_role IN ('owner', 'admin')
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        updated_at = now()
    RETURNING id INTO v_permission_id;
    
    RETURN v_permission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id uuid,
    p_organization_id uuid,
    p_permission text
)
RETURNS boolean AS $$
DECLARE
    v_has_permission boolean;
    v_is_owner boolean;
BEGIN
    -- Check if user is owner (owners have all permissions)
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_organization_id
        AND user_id = p_user_id
        AND role = 'owner'
    ) INTO v_is_owner;
    
    IF v_is_owner THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    EXECUTE format('
        SELECT %I FROM organization_member_permissions
        WHERE organization_id = $1 AND user_id = $2
    ', p_permission)
    INTO v_has_permission
    USING p_organization_id, p_user_id;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create permissions when member is added
CREATE OR REPLACE FUNCTION trigger_create_member_permissions()
RETURNS trigger AS $$
BEGIN
    PERFORM create_default_member_permissions(
        NEW.organization_id,
        NEW.user_id,
        NEW.role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_member_added_create_permissions ON organization_members;
CREATE TRIGGER on_member_added_create_permissions
    AFTER INSERT ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_member_permissions();

-- RLS Policies
ALTER TABLE organization_member_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions in their organizations"
    ON organization_member_permissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organization_member_permissions.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only owners and admins can update permissions"
    ON organization_member_permissions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organization_member_permissions.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Grant permissions
GRANT ALL ON organization_member_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_member_permissions(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(uuid, uuid, text) TO authenticated;
