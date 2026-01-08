import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown,
  Search,
  Download,
  ArrowLeft,
  Percent,
  Target
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RelatorioMargemRealProps {
  onBack?: () => void;
}

interface MargemOrcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  data: string;
  valor_orcamento: number;
  margem_projetada: number;
  valor_recebido: number;
  custo_real: number;
  margem_real: number;
  diferenca: number;
}

export function RelatorioMargemReal({ onBack }: RelatorioMargemRealProps) {
  const [busca, setBusca] = useState('');
  const { organizationId } = useOrganizationContext();

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-margem-real', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        return { itens: [], resumo: { mediaProjetada: 0, mediaRealizada: 0, diferenca: 0 } };
      }
      
      // Buscar orçamentos com status de pagamento
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, created_at, total_com_desconto, total_geral, custo_total, margem_percent')
        .eq('organization_id', organizationId)
        .in('status', ['pago', 'pago_parcial', 'pago_40', 'instalado', 'concluido'])
        .order('created_at', { ascending: false });

      if (!orcamentos || orcamentos.length === 0) {
        return { itens: [], resumo: { mediaProjetada: 0, mediaRealizada: 0, diferenca: 0 } };
      }

      // Buscar valores recebidos por orçamento
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('orcamento_id, valor_pago')
        .eq('organization_id', organizationId)
        .in('orcamento_id', orcamentos.map(o => o.id));

      // Buscar custos pagos por orçamento
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('orcamento_id, valor')
        .eq('organization_id', organizationId)
        .in('orcamento_id', orcamentos.map(o => o.id))
        .eq('status', 'pago');

      // Mapear valores
      const recebidoPorOrc = new Map<string, number>();
      (contasReceber || []).forEach(cr => {
        if (cr.orcamento_id) {
          recebidoPorOrc.set(cr.orcamento_id, 
            (recebidoPorOrc.get(cr.orcamento_id) || 0) + cr.valor_pago);
        }
      });

      const custoPorOrc = new Map<string, number>();
      (contasPagar || []).forEach(cp => {
        if (cp.orcamento_id) {
          custoPorOrc.set(cp.orcamento_id, 
            (custoPorOrc.get(cp.orcamento_id) || 0) + cp.valor);
        }
      });

      // Calcular margem real de cada orçamento
      const itens: MargemOrcamento[] = orcamentos.map(orc => {
        const valorOrcamento = orc.total_com_desconto || orc.total_geral || 0;
        const margemProjetada = orc.margem_percent || 0;
        const valorRecebido = recebidoPorOrc.get(orc.id) || 0;
        const custoReal = custoPorOrc.get(orc.id) || orc.custo_total || 0;
        
        let margemReal = 0;
        if (valorRecebido > 0) {
          margemReal = ((valorRecebido - custoReal) / valorRecebido) * 100;
        }
        
        const diferenca = margemReal - margemProjetada;

        return {
          id: orc.id,
          codigo: orc.codigo,
          cliente_nome: orc.cliente_nome,
          data: orc.created_at,
          valor_orcamento: valorOrcamento,
          margem_projetada: margemProjetada,
          valor_recebido: valorRecebido,
          custo_real: custoReal,
          margem_real: margemReal,
          diferenca
        };
      });

      // Calcular médias
      const itensComMargem = itens.filter(i => i.valor_recebido > 0);
      const somaProjetada = itensComMargem.reduce((s, i) => s + i.margem_projetada, 0);
      const somaRealizada = itensComMargem.reduce((s, i) => s + i.margem_real, 0);
      const count = itensComMargem.length || 1;

      return {
        itens,
        resumo: {
          mediaProjetada: somaProjetada / count,
          mediaRealizada: somaRealizada / count,
          diferenca: (somaRealizada - somaProjetada) / count
        }
      };
    }
  });

  const itensFiltrados = (data?.itens || []).filter(item =>
    item.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    item.cliente_nome.toLowerCase().includes(busca.toLowerCase())
  );

  const exportarCSV = () => {
    const headers = ['Código', 'Cliente', 'Data', 'Valor Orçamento', 'Margem Projetada', 'Valor Recebido', 'Custo Real', 'Margem Real', 'Diferença'];
    const rows = itensFiltrados.map(item => [
      item.codigo,
      item.cliente_nome,
      format(new Date(item.data), 'dd/MM/yyyy'),
      item.valor_orcamento.toFixed(2),
      item.margem_projetada.toFixed(2),
      item.valor_recebido.toFixed(2),
      item.custo_real.toFixed(2),
      item.margem_real.toFixed(2),
      item.diferenca.toFixed(2)
    ]);
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `margem-real-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const resumo = data?.resumo;
  const diferencaPositiva = (resumo?.diferenca || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Percent className="h-6 w-6 text-primary" />
              Relatório de Margem Real
            </h1>
            <p className="text-muted-foreground">
              Comparativo entre margem projetada e realizada por orçamento
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={exportarCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Margem Projetada Média</span>
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{(resumo?.mediaProjetada || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          diferencaPositiva ? "border-l-emerald-500" : "border-l-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Margem Realizada Média</span>
              <Percent className={cn("h-4 w-4", diferencaPositiva ? "text-emerald-500" : "text-red-500")} />
            </div>
            <p className="text-2xl font-bold">{(resumo?.mediaRealizada || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          diferencaPositiva ? "border-l-emerald-500" : "border-l-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Diferença Média</span>
              {diferencaPositiva ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className={cn(
              "text-2xl font-bold",
              diferencaPositiva ? "text-emerald-600" : "text-red-600"
            )}>
              {diferencaPositiva ? '+' : ''}{(resumo?.diferenca || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Detalhamento por Orçamento</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Margem Proj.</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Custo Real</TableHead>
                  <TableHead className="text-right">Margem Real</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum orçamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  itensFiltrados.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.codigo}</TableCell>
                      <TableCell>{item.cliente_nome}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valor_orcamento)}</TableCell>
                      <TableCell className="text-right">{item.margem_projetada.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valor_recebido)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.custo_real)}</TableCell>
                      <TableCell className="text-right">
                        {item.valor_recebido > 0 ? `${item.margem_real.toFixed(1)}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.valor_recebido > 0 ? (
                          <Badge variant={item.diferenca >= 0 ? "default" : "destructive"} className="gap-1">
                            {item.diferenca >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {item.diferenca >= 0 ? '+' : ''}{item.diferenca.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
