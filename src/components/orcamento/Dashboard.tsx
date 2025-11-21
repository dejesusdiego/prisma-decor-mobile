import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText } from 'lucide-react';

interface DashboardProps {
  onNovoOrcamento: () => void;
  onMeusOrcamentos: () => void;
}

export function Dashboard({ onNovoOrcamento, onMeusOrcamentos }: DashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
          Sistema de Orçamentos
        </h1>
        <p className="text-muted-foreground text-lg">
          Prisma Interiores
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onNovoOrcamento}>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <Button size="lg" className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              Novo Orçamento
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onMeusOrcamentos}>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-secondary-foreground" />
            </div>
            <Button variant="secondary" size="lg" className="w-full">
              <FileText className="mr-2 h-5 w-5" />
              Meus Orçamentos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
