import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SugestaoOrcamento {
  orcamentoId: string;
  codigo: string;
  clienteNome: string;
  valorTotal: number;
  similaridade: number; // 0-100
  motivoMatch: string;
}

export interface SugestaoContaReceber {
  contaId: string;
  parcelaId: string;
  clienteNome: string;
  numeroParcela: number;
  valorParcela: number;
  dataVencimento: string;
  orcamentoCodigo: string | null;
  similaridade: number;
  motivoMatch: string;
}

export interface SugestaoContaPagar {
  contaId: string;
  descricao: string;
  fornecedor: string | null;
  valor: number;
  dataVencimento: string;
  orcamentoCodigo: string | null;
  similaridade: number;
  motivoMatch: string;
}

interface MovimentacaoParaSugestao {
  id: string;
  descricao: string;
  valor: number;
  tipo: string | null;
  data_movimentacao: string;
}

function calcularSimilaridadeTexto(texto1: string, texto2: string): number {
  const t1 = texto1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const t2 = texto2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Verificar palavras em comum
  const palavras1 = t1.split(/\s+/).filter(p => p.length > 2);
  const palavras2 = t2.split(/\s+/).filter(p => p.length > 2);
  
  if (palavras1.length === 0 || palavras2.length === 0) return 0;
  
  let matches = 0;
  for (const p1 of palavras1) {
    if (palavras2.some(p2 => p2.includes(p1) || p1.includes(p2))) {
      matches++;
    }
  }
  
  return Math.round((matches / Math.max(palavras1.length, palavras2.length)) * 100);
}

function calcularSimilaridadeValor(valor1: number, valor2: number): number {
  const diferenca = Math.abs(valor1 - valor2);
  const percentual = (diferenca / Math.max(valor1, valor2)) * 100;
  
  if (percentual === 0) return 100;
  if (percentual < 1) return 95;
  if (percentual < 5) return 80;
  if (percentual < 10) return 60;
  if (percentual < 20) return 40;
  return 0;
}

