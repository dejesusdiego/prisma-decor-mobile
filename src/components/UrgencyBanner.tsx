import { Clock, Calendar } from "lucide-react";

const UrgencyBanner = () => {
  // Get current week's remaining slots (simulated)
  const remainingSlots = 3;
  
  return (
    <section className="bg-accent py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-accent-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Apenas <strong>{remainingSlots} vagas</strong> disponíveis esta semana
            </span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-accent-foreground/30" />
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              Orçamento gratuito e sem compromisso
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UrgencyBanner;
