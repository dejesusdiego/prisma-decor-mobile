import { LandingPageData } from "@/hooks/useLandingPageData";
import SocialProof from "@/components/SocialProof";

interface LandingPageSocialProofProps {
  organization: LandingPageData;
}

export function LandingPageSocialProof({ organization }: LandingPageSocialProofProps) {
  return <SocialProof />;
}
