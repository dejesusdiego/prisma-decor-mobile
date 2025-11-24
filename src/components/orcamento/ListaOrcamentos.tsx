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

interface Orcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  ambiente: string;
  created_at: string;
  total_geral: number;
  status: string;
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

  const duplicarOrcamento = async (orcamentoId: string) => {
    try {
      // Buscar orçamento original
      const { data: orcOriginal, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', orcamentoId)
        .single();

      if (orcError) throw orcError;

      // Buscar cortinas do orçamento original
      const { data: cortinasOriginais, error: cortinasError } = await supabase
        .from('cortina_items')
        .select('*')
        .eq('orcamento_id', orcamentoId);

      if (cortinasError) throw cortinasError;

      // Criar novo orçamento
      const { data: novoOrc, error: novoOrcError } = await supabase
        .from('orcamentos')
        .insert({
          cliente_nome: orcOriginal.cliente_nome,
          cliente_telefone: orcOriginal.cliente_telefone,
          ambiente: orcOriginal.ambiente,
          observacoes: orcOriginal.observacoes,
          margem_tipo: orcOriginal.margem_tipo,
          margem_percent: orcOriginal.margem_percent,
          status: 'rascunho',
          created_by_user_id: user?.id,
          codigo: '', // Será gerado pelo trigger
        })
        .select()
        .single();

      if (novoOrcError) throw novoOrcError;

      // Duplicar cortinas
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
      // Primeiro deletar os itens de cortina relacionados
      const { error: cortinasError } = await supabase
        .from('cortina_items')
        .delete()
        .eq('orcamento_id', orcamentoId);

      if (cortinasError) throw cortinasError;

      // Depois deletar o orçamento
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

  const baixarPDF = (orcamentoId: string) => {
    toast({
      title: 'Em desenvolvimento',
      description: 'A geração de PDF estará disponível em breve',
    });
  };

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
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
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
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentosFiltrados.map((orc) => (
                    <TableRow key={orc.id}>
                      <TableCell className="font-medium">{orc.codigo}</TableCell>
                      <TableCell>{orc.cliente_nome}</TableCell>
                      <TableCell>{orc.ambiente}</TableCell>
                      <TableCell>
                        {new Date(orc.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>R$ {orc.total_geral.toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            orc.status === 'finalizado'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {orc.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                        </span>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
