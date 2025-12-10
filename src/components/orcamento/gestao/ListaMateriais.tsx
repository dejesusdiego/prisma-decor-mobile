import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Power, Trash2, Loader2, CheckSquare, Square, Edit3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DialogMaterial } from './DialogMaterial';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Material {
  id: string;
  codigo_item: string;
  nome: string;
  categoria: string;
  unidade: string;
  largura_metro: number | null;
  preco_custo: number;
  preco_tabela: number;
  ativo: boolean;
  fornecedor: string | null;
  linha?: string | null;
  cor?: string | null;
  tipo?: string | null;
  aplicacao?: string | null;
  potencia?: string | null;
  area_min_fat?: number | null;
}

export function ListaMateriais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [materiaisFiltrados, setMateriaisFiltrados] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [fornecedorFiltro, setFornecedorFiltro] = useState('todos');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null);
  const [materialDeletando, setMaterialDeletando] = useState<Material | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());
  const [acaoMassaDialog, setAcaoMassaDialog] = useState<'ativar' | 'desativar' | 'deletar' | null>(null);
  const [processandoAcaoMassa, setProcessandoAcaoMassa] = useState(false);
  const [dialogEdicaoMassa, setDialogEdicaoMassa] = useState(false);
  const [campoEdicao, setCampoEdicao] = useState<string>('tipo');
  const [valorEdicao, setValorEdicao] = useState<string>('');

  const carregarMateriais = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .order('nome', { ascending: true })
        .limit(5000); // Aumentar limite para buscar todos os materiais

      if (error) throw error;
      
      console.log('[CARREGOU] Total materiais:', data?.length, '| Trilhos:', data?.filter(m => m.categoria === 'trilho').length);
      
      setMateriais(data || []);
      setMateriaisFiltrados(data || []);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({
        title: 'Erro ao carregar materiais',
        description: 'Não foi possível carregar a lista de materiais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMateriais();
  }, []);

  useEffect(() => {
    let resultado = materiais;

    // Filtro de busca
    if (busca) {
      resultado = resultado.filter(
        (m) =>
          m.nome.toLowerCase().includes(busca.toLowerCase()) ||
          m.codigo_item?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtro de categoria
    if (categoriaFiltro !== 'todas') {
      resultado = resultado.filter((m) => m.categoria === categoriaFiltro);
    }

    // Filtro de status
    if (statusFiltro === 'ativos') {
      resultado = resultado.filter((m) => m.ativo);
    } else if (statusFiltro === 'inativos') {
      resultado = resultado.filter((m) => !m.ativo);
    }

    // Filtro de fornecedor
    if (fornecedorFiltro !== 'todos') {
      resultado = resultado.filter((m) => m.fornecedor === fornecedorFiltro);
    }

    setMateriaisFiltrados(resultado);
    
    // Limpar seleções quando os filtros mudarem
    setItensSelecionados(new Set());
  }, [busca, categoriaFiltro, statusFiltro, fornecedorFiltro, materiais]);

  const handleToggleStatus = async (material: Material) => {
    try {
      const { error } = await supabase
        .from('materiais')
        .update({ ativo: !material.ativo })
        .eq('id', material.id);

      if (error) throw error;

      toast({
        title: material.ativo ? 'Material desativado' : 'Material ativado',
        description: `${material.nome} foi ${material.ativo ? 'desativado' : 'ativado'} com sucesso`,
      });

      carregarMateriais();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do material',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!materialDeletando) return;

    try {
      const { error } = await supabase
        .from('materiais')
        .delete()
        .eq('id', materialDeletando.id);

      if (error) throw error;

      toast({
        title: 'Material excluído',
        description: `${materialDeletando.nome} foi excluído com sucesso`,
      });

      setMaterialDeletando(null);
      carregarMateriais();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      toast({
        title: 'Erro ao excluir material',
        description: 'Não foi possível excluir o material',
        variant: 'destructive',
      });
    }
  };

  const handleNovoMaterial = () => {
    setMaterialEditando(null);
    setDialogAberto(true);
  };

  const handleEditarMaterial = (material: Material) => {
    setMaterialEditando(material);
    setDialogAberto(true);
  };

  const handleDialogClose = (sucesso?: boolean) => {
    setDialogAberto(false);
    setMaterialEditando(null);
    if (sucesso) {
      carregarMateriais();
    }
  };

  const handleToggleSelecao = (materialId: string) => {
    setItensSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(materialId)) {
        novo.delete(materialId);
      } else {
        novo.add(materialId);
      }
      return novo;
    });
  };

  const handleSelecionarTodos = () => {
    if (itensSelecionados.size === materiaisFiltrados.length) {
      setItensSelecionados(new Set());
    } else {
      setItensSelecionados(new Set(materiaisFiltrados.map(m => m.id)));
    }
  };

  const handleAcaoMassa = async () => {
    if (!acaoMassaDialog || itensSelecionados.size === 0) return;

    setProcessandoAcaoMassa(true);

    try {
      const ids = Array.from(itensSelecionados);

      switch (acaoMassaDialog) {
        case 'ativar':
          const { data: ativarData, error: ativarError, count: ativarCount } = await supabase
            .from('materiais')
            .update({ ativo: true })
            .in('id', ids)
            .select();
          
          if (ativarError) throw ativarError;
          
          if (!ativarData || ativarData.length === 0) {
            throw new Error('Nenhum material foi atualizado. Verifique suas permissões.');
          }
          
          toast({
            title: 'Materiais ativados',
            description: `${ativarData.length} material(is) foi(ram) ativado(s)`,
          });
          break;

        case 'desativar':
          const { data: desativarData, error: desativarError } = await supabase
            .from('materiais')
            .update({ ativo: false })
            .in('id', ids)
            .select();
          
          if (desativarError) throw desativarError;
          
          if (!desativarData || desativarData.length === 0) {
            throw new Error('Nenhum material foi atualizado. Verifique suas permissões.');
          }
          
          toast({
            title: 'Materiais desativados',
            description: `${desativarData.length} material(is) foi(ram) desativado(s)`,
          });
          break;

        case 'deletar':
          const { data: deletarData, error: deletarError } = await supabase
            .from('materiais')
            .delete()
            .in('id', ids)
            .select();
          
          if (deletarError) throw deletarError;
          
          if (!deletarData || deletarData.length === 0) {
            throw new Error('Nenhum material foi excluído. Verifique suas permissões.');
          }
          
          toast({
            title: 'Materiais excluídos',
            description: `${deletarData.length} material(is) foi(ram) excluído(s)`,
          });
          break;
      }

      setItensSelecionados(new Set());
      setAcaoMassaDialog(null);
      await carregarMateriais();
    } catch (error) {
      console.error('Erro na ação em massa:', error);
      toast({
        title: 'Erro na ação em massa',
        description: error instanceof Error ? error.message : 'Não foi possível executar a ação',
        variant: 'destructive',
      });
    } finally {
      setProcessandoAcaoMassa(false);
    }
  };

  const handleEdicaoMassa = async () => {
    if (itensSelecionados.size === 0 || !valorEdicao.trim()) return;

    setProcessandoAcaoMassa(true);

    try {
      const ids = Array.from(itensSelecionados);
      const updateData: any = {};
      updateData[campoEdicao] = valorEdicao.trim();

      const { data, error } = await supabase
        .from('materiais')
        .update(updateData)
        .in('id', ids)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Nenhum material foi atualizado. Verifique suas permissões.');
      }

      toast({
        title: 'Edição em massa concluída',
        description: `${data.length} material(is) teve(ram) o campo "${campoEdicao}" atualizado`,
      });

      setDialogEdicaoMassa(false);
      setValorEdicao('');
      setItensSelecionados(new Set());
      await carregarMateriais();
    } catch (error) {
      console.error('Erro na edição em massa:', error);
      toast({
        title: 'Erro na edição em massa',
        description: error instanceof Error ? error.message : 'Não foi possível executar a edição',
        variant: 'destructive',
      });
    } finally {
      setProcessandoAcaoMassa(false);
    }
  };

  const categorias = ['tecido', 'forro', 'trilho', 'acessorio', 'papel', 'persiana', 'motorizado'];
  
  const fornecedoresUnicos = Array.from(
    new Set(materiais.map((m) => m.fornecedor).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="space-y-4">
      {itensSelecionados.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {itensSelecionados.size} item(ns) selecionado(s)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => setDialogEdicaoMassa(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar em Massa
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAcaoMassaDialog('ativar')}
            >
              <Power className="h-4 w-4 mr-2" />
              Ativar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAcaoMassaDialog('desativar')}
            >
              <Power className="h-4 w-4 mr-2" />
              Desativar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setAcaoMassaDialog('deletar')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setItensSelecionados(new Set())}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fornecedorFiltro} onValueChange={setFornecedorFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos fornecedores</SelectItem>
              {fornecedoresUnicos.map((fornecedor) => (
                <SelectItem key={fornecedor} value={fornecedor}>
                  {fornecedor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {materiaisFiltrados.length > 0 && (
            <Button
              variant="outline"
              onClick={handleSelecionarTodos}
              size="sm"
            >
              {itensSelecionados.size === materiaisFiltrados.length ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Desmarcar Todos
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Selecionar Todos
                </>
              )}
            </Button>
          )}
          <Button onClick={handleNovoMaterial}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={materiaisFiltrados.length > 0 && itensSelecionados.size === materiaisFiltrados.length}
                    onCheckedChange={handleSelecionarTodos}
                  />
                </TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Preço Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiaisFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum material encontrado
                  </TableCell>
                </TableRow>
              ) : (
                materiaisFiltrados.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <Checkbox
                        checked={itensSelecionados.has(material.id)}
                        onCheckedChange={() => handleToggleSelecao(material.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{material.codigo_item}</TableCell>
                    <TableCell className="font-medium">{material.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {material.categoria.charAt(0).toUpperCase() + material.categoria.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {material.tipo ? (
                        <span className="text-sm">{material.tipo}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {material.fornecedor ? (
                        <span className="text-sm">{material.fornecedor}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {material.preco_custo.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={material.ativo ? 'default' : 'secondary'}>
                        {material.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditarMaterial(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(material)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMaterialDeletando(material)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <DialogMaterial
        aberto={dialogAberto}
        material={materialEditando}
        onClose={handleDialogClose}
      />

      <AlertDialog
        open={!!materialDeletando}
        onOpenChange={() => setMaterialDeletando(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o material "{materialDeletando?.nome}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!acaoMassaDialog}
        onOpenChange={() => setAcaoMassaDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar ação em massa
            </AlertDialogTitle>
            <AlertDialogDescription>
              {acaoMassaDialog === 'ativar' && (
                <>Tem certeza que deseja ativar {itensSelecionados.size} material(is)?</>
              )}
              {acaoMassaDialog === 'desativar' && (
                <>Tem certeza que deseja desativar {itensSelecionados.size} material(is)?</>
              )}
              {acaoMassaDialog === 'deletar' && (
                <>
                  Tem certeza que deseja excluir {itensSelecionados.size} material(is)?
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processandoAcaoMassa}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcaoMassa}
              disabled={processandoAcaoMassa}
            >
              {processandoAcaoMassa ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogEdicaoMassa} onOpenChange={setDialogEdicaoMassa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {itensSelecionados.size} materiais em massa</DialogTitle>
            <DialogDescription>
              Selecione o campo que deseja editar e defina o novo valor. Esta alteração será aplicada a todos os itens selecionados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campo">Campo a editar</Label>
              <Select value={campoEdicao} onValueChange={setCampoEdicao}>
                <SelectTrigger id="campo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tipo">Tipo</SelectItem>
                  <SelectItem value="linha">Linha</SelectItem>
                  <SelectItem value="cor">Cor</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="aplicacao">Aplicação</SelectItem>
                  <SelectItem value="potencia">Potência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Novo valor</Label>
              <Input
                id="valor"
                value={valorEdicao}
                onChange={(e) => setValorEdicao(e.target.value)}
                placeholder="Digite o novo valor..."
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {itensSelecionados.size} material(is) terá(ão) o campo <strong>{campoEdicao}</strong> alterado para <strong>{valorEdicao || '(vazio)'}</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEdicaoMassa(false)} disabled={processandoAcaoMassa}>
              Cancelar
            </Button>
            <Button onClick={handleEdicaoMassa} disabled={processandoAcaoMassa || !valorEdicao.trim()}>
              {processandoAcaoMassa ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Aplicar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
