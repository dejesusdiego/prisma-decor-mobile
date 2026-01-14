import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Users,
  Merge,
  FileText,
  Clock,
  Flame,
  Snowflake,
  Thermometer,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Wrench,
  Calendar,
  DollarSign,
  CheckCircle2,
  Download
} from 'lucide-react';
import { gerarCSV, downloadCSV } from '@/lib/parserCSVMateriais';
import { format } from 'date-fns';
import { useContatosComMetricas, ContatoComMetricas } from '@/hooks/useContatoComMetricas';
import { Contato } from '@/hooks/useCRMData';
import { useDeleteContato } from '@/hooks/useCRMData';
import { DialogContato } from './DialogContato';
import { MergeContatos } from './MergeContatos';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { TipBanner } from '@/components/ui/TipBanner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const TIPO_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  lead: { label: 'Lead', variant: 'secondary' },
  cliente: { label: 'Cliente', variant: 'default' },
  inativo: { label: 'Inativo', variant: 'outline' }
};

const TEMPERATURA_CONFIG = {
  quente: { 
    icon: Flame, 
    label: 'Quente', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Cliente engajado recentemente'
  },
  morno: { 
    icon: Thermometer, 
    label: 'Morno', 
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    description: 'Atividade moderada'
  },
  frio: { 
    icon: Snowflake, 
    label: 'Frio', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Sem atividade recente'
  }
};

interface ListaContatosProps {
  onVerContato?: (contatoId: string) => void;
}

