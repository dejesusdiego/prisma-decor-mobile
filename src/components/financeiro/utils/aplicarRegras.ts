import { supabase } from '@/integrations/supabase/client';

export interface RegrasConciliacao {
  id: string;
  nome: string;
  descricao_contem: string;
  acao: 'ignorar' | 'criar_lancamento';
  categoria_id: string | null;
  tipo_lancamento: string | null;
  ordem: number;
  ativo: boolean;
}

export interface MovimentacaoExtrato {
  id: string;
  descricao: string;
  valor: number;
  data_movimentacao: string;
  tipo: string;
  conciliado: boolean;
  ignorado: boolean;
}

export interface ResultadoAplicacao {
  movimentacaoId: string;
  regraId: string;
  regraAcao: 'ignorar' | 'criar_lancamento';
  lancamentoId?: string;
}

// Interfaces para análise de duplicados/parciais
export interface ParcelaParaAnalise {
  id: string;
  valor: number;
  data_vencimento: string;
  numero_parcela: number;
  cliente_nome: string;
  orcamento_codigo?: string;
}

export interface AlertaDuplicado {
  tipo: 'duplicado';
  movimentacoes: { id: string; descricao: string; data: string }[];
  valor: number;
  mensagem: string;
}

export interface AlertaParcial {
  tipo: 'parcial';
  movimentacao: { id: string; descricao: string; valor: number; data: string };
  parcela: ParcelaParaAnalise;
  percentual: number;
  diferenca: number;
  mensagem: string;
}

export interface AlertaAgrupado {
  tipo: 'agrupado';
  movimentacoes: { id: string; descricao: string; valor: number; data: string }[];
  parcela: ParcelaParaAnalise;
  somaValor: number;
  mensagem: string;
}

export interface AlertaExcedente {
  tipo: 'excedente';
  movimentacao: { id: string; descricao: string; valor: number; data: string };
  parcela: ParcelaParaAnalise;
  diferenca: number;
  mensagem: string;
}

export type AlertaReconciliacao = AlertaDuplicado | AlertaParcial | AlertaAgrupado | AlertaExcedente;

export interface AnaliseReconciliacao {
  duplicados: AlertaDuplicado[];
  parciais: AlertaParcial[];
  agrupados: AlertaAgrupado[];
  excedentes: AlertaExcedente[];
  totalAlertas: number;
}

// Buscar regras ativas ordenadas por ordem
export async function buscarRegrasAtivas(): Promise<RegrasConciliacao[]> {
  const { data, error } = await supabase
    .from('regras_conciliacao')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (error) throw error;
  return (data || []) as RegrasConciliacao[];
}

// Criar regras padrão para um usuário (se ainda não existirem)
export async function criarRegrasPadrao(userId: string): Promise<number> {
  // Verificar se o usuário já tem regras
  const { data: existentes } = await supabase
    .from('regras_conciliacao')
    .select('id')
    .eq('created_by_user_id', userId)
    .limit(1);

  // Se já tem regras, não criar
  if (existentes && existentes.length > 0) return 0;

  // Criar regras padrão
  const regrasParaInserir = REGRAS_PADRAO.map((r, idx) => ({
    ...r,
    ordem: idx,
    created_by_user_id: userId
  }));

  const { error } = await supabase
    .from('regras_conciliacao')
    .insert(regrasParaInserir);

  if (error) throw error;
  return regrasParaInserir.length;
}

