import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TruncatedText } from '@/components/ui/TruncatedText';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ExternalLink,
  BarChart3,
  Filter,
  FileText,
  Send,
  Link2,
  Users,
  Download
} from 'lucide-react';
import { subDays, subMonths, format } from 'date-fns';
import { useRelatorioConciliacaoConsolidado, OrcamentoConciliacaoResumo, FiltroStatusPagamento } from '@/hooks/useRelatorioConciliacaoConsolidado';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { getStatusConfig } from '@/lib/statusOrcamento';
import { DialogVincularLancamentoAoOrcamento } from './dialogs/DialogVincularLancamentoAoOrcamento';
import { TabClientes } from './conciliacao/TabClientes';
import { toast } from 'sonner';

type PeriodoFiltro = 'todos' | '30dias' | '3meses' | '6meses' | '12meses';
type VisualizacaoRelatorio = 'orcamento' | 'cliente';

interface RelatorioConciliacaoConsolidadoProps {
  onNavigateOrcamento?: (orcamentoId: string) => void;
}

export function RelatorioConciliacaoConsolidado({ onNavigateOrcamento }: RelatorioConciliacaoConsolidadoProps) {
  const [apenasComPendencias, setApenasComPendencias] = useState(false);
  const [incluirNaoEnviados, setIncluirNaoEnviados] = useState(false);
  const [filtroStatusPagamento, setFiltroStatusPagamento] = useState<FiltroStatusPagamento>('todos');
  const [dialogVincularOpen, setDialogVincularOpen] = useState(false);
  const [orcamentoParaVincular, setOrcamentoParaVincular] = useState<string | null>(null);
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('todos');
  const [visualizacao, setVisualizacao] = useState<VisualizacaoRelatorio>('orcamento');

  const dataFiltro = useMemo(() => {
    const hoje = new Date();
    switch (periodoFiltro) {
      case '30dias':
        return subDays(hoje, 30);
      case '3meses':
        return subMonths(hoje, 3);
      case '6meses':
        return subMonths(hoje, 6);
      case '12meses':
        return subMonths(hoje, 12);
      default:
        return undefined;
    }
  }, [periodoFiltro]);
  
  const { data, isLoading } = useRelatorioConciliacaoConsolidado({ 
    apenasComPendencias,
    incluirNaoEnviados,
    filtroStatusPagamento,
    dataInicio: dataFiltro ? format(dataFiltro, 'yyyy-MM-dd') : undefined
  });

  const handleVincularLancamento = (orcamentoId: string) => {
    setOrcamentoParaVincular(orcamentoId);
    setDialogVincularOpen(true);
  };

  const exportarCSV = () => {
    if (!data) return;
    
    const csvContent = 'Código,Cliente,Valor Total,Recebido,Conciliado,Status\n' +
      data.orcamentos.map(orc => 
        `"${orc.codigo}","${orc.clienteNome}",${orc.valorTotal},${orc.valorRecebido},${orc.valorRecebidoConciliado},"${orc.statusConciliacao}"`
      ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'conciliacao-consolidado.csv';
    link.click();
    toast.success('Arquivo CSV exportado com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { orcamentos, totais, estatisticas } = data;

  const getStatusBadge = (status: OrcamentoConciliacaoResumo['statusConciliacao']) => {
    switch (status) {
      case 'completo':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Conciliado</Badge>;
      case 'parcial':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Parcial</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getStatusIcon = (status: OrcamentoConciliacaoResumo['statusConciliacao']) => {
    switch (status) {
      case 'completo':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'parcial':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com filtro global e exportação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório de Conciliação
          </h2>
          <p className="text-sm text-muted-foreground">
            Visão consolidada de recebimentos e conciliação bancária
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Cliente/Orçamento */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={visualizacao === 'orcamento' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setVisualizacao('orcamento')}
              className="h-8"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Por Orçamento</span>
            </Button>
            <Button
              variant={visualizacao === 'cliente' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setVisualizacao('cliente')}
              className="h-8"
            >
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Por Cliente</span>
            </Button>
          </div>
          <Select value={periodoFiltro} onValueChange={(v: PeriodoFiltro) => setPeriodoFiltro(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo período</SelectItem>
              <SelectItem value="30dias">30 dias</SelectItem>
              <SelectItem value="3meses">3 meses</SelectItem>
              <SelectItem value="6meses">6 meses</SelectItem>
              <SelectItem value="12meses">12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportarCSV} disabled={visualizacao !== 'orcamento'}>
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Visão por Cliente */}
      {visualizacao === 'cliente' && (
        <TabClientes dataInicio={dataFiltro ? format(dataFiltro, 'yyyy-MM-dd') : undefined} />
      )}

      {/* Visão por Orçamento */}
      {visualizacao === 'orcamento' && (
        <>
          {/* Filtros específicos */}
          <div className="flex flex-wrap items-center gap-4">
            <Select 
              value={filtroStatusPagamento} 
              onValueChange={(v: FiltroStatusPagamento) => setFiltroStatusPagamento(v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos válidos</SelectItem>
                <SelectItem value="pagos">Apenas pagos (40%+)</SelectItem>
                <SelectItem value="totalmente_pago">Totalmente pagos</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Switch
                id="filtro-nao-enviados"
                checked={incluirNaoEnviados}
                onCheckedChange={setIncluirNaoEnviados}
                disabled={filtroStatusPagamento !== 'todos'}
              />
              <Label htmlFor="filtro-nao-enviados" className="text-sm">
                <FileText className="h-4 w-4 inline mr-1" />
                Incluir não enviados
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="filtro-pendencias"
                checked={apenasComPendencias}
                onCheckedChange={setApenasComPendencias}
              />
              <Label htmlFor="filtro-pendencias" className="text-sm">
                <Filter className="h-4 w-4 inline mr-1" />
                Apenas pendências
              </Label>
            </div>
          </div>

          {/* Info de filtro */}
          {filtroStatusPagamento === 'pagos' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4" />
              Mostrando apenas orçamentos com pagamento iniciado (40%, 50%, 60% ou 100%)
            </div>
          )}
          {filtroStatusPagamento === 'totalmente_pago' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4" />
              Mostrando apenas orçamentos 100% pagos
            </div>
          )}
          {filtroStatusPagamento === 'todos' && !incluirNaoEnviados && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              <Send className="h-4 w-4" />
              Mostrando apenas orçamentos enviados ao cliente ou com pagamentos iniciados
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-muted-foreground text-sm">Total Orçamentos</div>
                <p className="text-2xl font-bold">{estatisticas.totalOrcamentos}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600">{estatisticas.completos} ✓</span>
                  <span className="text-amber-600">{estatisticas.parciais} ◐</span>
                  <span className="text-muted-foreground">{estatisticas.pendentes} ○</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-muted-foreground text-sm">Recebido</div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totais.valorRecebido)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(totais.valorRecebidoConciliado)} no extrato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-muted-foreground text-sm">Custos Pagos</div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totais.custosPagos)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(totais.custosConciliados)} no extrato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-muted-foreground text-sm flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Margem Média
                </div>
                <p className="text-2xl font-bold">
                  {formatPercent(totais.margemMedia)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(estatisticas.percentualGeral)} conciliado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Progresso Geral */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso Geral de Conciliação</span>
                <span className="font-medium">{formatPercent(estatisticas.percentualGeral)}</span>
              </div>
              <Progress value={estatisticas.percentualGeral} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Recebido: {formatCurrency(totais.valorRecebido)}</span>
                <span>Conciliado: {formatCurrency(totais.valorRecebidoConciliado)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Orçamentos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhamento por Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orçamento</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead className="text-right">Conciliado</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {apenasComPendencias 
                            ? 'Nenhum orçamento com pendências' 
                            : 'Nenhum orçamento encontrado'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      orcamentos.map((orc) => {
                        const statusConfig = getStatusConfig(orc.status);
                        return (
                        <TableRow key={orc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(orc.statusConciliacao)}
                              <span className="font-medium">{orc.codigo}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[10px] px-1.5 py-0 ${statusConfig.color}`}
                                    >
                                      {statusConfig.label}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>Status do orçamento no CRM</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(orc.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <TruncatedText text={orc.clienteNome} maxWidth="200px" />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(orc.valorTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <span className="text-green-600">{formatCurrency(orc.valorRecebido)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatPercent(orc.percentualRecebido)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <span>{formatCurrency(orc.valorRecebidoConciliado)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatPercent(orc.percentualConciliado)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(orc.statusConciliacao)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {orc.statusConciliacao !== 'completo' && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleVincularLancamento(orc.id)}
                                      >
                                        <Link2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Vincular lançamento existente</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {onNavigateOrcamento && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => onNavigateOrcamento(orc.id)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )})
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Totalmente conciliado
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              Parcialmente conciliado
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
              Pendente de conciliação
            </div>
          </div>
        </>
      )}

      {/* Dialog de vinculação */}
      <DialogVincularLancamentoAoOrcamento
        open={dialogVincularOpen}
        onOpenChange={setDialogVincularOpen}
        orcamentoId={orcamentoParaVincular}
      />
    </div>
  );
}
