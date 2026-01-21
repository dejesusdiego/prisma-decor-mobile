-- =====================================================
-- ADICIONAR CAMPOS DE PERSONALIZAÇÃO DA LANDING PAGE
-- =====================================================
-- 
-- Permite que cada organização personalize sua landing page
-- com textos, imagens e configurações específicas
-- =====================================================

-- Campos de conteúdo da LP
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS lp_hero_title TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_description TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_button_text TEXT DEFAULT 'Agendar Visita Gratuita',
ADD COLUMN IF NOT EXISTS lp_about_title TEXT,
ADD COLUMN IF NOT EXISTS lp_about_description TEXT,
ADD COLUMN IF NOT EXISTS lp_about_image_url TEXT,
ADD COLUMN IF NOT EXISTS lp_benefits_title TEXT,
ADD COLUMN IF NOT EXISTS lp_benefits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lp_testimonials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lp_faq JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lp_instagram_url TEXT,
ADD COLUMN IF NOT EXISTS lp_facebook_url TEXT,
ADD COLUMN IF NOT EXISTS lp_custom_domain TEXT,
ADD COLUMN IF NOT EXISTS lp_enabled BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN public.organizations.lp_hero_title IS 'Título principal da hero section da landing page';
COMMENT ON COLUMN public.organizations.lp_hero_subtitle IS 'Subtítulo da hero section';
COMMENT ON COLUMN public.organizations.lp_hero_description IS 'Descrição da hero section';
COMMENT ON COLUMN public.organizations.lp_hero_image_url IS 'URL da imagem de fundo da hero section';
COMMENT ON COLUMN public.organizations.lp_hero_button_text IS 'Texto do botão principal da hero';
COMMENT ON COLUMN public.organizations.lp_about_title IS 'Título da seção sobre';
COMMENT ON COLUMN public.organizations.lp_about_description IS 'Descrição da seção sobre';
COMMENT ON COLUMN public.organizations.lp_about_image_url IS 'URL da imagem da seção sobre';
COMMENT ON COLUMN public.organizations.lp_benefits_title IS 'Título da seção de benefícios';
COMMENT ON COLUMN public.organizations.lp_benefits IS 'Array JSON com benefícios [{title, description, icon}]';
COMMENT ON COLUMN public.organizations.lp_testimonials IS 'Array JSON com depoimentos [{name, text, rating}]';
COMMENT ON COLUMN public.organizations.lp_faq IS 'Array JSON com perguntas frequentes [{question, answer}]';
COMMENT ON COLUMN public.organizations.lp_instagram_url IS 'URL do Instagram';
COMMENT ON COLUMN public.organizations.lp_facebook_url IS 'URL do Facebook';
COMMENT ON COLUMN public.organizations.lp_custom_domain IS 'Domínio personalizado para a landing page (ex: empresa.com.br)';
COMMENT ON COLUMN public.organizations.lp_enabled IS 'Se a landing page está habilitada para esta organização';

-- Preencher dados padrão para a Prisma (exemplo)
UPDATE public.organizations SET
  lp_hero_title = 'Cortinas e Persianas',
  lp_hero_subtitle = 'Sob Medida',
  lp_hero_description = 'Transforme seus ambientes com elegância e funcionalidade. Soluções personalizadas em cortinas e persianas que combinam design sofisticado com qualidade superior.',
  lp_hero_button_text = 'Agendar Visita Gratuita',
  lp_about_title = 'Sobre a Prisma',
  lp_about_description = 'Transformando ambientes com elegância, qualidade e sofisticação desde 2020.',
  lp_benefits_title = 'Por que escolher a Prisma?',
  lp_benefits = '[
    {"title": "Orçamento Gratuito", "description": "Sem compromisso, avaliação completa do seu espaço", "icon": "FileText"},
    {"title": "Visita Flexível", "description": "Agendamos no horário que melhor se adequa à sua rotina", "icon": "Calendar"},
    {"title": "Instalação Inclusa", "description": "Profissionais especializados cuidam de tudo para você", "icon": "Wrench"}
  ]'::jsonb,
  lp_instagram_url = 'https://www.instagram.com/prismainter/',
  lp_enabled = true
WHERE slug = 'prisma';

-- Criar índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain ON public.organizations(lp_custom_domain) WHERE lp_custom_domain IS NOT NULL;
