import { useState } from "react";
import { Menu, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingDialog from "@/components/BookingDialog";
import { Link } from "react-router-dom";
import { LandingPageData } from "@/hooks/useLandingPageData";

interface LandingPageNavbarProps {
  organization: LandingPageData;
}

export function LandingPageNavbar({ organization }: LandingPageNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const logoUrl = organization.logo_url;
  const organizationName = organization.name;

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-white/95 backdrop-blur-sm shadow-lg rounded-3xl z-50">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={`/lp/${organization.slug}`} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              {logoUrl ? (
                <img src={logoUrl} alt={organizationName} className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    {organizationName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary">{organizationName.toUpperCase()}</span>
                {organization.tagline && (
                  <span className="text-sm text-muted-foreground -mt-1">{organization.tagline}</span>
                )}
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#cortinas" className="text-foreground hover:text-primary transition-colors font-medium text-sm">
                Cortinas
              </a>
              <a href="#persianas" className="text-foreground hover:text-primary transition-colors font-medium text-sm">
                Persianas
              </a>
              <a href="#sobre" className="text-foreground hover:text-primary transition-colors font-medium text-sm">
                Sobre
              </a>
            </div>

            {/* Right side - Button and Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Yellow Button - Always visible */}
              <Button 
                size="sm" 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#F4C430] hover:bg-[#F4C430]/90 text-black font-semibold rounded-full h-10 w-10 p-0 shadow-md flex items-center justify-center"
              >
                <Calendar className="h-5 w-5" />
              </Button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-foreground"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden py-4 px-6 border-t border-border">
              <div className="flex flex-col gap-4">
                <a 
                  href="#cortinas" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Cortinas
                </a>
                <a 
                  href="#persianas" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Persianas
                </a>
                <a 
                  href="#sobre" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Sobre
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      <BookingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} organizationSlug={organization.slug} />
    </>
  );
}
