import { useState } from "react";
import { Menu, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingDialog from "@/components/BookingDialog";
import logo from "@/assets/logo.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-md z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Prisma Interiores" className="h-12 w-12" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">PRISMA</span>
              <span className="text-sm text-muted-foreground -mt-1">Interiores</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#cortinas" className="text-foreground hover:text-primary transition-colors font-medium">
              Cortinas
            </a>
            <a href="#persianas" className="text-foreground hover:text-primary transition-colors font-medium">
              Persianas
            </a>
            <a href="#sobre" className="text-foreground hover:text-primary transition-colors font-medium">
              Sobre
            </a>
            <Button 
              size="sm" 
              onClick={() => setIsDialogOpen(true)}
              className="bg-accent hover:bg-accent/90 text-primary font-semibold rounded-full px-6"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Visita
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
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
              <Button 
                size="sm" 
                onClick={() => {
                  setIsOpen(false);
                  setIsDialogOpen(true);
                }}
                className="bg-accent hover:bg-accent/90 text-primary font-semibold w-full rounded-full"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Visita
              </Button>
            </div>
          </div>
        )}
        </div>
      </nav>

      <BookingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default Navbar;
