-- Migration: Add supplier fields to cortina_items for supplier integration
-- Created: 2026-01-28

-- Add supplier-related fields to cortina_items
ALTER TABLE cortina_items
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_material_id uuid REFERENCES supplier_materials(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_price_at_time numeric(10,2),
ADD COLUMN IF NOT EXISTS supplier_name_at_time text,
ADD COLUMN IF NOT EXISTS supplier_material_name_at_time text;

-- Add comment explaining the fields
COMMENT ON COLUMN cortina_items.supplier_id IS 'Reference to the supplier providing the material';
COMMENT ON COLUMN cortina_items.supplier_material_id IS 'Reference to the specific supplier material';
COMMENT ON COLUMN cortina_items.supplier_price_at_time IS 'Price snapshot from supplier at the time of quote';
COMMENT ON COLUMN cortina_items.supplier_name_at_time IS 'Supplier name snapshot at the time of quote';
COMMENT ON COLUMN cortina_items.supplier_material_name_at_time IS 'Material name snapshot at the time of quote';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cortina_items_supplier_id ON cortina_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cortina_items_supplier_material_id ON cortina_items(supplier_material_id);

-- Update RLS policies to allow reading supplier materials
-- (Assuming existing RLS is in place, this just ensures the new fields are accessible)

-- Function to get supplier materials for an organization
CREATE OR REPLACE FUNCTION get_supplier_materials_for_organization(p_organization_id uuid)
RETURNS TABLE (
    id uuid,
    supplier_id uuid,
    supplier_name text,
    name text,
    category text,
    unit text,
    price numeric,
    width_meters numeric,
    color text,
    line text,
    is_active boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.supplier_id,
        s.company_name as supplier_name,
        sm.name,
        sm.category,
        sm.unit,
        sm.price,
        sm.width_meters,
        sm.color,
        sm.line,
        sm.is_active
    FROM supplier_materials sm
    JOIN suppliers s ON sm.supplier_id = s.id
    WHERE sm.is_active = true
      AND s.status = 'approved'
      AND s.organization_id = p_organization_id
    ORDER BY s.company_name, sm.category, sm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_supplier_materials_for_organization(uuid) TO authenticated;
