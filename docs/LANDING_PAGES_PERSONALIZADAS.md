# 🌐 Landing Pages Personalizadas por Organização

## Visão Geral

Cada organização no sistema multi-tenant agora pode ter sua própria landing page personalizada, acessível através da rota `/lp/:slug`.

## Funcionalidades

### ✅ Implementado

1. **Rota Dinâmica**
   - `/lp/:slug` - Landing page personalizada por organização
   - Exemplo: `/lp/prisma` para a organização Prisma

2. **Campos de Personalização**
   - Hero section (título, subtítulo, descrição, imagem)
   - Seção sobre
   - Benefícios customizados
   - Depoimentos
   - FAQ personalizado
   - Links de redes sociais
   - Domínio personalizado (futuro)

3. **Componentes Criados**
   - `LandingPageOrganizacao` - Página principal
   - `LandingPageHero` - Hero section personalizada
   - `LandingPageNavbar` - Navbar com logo da organização
   - `LandingPageFooter` - Footer personalizado
   - `LandingPageStats` - Estatísticas
   - `LandingPageProducts` - Produtos
   - `LandingPageProcess` - Processo
   - `LandingPageBenefits` - Benefícios
   - `LandingPageSocialProof` - Prova social
   - `LandingPageFAQ` - FAQ
   - `LandingPageContact` - Contato

4. **Hook**
   - `useLandingPageData` - Busca dados da organização pelo slug

## Estrutura do Banco de Dados

### Migration: `20260116_add_landing_page_fields.sql`

Campos adicionados à tabela `organizations`:

```sql
lp_hero_title TEXT
lp_hero_subtitle TEXT
lp_hero_description TEXT
lp_hero_image_url TEXT
lp_hero_button_text TEXT DEFAULT 'Agendar Visita Gratuita'
lp_about_title TEXT
lp_about_description TEXT
lp_about_image_url TEXT
lp_benefits_title TEXT
lp_benefits JSONB DEFAULT '[]'::jsonb
lp_testimonials JSONB DEFAULT '[]'::jsonb
lp_faq JSONB DEFAULT '[]'::jsonb
lp_instagram_url TEXT
lp_facebook_url TEXT
lp_custom_domain TEXT
lp_enabled BOOLEAN DEFAULT true
```

## Como Usar

### 1. Aplicar Migration

Execute a migration no Supabase:
```sql
-- Arquivo: supabase/migrations/20260116_add_landing_page_fields.sql
```

### 2. Configurar Landing Page

No painel admin (futuro), ou diretamente no banco:

```sql
UPDATE organizations 
SET 
  lp_hero_title = 'Cortinas e Persianas',
  lp_hero_subtitle = 'Sob Medida',
  lp_hero_description = 'Descrição personalizada...',
  lp_hero_image_url = 'https://exemplo.com/imagem.jpg',
  lp_enabled = true
WHERE slug = 'minha-empresa';
```

### 3. Acessar Landing Page

Acesse: `https://seudominio.com/lp/minha-empresa`

## Estrutura de Dados JSON

### Benefícios (lp_benefits)
```json
[
  {
    "title": "Orçamento Gratuito",
    "description": "Sem compromisso",
    "icon": "FileText"
  }
]
```

### Depoimentos (lp_testimonials)
```json
[
  {
    "name": "João Silva",
    "text": "Excelente atendimento!",
    "rating": 5
  }
]
```

### FAQ (lp_faq)
```json
[
  {
    "question": "Qual o prazo de entrega?",
    "answer": "Geralmente 15 a 30 dias úteis."
  }
]
```

## Próximos Passos

1. **Página de Configuração**
   - Criar interface no painel admin para configurar a LP
   - Upload de imagens
   - Editor de texto rico

2. **Domínios Personalizados**
   - Suporte a `lp_custom_domain`
   - Configuração de DNS
   - SSL automático

3. **SEO**
   - Meta tags personalizadas
   - Open Graph
   - Schema.org

4. **Analytics**
   - Tracking de conversões
   - Heatmaps
   - A/B testing

## Exemplo de Uso

```typescript
// Acessar landing page da organização
<Link to="/lp/prisma">Ver Landing Page</Link>

// Ou diretamente no navegador
// https://seudominio.com/lp/prisma
```

## Notas

- A landing page só é exibida se `lp_enabled = true`
- Se não houver dados personalizados, usa valores padrão
- O slug da organização deve ser único
- Índices criados para busca rápida por slug e domínio
