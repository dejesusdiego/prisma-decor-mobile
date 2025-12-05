import { Ruler, Star, Shield, Clock } from "lucide-react";

const benefits = [
  {
    icon: Ruler,
    stat: "100%",
    statLabel: "Personalizado",
    title: "Sob Medida",
    description: "Cada projeto é único. Medidas precisas para suas janelas.",
    highlight: false
  },
  {
    icon: Shield,
    stat: "3",
    statLabel: "Anos de Garantia",
    title: "Garantia Estendida",
    description: "Cobertura completa em produtos e instalação.",
    highlight: true
  },
  {
    icon: Clock,
    stat: "15",
    statLabel: "Dias p/ Instalação",
    title: "Entrega Rápida",
    description: "Da aprovação à instalação em tempo recorde.",
    highlight: false
  },
  {
    icon: Star,
    stat: "4.9",
    statLabel: "no Google",
    title: "Clientes Satisfeitos",
    description: "Mais de 127 avaliações 5 estrelas.",
    highlight: false
  }
];

const Benefits = () => {
  return (
    <section className="py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            Por Que a Prisma?
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-xl mx-auto">
            Confiança comprovada por nossos clientes
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className={`
                  group relative flex flex-col items-center text-center 
                  p-4 md:p-6 rounded-2xl 
                  bg-white/5 backdrop-blur-sm
                  border transition-all duration-300 
                  hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl
                  ${benefit.highlight 
                    ? 'border-accent/50 shadow-[0_0_30px_-10px_hsl(var(--accent)/0.3)]' 
                    : 'border-white/10 hover:border-accent/30'
                  }
                `}
              >
                {/* Highlight Badge */}
                {benefit.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-accent-foreground text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                    Mais Popular
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-12 h-12 md:w-14 md:h-14 rounded-full 
                  flex items-center justify-center mb-3 md:mb-4
                  ${benefit.highlight 
                    ? 'bg-accent/20' 
                    : 'bg-white/10 group-hover:bg-accent/20'
                  }
                  transition-colors duration-300
                `}>
                  <Icon className={`
                    h-6 w-6 md:h-7 md:w-7 
                    ${benefit.highlight ? 'text-accent' : 'text-white/80 group-hover:text-accent'}
                    transition-colors duration-300
                  `} />
                </div>

                {/* Stat Number */}
                <div className="mb-1">
                  <span className={`
                    text-3xl md:text-4xl lg:text-5xl font-bold
                    ${benefit.highlight 
                      ? 'text-accent' 
                      : 'text-white group-hover:text-accent'
                    }
                    transition-colors duration-300
                  `}>
                    {benefit.stat}
                  </span>
                </div>

                {/* Stat Label */}
                <span className="text-xs md:text-sm text-white/50 mb-3 md:mb-4">
                  {benefit.statLabel}
                </span>

                {/* Title */}
                <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-1.5 md:mb-2">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-xs md:text-sm text-white/60 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
