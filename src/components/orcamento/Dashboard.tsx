import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardProps {
  onNovoOrcamento: () => void;
  onMeusOrcamentos: () => void;
  onImportarDados: () => void;
}

export function Dashboard({ onNovoOrcamento, onMeusOrcamentos, onImportarDados }: DashboardProps) {
  const [materiaisCount, setMateriaisCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarDados();
  }, []);

  const verificarDados = async () => {
    try {
      const { count } = await supabase
        .from('materiais')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      
      setMateriaisCount(count || 0);
    } catch (error) {
      console.error('Erro ao verificar dados:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {!loading && materiaisCount < 100 && (
        <Alert className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Base de dados não importada</AlertTitle>
          <AlertDescription>
            Você tem apenas {materiaisCount} materiais cadastrados. Para criar orçamentos completos, 
            importe a base de dados da Prisma com ~2.700 materiais e serviços.
            <Button 
              variant="link" 
              className="px-2 h-auto" 
              onClick={onImportarDados}
            >
              Importar agora
            </Button>
          </AlertDescription>
        </Alert>
      )}

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

      <div className="flex justify-center mt-8">
        <Button variant="outline" onClick={onImportarDados}>
          <Plus className="mr-2 h-4 w-4" />
          Importar Base de Dados
        </Button>
      </div>
    </div>
  );
}
