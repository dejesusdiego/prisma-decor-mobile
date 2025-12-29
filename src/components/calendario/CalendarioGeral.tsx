import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Phone,
  Wrench,
  DollarSign,
  Users,
  MapPin,
  FileText,
  Package,
  AlertCircle,
  Filter,
  ExternalLink
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

type TipoEvento = 
  | 'atividade_crm' 
  | 'instalacao' 
  | 'visita' 
  | 'conta_pagar' 
  | 'conta_receber' 
  | 'pedido_entrega';

interface EventoCalendario {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  data: Date;
  hora?: string;
  descricao?: string;
  status?: string;
  cor: string;
  icone: React.ElementType;
  referenciaId?: string; // ID para navegação
  pedidoId?: string; // Para instalações
  contatoId?: string; // Para atividades CRM
}

const TIPOS_EVENTO: Record<TipoEvento, { label: string; cor: string; icone: React.ElementType }> = {
  atividade_crm: { label: 'Atividades CRM', cor: 'bg-blue-500', icone: Phone },
  instalacao: { label: 'Instalações', cor: 'bg-purple-500', icone: Wrench },
  visita: { label: 'Visitas', cor: 'bg-green-500', icone: MapPin },
  conta_pagar: { label: 'Contas a Pagar', cor: 'bg-red-500', icone: DollarSign },
  conta_receber: { label: 'Contas a Receber', cor: 'bg-emerald-500', icone: DollarSign },
  pedido_entrega: { label: 'Entregas', cor: 'bg-amber-500', icone: Package }
};

