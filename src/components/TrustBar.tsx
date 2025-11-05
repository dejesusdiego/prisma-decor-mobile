import { Sparkles, Building2, ShieldCheck, Wrench, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

const benefits = [
  {
    icon: Sparkles,
    text: "Atendimento Personalizado"
  },
  {
    icon: Building2,
    text: "Projetos Residenciais e Empresariais"
  },
  {
    icon: ShieldCheck,
    text: "Garantia de 3 anos"
  },
  {
    icon: Wrench,
    text: "Fazemos do seu Jeito"
  },
  {
    icon: DollarSign,
    text: "Preço Justo"
  }
];

const TrustBar = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition((prev) => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-foreground text-background py-3 overflow-hidden">
      {/* Desktop: static grid */}
      <div className="hidden md:block container mx-auto px-4">
        <div className="flex items-center justify-center gap-8 lg:gap-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <benefit.icon className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: animated scroll */}
      <div className="md:hidden relative">
        <div 
          className="flex gap-8 animate-scroll"
          style={{
            animation: 'scroll 30s linear infinite'
          }}
        >
          {/* Duplicate items for seamless loop */}
          {[...benefits, ...benefits, ...benefits].map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 flex-shrink-0">
              <benefit.icon className="h-4 w-4" />
              <span className="text-sm font-medium whitespace-nowrap">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
