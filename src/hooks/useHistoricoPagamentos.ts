import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface HistoricoPagamentoCliente {
  clienteNome: string;
  clienteTelefone: string;
  totalParcelas: number;
  parcelasPagas: number;
  parcelasAtrasadas: number;
  diasAtrasoMedio: number;
  valorTotalPago: number;
  valorTotalPendente: number;
  scoreConfiabilidade: number; // 0-100
  risco: 'baixo' | 'medio' | 'alto';
}

interface MetricasGerais {
  taxaInadimplencia: number; // percentual de parcelas atrasadas
  diasAtrasoMedioGeral: number;
  valorEmRisco: number; // soma das parcelas atrasadas
  clientesRisco: number; // quantidade de clientes com score < 50
  fatorInadimplenciaSugerido: number; // fator para usar nas projeções
}

/**
 * Hook para análise de histórico de pagamentos
 * Calcula score de confiabilidade por cliente e métricas gerais de inadimplência
 */
export function useHistoricoPagamentos() {
  const { organizationId } = useOrganizationContext();
  
  const { data: historico, isLoading, error } = useQuery({
    queryKey: ['historico-pagamentos-analise', organizationId],
    queryFn: async () => {
      if (!organizationId) return { clientes: [], metricas: null };

      // Buscar todas as contas a receber com suas parcelas - filtrado por organização
      const { data: contasReceber, error: errorContas } = await supabase
        .from('contas_receber')
        .select(`
          id,
          cliente_nome,
          cliente_telefone,
          valor_total,
          valor_pago,
          status,
          data_vencimento,
          parcelas:parcelas_receber(
            id,
            numero_parcela,
            valor,
            data_vencimento,
            data_pagamento,
            status
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (errorContas) throw errorContas;

      // Agrupar por cliente (telefone como chave única)
      const clientesMap = new Map<string, {
        nome: string;
        telefone: string;
        parcelas: Array<{
          valor: number;
          dataVencimento: string;
          dataPagamento: string | null;
          status: string;
        }>;
      }>();

      (contasReceber || []).forEach(conta => {
        const key = conta.cliente_telefone || conta.cliente_nome;
        
        if (!clientesMap.has(key)) {
          clientesMap.set(key, {
            nome: conta.cliente_nome,
            telefone: conta.cliente_telefone || '',
            parcelas: []
          });
        }

        const cliente = clientesMap.get(key)!;
        (conta.parcelas || []).forEach((parcela: any) => {
          cliente.parcelas.push({
            valor: Number(parcela.valor),
            dataVencimento: parcela.data_vencimento,
            dataPagamento: parcela.data_pagamento,
            status: parcela.status
          });
        });
      });

      // Calcular métricas por cliente
      const clientes: HistoricoPagamentoCliente[] = [];
      let totalParcelasGeral = 0;
      let parcelasAtrasadasGeral = 0;
      let somaDiasAtraso = 0;
      let countAtrasos = 0;
      let valorEmRiscoTotal = 0;

      clientesMap.forEach((cliente) => {
        const totalParcelas = cliente.parcelas.length;
        if (totalParcelas === 0) return;

        const parcelasPagas = cliente.parcelas.filter(p => p.status === 'pago').length;
        const parcelasAtrasadas = cliente.parcelas.filter(p => p.status === 'atrasado').length;
        
        // Calcular dias de atraso médio
        let diasAtrasoTotal = 0;
        let countAtrasosCliente = 0;
        
        cliente.parcelas.forEach(p => {
          if (p.dataPagamento && p.dataVencimento) {
            const dataVenc = parseISO(p.dataVencimento);
            const dataPag = parseISO(p.dataPagamento);
            const diff = differenceInDays(dataPag, dataVenc);
            if (diff > 0) {
              diasAtrasoTotal += diff;
              countAtrasosCliente++;
              somaDiasAtraso += diff;
              countAtrasos++;
            }
          } else if (p.status === 'atrasado') {
            const dataVenc = parseISO(p.dataVencimento);
            const hoje = new Date();
            const diff = differenceInDays(hoje, dataVenc);
            if (diff > 0) {
              diasAtrasoTotal += diff;
              countAtrasosCliente++;
              somaDiasAtraso += diff;
              countAtrasos++;
            }
          }
        });

        const diasAtrasoMedio = countAtrasosCliente > 0 ? diasAtrasoTotal / countAtrasosCliente : 0;

        const valorTotalPago = cliente.parcelas
          .filter(p => p.status === 'pago')
          .reduce((acc, p) => acc + p.valor, 0);

        const valorTotalPendente = cliente.parcelas
          .filter(p => p.status !== 'pago')
          .reduce((acc, p) => acc + p.valor, 0);

        // Calcular score de confiabilidade (0-100)
        // Fatores: taxa de pagamento, pontualidade, histórico
        let score = 100;
        
        // Penalizar por parcelas não pagas
        if (totalParcelas > 0) {
          const taxaPagamento = parcelasPagas / totalParcelas;
          score *= taxaPagamento;
        }
        
        // Penalizar por atrasos
        if (diasAtrasoMedio > 0) {
          score -= Math.min(diasAtrasoMedio * 2, 40); // Max -40 pontos por atraso
        }
        
        // Penalizar por parcelas atualmente atrasadas
        if (parcelasAtrasadas > 0) {
          score -= parcelasAtrasadas * 10; // -10 por cada parcela atrasada
        }

        score = Math.max(0, Math.min(100, score));

        // Determinar nível de risco
        let risco: 'baixo' | 'medio' | 'alto' = 'baixo';
        if (score < 50) risco = 'alto';
        else if (score < 75) risco = 'medio';

        clientes.push({
          clienteNome: cliente.nome,
          clienteTelefone: cliente.telefone,
          totalParcelas,
          parcelasPagas,
          parcelasAtrasadas,
          diasAtrasoMedio,
          valorTotalPago,
          valorTotalPendente,
          scoreConfiabilidade: Math.round(score),
          risco
        });

        // Somar para métricas gerais
        totalParcelasGeral += totalParcelas;
        parcelasAtrasadasGeral += parcelasAtrasadas;
        
        // Somar valor em risco
        valorEmRiscoTotal += cliente.parcelas
          .filter(p => p.status === 'atrasado')
          .reduce((acc, p) => acc + p.valor, 0);
      });

      // Recalcular valor em risco corretamente
      valorEmRiscoTotal = clientes.reduce((acc, c) => {
        if (c.risco === 'alto' || c.parcelasAtrasadas > 0) {
          return acc + c.valorTotalPendente;
        }
        return acc;
      }, 0);

      // Calcular métricas gerais
      const taxaInadimplencia = totalParcelasGeral > 0 
        ? (parcelasAtrasadasGeral / totalParcelasGeral) * 100 
        : 0;
      
      const diasAtrasoMedioGeral = countAtrasos > 0 
        ? somaDiasAtraso / countAtrasos 
        : 0;

      const clientesRisco = clientes.filter(c => c.scoreConfiabilidade < 50).length;

      // Fator de inadimplência sugerido baseado no histórico real
      // Se taxa alta, usar fator maior; se taxa baixa, usar fator menor
      let fatorInadimplenciaSugerido = 0.30; // Default 30%
      if (taxaInadimplencia < 5) fatorInadimplenciaSugerido = 0.10;
      else if (taxaInadimplencia < 10) fatorInadimplenciaSugerido = 0.20;
      else if (taxaInadimplencia < 20) fatorInadimplenciaSugerido = 0.30;
      else fatorInadimplenciaSugerido = 0.40;

      const metricas: MetricasGerais = {
        taxaInadimplencia,
        diasAtrasoMedioGeral,
        valorEmRisco: valorEmRiscoTotal,
        clientesRisco,
        fatorInadimplenciaSugerido
      };

      return {
        clientes: clientes.sort((a, b) => a.scoreConfiabilidade - b.scoreConfiabilidade),
        metricas
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!organizationId
  });

  return {
    clientes: historico?.clientes || [],
    metricas: historico?.metricas || {
      taxaInadimplencia: 0,
      diasAtrasoMedioGeral: 0,
      valorEmRisco: 0,
      clientesRisco: 0,
      fatorInadimplenciaSugerido: 0.30
    },
    isLoading,
    error
  };
}

/**
 * Buscar score de confiabilidade de um cliente específico
 */
export function useScoreCliente(clienteTelefone: string | undefined) {
  const { clientes, isLoading } = useHistoricoPagamentos();
  
  const cliente = clientes.find(c => c.clienteTelefone === clienteTelefone);
  
  return {
    score: cliente?.scoreConfiabilidade ?? 100,
    risco: cliente?.risco ?? 'baixo',
    diasAtrasoMedio: cliente?.diasAtrasoMedio ?? 0,
    isLoading
  };
}
