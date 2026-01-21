import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LandingPageData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  tagline: string | null;
  address: string | null;
  cnpj: string | null;
  // Landing page fields
  lp_hero_title: string | null;
  lp_hero_subtitle: string | null;
  lp_hero_description: string | null;
  lp_hero_image_url: string | null;
  lp_hero_button_text: string | null;
  lp_about_title: string | null;
  lp_about_description: string | null;
  lp_about_image_url: string | null;
  lp_benefits_title: string | null;
  lp_benefits: any[] | null;
  lp_testimonials: any[] | null;
  lp_faq: any[] | null;
  lp_instagram_url: string | null;
  lp_facebook_url: string | null;
  lp_custom_domain: string | null;
  lp_enabled: boolean | null;
}

export function useLandingPageData(slug: string | null) {
  return useQuery({
    queryKey: ['landing-page', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .eq('lp_enabled', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching landing page data:', error);
        return null;
      }

      if (!data) return null;

      // Parse JSON fields
      const parsedData: LandingPageData = {
        ...data,
        lp_benefits: data.lp_benefits ? (typeof data.lp_benefits === 'string' ? JSON.parse(data.lp_benefits) : data.lp_benefits) : [],
        lp_testimonials: data.lp_testimonials ? (typeof data.lp_testimonials === 'string' ? JSON.parse(data.lp_testimonials) : data.lp_testimonials) : [],
        lp_faq: data.lp_faq ? (typeof data.lp_faq === 'string' ? JSON.parse(data.lp_faq) : data.lp_faq) : [],
      };

      return parsedData;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
