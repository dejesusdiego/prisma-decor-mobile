import { LandingPageData } from "@/hooks/useLandingPageData";
import Products from "@/components/Products";

interface LandingPageProductsProps {
  organization: LandingPageData;
}

export function LandingPageProducts({ organization }: LandingPageProductsProps) {
  return <Products />;
}
