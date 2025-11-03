import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail } from "lucide-react";
import BookingDialog from "./BookingDialog";
const ContactForm = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  return <section id="contato" className="py-20 bg-background">
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

          <div className="grid md:grid-cols-2 gap-8">
            {/* CTA Button */}
            <div className="flex items-center justify-center">
              <Button onClick={() => setBookingOpen(true)} className="w-full max-w-md bg-accent hover:bg-accent/90 text-primary font-semibold shadow-gold" size="lg">
                Agendar Visita Gratuita
              </Button>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Como Funciona?
                </h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Agende a Visita</p>
                      <p className="text-sm text-muted-foreground">Preencha o formulário com seus dados</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Consultoria Gratuita</p>
                      <p className="text-sm text-muted-foreground">Nossa equipe visita sua casa para tirar medidas</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Orçamento Personalizado</p>
                      <p className="text-sm text-muted-foreground">Receba uma proposta sob medida</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Instalação</p>
                      <p className="text-sm text-muted-foreground">Agendamos a instalação na sua conveniência</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-md space-y-4">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Outras Formas de Contato
                </h3>
                <div className="space-y-3">
                  <a href="tel:+" className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                    <Phone className="h-5 w-5" />
                    <span>(00) -0000</span>
                  </a>
                  <a href="mailto:contato@prismainteriores.com.br" className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                    <Mail className="h-5 w-5" />
                    <span>contato@prismainteriores.com.br</span>
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    <span>Atendemos Balneário Camboriú, Itajaí e arredores.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default ContactForm;