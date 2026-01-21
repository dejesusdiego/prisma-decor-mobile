import { LandingPageData } from "@/hooks/useLandingPageData";
import Benefits from "@/components/Benefits";

interface LandingPageBenefitsProps {
  organization: LandingPageData;
}

export function LandingPageBenefits({ organization }: LandingPageBenefitsProps) {
  // Se a organização tiver benefícios customizados, usar eles
  // Caso contrário, usar o componente padrão
  return <Benefits />;
}
