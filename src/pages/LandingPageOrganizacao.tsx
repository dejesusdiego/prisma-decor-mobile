import { useParams } from 'react-router-dom';
import { useLandingPageData } from '@/hooks/useLandingPageData';
import { LandingPageHero } from '@/components/landing/LandingPageHero';
import { LandingPageNavbar } from '@/components/landing/LandingPageNavbar';
import { LandingPageStats } from '@/components/landing/LandingPageStats';
import { LandingPageProducts } from '@/components/landing/LandingPageProducts';
import { LandingPageProcess } from '@/components/landing/LandingPageProcess';
import { LandingPageBenefits } from '@/components/landing/LandingPageBenefits';
import { LandingPageSocialProof } from '@/components/landing/LandingPageSocialProof';
import { LandingPageFAQ } from '@/components/landing/LandingPageFAQ';
import { LandingPageContact } from '@/components/landing/LandingPageContact';
import { LandingPageFooter } from '@/components/landing/LandingPageFooter';
import WhatsAppButton from '@/components/WhatsAppButton';
import TrustBar from '@/components/TrustBar';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LandingPageOrganizacaoProps {
  slug?: string; // Slug opcional (quando chamado diretamente via domínio)
}

export default function LandingPageOrganizacao({ slug: slugProp }: LandingPageOrganizacaoProps = {}) {
  // Se slug vier como prop (roteamento por domínio), usar ele
  // Caso contrário, pegar da URL (rota /lp/:slug)
  const { slug: slugFromParams } = useParams<{ slug: string }>();
  const slug = slugProp || slugFromParams || null;
  
  const { data: orgData, isLoading, error } = useLandingPageData(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !orgData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Organização não encontrada ou landing page desabilitada.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <LandingPageNavbar organization={orgData} />
      <LandingPageHero organization={orgData} />
      <LandingPageStats organization={orgData} />
      <LandingPageProducts organization={orgData} />
      <LandingPageProcess organization={orgData} />
      <LandingPageBenefits organization={orgData} />
      <LandingPageSocialProof organization={orgData} />
      <LandingPageFAQ organization={orgData} />
      <LandingPageContact organization={orgData} />
      <WhatsAppButton
        phone={orgData.whatsapp || orgData.phone || ''}
        organizationId={orgData.id}
      />
      <TrustBar />
      <LandingPageFooter organization={orgData} />
    </div>
  );
}
