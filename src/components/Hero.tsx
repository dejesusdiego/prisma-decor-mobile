import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-curtains.jpg";
import BookingDialog from "./BookingDialog";
const Hero = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  return <>
    <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    <section className="relative min-h-screen flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Cortinas e persianas elegantes" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
            Cortinas e Persianas
            <span className="block text-accent"> Sob Medida</span>
          </h1>
          <div className="mb-8">
            <p className="text-lg md:text-xl text-white/90 mb-4 leading-relaxed">
              Transforme seus ambientes com elegância e funcionalidade. Soluções personalizadas em cortinas e persianas que combinam design sofisticado com qualidade superior.
            </p>
            <p className="text-sm md:text-base text-white/70 font-light">
              Agende agora uma visita sem compromisso!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="default" className="bg-accent hover:bg-accent/90 text-primary font-semibold shadow-gold transition-all hover:scale-105" onClick={() => setBookingOpen(true)}>
              <Calendar className="mr-2 h-5 w-5" />
              Agendar Visita Gratuita
            </Button>
            <Button size="lg" className="bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-semibold shadow-lg transition-all hover:scale-105" onClick={() => {
              const phoneNumber = "5500000000000";
              const message = encodeURIComponent("Olá! Gostaria de agendar uma visita gratuita.");
              window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
            }}>
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
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