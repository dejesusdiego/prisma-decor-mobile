-- ============================================================
-- SUPPLIER CATALOG V1
-- ============================================================
-- Migration para implementar catálogo de materiais por fornecedor
-- Data: 2026-01-17
-- ============================================================

-- 1. Atualizar tabela suppliers: adicionar service_states
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS service_states TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.suppliers.service_states IS 
'Lista de UFs (estados) atendidas pelo fornecedor. Ex: ["SC", "PR", "RS", "SP", "RJ"].';

-- Validação simples: apenas 2 letras maiúsculas (opcional, via trigger ou app)
-- No V1, validação será feita no frontend

-- 2. Criar tabela supplier_materials (catálogo do fornecedor)
CREATE TABLE IF NOT EXISTS public.supplier_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT, -- ex: "m", "un", "rolo"
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Evitar duplicatas: sku único por fornecedor (se sku não for null)
  CONSTRAINT supplier_materials_supplier_sku_unique 
    UNIQUE NULLS NOT DISTINCT (supplier_id, sku)
);

COMMENT ON TABLE public.supplier_materials IS 
'Catálogo de materiais de cada fornecedor. Fonte única de verdade controlada pelo fornecedor.';

COMMENT ON COLUMN public.supplier_materials.sku IS 
'Código SKU do fornecedor. Opcional, mas se fornecido deve ser único por fornecedor.';

COMMENT ON COLUMN public.supplier_materials.price IS 
'Preço global do material (mesmo preço para todos os clientes no V1).';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier_active 
  ON public.supplier_materials(supplier_id, active) 
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier_name 
  ON public.supplier_materials(supplier_id, name);

CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier_sku 
  ON public.supplier_materials(supplier_id, sku) 
  WHERE sku IS NOT NULL;

-- 3. Criar tabela supplier_material_imports (histórico de import CSV)
CREATE TABLE IF NOT EXISTS public.supplier_material_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' 
    CHECK (status IN ('uploaded', 'validated', 'applied', 'failed')),
  total_rows INT DEFAULT 0,
  inserted INT DEFAULT 0,
  updated INT DEFAULT 0,
  deactivated INT DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.supplier_material_imports IS 
'Histórico de importações CSV de materiais por fornecedor.';

COMMENT ON COLUMN public.supplier_material_imports.errors IS 
'Array JSON com erros encontrados durante a importação. Ex: [{"row": 5, "field": "price", "error": "Preço inválido"}]';

-- Índice para histórico
CREATE INDEX IF NOT EXISTS idx_supplier_material_imports_supplier 
  ON public.supplier_material_imports(supplier_id, created_at DESC);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supplier_materials_updated_at ON public.supplier_materials;
CREATE TRIGGER update_supplier_materials_updated_at
  BEFORE UPDATE ON public.supplier_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_material_imports_updated_at ON public.supplier_material_imports;
CREATE TRIGGER update_supplier_material_imports_updated_at
  BEFORE UPDATE ON public.supplier_material_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS para supplier_materials
ALTER TABLE public.supplier_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Fornecedor pode gerenciar apenas seus próprios materiais
CREATE POLICY "Suppliers can manage own materials"
  ON public.supplier_materials
  FOR ALL
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  )
  WITH CHECK (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  );

-- Policy: Organização cliente pode APENAS LER materiais de fornecedores vinculados e ativos
-- IMPORTANTE: NUNCA pode INSERT/UPDATE/DELETE
CREATE POLICY "Organizations can view linked supplier materials"
  ON public.supplier_materials
  FOR SELECT
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND so.active = true
    )
    AND active = true
  );

-- 6. RLS para supplier_material_imports
ALTER TABLE public.supplier_material_imports ENABLE ROW LEVEL SECURITY;

-- Policy: Fornecedor pode ver apenas seus próprios imports
CREATE POLICY "Suppliers can view own imports"
  ON public.supplier_material_imports
  FOR SELECT
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  );

-- Policy: Fornecedor pode criar/atualizar apenas seus próprios imports
CREATE POLICY "Suppliers can manage own imports"
  ON public.supplier_material_imports
  FOR ALL
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  )
  WITH CHECK (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  );

-- 7. Função auxiliar para buscar materiais de fornecedores ativos de uma organização
-- (útil para queries no frontend)
CREATE OR REPLACE FUNCTION public.get_organization_supplier_materials(
  p_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  supplier_id UUID,
  supplier_name TEXT,
  sku TEXT,
  name TEXT,
  description TEXT,
  unit TEXT,
  price NUMERIC,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sm.id,
    sm.supplier_id,
    s.name AS supplier_name,
    sm.sku,
    sm.name,
    sm.description,
    sm.unit,
    sm.price,
    sm.active,
    sm.created_at,
    sm.updated_at
  FROM public.supplier_materials sm
  INNER JOIN public.suppliers s ON sm.supplier_id = s.id
  INNER JOIN public.supplier_organizations so 
    ON sm.supplier_id = so.supplier_id
  WHERE so.organization_id = p_organization_id
    AND so.active = true
    AND sm.active = true
    AND s.active = true
  ORDER BY s.name, sm.name;
$$;

COMMENT ON FUNCTION public.get_organization_supplier_materials IS 
'Retorna materiais de fornecedores ativos vinculados à organização. Função auxiliar para queries.';
