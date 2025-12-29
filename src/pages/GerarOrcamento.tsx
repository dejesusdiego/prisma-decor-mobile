import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { OrcamentoSidebar, type View } from '@/components/orcamento/OrcamentoSidebar';
import { DashboardContent } from '@/components/orcamento/DashboardContent';
import { DashboardUnificado } from '@/components/orcamento/DashboardUnificado';
import { NovoOrcamento } from '@/components/orcamento/NovoOrcamento';
import { ListaOrcamentos } from '@/components/orcamento/ListaOrcamentos';
import { VisualizarOrcamento } from '@/components/orcamento/VisualizarOrcamento';
import { GestaoMateriais } from '@/components/orcamento/GestaoMateriais';
import { AjustesSistema } from '@/components/orcamento/AjustesSistema';
import { SolicitacoesVisita } from '@/components/orcamento/SolicitacoesVisita';
import { DashboardFinanceiro } from '@/components/financeiro/DashboardFinanceiro';
import { FluxoCaixaPrevisto } from '@/components/financeiro/FluxoCaixaPrevisto';
import { ContasPagar } from '@/components/financeiro/ContasPagar';
import { ContasReceber } from '@/components/financeiro/ContasReceber';
import { Lancamentos } from '@/components/financeiro/Lancamentos';
import { RelatoriosBI } from '@/components/financeiro/RelatoriosBI';
import { RelatorioConciliacaoConsolidado } from '@/components/financeiro/RelatorioConciliacaoConsolidado';
import { CategoriasFormas } from '@/components/financeiro/CategoriasFormas';
import { RelatorioRentabilidade } from '@/components/financeiro/RelatorioRentabilidade';
import { Comissoes } from '@/components/financeiro/Comissoes';
import { RelatorioVendedores } from '@/components/financeiro/RelatorioVendedores';
import DashboardKPIs from '@/components/financeiro/DashboardKPIs';
import { FinanceiroProvider } from '@/contexts/FinanceiroContext';
import { PainelCRM } from '@/components/crm/PainelCRM';
import { ListaContatos } from '@/components/crm/ListaContatos';
import { DetalheContato } from '@/components/crm/DetalheContato';
import { PipelineOrcamentos } from '@/components/crm/PipelineOrcamentos';
import { RelatoriosCRM } from '@/components/crm/RelatoriosCRM';
import { ListaAtividades } from '@/components/crm/ListaAtividades';
import { DashboardProducao } from '@/components/producao/DashboardProducao';
import { KanbanProducao } from '@/components/producao/KanbanProducao';
import { ListaPedidos } from '@/components/producao/ListaPedidos';
import { FichaPedido } from '@/components/producao/FichaPedido';
import { AgendaInstalacoes } from '@/components/producao/AgendaInstalacoes';
import { RelatorioProducao } from '@/components/producao/RelatorioProducao';
import { NotificationCenter } from '@/components/NotificationCenter';
import { CalendarioGeral } from '@/components/calendario/CalendarioGeral';

interface ClienteDataFromVisita {
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
}

// Views restritas apenas para admins
const ADMIN_ONLY_VIEWS: View[] = [
  'dashboardUnificado',
  'gestaoMateriais', 
  'ajustesSistema', 
  'solicitacoesVisita',
  'calendarioGeral',
  'finDashboard',
  'finFluxoPrevisto',
  'finRentabilidade',
  'finComissoes',
  'finVendedores',
  'finKPIs',
  'finContasPagar',
  'finContasReceber',
  'finLancamentos',
  'finRelatorios',
  'finConsolidado',
  'categoriasFormas',
  'crmRelatorios',
  'prodDashboard',
  'prodKanban',
  'prodLista',
  'prodFicha',
  'prodAgenda',
  'prodRelatorio'
];