// Regras padrão que serão criadas automaticamente
export const REGRAS_PADRAO = [
  { nome: 'Tarifas Bancárias', descricao_contem: 'TARIFA', acao: 'ignorar' as const, ativo: true },
  { nome: 'IOF', descricao_contem: 'IOF', acao: 'ignorar' as const, ativo: true },
  { nome: 'TED Tarifa', descricao_contem: 'TED TARIFA', acao: 'ignorar' as const, ativo: true },
  { nome: 'DOC Tarifa', descricao_contem: 'DOC TARIFA', acao: 'ignorar' as const, ativo: true },
  { nome: 'Taxa Manutenção', descricao_contem: 'MANUTENCAO', acao: 'ignorar' as const, ativo: true },
  { nome: 'Pacote Serviços', descricao_contem: 'PACOTE SERVICO', acao: 'ignorar' as const, ativo: true },
  { nome: 'Resgate RDB', descricao_contem: 'RESGATE RDB', acao: 'criar_lancamento' as const, tipo_lancamento: 'entrada', ativo: true },
  { nome: 'Aplicação RDB', descricao_contem: 'APLICACAO RDB', acao: 'criar_lancamento' as const, tipo_lancamento: 'saida', ativo: true },
  { nome: 'Resgate CDB', descricao_contem: 'RESGATE CDB', acao: 'criar_lancamento' as const, tipo_lancamento: 'entrada', ativo: true },
  { nome: 'Aplicação CDB', descricao_contem: 'APLICACAO CDB', acao: 'criar_lancamento' as const, tipo_lancamento: 'saida', ativo: true },
  { nome: 'Rendimento', descricao_contem: 'RENDIMENTO', acao: 'criar_lancamento' as const, tipo_lancamento: 'entrada', ativo: true },
  { nome: 'Juros Crédito', descricao_contem: 'JUROS CREDITO', acao: 'criar_lancamento' as const, tipo_lancamento: 'entrada', ativo: true },
];

// Verificar se a descrição corresponde à regra
function matchDescricao(descricao: string, padrao: string): boolean {
  return descricao.toLowerCase().includes(padrao.toLowerCase());
}

// Formatar data para exibição
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return dateStr;
  }
}

// Analisar movimentações para detectar duplicados, parciais, agrupados e excedentes
export function analisarDuplicadosParciais(
  movimentacoes: MovimentacaoExtrato[],
  parcelasPendentes: ParcelaParaAnalise[]
): AnaliseReconciliacao {
  const duplicados: AlertaDuplicado[] = [];
  const parciais: AlertaParcial[] = [];
  const agrupados: AlertaAgrupado[] = [];
  const excedentes: AlertaExcedente[] = [];

  // Filtrar apenas créditos pendentes
  const creditosPendentes = movimentacoes.filter(
    m => m.tipo === 'credito' && !m.conciliado && !m.ignorado
  );

  // 1. DETECTAR DUPLICADOS - movimentações com mesmo valor
  const valoresMap = new Map<number, MovimentacaoExtrato[]>();
  for (const mov of creditosPendentes) {
    const valor = Math.round(mov.valor * 100) / 100; // normalizar
    const lista = valoresMap.get(valor) || [];
    lista.push(mov);
    valoresMap.set(valor, lista);
  }

  for (const [valor, movs] of valoresMap.entries()) {
    if (movs.length > 1) {
      // Verificar se há parcela correspondente (pode ser pagamento válido de múltiplas parcelas)
      const parcelasMatch = parcelasPendentes.filter(p => Math.abs(p.valor - valor) < 1);
      
      // Se há menos parcelas do que movimentações do mesmo valor, provavelmente é duplicado
      if (parcelasMatch.length < movs.length) {
        duplicados.push({
          tipo: 'duplicado',
          movimentacoes: movs.map(m => ({
            id: m.id,
            descricao: m.descricao,
            data: formatDate(m.data_movimentacao)
          })),
          valor,
          mensagem: `${movs.length} movimentações de mesmo valor - possível duplicidade`
        });
      }
    }
  }

  // 2. DETECTAR PARCIAIS - valor entre 70% e 99% de uma parcela
  const idsJaUsados = new Set<string>();
  
  for (const mov of creditosPendentes) {
    for (const parcela of parcelasPendentes) {
      const percentual = (mov.valor / parcela.valor) * 100;
      const diferenca = parcela.valor - mov.valor;
      
      // Parcial: entre 70% e 99%
      if (percentual >= 70 && percentual < 99 && !idsJaUsados.has(mov.id)) {
        parciais.push({
          tipo: 'parcial',
          movimentacao: {
            id: mov.id,
            descricao: mov.descricao,
            valor: mov.valor,
            data: formatDate(mov.data_movimentacao)
          },
          parcela,
          percentual,
          diferenca,
          mensagem: `Valor recebido é ${percentual.toFixed(0)}% do esperado`
        });
        idsJaUsados.add(mov.id);
        break;
      }
      
      // Excedente: entre 101% e 130%
      if (percentual > 101 && percentual <= 130 && !idsJaUsados.has(mov.id)) {
        excedentes.push({
          tipo: 'excedente',
          movimentacao: {
            id: mov.id,
            descricao: mov.descricao,
            valor: mov.valor,
            data: formatDate(mov.data_movimentacao)
          },
          parcela,
          diferenca: mov.valor - parcela.valor,
          mensagem: `Valor recebido é ${percentual.toFixed(0)}% do esperado`
        });
        idsJaUsados.add(mov.id);
        break;
      }
    }
  }

  // 3. DETECTAR AGRUPADOS - duas movimentações que somam o valor de uma parcela
  for (const parcela of parcelasPendentes) {
    // Tentar combinações de 2 movimentações
    for (let i = 0; i < creditosPendentes.length; i++) {
      for (let j = i + 1; j < creditosPendentes.length; j++) {
        const mov1 = creditosPendentes[i];
        const mov2 = creditosPendentes[j];
        const soma = mov1.valor + mov2.valor;
        
        // Se a soma é aproximadamente igual ao valor da parcela
        if (Math.abs(soma - parcela.valor) < 5) { // tolerância de R$5
          // Verificar se essas movimentações não já são match exato de outras parcelas
          const mov1TemMatchExato = parcelasPendentes.some(p => Math.abs(p.valor - mov1.valor) < 1);
          const mov2TemMatchExato = parcelasPendentes.some(p => Math.abs(p.valor - mov2.valor) < 1);
          
          if (!mov1TemMatchExato && !mov2TemMatchExato) {
            agrupados.push({
              tipo: 'agrupado',
              movimentacoes: [
                { id: mov1.id, descricao: mov1.descricao, valor: mov1.valor, data: formatDate(mov1.data_movimentacao) },
                { id: mov2.id, descricao: mov2.descricao, valor: mov2.valor, data: formatDate(mov2.data_movimentacao) }
              ],
              parcela,
              somaValor: soma,
              mensagem: `2 depósitos somam o valor da parcela de ${parcela.cliente_nome}`
            });
          }
        }
      }
    }
  }

  return {
    duplicados,
    parciais,
    agrupados,
    excedentes,
    totalAlertas: duplicados.length + parciais.length + agrupados.length + excedentes.length
  };
}

