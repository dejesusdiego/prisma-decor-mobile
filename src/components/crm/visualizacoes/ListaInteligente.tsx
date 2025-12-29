import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Search,
  Eye,
  User,
  MoreHorizontal,
  ArrowUpDown,
  Filter,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrcamentoPipeline {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  cidade: string | null;
  status: string;
  total_com_desconto: number | null;
  total_geral: number | null;
  created_at: string;
  updated_at: string;
  contato_id: string | null;
}

interface StatusConfig {
  id: string;
  label: string;
  bgClass: string;
  color: string;
}

interface ListaInteligenteProps {
  orcamentos: OrcamentoPipeline[];
  statusConfig: StatusConfig[];
  onVerOrcamento?: (id: string) => void;
  onVerContato?: (id: string) => void;
  onMudarStatus?: (orcamentoId: string, novoStatus: string) => void;
}

type SortField = 'codigo' | 'cliente_nome' | 'valor' | 'updated_at' | 'status';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'status' | 'cidade';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function ListaInteligente({
  orcamentos,
  statusConfig,
  onVerOrcamento,
  onVerContato,
  onMudarStatus
}: ListaInteligenteProps) {
  const [busca, setBusca] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Filtrar e ordenar
  const orcamentosFiltrados = useMemo(() => {
    let result = [...orcamentos];

    // Filtrar por busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      result = result.filter(o => 
        o.codigo.toLowerCase().includes(buscaLower) ||
        o.cliente_nome.toLowerCase().includes(buscaLower) ||
        o.cliente_telefone?.includes(busca) ||
        o.cidade?.toLowerCase().includes(buscaLower)
      );
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'codigo':
          comparison = a.codigo.localeCompare(b.codigo);
          break;
        case 'cliente_nome':
          comparison = a.cliente_nome.localeCompare(b.cliente_nome);
          break;
        case 'valor':
          comparison = (a.total_com_desconto || a.total_geral || 0) - (b.total_com_desconto || b.total_geral || 0);
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'status':
          comparison = statusConfig.findIndex(s => s.id === a.status) - statusConfig.findIndex(s => s.id === b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [orcamentos, busca, sortField, sortOrder, statusConfig]);

  // Agrupar
  const grupos = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Todos': orcamentosFiltrados };
    }

    const grouped: Record<string, OrcamentoPipeline[]> = {};
    orcamentosFiltrados.forEach(orc => {
      let key = '';
      if (groupBy === 'status') {
        key = statusConfig.find(s => s.id === orc.status)?.label || orc.status;
      } else if (groupBy === 'cidade') {
        key = orc.cidade || 'Sem cidade';
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(orc);
    });
    return grouped;
  }, [orcamentosFiltrados, groupBy, statusConfig]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelecionado = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (selecionados.size === orcamentosFiltrados.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(orcamentosFiltrados.map(o => o.id)));
    }
  };

  const getStatusConfig = (statusId: string) => 
    statusConfig.find(s => s.id === statusId) || statusConfig[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar orçamento, cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Agrupar */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Agrupar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem agrupamento</SelectItem>
                <SelectItem value="status">Por Status</SelectItem>
                <SelectItem value="cidade">Por Cidade</SelectItem>
              </SelectContent>
            </Select>

            {/* Ações em lote */}
            {selecionados.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selecionados.size} selecionado(s)
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem className="text-sm font-medium" disabled>
                    Mover para:
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {statusConfig.map(status => (
                    <DropdownMenuItem 
                      key={status.id}
                      onClick={() => {
                        selecionados.forEach(id => onMudarStatus?.(id, status.id));
                        setSelecionados(new Set());
                      }}
                    >
                      <div className={cn("w-2 h-2 rounded-full mr-2", status.bgClass)} />
                      {status.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {Object.entries(grupos).map(([grupo, itens]) => (
          <div key={grupo}>
            {groupBy !== 'none' && (
              <div className="px-4 py-2 bg-muted/50 border-y text-sm font-medium flex items-center justify-between">
                <span>{grupo}</span>
                <Badge variant="secondary">{itens.length}</Badge>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selecionados.size === orcamentosFiltrados.length && orcamentosFiltrados.length > 0}
                      onCheckedChange={toggleTodos}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('codigo')}
                  >
                    <span className="flex items-center gap-1">
                      Código
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('cliente_nome')}
                  >
                    <span className="flex items-center gap-1">
                      Cliente
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('status')}
                  >
                    <span className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => toggleSort('valor')}
                  >
                    <span className="flex items-center gap-1 justify-end">
                      Valor
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('updated_at')}
                  >
                    <span className="flex items-center gap-1">
                      Atualizado
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map(orc => {
                  const status = getStatusConfig(orc.status);
                  return (
                    <TableRow key={orc.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox 
                          checked={selecionados.has(orc.id)}
                          onCheckedChange={() => toggleSelecionado(orc.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{orc.codigo}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{orc.cliente_nome}</p>
                          <p className="text-xs text-muted-foreground">{orc.cliente_telefone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{orc.cidade || '-'}</TableCell>
                      <TableCell>
                        <Select 
                          value={orc.status} 
                          onValueChange={(v) => onMudarStatus?.(orc.id, v)}
                        >
                          <SelectTrigger className="h-7 w-auto border-0 bg-transparent px-2">
                            <Badge className={cn(status.bgClass, "text-white")}>
                              {status.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusConfig.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", s.bgClass)} />
                                  {s.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(orc.total_com_desconto || orc.total_geral || 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(orc.updated_at), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onVerOrcamento?.(orc.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Orçamento
                            </DropdownMenuItem>
                            {orc.contato_id && (
                              <DropdownMenuItem onClick={() => onVerContato?.(orc.contato_id!)}>
                                <User className="h-4 w-4 mr-2" />
                                Ver Contato
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}

        {orcamentosFiltrados.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum orçamento encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
