import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "datetime" | "form" | "confirmation";

const timeSlots = [
  "08:00-09:00", "10:00-11:00", "12:00-13:00", "14:00-15:00", "16:00-17:00", "18:00-19:00"
];

const BookingDialog = ({ open, onOpenChange }: BookingDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("datetime");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
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
      address: "",
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui será integrado com RD Station e envio de email/WhatsApp
    console.log({
      date: selectedDate,
      time: selectedTime,
      ...formData
    });

    setStep("confirmation");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {step === "datetime" && (
          <>
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
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-3">
                  <Label className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Selecione o Horário Aproximado
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="h-12 text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <div className="bg-accent/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Visita agendada para:</p>
                  <p className="text-lg font-semibold text-foreground">
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}
                  </p>
                </div>
              )}
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
          </>
        )}

        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Seus Dados</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
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
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
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
                <Label htmlFor="address">Endereço</Label>
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
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Conte-nos sobre seu projeto..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep("datetime")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button type="submit">
                  Confirmar Agendamento
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "confirmation" && (
          <>
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
                  {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