// Aplicar regras a uma lista de movimentações pendentes
export async function aplicarRegrasMovimentacoes(
  movimentacoes: MovimentacaoExtrato[],
  regras: RegrasConciliacao[],
  userId: string
): Promise<ResultadoAplicacao[]> {
  const resultados: ResultadoAplicacao[] = [];

  for (const mov of movimentacoes) {
    // Pular se já conciliado ou ignorado
    if (mov.conciliado || mov.ignorado) continue;

    // Buscar primeira regra que corresponde
    for (const regra of regras) {
      if (!matchDescricao(mov.descricao, regra.descricao_contem)) continue;

      if (regra.acao === 'ignorar') {
        // Marcar como ignorado
        await supabase
          .from('movimentacoes_extrato')
          .update({ 
            ignorado: true,
            regra_aplicada_id: regra.id 
          })
          .eq('id', mov.id);

        resultados.push({
          movimentacaoId: mov.id,
          regraId: regra.id,
          regraAcao: 'ignorar'
        });
      } else if (regra.acao === 'criar_lancamento') {
        // Criar lançamento financeiro
        const { data: lancamento, error: lancError } = await supabase
          .from('lancamentos_financeiros')
          .insert({
            descricao: mov.descricao,
            valor: mov.valor,
            data_lancamento: mov.data_movimentacao,
            tipo: regra.tipo_lancamento || (mov.tipo === 'credito' ? 'entrada' : 'saida'),
            categoria_id: regra.categoria_id,
            created_by_user_id: userId
          })
          .select('id')
          .single();

        if (!lancError && lancamento) {
          // Vincular movimentação ao lançamento
          await supabase
            .from('movimentacoes_extrato')
            .update({ 
              lancamento_id: lancamento.id,
              conciliado: true,
              regra_aplicada_id: regra.id 
            })
            .eq('id', mov.id);

          resultados.push({
            movimentacaoId: mov.id,
            regraId: regra.id,
            regraAcao: 'criar_lancamento',
            lancamentoId: lancamento.id
          });
        }
      }

      // Parar após primeira regra aplicada
      break;
    }
  }

  return resultados;
}

// Alias for backwards compatibility (used in DialogRegrasConciliacao)
export const REGRAS_SUGERIDAS = REGRAS_PADRAO;
