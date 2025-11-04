import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
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

const Products = () => {
  return (
    <section id="cortinas" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Nossas Soluções
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Produtos sob medida que combinam funcionalidade e design sofisticado
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

        <div className="text-center mt-12">
          <Button asChild size="lg" variant="outline" className="bg-background border-2 border-accent text-foreground hover:bg-accent/10 font-semibold rounded-full uppercase">
            <Link to="/nossos-produtos">Ver mais</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Products;