// formatCurrency com valor inteiro para calendário (importado de formatters)
const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function CalendarioGeral() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filtrosAtivos, setFiltrosAtivos] = useState<Record<TipoEvento, boolean>>({
    atividade_crm: true,
    instalacao: true,
    visita: true,
    conta_pagar: true,
    conta_receber: true,
    pedido_entrega: true
  });

  // Função para navegar para a tela correspondente ao evento
  const handleEventoClick = (evento: EventoCalendario) => {
    switch (evento.tipo) {
      case 'atividade_crm':
        if (evento.contatoId) {
          navigate(`/gerarorcamento?view=crm&contato=${evento.contatoId}`);
        }
        break;
      case 'instalacao':
        if (evento.pedidoId) {
          navigate(`/gerarorcamento?view=producao&pedido=${evento.pedidoId}`);
        }
        break;
      case 'visita':
        navigate('/gerarorcamento?view=solicitacoesVisita');
        break;
      case 'conta_pagar':
        navigate('/gerarorcamento?view=financeiro&tab=pagar');
        break;
      case 'conta_receber':
        navigate('/gerarorcamento?view=financeiro&tab=receber');
        break;
      case 'pedido_entrega':
        if (evento.pedidoId) {
          navigate(`/gerarorcamento?view=producao&pedido=${evento.pedidoId}`);
        }
        break;
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

  // Buscar atividades CRM
  const { data: atividades, isLoading: loadingAtividades } = useQuery({
    queryKey: ['calendario-atividades', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividades_crm')
        .select('*, contatos(nome)')
        .gte('data_atividade', calendarStart.toISOString())
        .lte('data_atividade', calendarEnd.toISOString())
        .eq('concluida', false);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar instalações
  const { data: instalacoes, isLoading: loadingInstalacoes } = useQuery({
    queryKey: ['calendario-instalacoes', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instalacoes')
        .select('*, pedidos(numero_pedido, orcamentos(cliente_nome, endereco, cidade))')
        .gte('data_agendada', format(calendarStart, 'yyyy-MM-dd'))
        .lte('data_agendada', format(calendarEnd, 'yyyy-MM-dd'))
        .neq('status', 'concluida');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar visitas
  const { data: visitas, isLoading: loadingVisitas } = useQuery({
    queryKey: ['calendario-visitas', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_visita')
        .select('*')
        .gte('data_agendada', format(calendarStart, 'yyyy-MM-dd'))
        .lte('data_agendada', format(calendarEnd, 'yyyy-MM-dd'))
        .in('status', ['pendente', 'confirmada']);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar contas a pagar
  const { data: contasPagar, isLoading: loadingContasPagar } = useQuery({
    queryKey: ['calendario-contas-pagar', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .gte('data_vencimento', format(calendarStart, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(calendarEnd, 'yyyy-MM-dd'))
        .in('status', ['pendente', 'atrasado']);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar contas a receber
  const { data: contasReceber, isLoading: loadingContasReceber } = useQuery({
    queryKey: ['calendario-contas-receber', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .gte('data_vencimento', format(calendarStart, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(calendarEnd, 'yyyy-MM-dd'))
        .in('status', ['pendente', 'parcial', 'atrasado']);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar pedidos com previsão de entrega
  const { data: pedidos, isLoading: loadingPedidos } = useQuery({
    queryKey: ['calendario-pedidos', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, orcamentos(cliente_nome, codigo)')
        .gte('previsao_entrega', format(calendarStart, 'yyyy-MM-dd'))
        .lte('previsao_entrega', format(calendarEnd, 'yyyy-MM-dd'))
        .not('status_producao', 'in', '("entregue","cancelado")');
      
      if (error) throw error;
      return data || [];
    }
  });

  const isLoading = loadingAtividades || loadingInstalacoes || loadingVisitas || 
                    loadingContasPagar || loadingContasReceber || loadingPedidos;

  // Unificar todos os eventos
  const eventos = useMemo<EventoCalendario[]>(() => {
    const todos: EventoCalendario[] = [];

    // Atividades CRM
    if (filtrosAtivos.atividade_crm && atividades) {
      atividades.forEach(a => {
        todos.push({
          id: a.id,
          tipo: 'atividade_crm',
          titulo: a.titulo,
          data: new Date(a.data_atividade),
          hora: format(new Date(a.data_atividade), 'HH:mm'),
          descricao: (a.contatos as any)?.nome || a.descricao,
          status: a.tipo,
          cor: TIPOS_EVENTO.atividade_crm.cor,
          icone: TIPOS_EVENTO.atividade_crm.icone,
          contatoId: a.contato_id || undefined
        });
      });
    }

    // Instalações
    if (filtrosAtivos.instalacao && instalacoes) {
      instalacoes.forEach(i => {
        const orcamento = (i.pedidos as any)?.orcamentos;
        todos.push({
          id: i.id,
          tipo: 'instalacao',
          titulo: `Instalação - ${orcamento?.cliente_nome || 'Cliente'}`,
          data: parseISO(i.data_agendada),
          hora: i.turno === 'manha' ? '08:00' : i.turno === 'tarde' ? '14:00' : '08:00',
          descricao: `${i.endereco}, ${i.cidade}`,
          status: i.status,
          cor: TIPOS_EVENTO.instalacao.cor,
          icone: TIPOS_EVENTO.instalacao.icone,
          pedidoId: i.pedido_id
        });
      });
    }

    // Visitas
    if (filtrosAtivos.visita && visitas) {
      visitas.forEach(v => {
        todos.push({
          id: v.id,
          tipo: 'visita',
          titulo: `Visita - ${v.nome}`,
          data: parseISO(v.data_agendada),
          hora: v.horario_agendado,
          descricao: `${v.cidade} - ${v.telefone}`,
          status: v.status,
          cor: TIPOS_EVENTO.visita.cor,
          icone: TIPOS_EVENTO.visita.icone,
          referenciaId: v.id
        });
      });
    }

    // Contas a pagar
    if (filtrosAtivos.conta_pagar && contasPagar) {
      contasPagar.forEach(c => {
        todos.push({
          id: c.id,
          tipo: 'conta_pagar',
          titulo: c.descricao,
          data: parseISO(c.data_vencimento),
          descricao: `${formatCurrency(c.valor)} - ${c.fornecedor || 'Sem fornecedor'}`,
          status: c.status,
          cor: c.status === 'atrasado' ? 'bg-red-600' : TIPOS_EVENTO.conta_pagar.cor,
          icone: TIPOS_EVENTO.conta_pagar.icone,
          referenciaId: c.id
        });
      });
    }

    // Contas a receber
    if (filtrosAtivos.conta_receber && contasReceber) {
      contasReceber.forEach(c => {
        todos.push({
          id: c.id,
          tipo: 'conta_receber',
          titulo: `Receber - ${c.cliente_nome}`,
          data: parseISO(c.data_vencimento),
          descricao: formatCurrency(c.valor_total - c.valor_pago),
          status: c.status,
          cor: c.status === 'atrasado' ? 'bg-red-600' : TIPOS_EVENTO.conta_receber.cor,
          icone: TIPOS_EVENTO.conta_receber.icone,
          referenciaId: c.id
        });
      });
    }

    // Pedidos/Entregas
    if (filtrosAtivos.pedido_entrega && pedidos) {
      pedidos.forEach(p => {
        if (p.previsao_entrega) {
          const orcamento = p.orcamentos as any;
          todos.push({
            id: p.id,
            tipo: 'pedido_entrega',
            titulo: `${p.numero_pedido} - ${orcamento?.cliente_nome || 'Cliente'}`,
            data: parseISO(p.previsao_entrega),
            descricao: `Status: ${p.status_producao}`,
            status: p.status_producao,
            cor: TIPOS_EVENTO.pedido_entrega.cor,
            icone: TIPOS_EVENTO.pedido_entrega.icone,
            pedidoId: p.id
          });
        }
      });
    }

    return todos.sort((a, b) => a.data.getTime() - b.data.getTime());
  }, [atividades, instalacoes, visitas, contasPagar, contasReceber, pedidos, filtrosAtivos]);

  // Agrupar eventos por data
  const eventosPorData = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    eventos.forEach(e => {
      const key = format(e.data, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [eventos]);

  // Dias do calendário
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventosDoDia = selectedDate 
    ? eventosPorData.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  const toggleFiltro = (tipo: TipoEvento) => {
    setFiltrosAtivos(prev => ({ ...prev, [tipo]: !prev[tipo] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Calendário Geral</h2>
          <p className="text-sm text-muted-foreground">
            Todos os compromissos e eventos do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros e Lista de Eventos */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.entries(TIPOS_EVENTO) as [TipoEvento, typeof TIPOS_EVENTO[TipoEvento]][]).map(([tipo, config]) => (
                <div key={tipo} className="flex items-center gap-2">
                  <Checkbox
                    id={tipo}
                    checked={filtrosAtivos[tipo]}
                    onCheckedChange={() => toggleFiltro(tipo)}
                  />
                  <Label htmlFor={tipo} className="flex items-center gap-2 cursor-pointer">
                    <div className={cn("w-3 h-3 rounded-full", config.cor)} />
                    <span className="text-sm">{config.label}</span>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Eventos do Dia Selecionado */}
          {selectedDate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventosDoDia.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum evento neste dia
                  </p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {eventosDoDia.map(evento => {
                        const Icon = evento.icone;
                        return (
                          <div 
                            key={evento.id} 
                            onClick={() => handleEventoClick(evento)}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", evento.cor.replace('bg-', 'bg-').replace('500', '100'))}>
                                <Icon className={cn("h-4 w-4", evento.cor.replace('bg-', 'text-'))} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate">{evento.titulo}</p>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {evento.hora && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {evento.hora}
                                  </p>
                                )}
                                {evento.descricao && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {evento.descricao}
                                  </p>
                                )}
                                {evento.status && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "mt-2 text-xs",
                                      evento.status === 'atrasado' && "border-red-500 text-red-500"
                                    )}
                                  >
                                    {evento.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(Object.entries(TIPOS_EVENTO) as [TipoEvento, typeof TIPOS_EVENTO[TipoEvento]][]).map(([tipo, config]) => {
                  const count = eventos.filter(e => e.tipo === tipo).length;
                  if (!filtrosAtivos[tipo] || count === 0) return null;
                  const Icon = config.icone;
                  return (
                    <div key={tipo} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", config.cor.replace('bg-', 'text-'))} />
                        <span>{config.label}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendário */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <>
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                    <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Dias do mês */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map(day => {
                    const dayEvents = eventosPorData.get(format(day, 'yyyy-MM-dd')) || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const hasAtrasados = dayEvents.some(e => e.status === 'atrasado');

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "min-h-[100px] p-2 rounded-lg border transition-all text-left",
                          "hover:border-primary/50 hover:bg-accent/30",
                          !isCurrentMonth && "opacity-40",
                          isToday(day) && "border-primary bg-primary/5",
                          isSelected && "ring-2 ring-primary border-primary"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-sm font-medium",
                            isToday(day) && "text-primary"
                          )}>
                            {format(day, 'd')}
                          </span>
                          {hasAtrasados && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(evento => (
                            <div 
                              key={evento.id}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded truncate text-white",
                                evento.cor
                              )}
                              title={evento.titulo}
                            >
                              {evento.hora && <span className="opacity-75">{evento.hora} </span>}
                              {evento.titulo.slice(0, 15)}...
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayEvents.length - 3} mais
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
