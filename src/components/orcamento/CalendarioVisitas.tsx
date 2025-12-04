import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  parseISO,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  MapPin,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SolicitacaoVisita {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  data_agendada: string;
  horario_agendado: string;
  status: string;
}

interface CalendarioVisitasProps {
  visitas: SolicitacaoVisita[];
  onSelectVisita?: (visita: SolicitacaoVisita) => void;
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500",
  confirmada: "bg-blue-500",
  realizada: "bg-green-500",
  cancelada: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export function CalendarioVisitas({ visitas, onSelectVisita }: CalendarioVisitasProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Agrupar visitas por data
  const visitasPorData = useMemo(() => {
    const grouped: Record<string, SolicitacaoVisita[]> = {};
    visitas.forEach((visita) => {
      const dateKey = visita.data_agendada;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(visita);
    });
    return grouped;
  }, [visitas]);

  // Função para verificar se uma data tem visitas
  const getVisitasForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return visitasPorData[dateKey] || [];
  };

  // Visitas do dia selecionado
  const visitasDoDia = getVisitasForDate(selectedDate);

  // Dias da semana atual para visão semanal
  const diasDaSemana = useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const end = endOfWeek(selectedDate, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Navegar semana
  const navegarSemana = (direcao: "prev" | "next") => {
    const dias = direcao === "prev" ? -7 : 7;
    const novaData = new Date(selectedDate);
    novaData.setDate(novaData.getDate() + dias);
    setSelectedDate(novaData);
  };

  // Renderizar indicadores de visitas no calendário
  const renderDayContent = (day: Date) => {
    const visitasNoDia = getVisitasForDate(day);
    if (visitasNoDia.length === 0) return null;

    const statusCounts: Record<string, number> = {};
    visitasNoDia.forEach((v) => {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
    });

    return (
      <div className="flex gap-0.5 justify-center mt-1">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div
            key={status}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              statusColors[status] || "bg-muted"
            )}
            title={`${count} ${statusLabels[status] || status}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Calendário de Visitas
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Mês
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              <CalendarRange className="h-4 w-4 mr-1" />
              Semana
            </Button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={cn("h-2.5 w-2.5 rounded-full", statusColors[status])} />
              {label}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {viewMode === "month" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calendário mensal */}
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  hasVisitas: (date) => getVisitasForDate(date).length > 0,
                }}
                modifiersClassNames={{
                  hasVisitas: "font-bold",
                }}
                components={{
                  DayContent: ({ date }) => (
                    <div className="flex flex-col items-center">
                      <span>{date.getDate()}</span>
                      {renderDayContent(date)}
                    </div>
                  ),
                }}
              />
            </div>

            {/* Lista de visitas do dia */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                Visitas em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                {isToday(selectedDate) && (
                  <Badge variant="secondary" className="text-xs">Hoje</Badge>
                )}
              </h3>
              <ScrollArea className="h-[280px]">
                {visitasDoDia.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma visita agendada para este dia
                  </p>
                ) : (
                  <div className="space-y-2">
                    {visitasDoDia
                      .sort((a, b) => a.horario_agendado.localeCompare(b.horario_agendado))
                      .map((visita) => (
                        <VisitaCard
                          key={visita.id}
                          visita={visita}
                          onClick={() => onSelectVisita?.(visita)}
                        />
                      ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        ) : (
          /* Visão Semanal */
          <div>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => navegarSemana("prev")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="font-medium">
                {format(diasDaSemana[0], "dd MMM", { locale: ptBR })} -{" "}
                {format(diasDaSemana[6], "dd MMM yyyy", { locale: ptBR })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navegarSemana("next")}>
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {diasDaSemana.map((dia) => {
                const visitasNoDia = getVisitasForDate(dia);
                const isSelected = isSameDay(dia, selectedDate);
                const isHoje = isToday(dia);

                return (
                  <div
                    key={dia.toISOString()}
                    className={cn(
                      "min-h-[120px] p-2 rounded-lg border cursor-pointer transition-colors",
                      isSelected && "border-primary bg-primary/5",
                      isHoje && !isSelected && "border-accent bg-accent/5",
                      !isSelected && !isHoje && "border-border/50 hover:border-border"
                    )}
                    onClick={() => setSelectedDate(dia)}
                  >
                    <div className="text-center mb-2">
                      <div className="text-xs text-muted-foreground">
                        {format(dia, "EEE", { locale: ptBR })}
                      </div>
                      <div
                        className={cn(
                          "text-lg font-semibold",
                          isHoje && "text-primary"
                        )}
                      >
                        {format(dia, "dd")}
                      </div>
                    </div>

                    <ScrollArea className="h-[70px]">
                      <div className="space-y-1">
                        {visitasNoDia
                          .sort((a, b) => a.horario_agendado.localeCompare(b.horario_agendado))
                          .slice(0, 3)
                          .map((visita) => (
                            <Popover key={visita.id}>
                              <PopoverTrigger asChild>
                                <div
                                  className={cn(
                                    "text-xs p-1 rounded truncate cursor-pointer",
                                    "bg-muted/50 hover:bg-muted"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full shrink-0",
                                        statusColors[visita.status]
                                      )}
                                    />
                                    <span className="truncate">{visita.horario_agendado.split(" - ")[0]}</span>
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-3" align="start">
                                <VisitaCard visita={visita} compact onClick={() => onSelectVisita?.(visita)} />
                              </PopoverContent>
                            </Popover>
                          ))}
                        {visitasNoDia.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{visitasNoDia.length - 3} mais
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de card de visita
function VisitaCard({
  visita,
  compact,
  onClick,
}: {
  visita: SolicitacaoVisita;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/5 cursor-pointer transition-colors",
        compact && "p-2"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className={cn("font-medium truncate", compact && "text-sm")}>
              {visita.nome}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{visita.horario_agendado}</span>
          </div>
          {!compact && (
            <>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{visita.cidade}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{visita.telefone}</span>
              </div>
            </>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-xs",
            visita.status === "pendente" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
            visita.status === "confirmada" && "bg-blue-500/10 text-blue-600 border-blue-500/30",
            visita.status === "realizada" && "bg-green-500/10 text-green-600 border-green-500/30",
            visita.status === "cancelada" && "bg-red-500/10 text-red-600 border-red-500/30"
          )}
        >
          {statusLabels[visita.status] || visita.status}
        </Badge>
      </div>
    </div>
  );
}
