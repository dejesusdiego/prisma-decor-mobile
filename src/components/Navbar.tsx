import { useState } from "react";
import { Menu, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleScheduleClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl bg-background/80 backdrop-blur-md shadow-xl rounded-full z-50 border border-border/50">
        <div className="px-6">
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
              onClick={handleScheduleClick}
              className="bg-accent hover:bg-accent/90 text-primary font-semibold rounded-full px-6 shadow-lg hover:shadow-xl transition-all"
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
                  handleScheduleClick();
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

      {/* Import and render BookingDialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)} />
          <div className="relative bg-background rounded-lg p-6 max-w-md w-full mx-4">
            {/* Simple inline dialog for now - you can enhance this */}
            <h2 className="text-2xl font-bold mb-4">Agendar Visita</h2>
            <p className="text-muted-foreground mb-4">
              Entre em contato conosco para agendar sua visita gratuita.
            </p>
            <Button onClick={() => setIsDialogOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
