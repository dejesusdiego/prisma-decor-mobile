import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Play, X } from 'lucide-react';

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  onSkip: () => void;
}

export function OnboardingDialog({
  open,
  onOpenChange,
  onStartTour,
  onSkip,
}: OnboardingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Bem-vindo ao Prisma ERP!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Estamos felizes em ter você aqui. Preparamos um tour rápido para você conhecer as principais funcionalidades do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold">1</span>
              </div>
              <span>Aprenda a criar orçamentos em poucos minutos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold">2</span>
              </div>
              <span>Gerencie seus clientes e acompanhe vendas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold">3</span>
              </div>
              <span>Controle financeiro e produção integrados</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onSkip} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Pular tour
          </Button>
          <Button onClick={onStartTour} className="w-full sm:w-auto">
            <Play className="h-4 w-4 mr-2" />
            Iniciar tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
