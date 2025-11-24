import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/orcamento/Dashboard';
import { NovoOrcamento } from '@/components/orcamento/NovoOrcamento';
import { ListaOrcamentos } from '@/components/orcamento/ListaOrcamentos';
import { VisualizarOrcamento } from '@/components/orcamento/VisualizarOrcamento';

type View = 'dashboard' | 'novoOrcamento' | 'listaOrcamentos' | 'visualizarOrcamento';

export default function GerarOrcamento() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('dashboard');
  const [orcamentoEditandoId, setOrcamentoEditandoId] = useState<string | null>(null);

  const handleNovoOrcamento = () => {
    setOrcamentoEditandoId(null);
    setView('novoOrcamento');
  };

  const handleEditarOrcamento = (orcamentoId: string) => {
    setOrcamentoEditandoId(orcamentoId);
    setView('novoOrcamento');
  };

  const handleVisualizarOrcamento = (orcamentoId: string) => {
    setOrcamentoEditandoId(orcamentoId);
    setView('visualizarOrcamento');
  };

  const handleVoltarDashboard = () => {
    setOrcamentoEditandoId(null);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Sistema de Orçamentos</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/gerenciarusuarios')}
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && (
          <Dashboard
            onNovoOrcamento={handleNovoOrcamento}
            onMeusOrcamentos={() => setView('listaOrcamentos')}
            onVisualizarOrcamento={handleVisualizarOrcamento}
          />
        )}

        {view === 'novoOrcamento' && (
          <NovoOrcamento
            onVoltar={handleVoltarDashboard}
            orcamentoId={orcamentoEditandoId}
          />
        )}

        {view === 'listaOrcamentos' && (
          <ListaOrcamentos
            onVoltar={handleVoltarDashboard}
            onEditar={handleEditarOrcamento}
            onVisualizar={handleVisualizarOrcamento}
          />
        )}

        {view === 'visualizarOrcamento' && orcamentoEditandoId && (
          <VisualizarOrcamento
            orcamentoId={orcamentoEditandoId}
            onVoltar={handleVoltarDashboard}
          />
        )}
      </main>
    </div>
  );
}
