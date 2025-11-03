import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

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
    <button
      onClick={handleWhatsAppClick}
      className={`fixed bottom-0 left-0 right-0 z-50 bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-semibold py-4 px-6 shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      aria-label="Chamar no WhatsApp"
    >
      <div className="relative">
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </div>
      <span className="text-lg">Chamar no WhatsApp</span>
    </button>
  );
};

export default WhatsAppButton;
