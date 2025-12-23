import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, History, User, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HistoricoDesconto {
  id: string;
  desconto_tipo_anterior: string | null;
  desconto_valor_anterior: number;
  desconto_tipo_novo: string | null;
  desconto_valor_novo: number;
  motivo: string | null;
  usuario_nome: string;
  created_at: string;
}

interface HistoricoDescontosProps {
  orcamentoId: string;
}

export function HistoricoDescontos({ orcamentoId }: HistoricoDescontosProps) {
  const [historico, setHistorico] = useState<HistoricoDesconto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        const { data, error } = await supabase
          .from('historico_descontos')
          .select('*')
          .eq('orcamento_id', orcamentoId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistorico(data || []);
      } catch (error) {
        console.error('Erro ao carregar histórico de descontos:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarHistorico();
  }, [orcamentoId]);

  if (loading || historico.length === 0) return null;

  const formatDesconto = (tipo: string | null, valor: number) => {
    if (!tipo || valor === 0) return 'Sem desconto';
    if (tipo === 'percentual') return `${valor}%`;
    return `R$ ${valor.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full justify-between text-xs"
        >
          <span className="flex items-center gap-2">
            <History className="h-3 w-3" />
            Histórico de Alterações ({historico.length})
          </span>
          <ChevronDown className="h-3 w-3 transition-transform" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {historico.map((item) => (
            <div 
              key={item.id} 
              className="bg-muted/50 rounded p-2 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{item.usuario_nome}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline" className="text-xs">
                  {formatDesconto(item.desconto_tipo_anterior, item.desconto_valor_anterior)}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge 
                  variant={item.desconto_valor_novo > 0 ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {formatDesconto(item.desconto_tipo_novo, item.desconto_valor_novo)}
                </Badge>
              </div>

              {item.motivo && (
                <p className="text-muted-foreground italic pt-1">
                  Motivo: {item.motivo}
                </p>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export async function registrarHistoricoDesconto(
  orcamentoId: string,
  descontoAnterior: { tipo: string | null; valor: number },
  descontoNovo: { tipo: string | null; valor: number },
  usuarioId: string,
  usuarioNome: string,
  motivo?: string
): Promise<void> {
  // Só registrar se houve mudança
  if (
    descontoAnterior.tipo === descontoNovo.tipo &&
    descontoAnterior.valor === descontoNovo.valor
  ) {
    return;
  }

  try {
    const { error } = await supabase
      .from('historico_descontos')
      .insert({
        orcamento_id: orcamentoId,
        desconto_tipo_anterior: descontoAnterior.tipo,
        desconto_valor_anterior: descontoAnterior.valor,
        desconto_tipo_novo: descontoNovo.tipo,
        desconto_valor_novo: descontoNovo.valor,
        usuario_id: usuarioId,
        usuario_nome: usuarioNome,
        motivo,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao registrar histórico de desconto:', error);
  }
}
