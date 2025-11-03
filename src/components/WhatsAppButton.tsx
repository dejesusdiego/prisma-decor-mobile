import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const handleWhatsAppClick = () => {
    // Substitua pelo número real do WhatsApp
    const phoneNumber = "5500000000000"; // Formato: 55 + DDD + número
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre cortinas e persianas.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground shadow-lg transition-all duration-300 ${
        isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
      }`}
      size="icon"
      aria-label="Chamar no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};

export default WhatsAppButton;
