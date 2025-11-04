import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import blackoutImage from "@/assets/blackout-curtains.jpg";
import linenImage from "@/assets/linen-curtains.jpg";
import blindsImage from "@/assets/venetian-blinds.jpg";
import rollerImage from "@/assets/roller-curtains.jpg";
import fabricImage from "@/assets/fabric-curtains.jpg";
import verticalImage from "@/assets/vertical-blinds.jpg";
import woodenImage from "@/assets/wooden-blinds.jpg";
import romanImage from "@/assets/roman-shades.jpg";
import solarImage from "@/assets/solar-screen.jpg";
import doubleVisionImage from "@/assets/double-vision.jpg";
import tripleShadeImage from "@/assets/triple-shade.jpg";
import cellularImage from "@/assets/cellular-shades.jpg";
import motorizationImage from "@/assets/motorization.jpg";

const products = [
  {
    title: "Cortinas Blackout",
    description: "Controle total de luminosidade e privacidade para ambientes que exigem escuridão completa.",
    image: blackoutImage,
    features: [
      "Bloqueia 100% da luz",
      "Isolamento térmico e acústico",
      "Ideal para quartos e home theaters",
      "Variedade de cores e texturas"
    ]
  },
  {
    title: "Cortinas de Linho",
    description: "Elegância natural com tecidos nobres que trazem sofisticação e leveza aos ambientes.",
    image: linenImage,
    features: [
      "Tecido natural e sustentável",
      "Filtragem suave da luz",
      "Design atemporal",
      "Fácil manutenção"
    ]
  },
  {
    title: "Persianas",
    description: "Praticidade e modernidade com controle preciso de luminosidade para qualquer ambiente.",
    image: blindsImage,
    features: [
      "Controle preciso de luz",
      "Design minimalista",
      "Fácil operação",
      "Durabilidade garantida"
    ]
  },
  {
    title: "Cortina de Rolo",
    description: "Modernidade e praticidade com acionamento suave e visual clean, ideal para qualquer ambiente.",
    image: rollerImage,
    features: [
      "Design contemporâneo e funcional",
      "Facilidade de uso e manutenção",
      "Controle eficiente de luminosidade",
      "Opção blackout ou translúcida"
    ]
  },
  {
    title: "Cortina de Tecido",
    description: "Sofisticação e conforto com tecidos personalizados sob medida, perfeitos para salas e quartos.",
    image: fabricImage,
    features: [
      "Ampla variedade de tecidos e cores",
      "Acabamento sob medida",
      "Equilíbrio entre elegância e funcionalidade",
      "Conforto térmico e acústico"
    ]
  },
  {
    title: "Persiana Vertical",
    description: "Solução versátil e elegante para janelas amplas e portas de vidro.",
    image: verticalImage,
    features: [
      "Controle total de luz e privacidade",
      "Visual clean e moderno",
      "Fácil de operar e limpar",
      "Opções em PVC, tecido ou blackout"
    ]
  },
  {
    title: "Persiana de Madeira",
    description: "Toque natural e aconchegante com lâminas de madeira tratada que valorizam o ambiente.",
    image: woodenImage,
    features: [
      "Estilo clássico e sofisticado",
      "Alta durabilidade",
      "Controle preciso de luminosidade",
      "Produzida com madeiras sustentáveis"
    ]
  },
  {
    title: "Persiana Romana",
    description: "Design refinado e estrutura em camadas que proporcionam elegância e conforto visual.",
    image: romanImage,
    features: [
      "Estilo sofisticado e atemporal",
      "Variedade de tecidos e cores",
      "Acionamento suave e silencioso",
      "Ideal para salas e quartos"
    ]
  },
  {
    title: "Persiana Tela Solar (Rolô)",
    description: "Proteção solar eficaz sem perder a vista externa, perfeita para ambientes com grande incidência de luz.",
    image: solarImage,
    features: [
      "Filtragem de até 97% dos raios UV",
      "Redução de calor e brilho",
      "Preserva a vista externa",
      "Material resistente e de fácil limpeza"
    ]
  },
  {
    title: "Persiana Double Vision",
    description: "Elegância e sofisticação com controle dinâmico de luz através de faixas duplas translúcidas e opacas.",
    image: doubleVisionImage,
    features: [
      "Combinação de privacidade e luminosidade",
      "Design moderno e funcional",
      "Fácil acionamento manual ou motorizado",
      "Ideal para salas, escritórios e varandas"
    ]
  },
  {
    title: "Cortina Triple Shade",
    description: "Excelência em design e controle solar, com camadas sobrepostas que oferecem suavidade e desempenho.",
    image: tripleShadeImage,
    features: [
      "Controle ajustável de luz e visibilidade",
      "Estilo sofisticado e contemporâneo",
      "Material leve e resistente aos raios UV",
      "Indicado para quartos e ambientes de descanso"
    ]
  },
  {
    title: "Cortina Celular (Honeycomb)",
    description: "Tecnologia e conforto com estrutura celular que retém o ar, proporcionando isolamento térmico e acústico.",
    image: cellularImage,
    features: [
      "Reduz calor e ruído externo",
      "Alta eficiência energética",
      "Acionamento manual ou motorizado",
      "Design clean e elegante"
    ]
  },
  {
    title: "Motorização",
    description: "Praticidade e conforto com acionamento automatizado para cortinas e persianas.",
    image: motorizationImage,
    features: [
      "Controle via controle remoto, app ou assistente de voz",
      "Sistema silencioso e seguro",
      "Compatível com diversos modelos de cortinas e persianas",
      "Ideal para automação residencial"
    ]
  }
];

const OurProducts = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Nossos Produtos
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore nossa linha completa de cortinas e persianas sob medida
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {products.map((product, index) => (
                <Card 
                  key={index} 
                  className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 duration-300"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                      {product.title}
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4">
                      {product.description}
                    </p>
                    <ul className="space-y-2">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default OurProducts;
