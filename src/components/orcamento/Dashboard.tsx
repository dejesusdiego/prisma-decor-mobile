import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DashboardProps {
  onNovoOrcamento: () => void;
  onMeusOrcamentos: () => void;
}

export function Dashboard({ onNovoOrcamento, onMeusOrcamentos }: DashboardProps) {
  const [populating, setPopulating] = useState(false);
  const [materialsCount, setMaterialsCount] = useState<number | null>(null);

  const checkMaterialsCount = async () => {
    const { count } = await supabase
      .from('materiais')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);
    setMaterialsCount(count || 0);
  };

  const handlePopulateDatabase = async () => {
    setPopulating(true);
    try {
      toast({
        title: 'Populando base de dados...',
        description: 'Isso pode levar alguns minutos. Aguarde...',
      });

      const response = await fetch('/functions/v1/populate-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Base de dados populada!',
          description: `${result.materialsCount} materiais, ${result.confeccaoCount} serviços de confecção, ${result.instalacaoCount} serviços de instalação`,
          duration: 5000,
        });
        await checkMaterialsCount();
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao popular:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao popular base de dados',
        variant: 'destructive',
      });
    } finally {
      setPopulating(false);
    }
  };

  // Check materials count on mount
  useEffect(() => {
    checkMaterialsCount();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
          Sistema de Orçamentos
        </h1>
        <p className="text-muted-foreground text-lg">
          Prisma Interiores
        </p>
        {materialsCount !== null && materialsCount < 100 && (
          <Button 
            onClick={handlePopulateDatabase} 
            disabled={populating}
            variant="outline"
            className="mt-4"
          >
            <Database className="mr-2 h-4 w-4" />
            {populating ? 'Populando...' : 'Popular Base de Dados (2700+ itens)'}
          </Button>
        )}
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
