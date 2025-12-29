import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  MapPin,
  Phone
} from 'lucide-react';
import { useRelatorioJornada, EstagioFunil, ContatoNoEstagio } from '@/hooks/useRelatorioJornada';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

interface RelatorioJornadaClientesProps {
  onVerContato?: (contatoId: string) => void;
}

export function RelatorioJornadaClientes({ onVerContato }: RelatorioJornadaClientesProps) {
  const { data, isLoading } = useRelatorioJornada();
  const [estagioExpandido, setEstagioExpandido] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { funil, contatosPorEstagio, totalContatos, valorTotalPipeline, conversaoGeral, tempoMedioTotal } = data;

  // Dados para gráfico de funil
  const dadosFunil = funil.map(e => ({
    name: e.label,
    value: e.quantidade,
    fill: e.color
  }));

  // Dados para gráfico de tempo médio
  const dadosTempo = funil.map(e => ({
    name: e.label,
    dias: e.tempoMedio,
    fill: e.color
  }));

  // Identificar gargalos (conversão < 30% ou tempo > 15 dias)
  const gargalos = funil.filter(e => 
    (e.conversaoAnterior !== null && e.conversaoAnterior < 30) || 
    e.tempoMedio > 15
  );

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total Contatos</span>
            </div>
            <p className="text-2xl font-bold">{totalContatos}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Valor Pipeline</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(valorTotalPipeline)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Conversão Geral</span>
            </div>
            <p className="text-2xl font-bold">{conversaoGeral.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Lead → Instalação</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Tempo Médio</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(tempoMedioTotal)} dias</p>
            <p className="text-xs text-muted-foreground">Por estágio</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Gargalos */}
      {gargalos.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Gargalos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gargalos.map(g => (
                <Badge key={g.id} variant="outline" className="border-amber-500/30">
                  {g.label}
                  {g.conversaoAnterior !== null && g.conversaoAnterior < 30 && (
                    <span className="ml-1 text-amber-600">
                      ({g.conversaoAnterior.toFixed(0)}% conversão)
                    </span>
                  )}
                  {g.tempoMedio > 15 && (
                    <span className="ml-1 text-amber-600">
                      ({g.tempoMedio}d média)
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funil Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, 'Contatos']}
                  />
                  <Funnel
                    dataKey="value"
                    data={dadosFunil}
                    isAnimationActive
                  >
                    {dadosFunil.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList 
                      position="right" 
                      fill="#000" 
                      stroke="none" 
                      dataKey="name" 
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tempo Médio por Estágio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tempo Médio por Estágio (dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTempo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="dias" radius={[0, 4, 4, 0]}>
                    {dadosTempo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por Estágio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes por Estágio</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {funil.map((estagio, index) => {
              const contatos = contatosPorEstagio[estagio.id];
              const isExpandido = estagioExpandido === estagio.id;
              const contatosTravados = contatos.filter(c => c.diasNoEstagio > 15);
              
              return (
                <div key={estagio.id}>
                  {/* Header do Estágio */}
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setEstagioExpandido(isExpandido ? null : estagio.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: estagio.color }}
                      />
                      <div>
                        <p className="font-medium">{estagio.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {estagio.quantidade} contato(s) • {formatCurrency(estagio.valor)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {estagio.conversaoAnterior !== null && (
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-medium",
                            estagio.conversaoAnterior >= 50 ? "text-emerald-600" : 
                            estagio.conversaoAnterior >= 30 ? "text-amber-600" : "text-red-600"
                          )}>
                            {estagio.conversaoAnterior.toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">conversão</p>
                        </div>
                      )}
                      
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-medium",
                          estagio.tempoMedio <= 7 ? "text-emerald-600" : 
                          estagio.tempoMedio <= 15 ? "text-amber-600" : "text-red-600"
                        )}>
                          {estagio.tempoMedio}d
                        </p>
                        <p className="text-xs text-muted-foreground">média</p>
                      </div>
                      
                      {contatosTravados.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {contatosTravados.length} travado(s)
                        </Badge>
                      )}
                      
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpandido && "rotate-90"
                      )} />
                    </div>
                  </div>
                  
                  {/* Lista de Contatos Expandida */}
                  {isExpandido && contatos.length > 0 && (
                    <div className="bg-muted/30 border-t">
                      <ScrollArea className="max-h-64">
                        <div className="divide-y">
                          {contatos.map(contato => (
                            <div 
                              key={contato.id}
                              className="flex items-center justify-between p-3 hover:bg-background cursor-pointer transition-colors"
                              onClick={() => onVerContato?.(contato.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium">
                                    {contato.nome.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{contato.nome}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {contato.telefone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {contato.telefone}
                                      </span>
                                    )}
                                    {contato.cidade && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {contato.cidade}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {contato.valorTotal > 0 && (
                                  <span className="text-sm font-medium text-emerald-600">
                                    {formatCurrency(contato.valorTotal)}
                                  </span>
                                )}
                                <Badge 
                                  variant={contato.diasNoEstagio > 15 ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {contato.diasNoEstagio}d
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {isExpandido && contatos.length === 0 && (
                    <div className="bg-muted/30 border-t p-4 text-center text-sm text-muted-foreground">
                      Nenhum contato neste estágio
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
