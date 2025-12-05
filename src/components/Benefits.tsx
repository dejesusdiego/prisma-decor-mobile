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
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            Por Que a Prisma?
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto">
            A transparência que você merece, do início ao fim
          </p>
        </div>

        {/* Mobile-First Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          
          {/* Card Destaque - Visita Gratuita */}
          <div className="md:col-span-2 lg:col-span-1 lg:row-span-2 group relative flex flex-col p-6 md:p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-accent/30 shadow-[0_0_30px_-10px_hsl(var(--accent)/0.3)] transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
            <div className="absolute -top-3 left-6 px-4 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
              Mais Procurado
            </div>
            
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent/20 flex items-center justify-center mb-5">
              <Home className="h-7 w-7 md:h-8 md:w-8 text-accent" />
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Visita Gratuita
            </h3>
            <p className="text-white/60 text-sm md:text-base mb-5">
              Medimos. Você decide. Sem pressão.
            </p>
            
            <ul className="space-y-3 mt-auto">
              {['Orçamento detalhado', 'Sem compromisso', 'Consultoria inclusa'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-white/80 text-sm md:text-base">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Cards Normais - Grid 2x2 no mobile, distribuídos no desktop */}
          {diferenciais.filter(d => d.tipo === 'normal').map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="group flex flex-col p-5 md:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-accent/30 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-accent/20 flex items-center justify-center mb-4 transition-colors duration-300">
                  <Icon className="h-6 w-6 text-white/80 group-hover:text-accent transition-colors duration-300" />
                </div>
                
                <h3 className="text-base md:text-lg font-bold text-white mb-2">
                  {item.titulo}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.descricao}
                </p>
              </div>
            );
          })}

          {/* Card Anti-Marketing - O que NÃO fazemos */}
          <div className="md:col-span-2 lg:col-span-1 group flex flex-col p-6 md:p-8 rounded-2xl bg-red-950/20 backdrop-blur-sm border border-red-500/20 transition-all duration-300 hover:bg-red-950/30 hover:border-red-500/30">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
              <XCircle className="h-6 w-6 md:h-7 md:w-7 text-red-400" />
            </div>
            
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">
              O que NÃO fazemos
            </h3>
            
            <ul className="space-y-3">
              {['Vendas com pressão', 'Custos escondidos no orçamento', 'Terceirização da instalação', 'Promessas que não podemos cumprir'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-white/70 text-sm md:text-base">
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
