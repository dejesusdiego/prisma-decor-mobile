import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings2, Plus, Trash2, GripVertical, Ban, FileCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { REGRAS_SUGERIDAS } from '../utils/aplicarRegras';

interface RegraForm {
  nome: string;
  descricao_contem: string;
  acao: 'ignorar' | 'criar_lancamento';
  categoria_id: string | null;
  tipo_lancamento: string | null;
}

const initialForm: RegraForm = {
  nome: '',
  descricao_contem: '',
  acao: 'ignorar',
  categoria_id: null,
  tipo_lancamento: null
};

export function DialogRegrasConciliacao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RegraForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Buscar regras
  const { data: regras = [], isLoading } = useQuery({
    queryKey: ['regras-conciliacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_conciliacao')
        .select('*, categoria:categorias_financeiras(id, nome)')
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Buscar categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Criar/atualizar regra
  const saveMutation = useMutation({
    mutationFn: async (data: RegraForm) => {
      if (editingId) {
        const { error } = await supabase
          .from('regras_conciliacao')
          .update({
            nome: data.nome,
            descricao_contem: data.descricao_contem,
            acao: data.acao,
            categoria_id: data.acao === 'criar_lancamento' ? data.categoria_id : null,
            tipo_lancamento: data.acao === 'criar_lancamento' ? data.tipo_lancamento : null
          })
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const maxOrdem = regras.length > 0 ? Math.max(...regras.map(r => r.ordem)) + 1 : 0;
        
        const { error } = await supabase
          .from('regras_conciliacao')
          .insert({
            nome: data.nome,
            descricao_contem: data.descricao_contem,
            acao: data.acao,
            categoria_id: data.acao === 'criar_lancamento' ? data.categoria_id : null,
            tipo_lancamento: data.acao === 'criar_lancamento' ? data.tipo_lancamento : null,
            ordem: maxOrdem,
            created_by_user_id: user?.id
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Regra atualizada' : 'Regra criada');
      queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] });
      setForm(initialForm);
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar regra: ' + error.message);
    }
  });

  // Deletar regra
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('regras_conciliacao')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra excluída');
      queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] });
    }
  });

  // Toggle ativo
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('regras_conciliacao')
        .update({ ativo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] });
    }
  });

  // Adicionar regra sugerida
  const addSugeridaMutation = useMutation({
    mutationFn: async (sugestao: typeof REGRAS_SUGERIDAS[0]) => {
      const maxOrdem = regras.length > 0 ? Math.max(...regras.map(r => r.ordem)) + 1 : 0;
      
      const { error } = await supabase
        .from('regras_conciliacao')
        .insert({
          nome: sugestao.nome,
          descricao_contem: sugestao.descricao_contem,
          acao: sugestao.acao as 'ignorar' | 'criar_lancamento',
          ordem: maxOrdem,
          created_by_user_id: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra adicionada');
      queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] });
    }
  });

  const handleEdit = (regra: any) => {
    setForm({
      nome: regra.nome,
      descricao_contem: regra.descricao_contem,
      acao: regra.acao,
      categoria_id: regra.categoria_id,
      tipo_lancamento: regra.tipo_lancamento
    });
    setEditingId(regra.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.descricao_contem) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    saveMutation.mutate(form);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const regrasNaoAdicionadas = REGRAS_SUGERIDAS.filter(
    s => !regras.some(r => r.descricao_contem.toLowerCase() === s.descricao_contem.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Regras Automáticas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Regras de Conciliação Automática</DialogTitle>
          <DialogDescription>
            Configure regras para ignorar ou criar lançamentos automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nome">Nome da Regra</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Tarifas Bancárias"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="descricao_contem">Texto a Buscar</Label>
                <Input
                  id="descricao_contem"
                  value={form.descricao_contem}
                  onChange={e => setForm(f => ({ ...f, descricao_contem: e.target.value }))}
                  placeholder="Ex: TARIFA"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Ação</Label>
                <Select 
                  value={form.acao} 
                  onValueChange={v => setForm(f => ({ ...f, acao: v as 'ignorar' | 'criar_lancamento' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ignorar">
                      <span className="flex items-center gap-2">
                        <Ban className="h-3 w-3" /> Ignorar
                      </span>
                    </SelectItem>
                    <SelectItem value="criar_lancamento">
                      <span className="flex items-center gap-2">
                        <FileCheck className="h-3 w-3" /> Criar Lançamento
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.acao === 'criar_lancamento' && (
                <>
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <Select 
                      value={form.tipo_lancamento || ''} 
                      onValueChange={v => setForm(f => ({ ...f, tipo_lancamento: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Categoria</Label>
                    <Select 
                      value={form.categoria_id || ''} 
                      onValueChange={v => setForm(f => ({ ...f, categoria_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              {editingId && (
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={saveMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? 'Atualizar' : 'Adicionar'} Regra
              </Button>
            </div>
          </form>

          {/* Sugestões */}
          {regrasNaoAdicionadas.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sugestões rápidas:</Label>
              <div className="flex flex-wrap gap-2">
                {regrasNaoAdicionadas.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => addSugeridaMutation.mutate(s)}
                    disabled={addSugeridaMutation.isPending}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {s.nome}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Lista de regras */}
          <ScrollArea className="h-[250px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : regras.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Nenhuma regra cadastrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Buscar</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regras.map((regra) => (
                    <TableRow key={regra.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      </TableCell>
                      <TableCell className="font-medium">{regra.nome}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {regra.descricao_contem}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={regra.acao === 'ignorar' ? 'secondary' : 'default'}>
                          {regra.acao === 'ignorar' ? 'Ignorar' : 'Criar Lançamento'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={regra.ativo}
                          onCheckedChange={checked => 
                            toggleAtivoMutation.mutate({ id: regra.id, ativo: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(regra)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(regra.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
