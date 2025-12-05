import { Home, Shield, Wrench, Ruler, Clock, XCircle, Check } from "lucide-react";

const diferenciais = [
  {
    tipo: 'destaque',
    titulo: 'Visita Gratuita',
    subtitulo: 'Medimos. Você decide. Sem pressão.',
    bullets: ['Orçamento detalhado', 'Sem compromisso', 'Consultoria inclusa'],
    icon: Home
  },
  {
    tipo: 'normal',
    titulo: '3 Anos de Garantia',
    descricao: 'Cobertura total em produtos e instalação',
    icon: Shield
  },
  {
    tipo: 'normal',
    titulo: 'Instalação Inclusa',
    descricao: 'Nossa equipe faz a instalação. Sem terceiros.',
    icon: Wrench
  },
  {
    tipo: 'normal',
    titulo: '100% Sob Medida',
    descricao: 'Cada janela é única. Seu projeto também.',
    icon: Ruler
  },
  {
    tipo: 'normal',
    titulo: 'Entrega em 15-25 Dias',
    descricao: 'Da aprovação à instalação completa',
    icon: Clock
  },
  {
    tipo: 'anti',
    titulo: 'O que NÃO fazemos',
    items: [
      'Vendas com pressão',
      'Custos escondidos no orçamento',
      'Terceirização da instalação',
      'Promessas que não podemos cumprir'
    ],
    icon: XCircle
  }
];

const Benefits = () => {
  const normais = diferenciais.filter(d => d.tipo === 'normal');
  
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Por Que a Prisma?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            A transparência que você merece, do início ao fim
          </p>
        </div>

        {/* Layout 1-2-2-1 */}
        <div className="flex flex-col gap-4 md:gap-5 max-w-4xl mx-auto">
          
          {/* Row 1: Card Destaque - Visita Gratuita (full width) */}
          <div className="group relative flex flex-col md:flex-row md:items-center p-6 md:p-8 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-accent/30 shadow-[0_0_30px_-10px_hsl(var(--accent)/0.3)] transition-all duration-300 hover:bg-secondary/70 hover:-translate-y-1">
            <div className="absolute -top-3 left-6 px-4 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
              Mais Procurado
            </div>
            
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 md:mb-0 md:mr-6 flex-shrink-0">
              <Home className="h-7 w-7 md:h-8 md:w-8 text-accent" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Visita Gratuita
              </h3>
              <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-0">
                Medimos. Você decide. Sem pressão.
              </p>
            </div>
            
            <ul className="flex flex-wrap gap-3 md:gap-4">
              {['Orçamento detalhado', 'Sem compromisso', 'Consultoria inclusa'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-foreground/80 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Row 2: 2 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {normais.slice(0, 2).map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="group flex flex-col p-5 md:p-6 rounded-2xl bg-secondary/30 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:bg-secondary/50 hover:border-accent/30 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary group-hover:bg-accent/20 flex items-center justify-center mb-4 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                  </div>
                  
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Row 3: 2 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {normais.slice(2, 4).map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="group flex flex-col p-5 md:p-6 rounded-2xl bg-secondary/30 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:bg-secondary/50 hover:border-accent/30 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary group-hover:bg-accent/20 flex items-center justify-center mb-4 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                  </div>
                  
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Row 4: Card Anti-Marketing (full width) */}
          <div className="group flex flex-col md:flex-row md:items-center p-6 md:p-8 rounded-2xl bg-red-950/10 backdrop-blur-sm border border-red-500/20 transition-all duration-300 hover:bg-red-950/20 hover:border-red-500/30">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 md:mb-0 md:mr-6 flex-shrink-0">
              <XCircle className="h-6 w-6 md:h-7 md:w-7 text-red-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-0">
                O que NÃO fazemos
              </h3>
            </div>
            
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {['Vendas com pressão', 'Custos escondidos', 'Terceirização', 'Promessas vazias'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-foreground/70 text-sm">
                  <span className="text-red-400 flex-shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
