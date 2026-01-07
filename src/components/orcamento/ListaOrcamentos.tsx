import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Edit, Copy, FileDown, Search, Trash2, Eye, Receipt, CheckCircle2, Clock, AlertCircle, Banknote, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { DialogValidade } from './DialogValidade';
import { DialogDuplicarOrcamento } from './dialogs/DialogDuplicarOrcamento';
import { gerarPdfOrcamento } from '@/lib/gerarPdfOrcamento';
import { STATUS_CONFIG, STATUS_LIST, getStatusConfig, getStatusLabel, StatusOrcamento } from '@/lib/statusOrcamento';
import { DialogCondicoesPagamento } from '@/components/financeiro/dialogs/DialogCondicoesPagamento';
import { DialogGerarContasPagar } from '@/components/financeiro/dialogs/DialogGerarContasPagar';
import { useDuplicarOrcamento } from '@/hooks/useDuplicarOrcamento';
import { gerarCSV, downloadCSV } from '@/lib/parserCSVMateriais';
import { format } from 'date-fns';

interface ContaReceberInfo {
  id: string;
  status: string;
  valor_total: number;
  valor_pago: number;
  numero_parcelas: number;
  parcelas_pagas: number;
}

interface Orcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  created_at: string;
  total_geral: number;
  status: string;
  validade_dias?: number;
  conta_receber?: ContaReceberInfo;
  // Custos para contas a pagar
  subtotal_materiais?: number;
  subtotal_mao_obra_costura?: number;
  subtotal_instalacao?: number;
  custo_total?: number;
}

interface ListaOrcamentosProps {
  onVoltar: () => void;
  onEditar: (orcamentoId: string) => void;
  onVisualizar: (orcamentoId: string) => void;
  onVerFinanceiro?: () => void;
}

// Status que devem abrir o dialog de condições de pagamento
const STATUS_PAGAMENTO: StatusOrcamento[] = ['pago_40', 'pago_parcial', 'pago_60', 'pago'];

