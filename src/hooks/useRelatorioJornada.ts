import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';

export interface EstagioFunil {
  id: string;
  label: string;
  quantidade: number;
  valor: number;
  conversaoAnterior: number | null;
  tempoMedio: number; // dias
  color: string;
}

export interface ContatoNoEstagio {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: string | null;
  estagioAtual: string;
  diasNoEstagio: number;
  valorTotal: number;
  ultimaAtividade: Date | null;
}

export interface RelatorioJornadaData {
  funil: EstagioFunil[];
  contatosPorEstagio: Record<string, ContatoNoEstagio[]>;
  totalContatos: number;
  valorTotalPipeline: number;
  conversaoGeral: number;
  tempoMedioTotal: number;
}

const ESTAGIOS_ORDEM = [
  { id: 'lead', label: 'Leads', color: '#3b82f6' },
  { id: 'orcamento', label: 'Com Orçamento', color: '#8b5cf6' },
  { id: 'negociacao', label: 'Em Negociação', color: '#f59e0b' },
  { id: 'pagamento', label: 'Pagamento', color: '#22c55e' },
  { id: 'producao', label: 'Produção', color: '#6366f1' },
  { id: 'instalacao', label: 'Instalação', color: '#10b981' },
];

export function useRelatorioJornada() {
  // Buscar todos os contatos
  const { data: contatos, isLoading: loadingContatos } = useQuery({
    queryKey: ['relatorio-jornada-contatos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatos')
        .select('id, nome, telefone, cidade, tipo, created_at, ultima_interacao_em, valor_total_gasto')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar orçamentos
  const { data: orcamentos, isLoading: loadingOrcamentos } = useQuery({
    queryKey: ['relatorio-jornada-orcamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, contato_id, cliente_telefone, status, total_com_desconto, total_geral, created_at, status_updated_at');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar pedidos
  const { data: pedidos, isLoading: loadingPedidos } = useQuery({
    queryKey: ['relatorio-jornada-pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id, 
          orcamento_id, 
          status_producao, 
          created_at,
          orcamento:orcamentos(contato_id, cliente_telefone)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar instalações
  const { data: instalacoes, isLoading: loadingInstalacoes } = useQuery({
    queryKey: ['relatorio-jornada-instalacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instalacoes')
        .select(`
          id, 
          pedido_id, 
          status, 
          data_agendada, 
          data_realizada,
          pedido:pedidos(orcamento:orcamentos(contato_id, cliente_telefone))
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const relatorio = useMemo<RelatorioJornadaData | null>(() => {
    if (!contatos || !orcamentos || !pedidos || !instalacoes) return null;

    const agora = new Date();
    const contatosPorEstagio: Record<string, ContatoNoEstagio[]> = {};
    ESTAGIOS_ORDEM.forEach(e => { contatosPorEstagio[e.id] = []; });

    // Mapear orçamentos por contato
    const orcamentosPorContato = new Map<string, typeof orcamentos[0][]>();
    orcamentos.forEach(orc => {
      const key = orc.contato_id || orc.cliente_telefone;
      if (!orcamentosPorContato.has(key)) {
        orcamentosPorContato.set(key, []);
      }
      orcamentosPorContato.get(key)!.push(orc);
    });

    // Mapear pedidos por contato
    const pedidosPorContato = new Map<string, typeof pedidos[0][]>();
    pedidos.forEach(ped => {
      const contato = ped.orcamento as any;
      const key = contato?.contato_id || contato?.cliente_telefone;
      if (key) {
        if (!pedidosPorContato.has(key)) {
          pedidosPorContato.set(key, []);
        }
        pedidosPorContato.get(key)!.push(ped);
      }
    });

    // Mapear instalações por contato
    const instalacoesPorContato = new Map<string, typeof instalacoes[0][]>();
    instalacoes.forEach(inst => {
      const pedido = inst.pedido as any;
      const orcamento = pedido?.orcamento as any;
      const key = orcamento?.contato_id || orcamento?.cliente_telefone;
      if (key) {
        if (!instalacoesPorContato.has(key)) {
          instalacoesPorContato.set(key, []);
        }
        instalacoesPorContato.get(key)!.push(inst);
      }
    });

    // Determinar estágio de cada contato
    contatos.forEach(contato => {
      const key = contato.id;
      const orcsContato = orcamentosPorContato.get(key) || orcamentosPorContato.get(contato.telefone || '');
      const pedsContato = pedidosPorContato.get(key) || pedidosPorContato.get(contato.telefone || '');
      const instsContato = instalacoesPorContato.get(key) || instalacoesPorContato.get(contato.telefone || '');

      let estagio = 'lead';
      let dataEstagio = new Date(contato.created_at);
      let valorTotal = 0;

      // Verificar instalações realizadas
      const instRealizada = instsContato?.find(i => i.status === 'realizada');
      if (instRealizada) {
        estagio = 'instalacao';
        dataEstagio = new Date(instRealizada.data_realizada || instRealizada.data_agendada);
      }
      // Verificar instalações agendadas ou pedidos prontos
      else if (instsContato?.some(i => i.status === 'agendada') || 
               pedsContato?.some(p => ['pronto_instalacao', 'pronto_entrega'].includes(p.status_producao))) {
        estagio = 'instalacao';
        const pedPronto = pedsContato?.find(p => ['pronto_instalacao', 'pronto_entrega'].includes(p.status_producao));
        if (pedPronto) dataEstagio = new Date(pedPronto.created_at);
      }
      // Verificar pedidos em produção
      else if (pedsContato?.some(p => !['entregue', 'cancelado'].includes(p.status_producao))) {
        estagio = 'producao';
        const ped = pedsContato.find(p => !['entregue', 'cancelado'].includes(p.status_producao));
        if (ped) dataEstagio = new Date(ped.created_at);
      }
      // Verificar pagamentos
      else if (orcsContato?.some(o => ['pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(o.status))) {
        estagio = 'pagamento';
        const orc = orcsContato.find(o => ['pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(o.status));
        if (orc) dataEstagio = new Date(orc.status_updated_at || orc.created_at);
      }
      // Verificar negociação
      else if (orcsContato?.some(o => ['enviado', 'sem_resposta'].includes(o.status))) {
        estagio = 'negociacao';
        const orc = orcsContato.find(o => ['enviado', 'sem_resposta'].includes(o.status));
        if (orc) dataEstagio = new Date(orc.status_updated_at || orc.created_at);
      }
      // Verificar orçamentos
      else if (orcsContato && orcsContato.length > 0) {
        estagio = 'orcamento';
        dataEstagio = new Date(orcsContato[0].created_at);
      }

      // Calcular valor total dos orçamentos
      orcsContato?.forEach(orc => {
        valorTotal += orc.total_com_desconto || orc.total_geral || 0;
      });

      const diasNoEstagio = differenceInDays(agora, dataEstagio);

      contatosPorEstagio[estagio].push({
        id: contato.id,
        nome: contato.nome,
        telefone: contato.telefone,
        cidade: contato.cidade,
        estagioAtual: estagio,
        diasNoEstagio,
        valorTotal,
        ultimaAtividade: contato.ultima_interacao_em ? new Date(contato.ultima_interacao_em) : null
      });
    });

    // Calcular funil
    const funil: EstagioFunil[] = ESTAGIOS_ORDEM.map((estagioConfig, index) => {
      const contatosEstagio = contatosPorEstagio[estagioConfig.id];
      const quantidade = contatosEstagio.length;
      const valor = contatosEstagio.reduce((sum, c) => sum + c.valorTotal, 0);
      const tempoMedio = quantidade > 0 
        ? contatosEstagio.reduce((sum, c) => sum + c.diasNoEstagio, 0) / quantidade 
        : 0;

      // Conversão em relação ao estágio anterior
      let conversaoAnterior: number | null = null;
      if (index > 0) {
        const qtdAnterior = contatosPorEstagio[ESTAGIOS_ORDEM[index - 1].id].length;
        if (qtdAnterior > 0) {
          conversaoAnterior = (quantidade / qtdAnterior) * 100;
        }
      }

      return {
        id: estagioConfig.id,
        label: estagioConfig.label,
        quantidade,
        valor,
        conversaoAnterior,
        tempoMedio: Math.round(tempoMedio),
        color: estagioConfig.color
      };
    });

    // Métricas gerais
    const totalContatos = contatos.length;
    const valorTotalPipeline = funil.reduce((sum, e) => sum + e.valor, 0);
    const contatosInstalacao = contatosPorEstagio['instalacao'].length;
    const conversaoGeral = totalContatos > 0 ? (contatosInstalacao / totalContatos) * 100 : 0;
    const tempoMedioTotal = funil.reduce((sum, e) => sum + e.tempoMedio, 0) / funil.length;

    return {
      funil,
      contatosPorEstagio,
      totalContatos,
      valorTotalPipeline,
      conversaoGeral,
      tempoMedioTotal
    };
  }, [contatos, orcamentos, pedidos, instalacoes]);

  const isLoading = loadingContatos || loadingOrcamentos || loadingPedidos || loadingInstalacoes;

  return {
    data: relatorio,
    isLoading
  };
}
