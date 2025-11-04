import { Ruler, Star, Shield, Clock } from "lucide-react";

const benefits = [
  {
    icon: Ruler,
    title: "Sob Medida",
    description: "Cada projeto é único. Medidas precisas e acabamento perfeito para suas janelas."
  },
  {
    icon: Star,
    title: "Qualidade Premium",
    description: "Materiais selecionados e fornecedores confiáveis para garantir durabilidade."
  },
  {
    icon: Shield,
    title: "Garantia Estendida",
    description: "Confiança em nosso trabalho com garantia em todos os produtos e instalações."
  },
  {
    icon: Clock,
    title: "Instalação Rápida",
    description: "Equipe especializada e agendamento flexível para sua comodidade."
  }
];

const Benefits = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background via-background/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Por Que Escolher a Prisma?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Excelência em cada detalhe do seu projeto
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="group flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                  <Icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
