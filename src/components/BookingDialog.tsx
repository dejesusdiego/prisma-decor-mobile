import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";
import { z } from "zod";
interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationSlug?: string;
}
type Step = "datetime" | "form" | "confirmation";
const timeSlots = ["08:00 - 09:00", "10:00 - 11:00", "12:00 - 13:00", "14:00 - 15:00", "16:00 - 17:00", "18:00 - 19:00"];

// Input validation schema
const bookingFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string()
    .trim()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  phone: z.string()
    .trim()
    .min(1, "Telefone é obrigatório")
    .regex(/^[\d\s\-\(\)\+]+$/, "Telefone contém caracteres inválidos")
    .max(20, "Telefone deve ter no máximo 20 caracteres"),
  city: z.string()
    .trim()
    .min(1, "Cidade é obrigatória")
    .max(200, "Cidade deve ter no máximo 200 caracteres"),
  address: z.string()
    .trim()
    .min(1, "Endereço é obrigatório")
    .max(200, "Endereço deve ter no máximo 200 caracteres"),
  complement: z.string()
    .trim()
    .max(200, "Complemento deve ter no máximo 200 caracteres"),
  message: z.string()
    .trim()
    .max(1000, "Mensagem deve ter no máximo 1000 caracteres")
});
const BookingDialog = ({
  open,
  onOpenChange,
  organizationSlug = 'prisma'
}: BookingDialogProps) => {
  const {
    toast
  } = useToast();
  const [step, setStep] = useState<Step>("datetime");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    complement: "",
    message: ""
  });
  const resetAndClose = () => {
    setStep("datetime");
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      address: "",
      complement: "",
      message: ""
    });
    onOpenChange(false);
  };
  const handleDateTimeNext = () => {
    if (selectedDate && selectedTime) {
      setStep("form");
    } else {
      toast({
        title: "Atenção",
        description: "Por favor, selecione uma data e horário.",
        variant: "destructive"
      });
    }
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limit: 10 segundos entre envios
    const now = Date.now();
    if (now - lastSubmitTime < 10000) {
      toast({
        title: "Aguarde",
        description: "Por favor, aguarde alguns segundos antes de enviar novamente.",
        variant: "destructive"
      });
      return;
    }

    // Validate form data with zod
    try {
      bookingFormSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      const leadData = {
        nome: formData.name,
        email: formData.email,
        telefone: formData.phone,
        cidade: formData.city,
        endereco: formData.address,
        complemento: formData.complement,
        mensagem: formData.message,
        data_agendada: selectedDate?.toISOString().split('T')[0] || '',
        horario_agendado: selectedTime || '',
        organization_slug: organizationSlug,
      };

      console.log("Salvando solicitação de visita:", { ...leadData, email: '***' });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-visit-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(leadData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar dados');
      }

      console.log("Solicitação de visita salva com sucesso:", data.id);
      
      analytics.submitBooking({
        hasMessage: !!formData.message,
        city: formData.city,
      });
      
      setStep("confirmation");
    } catch (error) {
      console.error("Erro ao salvar solicitação:", error);
      toast({
        title: "Erro",
        description: "Erro ao agendar visita. Tente novamente ou entre em contato pelo WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {step === "datetime" && <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Escolha Data e Horário</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Selecione a Data
                </Label>
                <div className="flex justify-center">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={date => date < new Date() || date.getDay() === 0} locale={ptBR} className="rounded-md border" />
                </div>
              </div>

              {selectedDate && <div className="space-y-3">
                  <Label className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Selecione o Horário Aproximado
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map(time => <Button key={time} type="button" variant={selectedTime === time ? "default" : "outline"} onClick={() => setSelectedTime(time)} className="h-12 text-sm">
                        {time}
                      </Button>)}
                  </div>
                </div>}

              {selectedDate && selectedTime && <div className="bg-accent/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Agendar visita para:</p>
                  <p className="text-lg font-semibold text-foreground">
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR
              })} às {selectedTime}
                  </p>
                </div>}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleDateTimeNext}>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>}

        {step === "form" && <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Seus Dados</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1" placeholder="Seu nome completo" />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="mt-1" placeholder="seu@email.com" />
              </div>

              <div>
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required className="mt-1" placeholder="(00) 00000-0000" />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione sua cidade" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="Balneário Camboriú">Balneário Camboriú</SelectItem>
                    <SelectItem value="Camboriú">Camboriú</SelectItem>
                    <SelectItem value="Itajaí">Itajaí</SelectItem>
                    <SelectItem value="Itapema">Itapema</SelectItem>
                    <SelectItem value="Porto Belo">Porto Belo</SelectItem>
                    <SelectItem value="Bombinhas">Bombinhas</SelectItem>
                    <SelectItem value="Navegantes">Navegantes</SelectItem>
                    <SelectItem value="Penha">Penha</SelectItem>
                    <SelectItem value="Piçarras">Piçarras</SelectItem>
                    <SelectItem value="Ilhota">Ilhota</SelectItem>
                    <SelectItem value="Luiz Alves">Luiz Alves</SelectItem>
                    <SelectItem value="Brusque">Brusque</SelectItem>
                    <SelectItem value="Canelinha">Canelinha</SelectItem>
                    <SelectItem value="Tijucas">Tijucas</SelectItem>
                    <SelectItem value="São João Batista">São João Batista</SelectItem>
                    <SelectItem value="Nova Trento">Nova Trento</SelectItem>
                    <SelectItem value="Gaspar">Gaspar</SelectItem>
                    <SelectItem value="Blumenau">Blumenau</SelectItem>
                    <SelectItem value="Guabiruba">Guabiruba</SelectItem>
                    <SelectItem value="Botuverá">Botuverá</SelectItem>
                    <SelectItem value="Itapoá">Itapoá</SelectItem>
                    <SelectItem value="Barra Velha">Barra Velha</SelectItem>
                    <SelectItem value="Massaranduba">Massaranduba</SelectItem>
                    <SelectItem value="Schroeder">Schroeder</SelectItem>
                    <SelectItem value="Jaraguá do Sul">Jaraguá do Sul</SelectItem>
                    <SelectItem value="Corupá">Corupá</SelectItem>
                    <SelectItem value="São Bento do Sul">São Bento do Sul</SelectItem>
                    <SelectItem value="Campo Alegre">Campo Alegre</SelectItem>
                    <SelectItem value="Joinville">Joinville</SelectItem>
                    <SelectItem value="Araquari">Araquari</SelectItem>
                    <SelectItem value="São Francisco do Sul">São Francisco do Sul</SelectItem>
                    <SelectItem value="Garuva">Garuva</SelectItem>
                    <SelectItem value="Major Gercino">Major Gercino</SelectItem>
                    <SelectItem value="Angelina">Angelina</SelectItem>
                    <SelectItem value="Leoberto Leal">Leoberto Leal</SelectItem>
                    <SelectItem value="Vidal Ramos">Vidal Ramos</SelectItem>
                    <SelectItem value="Alfredo Wagner">Alfredo Wagner</SelectItem>
                    <SelectItem value="Benedito Novo">Benedito Novo</SelectItem>
                    <SelectItem value="Rodeio">Rodeio</SelectItem>
                    <SelectItem value="Ascurra">Ascurra</SelectItem>
                    <SelectItem value="Indaial">Indaial</SelectItem>
                    <SelectItem value="Timbó">Timbó</SelectItem>
                    <SelectItem value="Pomerode">Pomerode</SelectItem>
                    <SelectItem value="Rio dos Cedros">Rio dos Cedros</SelectItem>
                    <SelectItem value="Doutor Pedrinho">Doutor Pedrinho</SelectItem>
                    <SelectItem value="Lontras">Lontras</SelectItem>
                    <SelectItem value="Rio do Sul">Rio do Sul</SelectItem>
                    <SelectItem value="Agronômica">Agronômica</SelectItem>
                    <SelectItem value="Laurentino">Laurentino</SelectItem>
                    <SelectItem value="Ibirama">Ibirama</SelectItem>
                    <SelectItem value="Apiúna">Apiúna</SelectItem>
                    <SelectItem value="Presidente Getúlio">Presidente Getúlio</SelectItem>
                    <SelectItem value="Witmarsum">Witmarsum</SelectItem>
                    <SelectItem value="Mirim Doce">Mirim Doce</SelectItem>
                    <SelectItem value="Taió">Taió</SelectItem>
                    <SelectItem value="Nova Erechim">Nova Erechim</SelectItem>
                    <SelectItem value="Ituporanga">Ituporanga</SelectItem>
                    <SelectItem value="Petrolândia">Petrolândia</SelectItem>
                    <SelectItem value="Rancho Queimado">Rancho Queimado</SelectItem>
                    <SelectItem value="Águas Mornas">Águas Mornas</SelectItem>
                    <SelectItem value="Santo Amaro da Imperatriz">Santo Amaro da Imperatriz</SelectItem>
                    <SelectItem value="São Pedro de Alcântara">São Pedro de Alcântara</SelectItem>
                    <SelectItem value="Palhoça">Palhoça</SelectItem>
                    <SelectItem value="São José">São José</SelectItem>
                    <SelectItem value="Florianópolis">Florianópolis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} required className="mt-1" placeholder="Bairro, rua, número" />
              </div>

              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" name="complement" value={formData.complement} onChange={handleChange} className="mt-1" placeholder="Casa, apartamento, bloco" />
              </div>

              <div>
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleChange} className="mt-1" placeholder="Conte-nos sobre seu projeto..." rows={3} />
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep("datetime")} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </form>
          </>}

        {step === "confirmation" && <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">Visita Agendada!</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-6 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-20 w-20 text-accent" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  Obrigado, {formData.name}!
                </p>
                <p className="text-muted-foreground">
                  Sua visita foi agendada para:
                </p>
                <p className="text-xl font-bold text-foreground">
                  {selectedDate && format(selectedDate, "dd/MM/yyyy", {
                locale: ptBR
              })} às {selectedTime}
                </p>
              </div>

              <div className="bg-accent/20 p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Próximos Passos:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Você receberá uma confirmação por e-mail</li>
                  <li>✓ Enviaremos uma mensagem no WhatsApp</li>
                  <li>✓ Nossa equipe entrará em contato para confirmar</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={resetAndClose} size="lg">
                Fechar
              </Button>
            </div>
          </>}
      </DialogContent>
    </Dialog>;
};
export default BookingDialog;