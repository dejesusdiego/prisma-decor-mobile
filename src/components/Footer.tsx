import { Facebook, Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/logo.svg";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Prisma Interiores" className="h-12 w-12" />
              <div className="flex flex-col">
                <span className="text-xl font-bold">PRISMA</span>
                <span className="text-sm text-primary-foreground/80 -mt-1">Interiores</span>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Transformando ambientes com elegância, qualidade e sofisticação desde 2020.
            </p>
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
              <a 
                href="https://www.instagram.com/prismainter/" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Prisma Interiores</p>
          <p>Futuris Intelligence LTDA - ME | CNPJ: 44.840.624/0001-92</p>
          <p>Balneário Camboriú - SC | Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
