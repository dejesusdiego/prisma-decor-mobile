import { LandingPageData } from "@/hooks/useLandingPageData";
import FAQ from "@/components/FAQ";

interface LandingPageFAQProps {
  organization: LandingPageData;
}

export function LandingPageFAQ({ organization }: LandingPageFAQProps) {
  // Se a organização tiver FAQ customizado, usar ele
  // Caso contrário, usar o componente padrão
  return <FAQ />;
}
