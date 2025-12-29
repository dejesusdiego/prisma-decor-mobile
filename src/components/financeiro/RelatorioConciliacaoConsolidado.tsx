import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ExternalLink,
  BarChart3,
  Filter
} from 'lucide-react';
import { useRelatorioConciliacaoConsolidado, OrcamentoConciliacaoResumo } from '@/hooks/useRelatorioConciliacaoConsolidado';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';

interface RelatorioConciliacaoConsolidadoProps {
  onNavigateOrcamento?: (orcamentoId: string) => void;
}

export function RelatorioConciliacaoConsolidado({ onNavigateOrcamento }: RelatorioConciliacaoConsolidadoProps) {
  const [apenasComPendencias, setApenasComPendencias] = useState(false);
  
  const { data, isLoading } = useRelatorioConciliacaoConsolidado({ 
    apenasComPendencias 
  });

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório de Conciliação Consolidado
          </h2>
          <p className="text-sm text-muted-foreground">
            Visão geral da conciliação bancária de todos os orçamentos
          </p>
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
                  orcamentos.map((orc) => (
                    <TableRow key={orc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(orc.statusConciliacao)}
                          <span className="font-medium">{orc.codigo}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(orc.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="truncate max-w-[150px] block">{orc.clienteNome}</span>
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
                        {onNavigateOrcamento && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onNavigateOrcamento(orc.id)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
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
    </div>
  );
}
