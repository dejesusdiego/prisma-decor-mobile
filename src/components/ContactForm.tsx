import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail } from "lucide-react";
import BookingDialog from "./BookingDialog";

const ContactForm = () => {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <section id="contato" className="py-20 bg-background">
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Agende Sua Visita Gratuita
            </h2>
            <p className="text-lg text-muted-foreground">
              Preencha o formulário e nossa equipe entrará em contato para agendar sua visita técnica
            </p>
          </div>

          <div className="flex flex-col items-center gap-8">
            {/* CTA Button */}
            <Button 
              onClick={() => setBookingOpen(true)}
              className="w-full max-w-md bg-accent hover:bg-accent/90 text-primary font-semibold shadow-gold"
              size="lg"
            >
              Agendar Visita Gratuita
            </Button>

            {/* Contact Info */}
            <div className="bg-card p-6 rounded-lg shadow-md space-y-4 w-full max-w-md">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Outras Formas de Contato
              </h3>
              <div className="space-y-3">
                <a href="tel:+" className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                  <Phone className="h-5 w-5" />
                  <span>(00) 0000-0000</span>
                </a>
                <a href="mailto:contato@prismainteriores.com.br" className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                  <Mail className="h-5 w-5" />
                  <span>contato@prismainteriores.com.br</span>
                </a>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>Atendemos toda a região</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
