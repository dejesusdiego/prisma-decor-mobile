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
  status: string;
  valor_orcamento: number;
  custo_projetado: number;
  markup_projetado: number;
  valor_recebido: number;
  custo_real: number;
  markup_real: number;
  diferenca: number;
  conciliado: boolean;
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
      
      // Buscar orçamentos finalizados (100% concluídos) ou com pagamento
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, created_at, status, total_com_desconto, total_geral, custo_total, margem_percent')
        .eq('organization_id', organizationId)
        .in('status', ['finalizado', 'concluido', 'pago', 'instalado'])
        .order('created_at', { ascending: false });

      if (!orcamentos || orcamentos.length === 0) {
        return { itens: [], resumo: { mediaProjetada: 0, mediaRealizada: 0, diferenca: 0 } };
      }

      // Buscar valores recebidos por orçamento
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('orcamento_id, valor_pago, valor_total, status')
        .eq('organization_id', organizationId)
        .in('orcamento_id', orcamentos.map(o => o.id));

      // Buscar custos pagos por orçamento (apenas os já pagos para custo real)
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('orcamento_id, valor, status')
        .eq('organization_id', organizationId)
        .in('orcamento_id', orcamentos.map(o => o.id));

      // Mapear valores recebidos
      const recebidoPorOrc = new Map<string, { pago: number; total: number; quitado: boolean }>();
      (contasReceber || []).forEach(cr => {
        if (cr.orcamento_id) {
          const atual = recebidoPorOrc.get(cr.orcamento_id) || { pago: 0, total: 0, quitado: false };
          atual.pago += cr.valor_pago || 0;
          atual.total += cr.valor_total || 0;
          atual.quitado = cr.status === 'pago';
          recebidoPorOrc.set(cr.orcamento_id, atual);
        }
      });

      // Mapear custos pagos
      const custoPorOrc = new Map<string, { pago: number; total: number; conciliado: boolean }>();
      (contasPagar || []).forEach(cp => {
        if (cp.orcamento_id) {
          const atual = custoPorOrc.get(cp.orcamento_id) || { pago: 0, total: 0, conciliado: true };
          atual.total += cp.valor || 0;
          if (cp.status === 'pago') {
            atual.pago += cp.valor || 0;
          } else {
            atual.conciliado = false;
          }
          custoPorOrc.set(cp.orcamento_id, atual);
        }
      });

      // Calcular MARKUP real de cada orçamento
      // Markup = (Receita - Custo) / Custo * 100
      const itens: MargemOrcamento[] = orcamentos.map(orc => {
        const valorOrcamento = orc.total_com_desconto || orc.total_geral || 0;
        const custoProjetado = orc.custo_total || 0;
        const markupProjetado = orc.margem_percent || 0;
        
        const receita = recebidoPorOrc.get(orc.id);
        const custos = custoPorOrc.get(orc.id);
        
        const valorRecebido = receita?.pago || 0;
        // Se não tem contas a pagar vinculadas, usa o custo projetado
        const custoReal = custos?.pago || custoProjetado;
        const conciliado = (receita?.quitado || false) && (custos?.conciliado !== false);
        
        // Calcular markup real: (receita - custo) / custo * 100
        let markupReal = 0;
        if (custoReal > 0 && valorRecebido > 0) {
          markupReal = ((valorRecebido - custoReal) / custoReal) * 100;
        }
        
        const diferenca = markupReal - markupProjetado;

        return {
          id: orc.id,
          codigo: orc.codigo,
          cliente_nome: orc.cliente_nome,
          data: orc.created_at,
          status: orc.status,
          valor_orcamento: valorOrcamento,
          custo_projetado: custoProjetado,
          markup_projetado: markupProjetado,
          valor_recebido: valorRecebido,
          custo_real: custoReal,
          markup_real: markupReal,
          diferenca,
          conciliado
        };
      });

      // Calcular médias (apenas de orçamentos conciliados/finalizados)
      const itensFinalizados = itens.filter(i => i.conciliado && i.valor_recebido > 0);
      const somaProjetada = itensFinalizados.reduce((s, i) => s + i.markup_projetado, 0);
      const somaRealizada = itensFinalizados.reduce((s, i) => s + i.markup_real, 0);
      const count = itensFinalizados.length || 1;

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
    const headers = ['Código', 'Cliente', 'Status', 'Data', 'Valor Orçamento', 'Custo Projetado', 'Markup Projetado', 'Valor Recebido', 'Custo Real', 'Markup Real', 'Diferença', 'Conciliado'];
    const rows = itensFiltrados.map(item => [
      item.codigo,
      item.cliente_nome,
      item.status,
      format(new Date(item.data), 'dd/MM/yyyy'),
      item.valor_orcamento.toFixed(2),
      item.custo_projetado.toFixed(2),
      item.markup_projetado.toFixed(2),
      item.valor_recebido.toFixed(2),
      item.custo_real.toFixed(2),
      item.markup_real.toFixed(2),
      item.diferenca.toFixed(2),
      item.conciliado ? 'Sim' : 'Não'
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
              Markup Real vs Projetado
            </h1>
            <p className="text-muted-foreground">
              Comparativo de rentabilidade após conciliação completa
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
              <span className="text-sm text-muted-foreground">Markup Projetado Médio</span>
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{(resumo?.mediaProjetada || 0).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Sobre o custo</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          diferencaPositiva ? "border-l-emerald-500" : "border-l-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Markup Realizado Médio</span>
              <Percent className={cn("h-4 w-4", diferencaPositiva ? "text-emerald-500" : "text-red-500")} />
            </div>
            <p className="text-2xl font-bold">{(resumo?.mediaRealizada || 0).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Pedidos finalizados</p>
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
            <p className="text-xs text-muted-foreground mt-1">Markup real vs projetado</p>
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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Custo Real</TableHead>
                  <TableHead className="text-right">Markup Proj.</TableHead>
                  <TableHead className="text-right">Markup Real</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum orçamento finalizado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  itensFiltrados.map(item => (
                    <TableRow key={item.id} className={cn(!item.conciliado && "opacity-60")}>
                      <TableCell className="font-medium">{item.codigo}</TableCell>
                      <TableCell>{item.cliente_nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.conciliado ? "default" : "secondary"} className="text-xs">
                          {item.conciliado ? '✓ Conciliado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valor_recebido)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.custo_real)}</TableCell>
                      <TableCell className="text-right">{item.markup_projetado.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        {item.conciliado && item.valor_recebido > 0 ? `${item.markup_real.toFixed(1)}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.conciliado && item.valor_recebido > 0 ? (
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
          
          <p className="text-xs text-muted-foreground mt-2">
            * Markup calculado como (Receita - Custo) / Custo × 100. Apenas pedidos com custos e receitas 100% conciliados são considerados nas médias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
