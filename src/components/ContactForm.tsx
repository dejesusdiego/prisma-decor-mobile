import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContactForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui será integrado com RD Station no futuro
    toast({
      title: "Visita agendada!",
      description: "Entraremos em contato em breve para confirmar o horário.",
    });
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      message: ""
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contato" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Agende Sua Visita Gratuita
            </h2>
            <p className="text-lg text-muted-foreground">
              Preencha o formulário e nossa equipe entrará em contato para agendar sua visita técnica
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-foreground">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-foreground">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-foreground">Telefone/WhatsApp</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-foreground">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Cidade, bairro"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-foreground">Mensagem (opcional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Conte-nos sobre seu projeto..."
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent/90 text-primary font-semibold shadow-gold"
                size="lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Solicitar Visita Gratuita
              </Button>
            </form>

            {/* Info */}
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Como Funciona?
                </h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Agende a Visita</p>
                      <p className="text-sm text-muted-foreground">Preencha o formulário com seus dados</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Consultoria Gratuita</p>
                      <p className="text-sm text-muted-foreground">Nossa equipe visita sua casa para tirar medidas</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Orçamento Personalizado</p>
                      <p className="text-sm text-muted-foreground">Receba uma proposta sob medida</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Instalação</p>
                      <p className="text-sm text-muted-foreground">Agendamos a instalação na sua conveniência</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-md space-y-4">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Outras Formas de Contato
                </h3>
                <div className="space-y-3">
                  <a href="tel:+" className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                    <Phone className="h-5 w-5" />
                    <span>(00) 0000-0000</span>
                  </a>
                  <a href="mailto:contato@prismainteriores.com.br" className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                    <Mail className="h-5 w-5" />
                    <span>contato@prismainteriores.com.br</span>
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    <span>Atendemos toda a região</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
