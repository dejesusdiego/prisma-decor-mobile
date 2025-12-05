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
    titulo: '1 Ano de Garantia',
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
    <section className="pt-8 md:pt-12 pb-16 md:pb-24 bg-primary relative overflow-hidden">
      {/* Subtle background pattern - same as ProcessFlow */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-3">
            Por Que a Prisma?
          </h2>
          <p className="text-base md:text-lg text-primary-foreground/60 max-w-xl mx-auto">
            A transparência que você merece, do início ao fim
          </p>
        </div>

        {/* Layout 1-2-2-1 */}
        <div className="flex flex-col gap-3 md:gap-5 max-w-4xl mx-auto">
          
          {/* Row 1: Card Destaque - Visita Gratuita (full width) */}
          <div className="group relative flex flex-col p-5 md:p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-accent/30 shadow-[0_0_30px_-10px_hsl(var(--accent)/0.3)] transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
            <div className="absolute -top-3 left-5 px-3 py-1 bg-accent text-accent-foreground text-[10px] md:text-xs font-semibold rounded-full">
              Mais Procurado
            </div>
            
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent/20 flex items-center justify-center mb-4">
              <Home className="h-6 w-6 md:h-7 md:w-7 text-accent" />
            </div>
            
            <h3 className="text-lg md:text-2xl font-bold text-white mb-1">
              Visita Gratuita
            </h3>
            <p className="text-white/60 text-sm md:text-base mb-4">
              Medimos. Você decide. Sem pressão.
            </p>
            
            <ul className="flex flex-wrap gap-2 md:gap-3">
              {['Orçamento detalhado', 'Sem compromisso', 'Consultoria inclusa'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-white/80 text-xs md:text-sm">
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-accent" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Row 2: 2 cards lado a lado (mobile e desktop) */}
          <div className="grid grid-cols-2 gap-3 md:gap-5">
            {normais.slice(0, 2).map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="group flex flex-col p-4 md:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-accent/30 hover:-translate-y-1"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 group-hover:bg-accent/20 flex items-center justify-center mb-3 md:mb-4 transition-colors duration-300">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white/80 group-hover:text-accent transition-colors duration-300" />
                  </div>
                  
                  <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Row 3: 2 cards lado a lado (mobile e desktop) */}
          <div className="grid grid-cols-2 gap-3 md:gap-5">
            {normais.slice(2, 4).map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="group flex flex-col p-4 md:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-accent/30 hover:-translate-y-1"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 group-hover:bg-accent/20 flex items-center justify-center mb-3 md:mb-4 transition-colors duration-300">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white/80 group-hover:text-accent transition-colors duration-300" />
                  </div>
                  
                  <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Row 4: Card Anti-Marketing (full width) */}
          <div className="group flex flex-col p-5 md:p-8 rounded-2xl bg-red-950/20 backdrop-blur-sm border border-red-500/20 transition-all duration-300 hover:bg-red-950/30 hover:border-red-500/30">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
            </div>
            
            <h3 className="text-base md:text-xl font-bold text-white mb-3">
              O que NÃO fazemos
            </h3>
            
            <ul className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-x-6 md:gap-y-2">
              {['Vendas com pressão', 'Custos escondidos', 'Terceirização', 'Promessas vazias'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-white/70 text-xs md:text-sm">
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
