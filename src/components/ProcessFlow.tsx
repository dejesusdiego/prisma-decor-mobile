import { useEffect, useRef, useState } from "react";
import { Calendar, Ruler, Calculator, Wrench, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "1ª Etapa",
    label: "Contato",
    title: "Agendamento",
    description: "Preencha o formulário ou entre em contato conosco e um consultor entrará em contato para agendar o melhor horário e transformar seus ambientes.",
    icon: Calendar,
  },
  {
    number: "2ª Etapa",
    label: "Visita",
    title: "Visita sem Compromisso",
    description: "Nosso consultor especializado analisará suas necessidades, apresentará modelos e tecidos, fará as medições necessárias e oferecerá a solução ideal para o seu espaço.",
    icon: Ruler,
  },
  {
    number: "3ª Etapa",
    label: "Orçamento",
    title: "Orçamento e Pagamento",
    description: "Após definir o projeto, nosso consultor fornecerá o orçamento. Com a aprovação, você poderá realizar o pagamento de forma prática, via Cartão de Crédito, Débito ou PIX.",
    icon: Calculator,
  },
  {
    number: "4ª Etapa",
    label: "Instalação",
    title: "Entrega e Instalação",
    description: "Nossas persianas e cortinas sob medida são entregues e instaladas em 12 a 15 dias úteis. Assim que prontas, entraremos em contato para agendar o melhor dia.",
    icon: Wrench,
  },
];

const ProcessFlow = () => {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      if (scrollPosition >= sectionTop && scrollPosition <= sectionTop + sectionHeight) {
        const relativeScroll = scrollPosition - sectionTop;
        const stepHeight = sectionHeight / steps.length;
        const currentStep = Math.min(
          Math.floor(relativeScroll / stepHeight),
          steps.length - 1
        );
        setActiveStep(currentStep);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-background via-muted/20 to-background"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            COMO FUNCIONA O PROCESSO?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            <span className="bg-primary/10 px-4 py-2 inline-block rounded-md font-medium">
              Nós Planejamos. Nós Medimos. Nós Instalamos. Você Aproveita.
            </span>
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-12 top-0 bottom-0 w-0.5 bg-border" />

          {/* Steps */}
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= activeStep;

              return (
                <div
                  key={index}
                  ref={(el) => (stepRefs.current[index] = el)}
                  className={`relative transition-all duration-700 ${
                    isActive ? "opacity-100 translate-x-0" : "opacity-40 translate-x-4"
                  }`}
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-8 md:left-12 -translate-x-1/2 w-8 h-8 rounded-full border-4 border-background transition-all duration-500 flex items-center justify-center ${
                      isActive
                        ? "bg-primary scale-110 shadow-lg shadow-primary/50"
                        : "bg-muted scale-100"
                    }`}
                  >
                    {isActive && (
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>

                  {/* Content Card */}
                  <div className="ml-20 md:ml-28">
                    <div
                      className={`bg-card rounded-2xl p-6 md:p-8 shadow-lg transition-all duration-500 hover:shadow-xl ${
                        isActive ? "border-2 border-primary/20" : "border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`p-3 rounded-xl transition-all duration-500 ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {step.number}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {step.label}
                            </span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;
