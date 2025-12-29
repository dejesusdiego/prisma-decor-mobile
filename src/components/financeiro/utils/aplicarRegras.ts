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
