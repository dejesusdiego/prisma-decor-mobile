-- Migration: Add feature flags system for tenant-level feature management

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'general',
  default_value BOOLEAN DEFAULT false,
  plan_values JSONB DEFAULT '{}', -- { "starter": false, "pro": true, "business": true, "enterprise": true }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_feature_overrides table
CREATE TABLE IF NOT EXISTS organization_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  value BOOLEAN NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, feature_flag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org ON organization_feature_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_feature ON organization_feature_overrides(feature_flag_id);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_feature_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags
-- Super admin can manage all feature flags
CREATE POLICY "Super admin full access on feature_flags"
  ON feature_flags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Authenticated users can read feature flags
CREATE POLICY "Authenticated users can read feature_flags"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for organization_feature_overrides
-- Super admin can manage all overrides
CREATE POLICY "Super admin full access on org_feature_overrides"
  ON organization_feature_overrides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Organization admins can read their own overrides
CREATE POLICY "Org users can read their overrides"
  ON organization_feature_overrides
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid()
    )
  );

-- Function to check feature flag for an organization
CREATE OR REPLACE FUNCTION check_feature_flag(
  p_organization_id UUID,
  p_flag_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag_id UUID;
  v_default_value BOOLEAN;
  v_plan_values JSONB;
  v_override_value BOOLEAN;
  v_org_plan TEXT;
  v_result BOOLEAN;
BEGIN
  -- Get feature flag details
  SELECT id, default_value, plan_values
  INTO v_flag_id, v_default_value, v_plan_values
  FROM feature_flags
  WHERE name = p_flag_name;

  -- Flag not found
  IF v_flag_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check for organization override
  SELECT value INTO v_override_value
  FROM organization_feature_overrides
  WHERE organization_id = p_organization_id
    AND feature_flag_id = v_flag_id;

  -- If override exists, return it
  IF v_override_value IS NOT NULL THEN
    RETURN v_override_value;
  END IF;

  -- Get organization's subscription plan
  SELECT plan_type INTO v_org_plan
  FROM subscriptions
  WHERE organization_id = p_organization_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to starter if no subscription
  IF v_org_plan IS NULL THEN
    v_org_plan := 'starter';
  END IF;

  -- Check plan-based value
  IF v_plan_values ? v_org_plan THEN
    RETURN (v_plan_values->>v_org_plan)::BOOLEAN;
  END IF;

  -- Return default value
  RETURN v_default_value;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO anon;

-- Function to get all feature flags for an organization
CREATE OR REPLACE FUNCTION get_organization_features(
  p_organization_id UUID
)
RETURNS TABLE (
  name TEXT,
  description TEXT,
  category TEXT,
  value BOOLEAN,
  has_override BOOLEAN,
  plan_value BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_plan TEXT;
BEGIN
  -- Get organization's subscription plan
  SELECT plan_type INTO v_org_plan
  FROM subscriptions
  WHERE organization_id = p_organization_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to starter if no subscription
  IF v_org_plan IS NULL THEN
    v_org_plan := 'starter';
  END IF;

  RETURN QUERY
  SELECT 
    ff.name,
    ff.description,
    ff.category,
    COALESCE(ofo.value, 
      CASE 
        WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN
        ELSE ff.default_value
      END
    ) as value,
    ofo.value IS NOT NULL as has_override,
    CASE 
      WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN
      ELSE ff.default_value
    END as plan_value
  FROM feature_flags ff
  LEFT JOIN organization_feature_overrides ofo
    ON ofo.feature_flag_id = ff.id
    AND ofo.organization_id = p_organization_id
  ORDER BY ff.category, ff.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_organization_features(UUID) TO authenticated;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_feature_overrides_updated_at
  BEFORE UPDATE ON organization_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default feature flags
INSERT INTO feature_flags (name, description, category, default_value, plan_values) VALUES
('advanced_analytics', 'Relatórios avançados e dashboards personalizados', 'analytics', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('multi_user', 'Suporte a múltiplos usuários na organização', 'users', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('api_access', 'Acesso à API para integrações', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('webhooks', 'Webhooks para eventos em tempo real', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('custom_domain', 'Uso de domínio personalizado', 'branding', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('white_label', 'Remoção da marca Prisma', 'branding', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('priority_support', 'Suporte prioritário via chat e email', 'support', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('dedicated_manager', 'Gerente de conta dedicado', 'support', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('advanced_permissions', 'Permissões granulares por usuário', 'users', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('export_data', 'Exportação de dados em CSV/Excel', 'data', true, '{"starter": true, "pro": true, "business": true, "enterprise": true}'),
('bulk_import', 'Importação em massa de dados', 'data', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('custom_reports', 'Relatórios customizados', 'analytics', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}')
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE feature_flags IS 'Stores feature flags/ toggles for the platform with plan-based defaults';
COMMENT ON TABLE organization_feature_overrides IS 'Stores organization-specific overrides for feature flags';
COMMENT ON FUNCTION check_feature_flag(UUID, TEXT) IS 'Checks if a feature flag is enabled for a specific organization, considering plan values and overrides';
COMMENT ON FUNCTION get_organization_features(UUID) IS 'Returns all feature flags with their current values for a specific organization';