export default function GerarOrcamento() {
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading: isLoadingRole } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>('dashboard');
  const [orcamentoEditandoId, setOrcamentoEditandoId] = useState<string | null>(null);
  const [clienteDataFromVisita, setClienteDataFromVisita] = useState<ClienteDataFromVisita | null>(null);
  const [contatoSelecionadoId, setContatoSelecionadoId] = useState<string | null>(null);
  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState<string | null>(null);

  // Verificar parâmetros URL para pré-popular dados do cliente (vindo do CRM)
  useEffect(() => {
    const clienteNome = searchParams.get('cliente_nome');
    const clienteTelefone = searchParams.get('cliente_telefone');
    const contatoId = searchParams.get('contato_id');
    
    if (clienteNome || clienteTelefone) {
      setClienteDataFromVisita({
        nome: clienteNome || '',
        telefone: clienteTelefone || '',
        endereco: searchParams.get('endereco') || '',
        cidade: searchParams.get('cidade') || ''
      });
      setContatoSelecionadoId(contatoId);
      setView('novoOrcamento');
      
      // Limpar parâmetros URL após processar
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Redirecionar para dashboard se usuário não-admin tentar acessar view restrita
  useEffect(() => {
    if (!isLoadingRole && !isAdmin && ADMIN_ONLY_VIEWS.includes(view)) {
      setView('dashboard');
    }
  }, [isAdmin, isLoadingRole, view]);

  const handleNovoOrcamento = (clienteData?: ClienteDataFromVisita) => {
    setOrcamentoEditandoId(null);
    setClienteDataFromVisita(clienteData || null);
    setView('novoOrcamento');
  };

  const handleEditarOrcamento = (orcamentoId: string) => {
    setOrcamentoEditandoId(orcamentoId);
    setClienteDataFromVisita(null);
    setView('novoOrcamento');
  };

  const handleVisualizarOrcamento = (orcamentoId: string) => {
    setOrcamentoEditandoId(orcamentoId);
    setView('visualizarOrcamento');
  };

  const handleVoltarDashboard = () => {
    setOrcamentoEditandoId(null);
    setClienteDataFromVisita(null);
    setContatoSelecionadoId(null);
    setView('dashboard');
  };

  const handleVerContato = (contatoId: string) => {
    setContatoSelecionadoId(contatoId);
    setView('crmDetalheContato');
  };

  const handleVoltarContatos = () => {
    setContatoSelecionadoId(null);
    setView('crmContatos');
  };

  const handleNavigate = (newView: View) => {
    // Bloquear navegação para views restritas se não for admin
    if (!isAdmin && ADMIN_ONLY_VIEWS.includes(newView)) {
      return;
    }
    
    if (newView === 'novoOrcamento') {
      handleNovoOrcamento();
    } else {
      setOrcamentoEditandoId(null);
      setClienteDataFromVisita(null);
      setView(newView);
    }
  };

  const handleVerPedido = (pedidoId: string) => {
    setPedidoSelecionadoId(pedidoId);
    setView('prodFicha');
  };

  const handleVoltarProducao = () => {
    setPedidoSelecionadoId(null);
    setView('prodLista');
  };

  const getPageTitle = () => {
    switch (view) {
      case 'dashboardUnificado': return '';
      case 'novoOrcamento': return orcamentoEditandoId ? 'Editar Orçamento' : 'Novo Orçamento';
      case 'listaOrcamentos': return 'Meus Orçamentos';
      case 'visualizarOrcamento': return 'Visualizar Orçamento';
      case 'gestaoMateriais': return 'Gestão de Materiais';
      case 'ajustesSistema': return 'Ajustes do Sistema';
      case 'solicitacoesVisita': return 'Solicitações de Visita';
      case 'calendarioGeral': return 'Calendário Geral';
      case 'finContasPagar': return 'Contas a Pagar';
      case 'finContasReceber': return 'Contas a Receber';
      case 'finLancamentos': return 'Lançamentos';
      case 'finRelatorios': return 'Análise Financeira';
      case 'finVendedores': return 'Desempenho Vendedores';
      case 'finKPIs': return 'KPIs do Negócio';
      case 'prodRelatorio': return 'Análise Produção';
      case 'finFluxoPrevisto': return 'Fluxo de Caixa Previsto';
      case 'finRentabilidade': return 'Rentabilidade por Orçamento';
      case 'finComissoes': return 'Comissões';
      case 'finConsolidado': return 'Relatório Consolidado';
      case 'categoriasFormas': return 'Categorias e Formas de Pagamento';
      case 'crmPainel': return 'Painel CRM';
      case 'crmContatos': return 'Contatos';
      case 'crmDetalheContato': return '';
      case 'crmPipeline': return 'Pipeline de Vendas';
      case 'crmRelatorios': return 'Relatórios CRM';
      case 'crmAtividades': return 'Atividades';
      case 'prodDashboard': return '';
      case 'prodKanban': return 'Kanban de Produção';
      case 'prodLista': return 'Pedidos em Produção';
      case 'prodFicha': return '';
      case 'prodAgenda': return 'Agenda de Instalações';
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
            {view !== 'dashboard' && view !== 'finDashboard' && view !== 'dashboardUnificado' && (
              <h2 className="text-lg font-semibold text-foreground">{getPageTitle()}</h2>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter onNavigate={(newView) => handleNavigate(newView as View)} />
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
            {view === 'dashboardUnificado' && (
              <DashboardUnificado onNavigate={handleNavigate} />
            )}

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
                clienteDataInicial={clienteDataFromVisita}
              />
            )}

            {view === 'listaOrcamentos' && (
              <ListaOrcamentos
                onVoltar={handleVoltarDashboard}
                onEditar={handleEditarOrcamento}
                onVisualizar={handleVisualizarOrcamento}
                onVerFinanceiro={isAdmin ? () => setView('finRentabilidade') : undefined}
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

            {view === 'solicitacoesVisita' && (
              <SolicitacoesVisita 
                onNavigate={handleNavigate}
                onCreateOrcamento={(clienteData) => handleNovoOrcamento(clienteData)}
              />
            )}

            {view === 'calendarioGeral' && <CalendarioGeral />}

            {/* Seção Financeiro - envolta com Provider para estado global do período */}
            {view.startsWith('fin') && (
              <FinanceiroProvider>
                {view === 'finDashboard' && <DashboardFinanceiro onNavigate={handleNavigate} />}
                {view === 'finFluxoPrevisto' && <FluxoCaixaPrevisto onNavigate={handleNavigate} />}
                {view === 'finRentabilidade' && (
                  <RelatorioRentabilidade onVisualizarOrcamento={handleVisualizarOrcamento} onNavigate={handleNavigate} />
                )}
                {view === 'finComissoes' && (
                  <Comissoes onVisualizarOrcamento={handleVisualizarOrcamento} onNavigate={handleNavigate} />
                )}
                {view === 'finVendedores' && (
                  <RelatorioVendedores onVisualizarOrcamento={handleVisualizarOrcamento} onNavigate={handleNavigate} />
                )}
                {view === 'finContasPagar' && (
                  <ContasPagar onVisualizarOrcamento={handleVisualizarOrcamento} onNavigate={handleNavigate} />
                )}
                {view === 'finContasReceber' && <ContasReceber onNavigate={handleNavigate} />}
                {view === 'finLancamentos' && <Lancamentos onNavigate={handleNavigate} />}
                {view === 'finRelatorios' && <RelatoriosBI onNavigate={handleNavigate} />}
                {view === 'finKPIs' && <DashboardKPIs />}
                {view === 'finConsolidado' && (
                  <RelatorioConciliacaoConsolidado onNavigateOrcamento={handleVisualizarOrcamento} />
                )}
              </FinanceiroProvider>
            )}

            {/* Administração */}
            {view === 'categoriasFormas' && <CategoriasFormas />}

            {/* CRM */}
            {view === 'crmPainel' && (
              <PainelCRM 
                onVerContato={handleVerContato}
                onVerOrcamento={handleVisualizarOrcamento}
              />
            )}
            {view === 'crmContatos' && (
              <ListaContatos onVerContato={handleVerContato} />
            )}
            {view === 'crmDetalheContato' && contatoSelecionadoId && (
              <DetalheContato 
                contatoId={contatoSelecionadoId} 
                onVoltar={handleVoltarContatos}
                onVisualizarOrcamento={handleVisualizarOrcamento}
              />
            )}
            {view === 'crmPipeline' && (
              <PipelineOrcamentos 
                onVerOrcamento={handleVisualizarOrcamento} 
                onVerContato={handleVerContato}
              />
            )}
            {view === 'crmRelatorios' && <RelatoriosCRM />}
            {view === 'crmAtividades' && <ListaAtividades />}

            {/* Produção */}
            {view === 'prodDashboard' && (
              <DashboardProducao onNavigate={handleNavigate} />
            )}
            {view === 'prodKanban' && <KanbanProducao />}
            {view === 'prodLista' && (
              <ListaPedidos onVerPedido={handleVerPedido} />
            )}
            {view === 'prodFicha' && pedidoSelecionadoId && (
              <FichaPedido 
                pedidoId={pedidoSelecionadoId} 
                onVoltar={handleVoltarProducao}
                onAgendarInstalacao={() => setView('prodAgenda')}
              />
            )}
            {view === 'prodAgenda' && <AgendaInstalacoes />}
            {view === 'prodRelatorio' && <RelatorioProducao />}
          </div>
        </main>
      </div>
    </div>
  );
}
