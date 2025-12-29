import { useMemo } from 'react';
import { useContato, useAtividades, useOrcamentosDoContato } from '@/hooks/useCRMData';
import { useContatoFinanceiro, useContatoPedidos } from '@/hooks/useContatoFinanceiro';
import { differenceInDays, isBefore, addDays } from 'date-fns';

export type EstagioJornada = 'lead' | 'orcamento' | 'pagamento' | 'producao' | 'instalacao' | 'pos_venda';

export interface EstadoJornada {
  estagio: EstagioJornada;
  concluido: boolean;
  atual: boolean;
  info?: string;
}

export interface AlertaContextual {
  id: string;
  tipo: 'parcela_vencendo' | 'pedido_pronto' | 'sem_contato' | 'instalacao_pendente' | 'parcela_atrasada';
  titulo: string;
  descricao: string;
  prioridade: 'urgente' | 'alta' | 'normal';
  acao?: {
    label: string;
    href?: string;
  };
}

export interface TimelineExpandidaItem {
  id: string;
  tipo: 'atividade' | 'orcamento' | 'pagamento' | 'producao' | 'instalacao';
  data: Date;
  titulo: string;
  subtitulo?: string;
  iconType: string;
  status?: string;
  valor?: number;
  concluida?: boolean;
}

export interface JornadaCliente {
  estagioAtual: EstagioJornada;
  estagios: EstadoJornada[];
  alertas: AlertaContextual[];
  timelineExpandida: TimelineExpandidaItem[];
  isLoading: boolean;
}

