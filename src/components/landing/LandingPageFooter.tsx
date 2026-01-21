import { Instagram, Facebook } from "lucide-react";
import { LandingPageData } from "@/hooks/useLandingPageData";

interface LandingPageFooterProps {
  organization: LandingPageData;
}

export function LandingPageFooter({ organization }: LandingPageFooterProps) {
  const logoUrl = organization.logo_url;
  const organizationName = organization.name;
  const tagline = organization.tagline;
  const address = organization.address;
  const cnpj = organization.cnpj;
  const instagramUrl = organization.lp_instagram_url;
  const facebookUrl = organization.lp_facebook_url;

  return (
    <footer id="footer" className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={organizationName} className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    {organizationName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl font-bold">{organizationName.toUpperCase()}</span>
                {tagline && (
                  <span className="text-sm text-primary-foreground/80 -mt-1">{tagline}</span>
                )}
              </div>
            </div>
            {tagline && (
              <p className="text-primary-foreground/80 text-sm">
                {tagline}
              </p>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="#cortinas" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                  Cortinas
                </a>
              </li>
              <li>
                <a href="#persianas" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                  Persianas
                </a>
              </li>
              <li>
                <a href="#sobre" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#contato" className="text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
            <div className="flex gap-4">
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} {organizationName}</p>
          {cnpj && <p>CNPJ: {cnpj}</p>}
          {address && <p>{address}</p>}
          <p>Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