export function ListaContatosV2({ onVerContato }: ListaContatosProps) {
  const navigate = useNavigate();
  const { data: contatos, isLoading } = useContatosComMetricas();
  const deleteContato = useDeleteContato();
  
  const [activeTab, setActiveTab] = useState('lista');
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [temperaturaFilter, setTemperaturaFilter] = useState<string>('todos');
  const [filtroEspecial, setFiltroEspecial] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<ContatoComMetricas | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contatoParaExcluir, setContatoParaExcluir] = useState<ContatoComMetricas | null>(null);

  const contatosFiltrados = useMemo(() => {
    if (!contatos) return [];
    
    return contatos.filter(contato => {
      const matchSearch = 
        contato.nome.toLowerCase().includes(search.toLowerCase()) ||
        contato.telefone?.includes(search) ||
        contato.email?.toLowerCase().includes(search.toLowerCase()) ||
        contato.cidade?.toLowerCase().includes(search.toLowerCase());
      
      const matchTipo = tipoFilter === 'todos' || contato.tipo === tipoFilter;
      const matchTemperatura = temperaturaFilter === 'todos' || contato.temperatura === temperaturaFilter;
      
      // Filtros especiais
      let matchEspecial = true;
      if (filtroEspecial === 'com_pendentes') {
        matchEspecial = contato.orcamentosPendentes > 0;
      } else if (filtroEspecial === 'sem_contato_7d') {
        matchEspecial = contato.diasSemContato >= 7;
      } else if (filtroEspecial === 'com_atividade') {
        matchEspecial = contato.atividadesPendentes > 0;
      } else if (filtroEspecial === 'vip') {
        matchEspecial = (contato.valor_total_gasto || 0) >= 10000;
      }
      
      return matchSearch && matchTipo && matchTemperatura && matchEspecial;
    });
  }, [contatos, search, tipoFilter, temperaturaFilter, filtroEspecial]);

  const handleNovoContato = () => {
    setContatoSelecionado(null);
    setDialogOpen(true);
  };

  const handleEditarContato = (contato: ContatoComMetricas) => {
    setContatoSelecionado(contato);
    setDialogOpen(true);
  };

  const handleNovoOrcamento = (contato: ContatoComMetricas) => {
    navigate('/gerarorcamento', { 
      state: { 
        clienteInicial: {
          nome: contato.nome,
          telefone: contato.telefone || '',
          endereco: contato.endereco || '',
          cidade: contato.cidade || 'Balneário Camboriú'
        }
      }
    });
  };

  const handleWhatsApp = (telefone: string | null) => {
    if (!telefone) return;
    const numero = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${numero}`, '_blank');
  };

  const handleConfirmDelete = async () => {
    if (contatoParaExcluir) {
      await deleteContato.mutateAsync(contatoParaExcluir.id);
      setDeleteDialogOpen(false);
      setContatoParaExcluir(null);
    }
  };

  const limparFiltros = () => {
    setSearch('');
    setTipoFilter('todos');
    setTemperaturaFilter('todos');
    setFiltroEspecial('todos');
  };

  const temFiltrosAtivos = search || tipoFilter !== 'todos' || temperaturaFilter !== 'todos' || filtroEspecial !== 'todos';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular métricas para exibição rápida
  const metricas = {
    comPendentes: contatos?.filter(c => c.orcamentosPendentes > 0).length || 0,
    semContato7d: contatos?.filter(c => c.diasSemContato >= 7).length || 0,
    comAtividade: contatos?.filter(c => c.atividadesPendentes > 0).length || 0,
    quentes: contatos?.filter(c => c.temperatura === 'quente').length || 0
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lista" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contatos
            </TabsTrigger>
            <TabsTrigger value="merge" className="flex items-center gap-2">
              <Merge className="h-4 w-4" />
              Merge
            </TabsTrigger>
          </TabsList>
          {activeTab === 'lista' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const colunas = [
                    { campo: 'nome', titulo: 'Nome' },
                    { campo: 'telefone', titulo: 'Telefone' },
                    { campo: 'email', titulo: 'Email' },
                    { campo: 'cidade', titulo: 'Cidade' },
                    { campo: 'endereco', titulo: 'Endereço' },
                    { campo: 'tipo', titulo: 'Tipo' },
                    { campo: 'origem', titulo: 'Origem' },
                    { campo: 'tags', titulo: 'Tags' },
                    { campo: 'valor_total', titulo: 'Valor Total' },
                    { campo: 'temperatura', titulo: 'Temperatura' },
                  ];
                  const dados = contatosFiltrados.map(c => ({
                    nome: c.nome,
                    telefone: c.telefone || '',
                    email: c.email || '',
                    cidade: c.cidade || '',
                    endereco: c.endereco || '',
                    tipo: c.tipo,
                    origem: c.origem || '',
                    tags: (c.tags || []).join(', '),
                    valor_total: (c.valor_total_gasto || 0).toFixed(2).replace('.', ','),
                    temperatura: c.temperatura || '',
                  }));
                  const csv = gerarCSV(dados, colunas);
                  downloadCSV(csv, `contatos-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={handleNovoContato} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contato
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="lista" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Lista de Contatos
                <Badge variant="secondary" className="ml-2">
                  {contatosFiltrados.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtros rápidos - cards clicáveis */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <button
                  onClick={() => setFiltroEspecial(filtroEspecial === 'com_pendentes' ? 'todos' : 'com_pendentes')}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    filtroEspecial === 'com_pendentes' 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{metricas.comPendentes}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Com orçamentos pendentes</p>
                </button>
                
                <button
                  onClick={() => setFiltroEspecial(filtroEspecial === 'sem_contato_7d' ? 'todos' : 'sem_contato_7d')}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    filtroEspecial === 'sem_contato_7d' 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">{metricas.semContato7d}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sem contato há 7+ dias</p>
                </button>
                
                <button
                  onClick={() => setFiltroEspecial(filtroEspecial === 'com_atividade' ? 'todos' : 'com_atividade')}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    filtroEspecial === 'com_atividade' 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{metricas.comAtividade}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Com follow-up pendente</p>
                </button>
                
                <button
                  onClick={() => setTemperaturaFilter(temperaturaFilter === 'quente' ? 'todos' : 'quente')}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    temperaturaFilter === 'quente' 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">{metricas.quentes}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Leads quentes</p>
                </button>
              </div>

              {/* Filtros de busca */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="cliente">Clientes</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={temperaturaFilter} onValueChange={setTemperaturaFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Temperatura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Temp.</SelectItem>
                    <SelectItem value="quente">🔥 Quente</SelectItem>
                    <SelectItem value="morno">🌡️ Morno</SelectItem>
                    <SelectItem value="frio">❄️ Frio</SelectItem>
                  </SelectContent>
                </Select>
                {temFiltrosAtivos && (
                  <Button variant="ghost" size="sm" onClick={limparFiltros}>
                    Limpar filtros
                  </Button>
                )}
              </div>

              {/* Tabela */}
              {contatosFiltrados.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    variant="contatos"
                    title={temFiltrosAtivos ? 'Nenhum contato encontrado' : 'Nenhum contato'}
                    description={
                      temFiltrosAtivos
                        ? 'Tente ajustar os filtros de busca, tipo ou temperatura para ver mais resultados.'
                        : 'Adicione contatos através do CRM para começar a gerenciar seus clientes e oportunidades.'
                    }
                    action={
                      temFiltrosAtivos
                        ? {
                            label: 'Limpar Filtros',
                            onClick: limparFiltros,
                            variant: 'outline'
                          }
                        : {
                            label: 'Adicionar Contato',
                            onClick: () => setDialogOpen(true),
                            variant: 'default'
                          }
                    }
                  />
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <HelpTooltip content="Temperatura indica engajamento: Quente (ativo), Morno (moderado), Frio (inativo)">
                            🌡️
                          </HelpTooltip>
                        </TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">
                          <HelpTooltip content="Orçamentos pendentes / Dias sem contato">
                            Indicadores
                          </HelpTooltip>
                        </TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contatosFiltrados.map((contato) => {
                        const tipoConfig = TIPO_CONFIG[contato.tipo] || TIPO_CONFIG.lead;
                        const tempConfig = TEMPERATURA_CONFIG[contato.temperatura];
                        const TempIcon = tempConfig.icon;
                        
                        return (
                          <TableRow 
                            key={contato.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onVerContato?.(contato.id)}
                          >
                            <TableCell className="pr-0">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className={cn(
                                      "h-8 w-8 rounded-full flex items-center justify-center",
                                      tempConfig.bgColor
                                    )}>
                                      <TempIcon className={cn("h-4 w-4", tempConfig.color)} />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{tempConfig.label}: {tempConfig.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{contato.nome}</span>
                                {contato.tags && contato.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {contato.tags.slice(0, 2).map((tag, i) => (
                                      <Badge 
                                        key={i} 
                                        variant="outline" 
                                        className="text-xs px-1.5 py-0"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-0.5 text-sm">
                                {contato.telefone && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleWhatsApp(contato.telefone);
                                    }}
                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    {contato.telefone}
                                  </button>
                                )}
                                {contato.email && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <TruncatedText text={contato.email} maxWidth="150px" className="text-sm" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {contato.cidade && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {contato.cidade}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tipoConfig.variant}>
                                {tipoConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {/* Produção */}
                                {contato.pedidosEmProducao > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                                          <Wrench className="h-3 w-3 mr-1" />
                                          {contato.pedidosEmProducao}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {contato.pedidosEmProducao} pedido(s) em produção
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {contato.pedidosProntos > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          {contato.pedidosProntos}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {contato.pedidosProntos} pedido(s) pronto(s)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {contato.instalacoesAgendadas > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          {contato.instalacoesAgendadas}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {contato.instalacoesAgendadas} instalação(ões) agendada(s)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {/* Orçamentos */}
                                {contato.orcamentosPendentes > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                          <FileText className="h-3 w-3 mr-1" />
                                          {contato.orcamentosPendentes}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {contato.orcamentosPendentes} orçamento(s) pendente(s)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {/* Financeiro */}
                                {contato.valorVencido > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                                          <DollarSign className="h-3 w-3" />!
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        R$ {contato.valorVencido.toFixed(0)} vencido
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {/* Atividades */}
                                {contato.atividadesPendentes > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {contato.atividadesPendentes}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {contato.atividadesPendentes} atividade(s) pendente(s)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {/* Dias sem contato */}
                                {contato.diasSemContato >= 7 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">
                                          {contato.diasSemContato}d
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Sem contato há {contato.diasSemContato} dias
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(contato.valor_total_gasto)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onVerContato?.(contato.id);
                                  }}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleNovoOrcamento(contato);
                                  }}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Novo orçamento
                                  </DropdownMenuItem>
                                  {contato.telefone && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleWhatsApp(contato.telefone);
                                    }}>
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      WhatsApp
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarContato(contato);
                                  }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setContatoParaExcluir(contato);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merge" className="mt-0">
          <MergeContatos />
        </TabsContent>
      </Tabs>

      {/* Dialog de criar/editar */}
      <DialogContato 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        contato={contatoSelecionado}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato "{contatoParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
