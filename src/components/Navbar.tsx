import { useState } from "react";
import { Menu, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingDialog from "@/components/BookingDialog";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-white/95 backdrop-blur-sm shadow-lg rounded-3xl z-50">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logo} alt="Prisma Interiores" className="h-12 w-12" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">PRISMA</span>
              <span className="text-sm text-muted-foreground -mt-1">Interiores</span>
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
            <Link to="/nossos-produtos" className="text-foreground hover:text-primary transition-colors font-medium text-sm">
              Nossos Produtos
            </Link>
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
              <Link 
                to="/nossos-produtos" 
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Nossos Produtos
              </Link>
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

      <BookingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default Navbar;
