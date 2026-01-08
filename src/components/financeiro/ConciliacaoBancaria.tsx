import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOnly } from '@/lib/dateOnly';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Link2,
  Link2Off,
  RefreshCw,
  Plus,
  Zap,
  Receipt,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { parseExtrato, autoMatch, DadosExtrato } from './utils/parserOFX';
import { buscarRegrasAtivas, aplicarRegrasMovimentacoes, criarRegrasPadrao, analisarDuplicadosParciais, AnaliseReconciliacao, ParcelaParaAnalise, ContaPagarParaAnalise } from './utils/aplicarRegras';
import { DialogConciliarManual } from './dialogs/DialogConciliarManual';
import { DialogPreviaExtrato } from './dialogs/DialogPreviaExtrato';
import { DialogRegrasConciliacao } from './dialogs/DialogRegrasConciliacao';
import { DialogCriarLancamentoDeExtrato } from './dialogs/DialogCriarLancamentoDeExtrato';
import { DialogGerenciarImportacoes } from './dialogs/DialogGerenciarImportacoes';
import { DialogConciliarComRecebimento } from './dialogs/DialogConciliarComRecebimento';
import { DialogConciliarComPagamento } from './dialogs/DialogConciliarComPagamento';
import { DialogConciliarComOrcamento } from './dialogs/DialogConciliarComOrcamento';
import { AlertasReconciliacao } from './AlertasReconciliacao';
import { AlertasOrcamentosConciliacao } from './AlertasOrcamentosConciliacao';
import { SugestoesConciliacao } from './SugestoesConciliacao';
import { DialogGerenciarPadroes } from './dialogs/DialogGerenciarPadroes';
import { DialogRevisaoImportacao } from './dialogs/DialogRevisaoImportacao';
import { usePadroesConciliacao } from '@/hooks/usePadroesConciliacao';
import { SugestaoOrcamento } from '@/hooks/useSugestoesConciliacao';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

type StatusFilter = 'todos' | 'conciliados' | 'pendentes' | 'ignorados';

