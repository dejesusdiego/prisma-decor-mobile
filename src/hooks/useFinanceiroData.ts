import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export interface ResumoFinanceiro {
  saldo: number;
  totalEntradas: number;
  totalSaidas: number;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
  contasPagarPendentes: number;
  contasReceberPendentes: number;
  contasAtrasadas: number;
}

export interface FluxoCaixaDia {
  data: string;
  dataFormatada: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface DespesaCategoria {
  categoria: string;
  cor: string;
  valor: number;
  percentual: number;
}

export interface ContaPendente {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  status: string;
  tipo: 'pagar' | 'receber';
  clienteOuFornecedor?: string;
}

export interface LancamentoRecente {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: Date;
  categoria?: string;
  categoriaCor?: string;
}

export function useFinanceiroData(dataInicio: Date, dataFim: Date) {
  const { organizationId } = useOrganizationContext();
  const inicioStr = format(dataInicio, 'yyyy-MM-dd');
  const fimStr = format(dataFim, 'yyyy-MM-dd');

  // Buscar lançamentos do período
  const { data: lancamentos, isLoading: isLoadingLancamentos, refetch: refetchLancamentos } = useQuery({
    queryKey: ['lancamentos-financeiros', inicioStr, fimStr, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(nome, cor)
        `)
        .eq('organization_id', organizationId)
        .gte('data_lancamento', inicioStr)
        .lte('data_lancamento', fimStr)
        .order('data_lancamento', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Buscar contas a pagar pendentes
  const { data: contasPagar, isLoading: isLoadingContasPagar, refetch: refetchContasPagar } = useQuery({
    queryKey: ['contas-pagar-pendentes', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          categoria:categorias_financeiras(nome, cor)
        `)
        .eq('organization_id', organizationId)
        .in('status', ['pendente', 'atrasado'])
        .order('data_vencimento', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Buscar contas a receber pendentes
  const { data: contasReceber, isLoading: isLoadingContasReceber, refetch: refetchContasReceber } = useQuery({
    queryKey: ['contas-receber-pendentes', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['pendente', 'parcial', 'atrasado'])
        .order('data_vencimento', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Buscar categorias para despesas
  const { data: categorias } = useQuery({
    queryKey: ['categorias-financeiras', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('ativo', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const isLoading = isLoadingLancamentos || isLoadingContasPagar || isLoadingContasReceber;

  // Calcular resumo
  const resumo: ResumoFinanceiro = {
    saldo: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    quantidadeEntradas: 0,
    quantidadeSaidas: 0,
    contasPagarPendentes: contasPagar?.length || 0,
    contasReceberPendentes: contasReceber?.length || 0,
    contasAtrasadas: 0,
  };

  if (lancamentos) {
    lancamentos.forEach((l) => {
      if (l.tipo === 'entrada') {
        resumo.totalEntradas += Number(l.valor);
        resumo.quantidadeEntradas++;
      } else {
        resumo.totalSaidas += Number(l.valor);
        resumo.quantidadeSaidas++;
      }
    });
    resumo.saldo = resumo.totalEntradas - resumo.totalSaidas;
  }

  // Contar atrasados
  if (contasPagar) {
    resumo.contasAtrasadas += contasPagar.filter(c => c.status === 'atrasado').length;
  }
  if (contasReceber) {
    resumo.contasAtrasadas += contasReceber.filter(c => c.status === 'atrasado').length;
  }

  // Calcular fluxo de caixa por dia
  const fluxoCaixa: FluxoCaixaDia[] = [];
  if (lancamentos) {
    const dias = eachDayOfInterval({ start: dataInicio, end: dataFim });
    let saldoAcumulado = 0;

    dias.forEach((dia) => {
      const diaStr = format(dia, 'yyyy-MM-dd');
      const lancamentosDia = lancamentos.filter(l => l.data_lancamento === diaStr);
      
      const entradas = lancamentosDia
        .filter(l => l.tipo === 'entrada')
        .reduce((acc, l) => acc + Number(l.valor), 0);
      
      const saidas = lancamentosDia
        .filter(l => l.tipo === 'saida')
        .reduce((acc, l) => acc + Number(l.valor), 0);
      
      saldoAcumulado += entradas - saidas;

      fluxoCaixa.push({
        data: diaStr,
        dataFormatada: format(dia, 'dd/MM'),
        entradas,
        saidas,
        saldo: saldoAcumulado,
      });
    });
  }

  // Calcular despesas por categoria
  const despesasPorCategoria: DespesaCategoria[] = [];
  if (lancamentos && categorias) {
    const despesasAgrupadas: Record<string, { valor: number; cor: string }> = {};
    
    lancamentos
      .filter(l => l.tipo === 'saida')
      .forEach((l) => {
        const categoriaNome = l.categoria?.nome || 'Sem Categoria';
        const categoriaCor = l.categoria?.cor || '#6B7280';
        
        if (!despesasAgrupadas[categoriaNome]) {
          despesasAgrupadas[categoriaNome] = { valor: 0, cor: categoriaCor };
        }
        despesasAgrupadas[categoriaNome].valor += Number(l.valor);
      });

    const totalDespesas = Object.values(despesasAgrupadas).reduce((acc, d) => acc + d.valor, 0);

    Object.entries(despesasAgrupadas)
      .sort((a, b) => b[1].valor - a[1].valor)
      .slice(0, 6)
      .forEach(([categoria, { valor, cor }]) => {
        despesasPorCategoria.push({
          categoria,
          cor,
          valor,
          percentual: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0,
        });
      });
  }

  // Mapear contas pendentes
  const contasPagarPendentes: ContaPendente[] = (contasPagar || []).map(c => ({
    id: c.id,
    descricao: c.descricao,
    valor: Number(c.valor),
    dataVencimento: parseISO(c.data_vencimento),
    status: c.status,
    tipo: 'pagar' as const,
    clienteOuFornecedor: c.fornecedor,
  }));

  const contasReceberPendentes: ContaPendente[] = (contasReceber || []).map(c => ({
    id: c.id,
    descricao: c.descricao,
    valor: Number(c.valor_total) - Number(c.valor_pago),
    dataVencimento: parseISO(c.data_vencimento),
    status: c.status,
    tipo: 'receber' as const,
    clienteOuFornecedor: c.cliente_nome,
  }));

  // Mapear lançamentos recentes
  const lancamentosRecentes: LancamentoRecente[] = (lancamentos || [])
    .slice(0, 10)
    .map(l => ({
      id: l.id,
      descricao: l.descricao,
      valor: Number(l.valor),
      tipo: l.tipo as 'entrada' | 'saida',
      data: parseISO(l.data_lancamento),
      categoria: l.categoria?.nome,
      categoriaCor: l.categoria?.cor,
    }));

  const refetch = () => {
    refetchLancamentos();
    refetchContasPagar();
    refetchContasReceber();
  };

  return {
    resumo,
    fluxoCaixa,
    despesasPorCategoria,
    contasPagarPendentes,
    contasReceberPendentes,
    lancamentosRecentes,
    isLoading,
    refetch,
  };
}
