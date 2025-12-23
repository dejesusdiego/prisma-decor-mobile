import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Users
} from 'lucide-react';
import { useContatos, useDeleteContato, Contato } from '@/hooks/useCRMData';
import { DialogContato } from './DialogContato';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const TIPO_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  lead: { label: 'Lead', variant: 'secondary' },
  cliente: { label: 'Cliente', variant: 'default' },
  inativo: { label: 'Inativo', variant: 'outline' }
};

interface ListaContatosProps {
  onVerContato?: (contatoId: string) => void;
}

export function ListaContatos({ onVerContato }: ListaContatosProps) {
  const { data: contatos, isLoading } = useContatos();
  const deleteContato = useDeleteContato();
  
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contatoParaExcluir, setContatoParaExcluir] = useState<Contato | null>(null);

  const contatosFiltrados = useMemo(() => {
    if (!contatos) return [];
    
    return contatos.filter(contato => {
      const matchSearch = 
        contato.nome.toLowerCase().includes(search.toLowerCase()) ||
        contato.telefone?.includes(search) ||
        contato.email?.toLowerCase().includes(search.toLowerCase()) ||
        contato.cidade?.toLowerCase().includes(search.toLowerCase());
      
      const matchTipo = tipoFilter === 'todos' || contato.tipo === tipoFilter;
      
      return matchSearch && matchTipo;
    });
  }, [contatos, search, tipoFilter]);

  const handleNovoContato = () => {
    setContatoSelecionado(null);
    setDialogOpen(true);
  };

  const handleEditarContato = (contato: Contato) => {
    setContatoSelecionado(contato);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (contatoParaExcluir) {
      await deleteContato.mutateAsync(contatoParaExcluir.id);
      setDeleteDialogOpen(false);
      setContatoParaExcluir(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contatos
            <Badge variant="secondary" className="ml-2">
              {contatosFiltrados.length}
            </Badge>
          </CardTitle>
          <Button onClick={handleNovoContato} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, email ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="cliente">Clientes</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {contatosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contato encontrado</p>
              {search && (
                <Button 
                  variant="link" 
                  onClick={() => setSearch('')}
                  className="mt-2"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor Gasto</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contatosFiltrados.map((contato) => {
                    const tipoConfig = TIPO_CONFIG[contato.tipo] || TIPO_CONFIG.lead;
                    
                    return (
                      <TableRow 
                        key={contato.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          onVerContato && "cursor-pointer"
                        )}
                        onClick={() => onVerContato?.(contato.id)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{contato.nome}</span>
                            {contato.tags && contato.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {contato.tags.slice(0, 3).map((tag, i) => (
                                  <Badge 
                                    key={i} 
                                    variant="outline" 
                                    className="text-xs px-1.5 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-sm">
                            {contato.telefone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {contato.telefone}
                              </div>
                            )}
                            {contato.email && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {contato.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contato.cidade && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {contato.cidade}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tipoConfig.variant}>
                            {tipoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(contato.valor_total_gasto)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEditarContato(contato);
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContatoParaExcluir(contato);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Dialog de criar/editar */}
      <DialogContato 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        contato={contatoSelecionado}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato "{contatoParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
