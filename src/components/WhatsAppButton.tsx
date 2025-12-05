import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { analytics } from "@/lib/analytics";

const WhatsAppButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

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

  useEffect(() => {
    const footer = document.getElementById("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleWhatsAppClick = () => {
    analytics.clickWhatsApp('floating_button');
    const phoneNumber = "5547992624706";
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre cortinas e persianas.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`fixed bottom-0 left-0 right-0 z-50 bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-semibold py-4 px-6 shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
        isVisible && !isFooterVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      aria-label="Chamar no WhatsApp"
    >
      {/* Avatar da atendente */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-whatsapp-foreground/20 flex items-center justify-center overflow-hidden border-2 border-whatsapp-foreground/30">
          <span className="text-lg font-bold">A</span>
        </div>
        {/* Status Online */}
        <span className="absolute bottom-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-300 border border-whatsapp"></span>
        </span>
      </div>
      
      <div className="flex flex-col items-start">
        <span className="text-base font-semibold leading-tight">Fale com a Ana</span>
        <span className="text-xs opacity-80">Responde em até 5 min</span>
      </div>
      
      <MessageCircle className="h-6 w-6 ml-2" />
    </button>
  );
};

export default WhatsAppButton;