export function ListaOrcamentos({ onVoltar, onEditar, onVisualizar, onVerFinanceiro }: ListaOrcamentosProps) {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [dialogValidadeOpen, setDialogValidadeOpen] = useState(false);
  const [orcamentoSelecionadoId, setOrcamentoSelecionadoId] = useState<string>('');
  const [validadeAtual, setValidadeAtual] = useState<number | undefined>(undefined);
  
  // Estado para o dialog de condições de pagamento
  const [dialogPagamentoOpen, setDialogPagamentoOpen] = useState(false);
  const [orcamentoParaPagamento, setOrcamentoParaPagamento] = useState<Orcamento | null>(null);
  const [novoStatusPendente, setNovoStatusPendente] = useState<StatusOrcamento | null>(null);
  
  // Estado para o dialog de contas a pagar
  const [dialogContasPagarOpen, setDialogContasPagarOpen] = useState(false);
  const [orcamentoParaContasPagar, setOrcamentoParaContasPagar] = useState<Orcamento | null>(null);

  // Estado para o dialog de duplicar orçamento
  const [dialogDuplicarOpen, setDialogDuplicarOpen] = useState(false);
  const [orcamentoParaDuplicar, setOrcamentoParaDuplicar] = useState<Orcamento | null>(null);
  const duplicarMutation = useDuplicarOrcamento();

  useEffect(() => {
    carregarOrcamentos();
  }, [user]);

const carregarOrcamentos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar orçamentos - RLS filtra por organization_id automaticamente
      const { data: orcamentosData, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (orcError) throw orcError;

      // Buscar contas a receber vinculadas
      const { data: contasData, error: contasError } = await supabase
        .from('contas_receber')
        .select(`
          id,
          orcamento_id,
          status,
          valor_total,
          valor_pago,
          numero_parcelas,
          parcelas_receber (status)
        `)
        .in('orcamento_id', (orcamentosData || []).map(o => o.id));

      if (contasError) throw contasError;

      // Mapear contas por orcamento_id
      const contasPorOrcamento = new Map<string, ContaReceberInfo>();
      (contasData || []).forEach((conta: any) => {
        if (conta.orcamento_id) {
          const parcelasPagas = (conta.parcelas_receber || []).filter(
            (p: any) => p.status === 'pago'
          ).length;
          contasPorOrcamento.set(conta.orcamento_id, {
            id: conta.id,
            status: conta.status,
            valor_total: conta.valor_total,
            valor_pago: conta.valor_pago,
            numero_parcelas: conta.numero_parcelas,
            parcelas_pagas: parcelasPagas,
          });
        }
      });

      // Associar contas aos orçamentos
      const orcamentosComContas = (orcamentosData || []).map(orc => ({
        ...orc,
        conta_receber: contasPorOrcamento.get(orc.id),
      }));

      setOrcamentos(orcamentosComContas);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os orçamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (orcamentoId: string, novoStatus: StatusOrcamento) => {
    const orcamento = orcamentos.find(o => o.id === orcamentoId);
    if (!orcamento) return;

    // Se está mudando para um status de pagamento e ainda não está em status de pagamento
    const statusAtualEhPagamento = STATUS_PAGAMENTO.includes(orcamento.status as StatusOrcamento);
    const novoStatusEhPagamento = STATUS_PAGAMENTO.includes(novoStatus);
    
    if (novoStatusEhPagamento && !statusAtualEhPagamento) {
      // Abrir dialog para definir condições de pagamento
      setOrcamentoParaPagamento(orcamento);
      setNovoStatusPendente(novoStatus);
      setDialogPagamentoOpen(true);
      return;
    }

    // Atualização normal de status
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: novoStatus })
        .eq('id', orcamentoId);

      if (error) throw error;

      setOrcamentos(prev => 
        prev.map(orc => 
          orc.id === orcamentoId ? { ...orc, status: novoStatus } : orc
        )
      );

      toast({
        title: 'Status atualizado',
        description: `Status alterado para "${getStatusLabel(novoStatus)}"`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive',
      });
    }
  };

  const handlePagamentoSuccess = () => {
    if (orcamentoParaPagamento && novoStatusPendente) {
      setOrcamentos(prev => 
        prev.map(orc => 
          orc.id === orcamentoParaPagamento.id ? { ...orc, status: novoStatusPendente } : orc
        )
      );
      
      // Após criar conta a receber, oferecer criar contas a pagar
      if (orcamentoParaPagamento.custo_total && orcamentoParaPagamento.custo_total > 0) {
        setOrcamentoParaContasPagar(orcamentoParaPagamento);
        setDialogContasPagarOpen(true);
      }
    }
    setOrcamentoParaPagamento(null);
    setNovoStatusPendente(null);
  };

  const handleContasPagarSuccess = () => {
    setOrcamentoParaContasPagar(null);
    carregarOrcamentos();
  };
  
  const abrirDialogContasPagar = (orcamento: Orcamento) => {
    setOrcamentoParaContasPagar(orcamento);
    setDialogContasPagarOpen(true);
  };

  const abrirDialogDuplicar = (orcamento: Orcamento) => {
    setOrcamentoParaDuplicar(orcamento);
    setDialogDuplicarOpen(true);
  };

  const handleConfirmarDuplicar = (novoClienteNome: string) => {
    if (!orcamentoParaDuplicar || !user) return;
    
    duplicarMutation.mutate(
      { 
        orcamentoId: orcamentoParaDuplicar.id, 
        userId: user.id,
        novoClienteNome 
      },
      {
        onSuccess: (novoOrcamento) => {
          setDialogDuplicarOpen(false);
          setOrcamentoParaDuplicar(null);
          carregarOrcamentos();
          // Redirecionar para edição do novo orçamento
          onEditar(novoOrcamento.id);
        },
      }
    );
  };

  const excluirOrcamento = async (orcamentoId: string, codigo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o orçamento ${codigo}?`)) {
      return;
    }

    try {
      const { error: cortinasError } = await supabase
        .from('cortina_items')
        .delete()
        .eq('orcamento_id', orcamentoId);

      if (cortinasError) throw cortinasError;

      const { error: orcError } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', orcamentoId);

      if (orcError) throw orcError;

      toast({
        title: 'Sucesso',
        description: 'Orçamento excluído com sucesso',
      });

      carregarOrcamentos();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o orçamento',
        variant: 'destructive',
      });
    }
  };

  const baixarPDF = async (orcamentoId: string) => {
    const orcamento = orcamentos.find((o) => o.id === orcamentoId);
    
    if (!orcamento) return;

    if (orcamento.validade_dias) {
      try {
        setLoading(true);
        await gerarPdfOrcamento(orcamentoId);
        toast({
          title: 'Sucesso',
          description: 'PDF gerado com sucesso',
        });
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o PDF',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else {
      setOrcamentoSelecionadoId(orcamentoId);
      setValidadeAtual(undefined);
      setDialogValidadeOpen(true);
    }
  };

  const handleConfirmarValidade = async (novaValidade: number) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('orcamentos')
        .update({ validade_dias: novaValidade })
        .eq('id', orcamentoSelecionadoId);

      if (error) throw error;

      await gerarPdfOrcamento(orcamentoSelecionadoId);

      toast({
        title: 'Sucesso',
        description: 'PDF gerado com sucesso',
      });

      carregarOrcamentos();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setOrcamentoSelecionadoId('');
    }
  };

  // Contadores por status
  const contadores = STATUS_LIST.reduce((acc, status) => {
    acc[status] = orcamentos.filter(o => o.status === status).length;
    return acc;
  }, {} as Record<StatusOrcamento, number>);

  const orcamentosFiltrados = orcamentos.filter((orc) => {
    const matchNome = orc.cliente_nome.toLowerCase().includes(filtroNome.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || orc.status === filtroStatus;
    return matchNome && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Início
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const colunas = [
                { campo: 'codigo', titulo: 'Código' },
                { campo: 'cliente_nome', titulo: 'Cliente' },
                { campo: 'cliente_telefone', titulo: 'Telefone' },
                { campo: 'endereco', titulo: 'Endereço' },
                { campo: 'cidade', titulo: 'Cidade' },
                { campo: 'data', titulo: 'Data' },
                { campo: 'total_geral', titulo: 'Total' },
                { campo: 'custo_total', titulo: 'Custo' },
                { campo: 'margem', titulo: 'Margem %' },
                { campo: 'status', titulo: 'Status' },
              ];
              const dados = orcamentosFiltrados.map(orc => ({
                codigo: orc.codigo,
                cliente_nome: orc.cliente_nome,
                cliente_telefone: orc.cliente_telefone,
                endereco: orc.endereco || '',
                cidade: (orc as any).cidade || '',
                data: format(new Date(orc.created_at), 'dd/MM/yyyy'),
                total_geral: (orc.total_geral || 0).toFixed(2).replace('.', ','),
                custo_total: (orc.custo_total || 0).toFixed(2).replace('.', ','),
                margem: ((orc as any).margem_percent || 0).toFixed(1).replace('.', ','),
                status: getStatusLabel(orc.status as StatusOrcamento),
              }));
              const csv = gerarCSV(dados, colunas);
              downloadCSV(csv, `orcamentos-${format(new Date(), 'yyyy-MM-dd')}.csv`);
              toast({ title: 'CSV exportado', description: `${dados.length} orçamentos exportados.` });
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          {onVerFinanceiro && (
            <Button variant="outline" onClick={onVerFinanceiro}>
              <Receipt className="mr-2 h-4 w-4" />
              Ver Financeiro
            </Button>
          )}
        </div>
      </div>

      {/* Contadores de Status */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {STATUS_LIST.map((status) => {
          const config = getStatusConfig(status);
          const isActive = filtroStatus === status;
          return (
            <button
              key={status}
              onClick={() => setFiltroStatus(isActive ? 'todos' : status)}
              className={`p-3 rounded-lg border transition-all ${
                isActive 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'border-border hover:border-primary/50'
              } ${config.color}`}
            >
              <div className="text-2xl font-bold">{contadores[status]}</div>
              <div className="text-xs font-medium truncate">{config.label}</div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do cliente..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_LIST.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : orcamentosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum orçamento encontrado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentosFiltrados.map((orc) => {
                    const statusConfig = getStatusConfig(orc.status);
                    const conta = orc.conta_receber;
                    return (
                      <TableRow key={orc.id}>
                        <TableCell className="font-medium">{orc.codigo}</TableCell>
                        <TableCell>{orc.cliente_nome}</TableCell>
                        <TableCell>{orc.endereco}</TableCell>
                        <TableCell>
                          {new Date(orc.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>R$ {orc.total_geral?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {conta ? (
                                  <a
                                    href={`/gerarorcamento?financeiro=contas-receber&conta=${conta.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Badge
                                      variant={
                                        conta.status === 'pago' ? 'default' :
                                        conta.status === 'parcial' ? 'secondary' :
                                        conta.status === 'atrasado' ? 'destructive' : 'outline'
                                      }
                                      className="cursor-pointer flex items-center gap-1 hover:opacity-80"
                                    >
                                      {conta.status === 'pago' ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                      ) : conta.status === 'atrasado' ? (
                                        <AlertCircle className="h-3 w-3" />
                                      ) : (
                                        <Clock className="h-3 w-3" />
                                      )}
                                      {conta.parcelas_pagas}/{conta.numero_parcelas}
                                    </Badge>
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                {conta ? (
                                  <div className="text-xs space-y-1">
                                    <p><strong>Status:</strong> {conta.status === 'pago' ? 'Quitado' : conta.status === 'parcial' ? 'Parcial' : conta.status === 'atrasado' ? 'Atrasado' : 'Pendente'}</p>
                                    <p><strong>Parcelas:</strong> {conta.parcelas_pagas} de {conta.numero_parcelas} pagas</p>
                                    <p><strong>Pago:</strong> R$ {conta.valor_pago.toFixed(2)} de R$ {conta.valor_total.toFixed(2)}</p>
                                    <p className="text-primary font-medium">Clique para ver detalhes</p>
                                  </div>
                                ) : (
                                  <p className="text-xs">Sem conta a receber vinculada</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={orc.status}
                            onValueChange={(value) => alterarStatus(orc.id, value as StatusOrcamento)}
                          >
                            <SelectTrigger className={`w-[130px] h-8 text-xs ${statusConfig.color}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_LIST.map((status) => {
                                const config = getStatusConfig(status);
                                return (
                                  <SelectItem key={status} value={status}>
                                    <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
                                      {config.label}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onVisualizar(orc.id)}
                              title="Ver Resumo"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditar(orc.id)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {(orc.custo_total || 0) > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogContasPagar(orc)}
                                title="Gerar Contas a Pagar"
                              >
                                <Banknote className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirDialogDuplicar(orc)}
                              title="Duplicar"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => baixarPDF(orc.id)}
                              title="Baixar PDF"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirOrcamento(orc.id, orc.codigo)}
                              title="Excluir"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogValidade
        open={dialogValidadeOpen}
        onOpenChange={setDialogValidadeOpen}
        onConfirmar={handleConfirmarValidade}
        validadeAtual={validadeAtual}
      />

      <DialogCondicoesPagamento
        open={dialogPagamentoOpen}
        onOpenChange={setDialogPagamentoOpen}
        orcamento={orcamentoParaPagamento}
        novoStatus={novoStatusPendente || ''}
        onSuccess={handlePagamentoSuccess}
      />

      <DialogGerarContasPagar
        open={dialogContasPagarOpen}
        onOpenChange={setDialogContasPagarOpen}
        orcamento={orcamentoParaContasPagar}
        onSuccess={handleContasPagarSuccess}
      />

      <DialogDuplicarOrcamento
        open={dialogDuplicarOpen}
        onOpenChange={setDialogDuplicarOpen}
        codigoOriginal={orcamentoParaDuplicar?.codigo || ''}
        clienteNomeOriginal={orcamentoParaDuplicar?.cliente_nome || ''}
        onConfirmar={handleConfirmarDuplicar}
        isLoading={duplicarMutation.isPending}
      />
    </div>
  );
}