export function ConciliacaoBancaria() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { verificarMatchesAlta } = usePadroesConciliacao();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extratoSelecionado, setExtratoSelecionado] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [dialogConciliarOpen, setDialogConciliarOpen] = useState(false);
  const [movimentacaoParaConciliar, setMovimentacaoParaConciliar] = useState<any>(null);
  
  // Preview state
  const [previaOpen, setPreviaOpen] = useState(false);
  const [dadosPrevia, setDadosPrevia] = useState<DadosExtrato | null>(null);
  const [arquivoPrevia, setArquivoPrevia] = useState<File | null>(null);
  
  // Criar lançamento state
  const [criarLancamentoOpen, setCriarLancamentoOpen] = useState(false);
  const [movimentacaoParaLancamento, setMovimentacaoParaLancamento] = useState<any>(null);

  // Conciliar com recebimento state
  const [recebimentoOpen, setRecebimentoOpen] = useState(false);
  const [movimentacaoParaRecebimento, setMovimentacaoParaRecebimento] = useState<any>(null);
  const [parcelaParaRecebimento, setParcelaParaRecebimento] = useState<any>(null);
  const [isPagamentoParcial, setIsPagamentoParcial] = useState(false);

  // Análise de duplicados/parciais
  const [analiseReconciliacao, setAnaliseReconciliacao] = useState<AnaliseReconciliacao | null>(null);

  // Conciliar com pagamento (débitos) state
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [movimentacaoParaPagamento, setMovimentacaoParaPagamento] = useState<any>(null);
  const [contaParaPagamento, setContaParaPagamento] = useState<any>(null);

  // Conciliar com orçamento (vincular diretamente)
  const [orcamentoOpen, setOrcamentoOpen] = useState(false);
  const [movimentacaoParaOrcamento, setMovimentacaoParaOrcamento] = useState<any>(null);

  // Wizard de revisão pós-importação
  const [revisaoOpen, setRevisaoOpen] = useState(false);
  const [extratoParaRevisao, setExtratoParaRevisao] = useState<{ id: string; nome: string } | null>(null);
  const [orcamentoParaVincular, setOrcamentoParaVincular] = useState<SugestaoOrcamento | null>(null);

  // Criar regras padrão ao carregar (uma vez por usuário)
  useEffect(() => {
    if (user?.id) {
      criarRegrasPadrao(user.id).then(count => {
        if (count > 0) {
          toast.success(`${count} regras padrão criadas automaticamente`);
          queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] });
        }
      }).catch(() => {
        // Silently fail - user may already have rules
      });
    }
  }, [user?.id]);

  // Helper para buscar extratos
  const fetchExtratos = async (orgId: string): Promise<any[]> => {
    const table = supabase.from('extratos_bancarios') as any;
    const result = await table
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  };

  // Buscar extratos importados
  const { data: extratos = [] } = useQuery({
    queryKey: ['extratos-bancarios', organizationId],
    queryFn: () => fetchExtratos(organizationId!),
    enabled: !!organizationId
  });

  // Helper para buscar movimentações
  const fetchMovimentacoes = async (extratoId: string, orgId: string): Promise<any[]> => {
    const table = supabase.from('movimentacoes_extrato') as any;
    const result = await table
      .select(`
        *,
        lancamento:lancamentos_financeiros(id, descricao, valor, data_lancamento)
      `)
      .eq('extrato_id', extratoId)
      .eq('organization_id', orgId)
      .order('data_movimentacao', { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  };

  // Buscar movimentações do extrato selecionado
  const { data: movimentacoes = [], isLoading: loadingMovimentacoes } = useQuery({
    queryKey: ['movimentacoes-extrato', extratoSelecionado, organizationId],
    queryFn: () => fetchMovimentacoes(extratoSelecionado!, organizationId!),
    enabled: !!extratoSelecionado && !!organizationId
  });

  // Estatísticas
  const estatisticas = {
    total: movimentacoes.length,
    conciliados: movimentacoes.filter(m => m.conciliado).length,
    pendentes: movimentacoes.filter(m => !m.conciliado && !m.ignorado).length,
    ignorados: movimentacoes.filter(m => m.ignorado).length,
  };

  const percentualConciliado = estatisticas.total > 0 
    ? (estatisticas.conciliados / estatisticas.total) * 100 
    : 0;

  // Processar arquivo para prévia
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      file.text().then(content => {
        try {
          const dados = parseExtrato(content, file.name);
          setDadosPrevia(dados);
          setArquivoPrevia(file);
          setPreviaOpen(true);
        } catch (err: any) {
          toast.error('Erro ao processar arquivo: ' + err.message);
        }
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload após confirmação da prévia
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!dadosPrevia || !arquivoPrevia || !user || !organizationId) throw new Error('Dados inválidos');

      let extratoId: string | null = null;

      try {
        const { data: extrato, error: extratoError } = await supabase
          .from('extratos_bancarios')
          .insert({
            nome_arquivo: arquivoPrevia.name,
            banco: dadosPrevia.banco,
            conta: dadosPrevia.conta,
            data_inicio: dadosPrevia.data_inicio,
            data_fim: dadosPrevia.data_fim,
            status: 'concluido',
            created_by_user_id: user.id,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (extratoError) throw extratoError;
        extratoId = extrato.id;

        const movimentacoesInsert = dadosPrevia.movimentacoes
          .filter(m => m.data_movimentacao && Number.isFinite(m.valor))
          .map(m => ({
            extrato_id: extrato.id,
            data_movimentacao: m.data_movimentacao,
            descricao: m.descricao || 'Sem descrição',
            valor: m.valor,
            tipo: m.tipo,
            numero_documento: m.numero_documento,
            organization_id: organizationId,
          }));

        if (movimentacoesInsert.length === 0) {
          throw new Error('Nenhuma movimentação válida');
        }

        const { error: movError } = await supabase
          .from('movimentacoes_extrato')
          .insert(movimentacoesInsert);

        if (movError) throw movError;

        // Aplicar regras automáticas
        const regras = await buscarRegrasAtivas();
        if (regras.length > 0) {
          const { data: movsCriadas } = await supabase
            .from('movimentacoes_extrato')
            .select('id, descricao, valor, data_movimentacao, tipo, conciliado, ignorado')
            .eq('extrato_id', extrato.id);

          if (movsCriadas) {
            const resultados = await aplicarRegrasMovimentacoes(movsCriadas as any, regras, user.id);
            if (resultados.length > 0) {
              toast.info(`${resultados.length} regra(s) aplicada(s) automaticamente`);
            }
          }
        }

        return { extrato, count: movimentacoesInsert.length };
      } catch (err) {
        if (extratoId) {
          await supabase.from('extratos_bancarios').delete().eq('id', extratoId);
        }
        throw err;
      }
    },
    onSuccess: async (data) => {
      toast.success(`Extrato importado com ${data.count} movimentações`);
      queryClient.invalidateQueries({ queryKey: ['extratos-bancarios'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      setExtratoSelecionado(data.extrato.id);
      setPreviaOpen(false);
      setDadosPrevia(null);
      setArquivoPrevia(null);

      // Abrir wizard de revisão pós-importação
      setExtratoParaRevisao({ id: data.extrato.id, nome: arquivoPrevia?.name || 'Extrato' });
      setRevisaoOpen(true);
    },
    onError: (error: Error) => {
      toast.error('Erro ao importar: ' + error.message);
    },
  });

  // Buscar parcelas a receber pendentes para conciliação inteligente
  const { data: parcelasPendentes = [] } = useQuery({
    queryKey: ['parcelas-para-conciliacao', extratoSelecionado, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const extrato = extratos.find(e => e.id === extratoSelecionado);
      if (!extrato) return [];

      const { data, error } = await supabase
        .from('parcelas_receber')
        .select(`
          id, numero_parcela, valor, data_vencimento, status,
          conta_receber:contas_receber(
            id, cliente_nome, cliente_telefone, orcamento_id, organization_id,
            orcamento:orcamentos(id, codigo, cliente_nome)
          )
        `)
        .eq('status', 'pendente')
        .gte('data_vencimento', extrato.data_inicio || '2020-01-01')
        .lte('data_vencimento', extrato.data_fim || '2099-12-31');

      if (error) throw error;
      
      // Filtrar por organization_id via conta_receber
      const filtered = (data || []).filter((p: any) => 
        p.conta_receber?.organization_id === organizationId
      );

      
      // Atualizar análise quando parcelas carregarem
      if (filtered.length > 0 && movimentacoes.length > 0) {
        const parcelasParaAnalise: ParcelaParaAnalise[] = filtered.map((p: any) => ({
          id: p.id,
          valor: Number(p.valor),
          data_vencimento: p.data_vencimento,
          numero_parcela: p.numero_parcela,
          cliente_nome: (p.conta_receber as any)?.cliente_nome || 'Cliente',
          orcamento_codigo: (p.conta_receber as any)?.orcamento?.codigo
        }));
        
        const movParaAnalise = movimentacoes.map(m => ({
          id: m.id,
          descricao: m.descricao,
          valor: Number(m.valor),
          data_movimentacao: m.data_movimentacao,
          tipo: m.tipo || 'debito',
          conciliado: m.conciliado,
          ignorado: m.ignorado
        }));
        
        const analise = analisarDuplicadosParciais(movParaAnalise, parcelasParaAnalise);
        setAnaliseReconciliacao(analise);
      }
      
      return filtered;
    },
    enabled: !!extratoSelecionado && !!organizationId
  });

  // Buscar contas a pagar pendentes para conciliação de débitos
  const { data: contasPagarPendentes = [] } = useQuery({
    queryKey: ['contas-pagar-para-conciliacao', extratoSelecionado, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const extrato = extratos.find(e => e.id === extratoSelecionado);
      if (!extrato) return [];

      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          id, descricao, valor, data_vencimento, status, fornecedor, orcamento_id,
          orcamento:orcamentos(id, codigo, cliente_nome),
          categoria:categorias_financeiras(id, nome)
        `)
        .eq('organization_id', organizationId)
        .in('status', ['pendente', 'atrasado'])
        .gte('data_vencimento', extrato.data_inicio || '2020-01-01')
        .lte('data_vencimento', extrato.data_fim || '2099-12-31');

      if (error) throw error;
      return data || [];
    },
    enabled: !!extratoSelecionado && !!organizationId
  });

  // Auto-conciliar (agora com parcelas também)
  const autoConciliarMutation = useMutation({
    mutationFn: async () => {
      if (!extratoSelecionado || !user) return { lancamentos: 0, parcelas: 0 };
      
      const movPendentes = movimentacoes.filter(m => !m.conciliado && !m.ignorado && m.tipo === 'credito');
      const extrato = extratos.find(e => e.id === extratoSelecionado);
      if (!extrato) return { lancamentos: 0, parcelas: 0 };

      let parcelasCount = 0;
      let lancamentosCount = 0;

      // 1. PRIMEIRO: Tentar match com parcelas a receber (créditos)
      for (const mov of movPendentes) {
        const parcelaMatch = parcelasPendentes.find(p => 
          Math.abs(Number(p.valor) - Number(mov.valor)) < 1
        );

        if (parcelaMatch && parcelaMatch.conta_receber) {
          // Criar lançamento e registrar recebimento
          const { data: lancamento } = await supabase
            .from('lancamentos_financeiros')
            .insert({
              descricao: `Recebimento: ${parcelaMatch.conta_receber.cliente_nome} - Parcela ${parcelaMatch.numero_parcela}`,
              valor: mov.valor,
              data_lancamento: mov.data_movimentacao,
              tipo: 'entrada',
              parcela_receber_id: parcelaMatch.id,
              created_by_user_id: user.id
            })
            .select('id')
            .single();

          if (lancamento) {
            // Atualizar movimentação
            await supabase
              .from('movimentacoes_extrato')
              .update({ lancamento_id: lancamento.id, conciliado: true })
              .eq('id', mov.id);

            // Atualizar parcela
            await supabase
              .from('parcelas_receber')
              .update({ status: 'pago', data_pagamento: mov.data_movimentacao })
              .eq('id', parcelaMatch.id);

            // Atualizar conta_receber
            const { data: contaAtual } = await supabase
              .from('contas_receber')
              .select('valor_pago, valor_total')
              .eq('id', parcelaMatch.conta_receber.id)
              .single();

            if (contaAtual) {
              const novoValorPago = (contaAtual.valor_pago || 0) + mov.valor;
              await supabase
                .from('contas_receber')
                .update({
                  valor_pago: novoValorPago,
                  status: novoValorPago >= contaAtual.valor_total ? 'pago' : 'parcial'
                })
                .eq('id', parcelaMatch.conta_receber.id);
            }

            parcelasCount++;
          }
        }
      }

      // 2. DEPOIS: Match com lançamentos existentes (restantes)
      const movRestantes = movimentacoes.filter(m => !m.conciliado && !m.ignorado);
      
      const { data: lancamentos } = await supabase
        .from('lancamentos_financeiros')
        .select('id, data_lancamento, descricao, valor')
        .gte('data_lancamento', extrato.data_inicio)
        .lte('data_lancamento', extrato.data_fim);
      
      if (lancamentos && lancamentos.length > 0) {
        const { data: jaConciliados } = await supabase
          .from('movimentacoes_extrato')
          .select('lancamento_id')
          .not('lancamento_id', 'is', null);
        
        const idsJaConciliados = new Set((jaConciliados || []).map(m => m.lancamento_id));
        const lancamentosDisponiveis = lancamentos.filter(l => !idsJaConciliados.has(l.id));
        
        const movParaMatch = movRestantes.map(m => ({
          id: m.id,
          data: m.data_movimentacao,
          valor: Number(m.valor),
          descricao: m.descricao
        }));
        
        const lancParaMatch = lancamentosDisponiveis.map(l => ({
          id: l.id,
          data: l.data_lancamento,
          valor: Number(l.valor),
          descricao: l.descricao
        }));
        
        const matches = autoMatch(movParaMatch, lancParaMatch);
        
        for (const match of matches) {
          await supabase
            .from('movimentacoes_extrato')
            .update({ lancamento_id: match.lancamentoId, conciliado: true })
            .eq('id', match.movimentacaoId);
        }
        
        lancamentosCount = matches.length;
      }
      
      return { lancamentos: lancamentosCount, parcelas: parcelasCount };
    },
    onSuccess: (result) => {
      const total = (result?.lancamentos || 0) + (result?.parcelas || 0);
      if (total > 0) {
        const msgs: string[] = [];
        if (result?.parcelas) msgs.push(`${result.parcelas} recebimento(s)`);
        if (result?.lancamentos) msgs.push(`${result.lancamentos} lançamento(s)`);
        toast.success(`Conciliados: ${msgs.join(', ')}`);
      } else {
        toast.info('Nenhuma correspondência encontrada');
      }
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas-para-conciliacao'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
    }
  });

  // Aplicar regras aos pendentes
  const aplicarRegrasMutation = useMutation({
    mutationFn: async () => {
      if (!user) return 0;
      const regras = await buscarRegrasAtivas();
      const pendentes = movimentacoes.filter(m => !m.conciliado && !m.ignorado);
      const resultados = await aplicarRegrasMovimentacoes(pendentes as any, regras, user.id);
      return resultados.length;
    },
    onSuccess: (count) => {
      if (count > 0) {
        toast.success(`${count} regra(s) aplicada(s)`);
      } else {
        toast.info('Nenhuma regra correspondeu');
      }
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
    }
  });

  // Ignorar movimentação
  const ignorarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movimentacoes_extrato')
        .update({ ignorado: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Movimentação ignorada');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
    }
  });

  // Desfazer
  const desfazerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movimentacoes_extrato')
        .update({ lancamento_id: null, conciliado: false, ignorado: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Desfeito');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
    }
  });

  const handleCriarLancamento = (mov: any) => {
    setMovimentacaoParaLancamento(mov);
    setCriarLancamentoOpen(true);
  };

  // Buscar parcela correspondente para botão de recebimento
  const buscarParcelaMatch = (mov: any) => {
    if (mov.tipo !== 'credito') return null;
    return parcelasPendentes.find(p => Math.abs(Number(p.valor) - Number(mov.valor)) < 1);
  };

  // Buscar conta a pagar correspondente para botão de pagamento (débitos)
  const buscarContaPagarMatch = (mov: any) => {
    if (mov.tipo !== 'debito') return null;
    return contasPagarPendentes.find(cp => Math.abs(Number(cp.valor) - Math.abs(Number(mov.valor))) < 1);
  };

  const handleRegistrarRecebimento = (mov: any, parcela: any, isParcial = false) => {
    setMovimentacaoParaRecebimento(mov);
    setParcelaParaRecebimento(parcela);
    setIsPagamentoParcial(isParcial);
    setRecebimentoOpen(true);
  };

  const handleRegistrarPagamento = (mov: any, contaPagar: any) => {
    setMovimentacaoParaPagamento(mov);
    setContaParaPagamento(contaPagar);
    setPagamentoOpen(true);
  };

  // Handler para vincular pagamento diretamente ao orçamento
  const handleVincularOrcamento = (orcamento: SugestaoOrcamento, mov: any) => {
    setOrcamentoParaVincular(orcamento);
    setMovimentacaoParaOrcamento(mov);
    setOrcamentoOpen(true);
  };

  // Buscar código do orçamento relacionado a uma movimentação
  const getOrcamentoRelacionado = (mov: any) => {
    if (!mov.lancamento) return null;
    
    // Via parcela_receber → conta_receber → orcamento
    const parcelaMatch = parcelasPendentes.find(p => {
      // Verificar se o lançamento está vinculado a esta parcela
      return mov.lancamento?.parcela_receber_id === p.id;
    });
    
    if (parcelaMatch?.conta_receber?.orcamento?.codigo) {
      return parcelaMatch.conta_receber.orcamento.codigo;
    }
    
    // Via conta_pagar → orcamento  
    const contaMatch = contasPagarPendentes.find(cp => 
      mov.lancamento?.conta_pagar_id === cp.id
    );
    
    if (contaMatch?.orcamento?.codigo) {
      return contaMatch.orcamento.codigo;
    }
    
    return null;
  };

  const movimentacoesFiltradas = movimentacoes.filter(m => {
    if (statusFilter === 'conciliados') return m.conciliado;
    if (statusFilter === 'pendentes') return !m.conciliado && !m.ignorado;
    if (statusFilter === 'ignorados') return m.ignorado;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Conciliação Bancária
          </CardTitle>
          <CardDescription>
            Importe extratos OFX/CSV e concilie com os lançamentos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ofx,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-4 w-4 mr-2" />
              Importar Extrato
            </Button>
            
            <DialogGerenciarImportacoes onSelectExtrato={setExtratoSelecionado} />
            <DialogRegrasConciliacao />
            <DialogGerenciarPadroes />
            
            {extratos.length > 0 && (
              <Select value={extratoSelecionado || ''} onValueChange={setExtratoSelecionado}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecione um extrato" />
                </SelectTrigger>
                <SelectContent>
                  {extratos.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_arquivo} ({format(new Date(e.created_at), "dd/MM", { locale: ptBR })})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas e ações */}
      {extratoSelecionado && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Conciliados</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.conciliados}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-amber-600">{estatisticas.pendentes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Ignorados</p>
                <p className="text-2xl font-bold text-muted-foreground">{estatisticas.ignorados}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{percentualConciliado.toFixed(0)}%</span>
              </div>
              <Progress value={percentualConciliado} className="h-2" />
            </CardContent>
          </Card>

          {/* Alertas de Duplicados/Parciais */}
          <AlertasReconciliacao analise={analiseReconciliacao} />
          
          {/* Alertas de Orçamentos */}
          <AlertasOrcamentosConciliacao />

          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => autoConciliarMutation.mutate()}
                disabled={autoConciliarMutation.isPending || estatisticas.pendentes === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoConciliarMutation.isPending ? 'animate-spin' : ''}`} />
                Auto-Conciliar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => aplicarRegrasMutation.mutate()}
                disabled={aplicarRegrasMutation.isPending || estatisticas.pendentes === 0}
              >
                <Zap className="h-4 w-4 mr-2" />
                Aplicar Regras
              </Button>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="conciliados">Conciliados</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="ignorados">Ignorados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {loadingMovimentacoes ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma movimentação</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Vinculado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoesFiltradas.map((mov) => (
                        <TableRow key={mov.id} className={mov.ignorado ? 'opacity-50' : ''}>
                          <TableCell>
                            {mov.conciliado ? (
                              <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                            ) : mov.ignorado ? (
                              <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Ign</Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600"><AlertCircle className="h-3 w-3 mr-1" />Pend</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDateOnly(mov.data_movimentacao, 'dd/MM/yy')}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{mov.descricao}</TableCell>
                          <TableCell className={`text-right font-medium ${mov.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                            {mov.tipo === 'credito' ? '+' : '-'}{formatCurrency(Number(mov.valor))}
                          </TableCell>
                          <TableCell>
                            {mov.lancamento ? (
                              <span className="text-xs">{mov.lancamento.descricao}</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                {!mov.conciliado && !mov.ignorado && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleCriarLancamento(mov)}>
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Criar lançamento</TooltipContent>
                                    </Tooltip>
                                    {/* Botão de recebimento se houver parcela match (créditos) */}
                                    {(() => {
                                      const parcelaMatch = buscarParcelaMatch(mov);
                                      if (parcelaMatch) {
                                        return (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="text-green-600"
                                                onClick={() => handleRegistrarRecebimento(mov, parcelaMatch)}
                                              >
                                                <Receipt className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Recebimento: {parcelaMatch.conta_receber?.cliente_nome}
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      }
                                      return null;
                                    })()}
                                    {/* Botão de pagamento se houver conta a pagar match (débitos) */}
                                    {(() => {
                                      const contaMatch = buscarContaPagarMatch(mov);
                                      if (contaMatch) {
                                        return (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => handleRegistrarPagamento(mov, contaMatch)}
                                              >
                                                <CreditCard className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Pagamento: {contaMatch.descricao}
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => { setMovimentacaoParaConciliar(mov); setDialogConciliarOpen(true); }}>
                                          <Link2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Conciliar</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => ignorarMutation.mutate(mov.id)}>
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Ignorar</TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                                {(mov.conciliado || mov.ignorado) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => desfazerMutation.mutate(mov.id)}>
                                        <Link2Off className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Desfazer</TooltipContent>
                                  </Tooltip>
                                )}
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialogs */}
      <DialogConciliarManual
        open={dialogConciliarOpen}
        onOpenChange={setDialogConciliarOpen}
        movimentacao={movimentacaoParaConciliar}
      />
      
      <DialogPreviaExtrato
        open={previaOpen}
        onOpenChange={setPreviaOpen}
        dados={dadosPrevia}
        nomeArquivo={arquivoPrevia?.name || ''}
        onConfirmar={() => uploadMutation.mutate()}
        isLoading={uploadMutation.isPending}
      />
      
      <DialogCriarLancamentoDeExtrato
        open={criarLancamentoOpen}
        onOpenChange={setCriarLancamentoOpen}
        movimentacao={movimentacaoParaLancamento}
      />

      <DialogConciliarComRecebimento
        open={recebimentoOpen}
        onOpenChange={setRecebimentoOpen}
        movimentacao={movimentacaoParaRecebimento}
        parcela={parcelaParaRecebimento}
        isPagamentoParcial={isPagamentoParcial}
      />

      <DialogConciliarComPagamento
        open={pagamentoOpen}
        onOpenChange={setPagamentoOpen}
        movimentacao={movimentacaoParaPagamento}
        contaPagar={contaParaPagamento}
      />

      <DialogConciliarComOrcamento
        open={orcamentoOpen}
        onOpenChange={setOrcamentoOpen}
        movimentacao={movimentacaoParaOrcamento}
        orcamento={orcamentoParaVincular}
      />

      {extratoParaRevisao && (
        <DialogRevisaoImportacao
          open={revisaoOpen}
          onOpenChange={setRevisaoOpen}
          extratoId={extratoParaRevisao.id}
          nomeArquivo={extratoParaRevisao.nome}
        />
      )}
    </div>
  );
}
