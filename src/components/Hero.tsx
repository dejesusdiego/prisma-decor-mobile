import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle, Star, Shield, Award } from "lucide-react";
import heroImage from "@/assets/hero-curtains.jpg";
import BookingDialog from "./BookingDialog";
import { analytics } from "@/lib/analytics";

const Hero = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  
  return <>
    <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    <section className="relative min-h-screen flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Cortinas e persianas elegantes em Balneário Camboriú" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="text-white text-sm font-medium">4.9 no Google</span>
              <span className="text-white/60 text-xs">(127 avaliações)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-white text-sm font-medium">Garantia de 3 anos</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
              <Award className="h-4 w-4 text-accent" />
              <span className="text-white text-sm font-medium">500+ projetos</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
            Cortinas e Persianas
            <span className="block text-accent"> Sob Medida</span>
          </h1>
          
          <div className="mb-8">
            <p className="text-lg md:text-xl text-white/90 mb-4 leading-relaxed">
              Transforme seus ambientes com elegância e funcionalidade. Soluções personalizadas em cortinas e persianas que combinam design sofisticado com qualidade superior.
            </p>
            <div className="flex items-center gap-2 text-accent font-medium">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </span>
              <span>Agende a sua visita em 1 minuto!</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="default" className="bg-accent hover:bg-accent/90 text-primary font-semibold shadow-gold transition-all hover:scale-105 text-base py-6" onClick={() => {
              analytics.openBookingDialog('hero');
              setBookingOpen(true);
            }}>
              <Calendar className="mr-2 h-5 w-5" />
              Agendar Visita Gratuita
            </Button>
            <Button size="lg" className="bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-semibold shadow-lg transition-all hover:scale-105 text-base py-6" onClick={() => {
              analytics.clickWhatsApp('hero');
              const phoneNumber = "5547992624706";
              const message = encodeURIComponent("Olá! Gostaria de agendar uma visita gratuita.");
              window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
            }}>
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
          </div>

          {/* Quick Benefit List */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-white/70 text-sm">
            <span>✓ Orçamento gratuito</span>
            <span>✓ Visita sem compromisso</span>
            <span>✓ Instalação inclusa</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  </>;
};

export default Hero;