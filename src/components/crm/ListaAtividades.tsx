import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Clock,
  Phone,
  Mail,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useAtividades, useUpdateAtividade, Atividade } from '@/hooks/useCRMData';
import { DialogAtividade } from './DialogAtividade';
import { NotificacoesFollowUp } from './NotificacoesFollowUp';
import { format, formatDistanceToNow, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ligacao: { label: 'Ligação', icon: Phone, color: 'text-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'text-amber-500' },
  reuniao: { label: 'Reunião', icon: Calendar, color: 'text-purple-500' },
  visita: { label: 'Visita', icon: Users, color: 'text-green-500' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500' },
  outro: { label: 'Outro', icon: FileText, color: 'text-muted-foreground' }
};

export function ListaAtividades() {
  const { data: atividades, isLoading } = useAtividades();
  const updateAtividade = useUpdateAtividade();
  
  const [activeTab, setActiveTab] = useState('lista');
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('pendentes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pendentes');
  const [dialogOpen, setDialogOpen] = useState(false);

  const atividadesFiltradas = useMemo(() => {
    if (!atividades) return [];
    
    return atividades.filter(atividade => {
      const matchSearch = 
        atividade.titulo.toLowerCase().includes(search.toLowerCase()) ||
        atividade.contato?.nome?.toLowerCase().includes(search.toLowerCase());
      
      const matchTipo = tipoFilter === 'todos' || atividade.tipo === tipoFilter;
      
      const matchStatus = 
        statusFilter === 'todos' ||
        (statusFilter === 'pendentes' && !atividade.concluida) ||
        (statusFilter === 'concluidas' && atividade.concluida);
      
      return matchSearch && matchTipo && matchStatus;
    });
  }, [atividades, search, tipoFilter, statusFilter]);

  const handleToggleConcluida = async (atividade: Atividade) => {
    await updateAtividade.mutateAsync({
      id: atividade.id,
      concluida: !atividade.concluida
    });
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
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Atividades
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Follow-ups
          </TabsTrigger>
        </TabsList>
        {activeTab === 'lista' && (
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        )}
      </div>

      <TabsContent value="lista" className="mt-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Lista de Atividades
              <Badge variant="secondary" className="ml-2">
                {atividadesFiltradas.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou contato..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {Object.entries(TIPO_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="concluidas">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          {atividadesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atividadesFiltradas.map((atividade) => {
                const config = TIPO_CONFIG[atividade.tipo] || TIPO_CONFIG.outro;
                const Icon = config.icon;
                const dataAtividade = new Date(atividade.data_atividade);
                const dataLembrete = atividade.data_lembrete ? new Date(atividade.data_lembrete) : null;
                const lembreteVencido = dataLembrete && isPast(dataLembrete) && !atividade.concluida;
                const lembreteHoje = dataLembrete && isToday(dataLembrete) && !atividade.concluida;
                
                return (
                  <div 
                    key={atividade.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                      atividade.concluida && "bg-muted/50 opacity-75",
                      lembreteVencido && "border-red-500/50 bg-red-500/5",
                      lembreteHoje && "border-amber-500/50 bg-amber-500/5"
                    )}
                  >
                    <Checkbox
                      checked={atividade.concluida}
                      onCheckedChange={() => handleToggleConcluida(atividade)}
                      className="mt-1"
                    />
                    
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      atividade.concluida ? "bg-muted" : "bg-primary/10"
                    )}>
                      <Icon className={cn("h-5 w-5", atividade.concluida ? "text-muted-foreground" : config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn(
                            "font-medium",
                            atividade.concluida && "line-through text-muted-foreground"
                          )}>
                            {atividade.titulo}
                          </p>
                          {atividade.contato && (
                            <p className="text-sm text-muted-foreground">
                              {atividade.contato.nome}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {atividade.concluida && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Concluída
                            </Badge>
                          )}
                          {lembreteVencido && (
                            <Badge variant="destructive">
                              Atrasada
                            </Badge>
                          )}
                          {lembreteHoje && !lembreteVencido && (
                            <Badge variant="default" className="bg-amber-500">
                              Hoje
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {atividade.descricao && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {atividade.descricao}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {format(dataAtividade, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {dataLembrete && (
                          <span className={cn(lembreteVencido && "text-red-500")}>
                            Lembrete: {formatDistanceToNow(dataLembrete, { addSuffix: true, locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="followup" className="mt-0">
        <NotificacoesFollowUp />
      </TabsContent>

      <DialogAtividade 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </Tabs>
  );
}
