import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit,
  Trash2,
  Tags,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DialogCategoria } from './dialogs/DialogCategoria';
import { DialogFormaPagamento } from './dialogs/DialogFormaPagamento';

export function CategoriasFormas() {
  const queryClient = useQueryClient();
  const [dialogCategoriaOpen, setDialogCategoriaOpen] = useState(false);
  const [dialogFormaOpen, setDialogFormaOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<any>(null);
  const [formaEditando, setFormaEditando] = useState<any>(null);

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: formasPagamento = [], isLoading: loadingFormas } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categorias_financeiras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
      toast.success('Categoria excluída');
    },
    onError: () => toast.error('Erro ao excluir categoria')
  });

  const deleteFormaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('formas_pagamento').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
      toast.success('Forma de pagamento excluída');
    },
    onError: () => toast.error('Erro ao excluir forma de pagamento')
  });

  const toggleCatAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('categorias_financeiras')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
    }
  });

  const toggleFormaAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('formas_pagamento')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Categorias e Formas de Pagamento</h1>
        <p className="text-muted-foreground">Configure as opções do módulo financeiro</p>
      </div>

      <Tabs defaultValue="categorias" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categorias" className="gap-2">
            <Tags className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="formas" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Formas de Pagamento
          </TabsTrigger>
        </TabsList>

        {/* Categorias */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setCategoriaEditando(null); setDialogCategoriaOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCategorias ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : categorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma categoria cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    categorias.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.nome}</TableCell>
                        <TableCell>
                          <Badge variant={cat.tipo === 'receita' ? 'default' : 'secondary'}>
                            {cat.tipo === 'receita' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: cat.cor || '#6B7280' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={cat.ativo}
                            onCheckedChange={(checked) => 
                              toggleCatAtivoMutation.mutate({ id: cat.id, ativo: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setCategoriaEditando(cat); setDialogCategoriaOpen(true); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCatMutation.mutate(cat.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formas de Pagamento */}
        <TabsContent value="formas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setFormaEditando(null); setDialogFormaOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Forma
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Parcelamento</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingFormas ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : formasPagamento.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma forma de pagamento cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    formasPagamento.map((forma) => (
                      <TableRow key={forma.id}>
                        <TableCell className="font-medium">{forma.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{forma.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          {forma.permite_parcelamento ? (
                            <span className="text-sm">Até {forma.max_parcelas}x</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Não</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {forma.taxa_percentual ? `${forma.taxa_percentual}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={forma.ativo}
                            onCheckedChange={(checked) => 
                              toggleFormaAtivoMutation.mutate({ id: forma.id, ativo: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setFormaEditando(forma); setDialogFormaOpen(true); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteFormaMutation.mutate(forma.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DialogCategoria
        open={dialogCategoriaOpen}
        onOpenChange={setDialogCategoriaOpen}
        categoria={categoriaEditando}
      />

      <DialogFormaPagamento
        open={dialogFormaOpen}
        onOpenChange={setDialogFormaOpen}
        forma={formaEditando}
      />
    </div>
  );
}
