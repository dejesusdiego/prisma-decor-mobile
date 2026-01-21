import { LandingPageData } from "@/hooks/useLandingPageData";
import ProcessFlow from "@/components/ProcessFlow";

interface LandingPageProcessProps {
  organization: LandingPageData;
}

export function LandingPageProcess({ organization }: LandingPageProcessProps) {
  return <ProcessFlow />;
}
