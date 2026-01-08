import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { useProducaoData, STATUS_INSTALACAO_LABELS, TURNO_LABELS } from '@/hooks/useProducaoData';
import { DialogAgendarInstalacao } from './DialogAgendarInstalacao';
import { TipBanner } from '@/components/ui/TipBanner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateOnly, isSameDayDateOnly } from '@/lib/dateOnly';

export function AgendaInstalacoes() {
  const { instalacoes, pedidos, isLoading, atualizarInstalacao } = useProducaoData();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [filtroInstalador, setFiltroInstalador] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Pedidos prontos que ainda não têm instalação agendada
  const pedidosProntosParaInstalacao = pedidos.filter(p => 
    p.status_producao === 'pronto' && 
    (!p.instalacoes || p.instalacoes.length === 0 || p.instalacoes.every(i => i.status === 'cancelada'))
  );

  // Instaladores únicos
  const instaladores = useMemo(() => {
    const set = new Set<string>();
    instalacoes.forEach(i => {
      if (i.instalador) set.add(i.instalador);
    });
    return Array.from(set);
  }, [instalacoes]);

  // Instalações filtradas
  const instalacoesFiltradas = instalacoes.filter(i => 
    filtroInstalador === 'todos' || i.instalador === filtroInstalador
  );

  // Instalações do dia selecionado
  const instalacoesDoDia = diaSelecionado 
    ? instalacoesFiltradas.filter(i => isSameDayDateOnly(i.data_agendada, diaSelecionado))
    : [];

  // Dias do mês com instalações
  const diasComInstalacao = useMemo(() => {
    const inicio = startOfMonth(mesAtual);
    const fim = endOfMonth(mesAtual);
    const dias = eachDayOfInterval({ start: inicio, end: fim });
    
    return dias.map(dia => ({
      date: dia,
      count: instalacoesFiltradas.filter(i => isSameDayDateOnly(i.data_agendada, dia)).length,
      hasUrgent: instalacoesFiltradas.some(i => 
        isSameDayDateOnly(i.data_agendada, dia) && 
        ['agendada', 'confirmada'].includes(i.status)
      )
    }));
  }, [mesAtual, instalacoesFiltradas]);

  const handleMarcarConcluida = (instalacaoId: string) => {
    atualizarInstalacao({ 
      id: instalacaoId, 
      status: 'concluida',
      data_realizada: new Date().toISOString()
    });
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] md:col-span-2" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TipBanner
        id="agenda-instalacoes-tip"
        title="Agenda de Instalações"
        variant="info"
      >
        Gerencie as instalações agendadas. Clique em um dia para ver os detalhes 
        ou use o botão para agendar uma nova instalação.
      </TipBanner>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Instalador:</span>
            <Select value={filtroInstalador} onValueChange={setFiltroInstalador}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {instaladores.map(inst => (
                  <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agendar Instalação
        </Button>
      </div>

      {/* Alerta de pedidos prontos */}
      {pedidosProntosParaInstalacao.length > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-400">
                    {pedidosProntosParaInstalacao.length} pedido(s) pronto(s) para agendar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Aguardando agendamento de instalação
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                Agendar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setMesAtual(subMonths(mesAtual, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setMesAtual(addMonths(mesAtual, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={diaSelecionado || undefined}
              onSelect={(date) => setDiaSelecionado(date || null)}
              month={mesAtual}
              onMonthChange={setMesAtual}
              locale={ptBR}
              className="w-full"
              modifiers={{
                hasInstallation: diasComInstalacao.filter(d => d.count > 0).map(d => d.date),
              }}
              modifiersStyles={{
                hasInstallation: {
                  fontWeight: 'bold',
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                },
              }}
              components={{
                DayContent: ({ date }) => {
                  const dayInfo = diasComInstalacao.find(d => isSameDay(d.date, date));
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{date.getDate()}</span>
                      {dayInfo && dayInfo.count > 0 && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-primary">
                          {dayInfo.count}
                        </span>
                      )}
                    </div>
                  );
                }
              }}
            />

            {/* Legenda */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              {Object.entries(STATUS_INSTALACAO_LABELS).slice(0, 4).map(([key, info]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={cn("w-3 h-3 rounded-full", info.color)} />
                  <span className="text-muted-foreground">{info.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {diaSelecionado 
                ? format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!diaSelecionado ? (
              <p className="text-muted-foreground text-center py-8">
                Clique em um dia para ver as instalações
              </p>
            ) : instalacoesDoDia.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">Nenhuma instalação neste dia</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {instalacoesDoDia.map(instalacao => {
                  const statusInfo = STATUS_INSTALACAO_LABELS[instalacao.status];
                  
                  return (
                    <div 
                      key={instalacao.id}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {instalacao.pedido?.numero_pedido}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {instalacao.pedido?.orcamento?.codigo}
                          </p>
                        </div>
                        <Badge className={cn(statusInfo.color, "text-white text-xs")}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {instalacao.pedido?.orcamento?.cliente_nome}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {TURNO_LABELS[instalacao.turno]}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {instalacao.endereco}
                        </div>
                        {instalacao.instalador && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            Instalador: {instalacao.instalador}
                          </div>
                        )}
                      </div>

                      {['agendada', 'confirmada', 'em_andamento'].includes(instalacao.status) && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full mt-3"
                          onClick={() => handleMarcarConcluida(instalacao.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marcar Concluída
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DialogAgendarInstalacao
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pedidosDisponiveis={pedidosProntosParaInstalacao}
        dataSugerida={diaSelecionado}
      />
    </div>
  );
}
