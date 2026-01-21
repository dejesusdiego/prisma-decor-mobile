import { LandingPageData } from "@/hooks/useLandingPageData";
import ContactForm from "@/components/ContactForm";

interface LandingPageContactProps {
  organization: LandingPageData;
}

export function LandingPageContact({ organization }: LandingPageContactProps) {
  return <ContactForm organizationSlug={organization.slug} />;
}
