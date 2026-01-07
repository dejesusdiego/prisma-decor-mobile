-- =====================================================
-- FASE 1: ADICIONAR CAMPOS COMERCIAIS NA TABELA ORGANIZATIONS
-- =====================================================

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Preencher dados iniciais da Prisma
UPDATE public.organizations SET
  email = 'prisma@prismadecor.com.br',
  phone = '(47) 99262-4706',
  whatsapp = '(47) 99262-4706',
  website = 'www.prismadecor.com.br',
  tagline = 'Transformando ambientes em experiências únicas'
WHERE slug = 'prisma';

-- =====================================================
-- FASE 2: CRIAR BUCKET PARA LOGOS DAS ORGANIZAÇÕES
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Qualquer um pode ver assets públicos
CREATE POLICY "Anyone can view organization assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-assets');

-- Política: Membros podem fazer upload para sua organização
CREATE POLICY "Members can upload organization assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = (
    SELECT om.organization_id::text
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    LIMIT 1
  )
);

-- Política: Membros podem atualizar assets da sua organização
CREATE POLICY "Members can update organization assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = (
    SELECT om.organization_id::text
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    LIMIT 1
  )
);

-- Política: Admins podem deletar assets da organização
CREATE POLICY "Admins can delete organization assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);