export function useSugestoesConciliacao(movimentacao: MovimentacaoParaSugestao | null) {
  // Buscar sugestões de parcelas a receber (para créditos)
  const { data: sugestoesRecebimento = [], isLoading: loadingRecebimento } = useQuery({
    queryKey: ['sugestoes-recebimento', movimentacao?.id],
    queryFn: async (): Promise<SugestaoContaReceber[]> => {
      if (!movimentacao || movimentacao.tipo !== 'credito') return [];

      const { data: parcelas } = await supabase
        .from('parcelas_receber')
        .select(`
          id, numero_parcela, valor, data_vencimento, status,
          conta_receber:contas_receber(
            id, cliente_nome, cliente_telefone,
            orcamento:orcamentos(id, codigo, cliente_nome)
          )
        `)
        .in('status', ['pendente', 'parcial', 'atrasado'])
        .order('data_vencimento', { ascending: true })
        .limit(50);

      if (!parcelas) return [];

      const sugestoes: SugestaoContaReceber[] = [];

      for (const parcela of parcelas) {
        const contaReceber = parcela.conta_receber as any;
        if (!contaReceber) continue;

        const clienteNome = contaReceber.cliente_nome || '';
        const valorParcela = Number(parcela.valor);
        const valorMov = Math.abs(movimentacao.valor);

        // Calcular similaridades
        const simValor = calcularSimilaridadeValor(valorMov, valorParcela);
        const simTexto = calcularSimilaridadeTexto(movimentacao.descricao, clienteNome);

        // Score combinado (valor pesa mais)
        const similaridade = Math.round((simValor * 0.7) + (simTexto * 0.3));

        // Só mostrar se tiver alguma relevância
        if (similaridade < 30) continue;

        const motivos: string[] = [];
        if (simValor >= 95) motivos.push('Valor exato');
        else if (simValor >= 80) motivos.push('Valor similar');
        if (simTexto >= 50) motivos.push('Nome do cliente');

        sugestoes.push({
          contaId: contaReceber.id,
          parcelaId: parcela.id,
          clienteNome,
          numeroParcela: parcela.numero_parcela,
          valorParcela,
          dataVencimento: parcela.data_vencimento,
          orcamentoCodigo: contaReceber.orcamento?.codigo || null,
          similaridade,
          motivoMatch: motivos.length > 0 ? motivos.join(', ') : 'Período compatível'
        });
      }

      return sugestoes
        .sort((a, b) => b.similaridade - a.similaridade)
        .slice(0, 5);
    },
    enabled: !!movimentacao && movimentacao.tipo === 'credito'
  });

  // Buscar sugestões de contas a pagar (para débitos)
  const { data: sugestoesPagamento = [], isLoading: loadingPagamento } = useQuery({
    queryKey: ['sugestoes-pagamento', movimentacao?.id],
    queryFn: async (): Promise<SugestaoContaPagar[]> => {
      if (!movimentacao || movimentacao.tipo !== 'debito') return [];

      const { data: contas } = await supabase
        .from('contas_pagar')
        .select(`
          id, descricao, valor, data_vencimento, status, fornecedor,
          orcamento:orcamentos(id, codigo)
        `)
        .in('status', ['pendente', 'atrasado'])
        .order('data_vencimento', { ascending: true })
        .limit(50);

      if (!contas) return [];

      const sugestoes: SugestaoContaPagar[] = [];
      const valorMov = Math.abs(movimentacao.valor);

      for (const conta of contas) {
        const valorConta = Number(conta.valor);

        // Calcular similaridades
        const simValor = calcularSimilaridadeValor(valorMov, valorConta);
        const simDescricao = calcularSimilaridadeTexto(movimentacao.descricao, conta.descricao);
        const simFornecedor = conta.fornecedor 
          ? calcularSimilaridadeTexto(movimentacao.descricao, conta.fornecedor) 
          : 0;

        // Score combinado
        const similaridade = Math.round(
          (simValor * 0.6) + 
          (Math.max(simDescricao, simFornecedor) * 0.4)
        );

        if (similaridade < 30) continue;

        const motivos: string[] = [];
        if (simValor >= 95) motivos.push('Valor exato');
        else if (simValor >= 80) motivos.push('Valor similar');
        if (simFornecedor >= 50) motivos.push('Fornecedor');
        if (simDescricao >= 50) motivos.push('Descrição');

        sugestoes.push({
          contaId: conta.id,
          descricao: conta.descricao,
          fornecedor: conta.fornecedor,
          valor: valorConta,
          dataVencimento: conta.data_vencimento,
          orcamentoCodigo: (conta.orcamento as any)?.codigo || null,
          similaridade,
          motivoMatch: motivos.length > 0 ? motivos.join(', ') : 'Período compatível'
        });
      }

      return sugestoes
        .sort((a, b) => b.similaridade - a.similaridade)
        .slice(0, 5);
    },
    enabled: !!movimentacao && movimentacao.tipo === 'debito'
  });

  // Buscar sugestões de orçamentos (baseado no nome do cliente na descrição)
  const { data: sugestoesOrcamento = [], isLoading: loadingOrcamento } = useQuery({
    queryKey: ['sugestoes-orcamento', movimentacao?.id],
    queryFn: async (): Promise<SugestaoOrcamento[]> => {
      if (!movimentacao) return [];

      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_geral, total_com_desconto, status')
        .in('status', ['enviado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (!orcamentos) return [];

      const sugestoes: SugestaoOrcamento[] = [];
      const valorMov = Math.abs(movimentacao.valor);

      for (const orc of orcamentos) {
        const valorOrc = orc.total_com_desconto ?? orc.total_geral ?? 0;

        const simNome = calcularSimilaridadeTexto(movimentacao.descricao, orc.cliente_nome);
        const simValor = calcularSimilaridadeValor(valorMov, valorOrc);

        // Score combinado
        const similaridade = Math.round((simNome * 0.6) + (simValor * 0.4));

        if (similaridade < 25) continue;

        const motivos: string[] = [];
        if (simNome >= 50) motivos.push('Nome do cliente');
        if (simValor >= 95) motivos.push('Valor igual ao orçamento');
        else if (simValor >= 60) motivos.push('Valor próximo');

        sugestoes.push({
          orcamentoId: orc.id,
          codigo: orc.codigo,
          clienteNome: orc.cliente_nome,
          valorTotal: valorOrc,
          similaridade,
          motivoMatch: motivos.length > 0 ? motivos.join(', ') : 'Possível relação'
        });
      }

      return sugestoes
        .sort((a, b) => b.similaridade - a.similaridade)
        .slice(0, 3);
    },
    enabled: !!movimentacao
  });

  return {
    sugestoesRecebimento,
    sugestoesPagamento,
    sugestoesOrcamento,
    isLoading: loadingRecebimento || loadingPagamento || loadingOrcamento,
    temSugestoes: sugestoesRecebimento.length > 0 || sugestoesPagamento.length > 0 || sugestoesOrcamento.length > 0
  };
}