export function useJornadaCliente(contatoId: string): JornadaCliente {
  const { data: contato, isLoading: loadingContato } = useContato(contatoId);
  const { data: atividades, isLoading: loadingAtividades } = useAtividades({ contatoId });
  const { data: orcamentos, isLoading: loadingOrcamentos } = useOrcamentosDoContato(contatoId);
  const { data: financeiro, isLoading: loadingFinanceiro } = useContatoFinanceiro(
    contatoId,
    contato?.telefone || null
  );
  const { data: pedidos, isLoading: loadingPedidos } = useContatoPedidos(
    contatoId,
    contato?.telefone || null
  );

  const isLoading = loadingContato || loadingAtividades || loadingOrcamentos || loadingFinanceiro || loadingPedidos;

  // Calcular estágio atual da jornada
  const { estagioAtual, estagios } = useMemo(() => {
    if (!contato) {
      return {
        estagioAtual: 'lead' as EstagioJornada,
        estagios: [] as EstadoJornada[]
      };
    }

    const temOrcamento = orcamentos && orcamentos.length > 0;
    const temPagamento = orcamentos?.some(o => 
      ['pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(o.status)
    );
    const temPedidoProducao = pedidos && pedidos.some(p => 
      ['aguardando_materiais', 'em_producao'].includes(p.status_producao)
    );
    const temPedidoPronto = pedidos && pedidos.some(p => 
      ['pronto_instalacao', 'pronto_entrega'].includes(p.status_producao)
    );
    const temPedidoEntregue = pedidos && pedidos.some(p => 
      ['entregue', 'instalado'].includes(p.status_producao)
    );
    const temInstalacaoAgendada = pedidos?.some(p => 
      p.instalacoes && p.instalacoes.some(i => i.status === 'agendada')
    );

    let atual: EstagioJornada = 'lead';
    
    if (temPedidoEntregue) {
      atual = 'pos_venda';
    } else if (temPedidoPronto || temInstalacaoAgendada) {
      atual = 'instalacao';
    } else if (temPedidoProducao) {
      atual = 'producao';
    } else if (temPagamento) {
      atual = 'pagamento';
    } else if (temOrcamento) {
      atual = 'orcamento';
    }

    const ordem: EstagioJornada[] = ['lead', 'orcamento', 'pagamento', 'producao', 'instalacao', 'pos_venda'];
    const indiceAtual = ordem.indexOf(atual);

    const estadosJornada: EstadoJornada[] = ordem.map((estagio, i) => ({
      estagio,
      concluido: i < indiceAtual,
      atual: i === indiceAtual,
      info: undefined
    }));

    // Adicionar info contextual
    if (temOrcamento) {
      const orcPendentes = orcamentos?.filter(o => !['pago', 'cancelado', 'recusado'].includes(o.status)).length || 0;
      const orcIdx = estadosJornada.findIndex(e => e.estagio === 'orcamento');
      if (orcIdx >= 0 && orcPendentes > 0) {
        estadosJornada[orcIdx].info = `${orcPendentes} pendente${orcPendentes > 1 ? 's' : ''}`;
      }
    }

    if (pedidos && pedidos.length > 0) {
      const emProducao = pedidos.filter(p => ['aguardando_materiais', 'em_producao'].includes(p.status_producao)).length;
      const prodIdx = estadosJornada.findIndex(e => e.estagio === 'producao');
      if (prodIdx >= 0 && emProducao > 0) {
        estadosJornada[prodIdx].info = `${emProducao} em produção`;
      }
    }

    return { estagioAtual: atual, estagios: estadosJornada };
  }, [contato, orcamentos, pedidos]);

  // Calcular alertas contextuais
  const alertas = useMemo<AlertaContextual[]>(() => {
    if (!contato) return [];

    const result: AlertaContextual[] = [];
    const hoje = new Date();

    // Verificar parcelas vencendo
    financeiro?.contasReceber.forEach(conta => {
      conta.parcelas?.forEach(parcela => {
        if (parcela.status === 'pendente') {
          const vencimento = new Date(parcela.data_vencimento);
          const diasParaVencer = differenceInDays(vencimento, hoje);
          
          if (diasParaVencer < 0) {
            result.push({
              id: `parcela-atrasada-${parcela.id}`,
              tipo: 'parcela_atrasada',
              titulo: 'Parcela atrasada',
              descricao: `Parcela ${parcela.numero_parcela} de R$ ${parcela.valor.toFixed(0)} está atrasada há ${Math.abs(diasParaVencer)} dias`,
              prioridade: 'urgente',
              acao: { label: 'Registrar Pagamento' }
            });
          } else if (diasParaVencer <= 3) {
            result.push({
              id: `parcela-vencendo-${parcela.id}`,
              tipo: 'parcela_vencendo',
              titulo: 'Parcela vencendo',
              descricao: `Parcela ${parcela.numero_parcela} de R$ ${parcela.valor.toFixed(0)} vence em ${diasParaVencer === 0 ? 'hoje' : `${diasParaVencer} dias`}`,
              prioridade: diasParaVencer === 0 ? 'urgente' : 'alta',
              acao: { label: 'Registrar Pagamento' }
            });
          }
        }
      });
    });

    // Verificar pedidos prontos para instalação
    pedidos?.forEach(pedido => {
      if (['pronto_instalacao', 'pronto_entrega'].includes(pedido.status_producao)) {
        const temInstalacao = pedido.instalacoes && pedido.instalacoes.some(i => i.status === 'agendada');
        if (!temInstalacao) {
          result.push({
            id: `pedido-pronto-${pedido.id}`,
            tipo: 'pedido_pronto',
            titulo: 'Pedido pronto',
            descricao: `Pedido ${pedido.numero_pedido} está pronto e aguarda instalação/entrega`,
            prioridade: 'alta',
            acao: { label: 'Agendar Instalação' }
          });
        }
      }
    });

    // Verificar tempo sem contato usando updated_at como fallback
    const ultimaInteracao = (contato as any).ultima_interacao_em || contato.updated_at;
    if (ultimaInteracao) {
      const diasSemContato = differenceInDays(hoje, new Date(ultimaInteracao));
      if (diasSemContato >= 14) {
        result.push({
          id: 'sem-contato',
          tipo: 'sem_contato',
          titulo: 'Sem contato recente',
          descricao: `Última interação há ${diasSemContato} dias`,
          prioridade: diasSemContato >= 30 ? 'alta' : 'normal',
          acao: { label: 'Criar Follow-up' }
        });
      }
    }

    return result.sort((a, b) => {
      const prioridadeOrdem = { urgente: 0, alta: 1, normal: 2 };
      return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
    });
  }, [contato, financeiro, pedidos]);

  // Criar timeline expandida com todos os eventos
  const timelineExpandida = useMemo<TimelineExpandidaItem[]>(() => {
    const items: TimelineExpandidaItem[] = [];

    // Adicionar atividades
    atividades?.forEach(atividade => {
      items.push({
        id: `ativ-${atividade.id}`,
        tipo: 'atividade',
        data: new Date(atividade.data_atividade),
        titulo: atividade.titulo,
        subtitulo: atividade.descricao || undefined,
        iconType: atividade.tipo,
        concluida: atividade.concluida
      });
    });

    // Adicionar orçamentos
    orcamentos?.forEach(orcamento => {
      items.push({
        id: `orc-${orcamento.id}`,
        tipo: 'orcamento',
        data: new Date(orcamento.created_at),
        titulo: `Orçamento ${orcamento.codigo}`,
        subtitulo: orcamento.endereco || undefined,
        iconType: 'orcamento',
        status: orcamento.status,
        valor: orcamento.total_com_desconto || orcamento.total_geral
      });
    });

    // Adicionar pagamentos (parcelas pagas)
    financeiro?.contasReceber.forEach(conta => {
      conta.parcelas?.forEach(parcela => {
        if (parcela.status === 'pago' && parcela.data_pagamento) {
          items.push({
            id: `pag-${parcela.id}`,
            tipo: 'pagamento',
            data: new Date(parcela.data_pagamento),
            titulo: `Pagamento recebido`,
            subtitulo: `Parcela ${parcela.numero_parcela} - ${conta.orcamento?.codigo || 'Avulso'}`,
            iconType: 'pagamento',
            valor: parcela.valor,
            concluida: true
          });
        }
      });
    });

    // Adicionar eventos de produção (entrada em produção)
    pedidos?.forEach(pedido => {
      items.push({
        id: `prod-${pedido.id}`,
        tipo: 'producao',
        data: new Date(pedido.data_entrada),
        titulo: `Pedido ${pedido.numero_pedido}`,
        subtitulo: `Entrada em produção`,
        iconType: 'producao',
        status: pedido.status_producao
      });

      // Adicionar instalações
      pedido.instalacoes?.forEach(inst => {
        items.push({
          id: `inst-${inst.id}`,
          tipo: 'instalacao',
          data: new Date(inst.data_agendada),
          titulo: `Instalação ${inst.status === 'realizada' ? 'realizada' : 'agendada'}`,
          subtitulo: `${pedido.numero_pedido} - ${inst.turno}`,
          iconType: 'instalacao',
          status: inst.status,
          concluida: inst.status === 'realizada'
        });
      });
    });

    // Ordenar por data decrescente
    return items.sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [atividades, orcamentos, financeiro, pedidos]);

  return {
    estagioAtual,
    estagios,
    alertas,
    timelineExpandida,
    isLoading
  };
}
