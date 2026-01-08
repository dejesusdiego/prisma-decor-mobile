import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STATUS_COM_PAGAMENTO } from '@/lib/statusOrcamento';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { 
  Target, 
  Settings2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetaConfig {
  metaVendasMensal: number;
  metaConversao: number;
  metaTicketMedio: number;
  metaNovosClientes: number;
}

interface MetasVendasProps {
  receitaAtual: number;
  taxaConversao: number;
  ticketMedio: number;
  clientesNovos: number;
  periodo: '3m' | '6m' | '12m' | 'todos';
}

const DEFAULT_METAS: MetaConfig = {
  metaVendasMensal: 100000,
  metaConversao: 30,
  metaTicketMedio: 5000,
  metaNovosClientes: 10
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function MetasVendas({ 
  receitaAtual, 
  taxaConversao, 
  ticketMedio, 
  clientesNovos,
  periodo 
}: MetasVendasProps) {
  const { organizationId } = useOrganizationContext();
  const [metas, setMetas] = useState<MetaConfig>(DEFAULT_METAS);
  const [tempMetas, setTempMetas] = useState<MetaConfig>(DEFAULT_METAS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dadosAnterior, setDadosAnterior] = useState({
    receita: 0,
    conversao: 0,
    ticket: 0,
    novos: 0
  });

  // Calcular fator de ajuste baseado no período
  const getFatorPeriodo = () => {
    switch (periodo) {
      case '3m': return 3;
      case '6m': return 6;
      case '12m': return 12;
      default: return 6;
    }
  };

  // Carregar metas do banco
  useEffect(() => {
    const loadMetas = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('configuracoes_sistema')
          .select('valor')
          .eq('chave', 'metas_vendas')
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (error) throw error;

        if (data?.valor) {
          const metasDb = data.valor as unknown as MetaConfig;
          setMetas(metasDb);
          setTempMetas(metasDb);
        }
      } catch (error) {
        console.error('Erro ao carregar metas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetas();
    loadDadosPeriodoAnterior();
  }, [organizationId]);

  // Carregar dados do período anterior para comparação
  const loadDadosPeriodoAnterior = async () => {
    if (!organizationId) return;
    
    try {
      const hoje = new Date();
      const mesesAtras = getFatorPeriodo() * 2;
      const dataInicioAnterior = subMonths(hoje, mesesAtras);
      const dataFimAnterior = subMonths(hoje, getFatorPeriodo());

      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', dataInicioAnterior.toISOString())
        .lt('created_at', dataFimAnterior.toISOString());

      const { data: contatos } = await supabase
        .from('contatos')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', dataInicioAnterior.toISOString())
        .lt('created_at', dataFimAnterior.toISOString())
        .eq('tipo', 'cliente');

      if (orcamentos) {
        const pagos = orcamentos.filter(o => STATUS_COM_PAGAMENTO.includes(o.status as any));
        const receita = pagos.reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0);
        const ticket = pagos.length > 0 ? receita / pagos.length : 0;
        const conversao = orcamentos.length > 0 ? (pagos.length / orcamentos.length) * 100 : 0;
        
        setDadosAnterior({
          receita,
          conversao,
          ticket,
          novos: contatos?.length || 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados anteriores:', error);
    }
  };

  const salvarMetas = async () => {
    if (!organizationId) {
      toast.error('Organização não identificada');
      return;
    }
    
    setSaving(true);
    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('configuracoes_sistema')
        .select('id')
        .eq('chave', 'metas_vendas')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('configuracoes_sistema')
          .update({ valor: tempMetas as unknown as never })
          .eq('chave', 'metas_vendas')
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracoes_sistema')
          .insert({
            chave: 'metas_vendas',
            valor: tempMetas as unknown as never,
            descricao: 'Metas de vendas configuráveis',
            organization_id: organizationId
          });

        if (error) throw error;
      }

      setMetas(tempMetas);
      setDialogOpen(false);
      toast.success('Metas salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      toast.error('Erro ao salvar metas');
    } finally {
      setSaving(false);
    }
  };

  // Ajustar meta pelo período
  const getMetaAjustada = (metaMensal: number) => metaMensal * getFatorPeriodo();

  // Calcular progresso
  const progressoVendas = Math.min(100, (receitaAtual / getMetaAjustada(metas.metaVendasMensal)) * 100);
  const progressoConversao = Math.min(100, (taxaConversao / metas.metaConversao) * 100);
  const progressoTicket = Math.min(100, (ticketMedio / metas.metaTicketMedio) * 100);
  const progressoNovos = Math.min(100, (clientesNovos / (metas.metaNovosClientes * getFatorPeriodo())) * 100);

  // Projeção linear
  const hoje = new Date();
  const diasNoMes = getDaysInMonth(hoje);
  const diasPassados = hoje.getDate();
  const fatorProjecao = diasNoMes / diasPassados;
  const projecaoVendas = receitaAtual * fatorProjecao;
  const projecaoAtingimento = (projecaoVendas / getMetaAjustada(metas.metaVendasMensal)) * 100;

  const getStatusBadge = (progresso: number) => {
    if (progresso >= 100) return { label: 'Atingida', variant: 'default' as const, className: 'bg-green-100 text-green-700' };
    if (progresso >= 80) return { label: 'No caminho', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700' };
    if (progresso >= 50) return { label: 'Atenção', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Crítico', variant: 'destructive' as const, className: '' };
  };

  const getProgressColor = (progresso: number) => {
    if (progresso >= 100) return 'bg-green-500';
    if (progresso >= 80) return 'bg-blue-500';
    if (progresso >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const comparacaoAnterior = (atual: number, anterior: number, invertido = false) => {
    if (anterior === 0) return null;
    const diff = ((atual - anterior) / anterior) * 100;
    const isPositive = invertido ? diff < 0 : diff > 0;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        <span>{Math.abs(diff).toFixed(1)}% vs anterior</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Metas de Vendas
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Metas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Meta de Vendas Mensal (R$)</Label>
                <Input
                  type="number"
                  value={tempMetas.metaVendasMensal}
                  onChange={(e) => setTempMetas({ ...tempMetas, metaVendasMensal: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta de Conversão (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tempMetas.metaConversao}
                  onChange={(e) => setTempMetas({ ...tempMetas, metaConversao: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta de Ticket Médio (R$)</Label>
                <Input
                  type="number"
                  value={tempMetas.metaTicketMedio}
                  onChange={(e) => setTempMetas({ ...tempMetas, metaTicketMedio: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta de Novos Clientes (por mês)</Label>
                <Input
                  type="number"
                  value={tempMetas.metaNovosClientes}
                  onChange={(e) => setTempMetas({ ...tempMetas, metaNovosClientes: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarMetas} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta principal de vendas com projeção */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Meta de Faturamento ({getFatorPeriodo()} meses)</p>
              <p className="text-2xl font-bold">{formatCurrency(receitaAtual)}</p>
              <p className="text-xs text-muted-foreground">
                de {formatCurrency(getMetaAjustada(metas.metaVendasMensal))}
              </p>
            </div>
            <div className="text-right">
              <Badge className={getStatusBadge(progressoVendas).className}>
                {getStatusBadge(progressoVendas).label}
              </Badge>
              {comparacaoAnterior(receitaAtual, dadosAnterior.receita)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progressoVendas.toFixed(1)}% atingido</span>
              <span className="text-muted-foreground">
                Falta: {formatCurrency(Math.max(0, getMetaAjustada(metas.metaVendasMensal) - receitaAtual))}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div 
                className={`absolute h-full rounded-full transition-all ${getProgressColor(progressoVendas)}`}
                style={{ width: `${Math.min(100, progressoVendas)}%` }}
              />
            </div>
          </div>

          {/* Projeção */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Projeção do Período</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{formatCurrency(projecaoVendas)}</p>
                <p className={`text-xs ${projecaoAtingimento >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                  {projecaoAtingimento >= 100 ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Projeção de atingimento
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {formatPercent(projecaoAtingimento)} da meta
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Outras metas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Taxa de Conversão */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
              <Badge variant="outline" className="text-xs">
                Meta: {formatPercent(metas.metaConversao)}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{formatPercent(taxaConversao)}</span>
              {comparacaoAnterior(taxaConversao, dadosAnterior.conversao)}
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`absolute h-full rounded-full transition-all ${getProgressColor(progressoConversao)}`}
                style={{ width: `${Math.min(100, progressoConversao)}%` }}
              />
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ticket Médio</span>
              <Badge variant="outline" className="text-xs">
                Meta: {formatCurrency(metas.metaTicketMedio)}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{formatCurrency(ticketMedio)}</span>
              {comparacaoAnterior(ticketMedio, dadosAnterior.ticket)}
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`absolute h-full rounded-full transition-all ${getProgressColor(progressoTicket)}`}
                style={{ width: `${Math.min(100, progressoTicket)}%` }}
              />
            </div>
          </div>

          {/* Novos Clientes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Novos Clientes</span>
              <Badge variant="outline" className="text-xs">
                Meta: {metas.metaNovosClientes * getFatorPeriodo()}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{clientesNovos}</span>
              {comparacaoAnterior(clientesNovos, dadosAnterior.novos)}
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`absolute h-full rounded-full transition-all ${getProgressColor(progressoNovos)}`}
                style={{ width: `${Math.min(100, progressoNovos)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
