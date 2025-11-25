import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Moon, Sun, Calendar, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { popularDadosIniciais } from '@/lib/popularDadosIniciais';

interface DashboardProps {
  onNovoOrcamento: () => void;
  onMeusOrcamentos: () => void;
  onVisualizarOrcamento: (id: string) => void;
}

interface RecentOrcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  total_geral: number;
  created_at: string;
  status: string;
}

export function Dashboard({ onNovoOrcamento, onMeusOrcamentos, onVisualizarOrcamento }: DashboardProps) {
  const [isDark, setIsDark] = useState(false);
  const [recentOrcamentos, setRecentOrcamentos] = useState<RecentOrcamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    loadRecentOrcamentos();
    
    // Popular dados iniciais se necessário
    popularDadosIniciais().then((result) => {
      if (result.success && result.message !== 'Dados já existem') {
        console.log('✅ Dados iniciais populados:', result);
      }
    });
  }, []);

  const loadRecentOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_geral, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentOrcamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
      case 'pendente':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400';
      case 'rejeitado':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-2 relative w-full">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="absolute right-4 top-0"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
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
              <div className="w-16 h-16 rounded-full bg-lovable-blue/10 flex items-center justify-center">
                <Plus className="w-8 h-8 text-lovable-blue" />
              </div>
              <Button size="lg" className="w-full bg-lovable-blue hover:bg-lovable-blue/90 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Novo Orçamento
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onMeusOrcamentos}>
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-foreground" />
              </div>
              <Button variant="default" size="lg" className="w-full">
                <FileText className="mr-2 h-5 w-5" />
                Meus Orçamentos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Últimos Orçamentos */}
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Últimos Orçamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : recentOrcamentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum orçamento criado ainda
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrcamentos.map((orc) => (
                  <Card
                    key={orc.id}
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => onVisualizarOrcamento(orc.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">
                              {orc.codigo}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(orc.status)}`}>
                              {orc.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {orc.cliente_nome}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(orc.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold text-lovable-blue">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(orc.total_geral || 0)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
