import { useState } from "react";
import { Calendar, Ruler, Calculator, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingDialog from "./BookingDialog";

const steps = [
  {
    number: "01",
    title: "Agendamento",
    description: "Preencha o formulário e um consultor entrará em contato para agendar sua visita gratuita.",
    icon: Calendar,
  },
  {
    number: "02",
    title: "Visita Técnica",
    description: "Nosso consultor apresenta opções, faz medições e oferece a solução ideal para você.",
    icon: Ruler,
  },
  {
    number: "03",
    title: "Orçamento",
    description: "Receba o orçamento detalhado e escolha a forma de pagamento mais conveniente.",
    icon: Calculator,
  },
  {
    number: "04",
    title: "Instalação",
    description: "Entrega e instalação gratuitas. Agendamos o melhor dia assim que estiver pronto.",
    icon: Wrench,
  },
];

const ProcessFlow = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <section className="pt-16 md:pt-24 pb-8 md:pb-12 bg-primary relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Seu Projeto em 4 Passos
          </h2>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            Da primeira conversa à instalação, cuidamos de tudo para você.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="max-w-5xl mx-auto">
          {/* Desktop: Connecting line */}
          <div className="hidden md:block relative">
            <div className="absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-accent/30 via-accent to-accent/30" />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <div
                  key={index}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 hover:border-accent/30 transition-all duration-300 hover:bg-card/20 hover:scale-105 h-full flex flex-col">
                    {/* Number */}
                    <div className="text-center mb-3 md:mb-4">
                      <span className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-accent to-accent/60 bg-clip-text text-transparent">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-3 md:mb-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors duration-300">
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center flex-1 flex flex-col">
                      <h3 className="text-base md:text-lg font-semibold text-primary-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-xs md:text-sm text-primary-foreground/60 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 md:mt-16">
          <p className="text-primary-foreground/70 mb-4">
            Pronto para transformar seu ambiente?
          </p>
          <Button 
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300"
            onClick={() => setIsBookingOpen(true)}
          >
            Agendar Minha Visita Gratuita
          </Button>
        </div>
      </div>

      <BookingDialog open={isBookingOpen} onOpenChange={setIsBookingOpen} />
    </section>
  );
};

export default ProcessFlow;
