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
import { ArrowLeft, Edit, Copy, FileDown, Search, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { DialogValidade } from './DialogValidade';
import { gerarPdfOrcamento } from '@/lib/gerarPdfOrcamento';
import { STATUS_CONFIG, STATUS_LIST, getStatusConfig, getStatusLabel, StatusOrcamento } from '@/lib/statusOrcamento';

interface Orcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  endereco: string;
  created_at: string;
  total_geral: number;
  status: string;
  validade_dias?: number;
}

interface ListaOrcamentosProps {
  onVoltar: () => void;
  onEditar: (orcamentoId: string) => void;
  onVisualizar: (orcamentoId: string) => void;
}

export function ListaOrcamentos({ onVoltar, onEditar, onVisualizar }: ListaOrcamentosProps) {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [dialogValidadeOpen, setDialogValidadeOpen] = useState(false);
  const [orcamentoSelecionadoId, setOrcamentoSelecionadoId] = useState<string>('');
  const [validadeAtual, setValidadeAtual] = useState<number | undefined>(undefined);

  useEffect(() => {
    carregarOrcamentos();
  }, [user]);

  const carregarOrcamentos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrcamentos(data || []);
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

  const duplicarOrcamento = async (orcamentoId: string) => {
    try {
      const { data: orcOriginal, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', orcamentoId)
        .single();

      if (orcError) throw orcError;

      const { data: cortinasOriginais, error: cortinasError } = await supabase
        .from('cortina_items')
        .select('*')
        .eq('orcamento_id', orcamentoId);

      if (cortinasError) throw cortinasError;

      const { data: novoOrc, error: novoOrcError } = await supabase
        .from('orcamentos')
        .insert({
          cliente_nome: orcOriginal.cliente_nome,
          cliente_telefone: orcOriginal.cliente_telefone,
          endereco: orcOriginal.endereco,
          observacoes: orcOriginal.observacoes,
          margem_tipo: orcOriginal.margem_tipo,
          margem_percent: orcOriginal.margem_percent,
          status: 'rascunho',
          created_by_user_id: user?.id,
          codigo: '',
        })
        .select()
        .single();

      if (novoOrcError) throw novoOrcError;

      if (cortinasOriginais && cortinasOriginais.length > 0) {
        const novasCortinas = cortinasOriginais.map((cortina) => ({
          orcamento_id: novoOrc.id,
          nome_identificacao: cortina.nome_identificacao,
          largura: cortina.largura,
          altura: cortina.altura,
          quantidade: cortina.quantidade,
          tipo_cortina: cortina.tipo_cortina,
          tecido_id: cortina.tecido_id,
          forro_id: cortina.forro_id,
          trilho_id: cortina.trilho_id,
          precisa_instalacao: cortina.precisa_instalacao,
          pontos_instalacao: cortina.pontos_instalacao,
          custo_tecido: cortina.custo_tecido,
          custo_forro: cortina.custo_forro,
          custo_trilho: cortina.custo_trilho,
          custo_costura: cortina.custo_costura,
          custo_instalacao: cortina.custo_instalacao,
          custo_total: cortina.custo_total,
          preco_venda: cortina.preco_venda,
        }));

        const { error: cortinasInsertError } = await supabase
          .from('cortina_items')
          .insert(novasCortinas);

        if (cortinasInsertError) throw cortinasInsertError;
      }

      toast({
        title: 'Sucesso',
        description: 'Orçamento duplicado com sucesso',
      });

      carregarOrcamentos();
    } catch (error) {
      console.error('Erro ao duplicar orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o orçamento',
        variant: 'destructive',
      });
    }
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
      </div>

      {/* Contadores de Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentosFiltrados.map((orc) => {
                    const statusConfig = getStatusConfig(orc.status);
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicarOrcamento(orc.id)}
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
    </div>
  );
}
