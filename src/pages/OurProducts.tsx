import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import blackoutImage from "@/assets/blackout-curtains.jpg";
import linenImage from "@/assets/linen-curtains.jpg";
import blindsImage from "@/assets/venetian-blinds.jpg";

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
    description: "Elegância natural com tecidos nobres que trazem sofisticação e leveza aos seus ambientes.",
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
