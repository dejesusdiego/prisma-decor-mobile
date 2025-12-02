import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { OrcamentoSidebar } from '@/components/orcamento/OrcamentoSidebar';
import { DashboardContent } from '@/components/orcamento/DashboardContent';
import { NovoOrcamento } from '@/components/orcamento/NovoOrcamento';
import { ListaOrcamentos } from '@/components/orcamento/ListaOrcamentos';
import { VisualizarOrcamento } from '@/components/orcamento/VisualizarOrcamento';
import { GestaoMateriais } from '@/components/orcamento/GestaoMateriais';
import { AjustesSistema } from '@/components/orcamento/AjustesSistema';

type View = 'dashboard' | 'novoOrcamento' | 'listaOrcamentos' | 'visualizarOrcamento' | 'gestaoMateriais' | 'ajustesSistema';

export default function GerarOrcamento() {
  const { user, signOut } = useAuth();
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

  const handleNavigate = (newView: View) => {
    if (newView === 'novoOrcamento') {
      handleNovoOrcamento();
    } else {
      setOrcamentoEditandoId(null);
      setView(newView);
    }
  };

  const getPageTitle = () => {
    switch (view) {
      case 'novoOrcamento': return orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento';
      case 'listaOrcamentos': return 'Meus Orçamentos';
      case 'visualizarOrcamento': return 'Visualizar Orçamento';
      case 'gestaoMateriais': return 'Gestão de Materiais';
      case 'ajustesSistema': return 'Ajustes do Sistema';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <OrcamentoSidebar currentView={view} onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            {view !== 'dashboard' && (
              <h2 className="text-lg font-semibold text-foreground">{getPageTitle()}</h2>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {view === 'dashboard' && (
              <DashboardContent
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

            {view === 'gestaoMateriais' && (
              <GestaoMateriais onVoltar={handleVoltarDashboard} />
            )}

            {view === 'ajustesSistema' && (
              <AjustesSistema onVoltar={handleVoltarDashboard} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
