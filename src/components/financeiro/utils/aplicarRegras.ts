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

// Verificar se a descrição corresponde à regra
function matchDescricao(descricao: string, padrao: string): boolean {
  return descricao.toLowerCase().includes(padrao.toLowerCase());
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

// Regras padrão sugeridas
export const REGRAS_SUGERIDAS = [
  { nome: 'Tarifas Bancárias', descricao_contem: 'TARIFA', acao: 'ignorar' },
  { nome: 'IOF', descricao_contem: 'IOF', acao: 'ignorar' },
  { nome: 'TED Enviada (Tarifa)', descricao_contem: 'TED TARIFA', acao: 'ignorar' },
  { nome: 'Resgate RDB', descricao_contem: 'RESGATE RDB', acao: 'criar_lancamento' },
  { nome: 'Aplicação RDB', descricao_contem: 'APLICACAO RDB', acao: 'criar_lancamento' },
  { nome: 'Rendimento Poupança', descricao_contem: 'RENDIMENTO', acao: 'criar_lancamento' },
];
