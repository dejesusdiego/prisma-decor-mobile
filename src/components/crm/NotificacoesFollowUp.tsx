import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  MessageCircle, 
  Phone, 
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useAtividadesPendentesHoje, useUpdateAtividade, Contato } from '@/hooks/useCRMData';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AtividadeComContato {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data_atividade: string;
  data_lembrete: string | null;
  concluida: boolean;
  contato: { nome: string; telefone: string | null } | null;
}

const formatWhatsAppLink = (telefone: string) => {
  const cleaned = telefone.replace(/\D/g, '');
  const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  return `https://wa.me/${withCountry}`;
};

const MENSAGENS_FOLLOWUP: Record<string, (nome: string, titulo: string) => string> = {
  ligacao: (nome, titulo) => 
    `Olá ${nome}! 👋\n\nEstou entrando em contato referente a: ${titulo}\n\nPodemos conversar?\n\n_Prisma Interiores_`,
  reuniao: (nome, titulo) => 
    `Olá ${nome}! 👋\n\nGostaria de confirmar nossa reunião sobre: ${titulo}\n\nO horário ainda está ok para você?\n\n_Prisma Interiores_`,
  visita: (nome, titulo) => 
    `Olá ${nome}! 👋\n\nPassando para confirmar a visita técnica: ${titulo}\n\nPodemos manter conforme agendado?\n\n_Prisma Interiores_`,
  proposta: (nome, titulo) => 
    `Olá ${nome}! 👋\n\nGostaria de saber se teve a oportunidade de analisar nossa proposta: ${titulo}\n\nPosso esclarecer alguma dúvida?\n\n_Prisma Interiores_`,
  default: (nome, titulo) => 
    `Olá ${nome}! 👋\n\nEstou fazendo um follow-up sobre: ${titulo}\n\nComo posso ajudar?\n\n_Prisma Interiores_`
};

export function NotificacoesFollowUp() {
  const { data: atividades, isLoading, refetch } = useAtividadesPendentesHoje();
  const updateAtividade = useUpdateAtividade();

  const atividadesOrdenadas = useMemo(() => {
    if (!atividades) return [];
    
    return [...atividades].sort((a, b) => {
      // Atrasadas primeiro
      const aAtrasada = a.data_lembrete && isPast(new Date(a.data_lembrete));
      const bAtrasada = b.data_lembrete && isPast(new Date(b.data_lembrete));
      if (aAtrasada && !bAtrasada) return -1;
      if (!aAtrasada && bAtrasada) return 1;
      
      // Depois por data de lembrete
      const aDate = a.data_lembrete ? new Date(a.data_lembrete) : new Date();
      const bDate = b.data_lembrete ? new Date(b.data_lembrete) : new Date();
      return aDate.getTime() - bDate.getTime();
    }) as AtividadeComContato[];
  }, [atividades]);

  const handleEnviarWhatsApp = (atividade: AtividadeComContato) => {
    if (!atividade.contato?.telefone) {
      toast.error('Contato sem telefone cadastrado');
      return;
    }

    const getMensagem = MENSAGENS_FOLLOWUP[atividade.tipo] || MENSAGENS_FOLLOWUP.default;
    const mensagem = getMensagem(atividade.contato.nome, atividade.titulo);
    const url = `${formatWhatsAppLink(atividade.contato.telefone)}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
    toast.success('Abrindo WhatsApp...');
  };

  const handleMarcarConcluida = async (atividade: AtividadeComContato) => {
    await updateAtividade.mutateAsync({
      id: atividade.id,
      concluida: true
    });
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Follow-ups Pendentes
          {atividadesOrdenadas.length > 0 && (
            <Badge variant="destructive" className="ml-2 animate-pulse">
              {atividadesOrdenadas.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atividadesOrdenadas.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">Tudo em dia!</p>
            <p className="text-muted-foreground">
              Nenhum follow-up pendente para hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {atividadesOrdenadas.map((atividade) => {
              const dataLembrete = atividade.data_lembrete ? new Date(atividade.data_lembrete) : null;
              const isAtrasada = dataLembrete && isPast(dataLembrete) && !isToday(dataLembrete);
              const isHoje = dataLembrete && isToday(dataLembrete);
              
              return (
                <div 
                  key={atividade.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    isAtrasada && "border-red-500 bg-red-500/5",
                    isHoje && !isAtrasada && "border-amber-500 bg-amber-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isAtrasada && (
                          <Badge variant="destructive" className="text-xs">
                            ATRASADO
                          </Badge>
                        )}
                        {isHoje && !isAtrasada && (
                          <Badge className="bg-amber-500 text-xs">
                            HOJE
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{atividade.titulo}</p>
                      {atividade.contato && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {atividade.contato.nome}
                          {atividade.contato.telefone && (
                            <span className="text-xs">({atividade.contato.telefone})</span>
                          )}
                        </p>
                      )}
                      {dataLembrete && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(dataLembrete, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          <span className="text-muted-foreground">
                            ({formatDistanceToNow(dataLembrete, { addSuffix: true, locale: ptBR })})
                          </span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {atividade.contato?.telefone && (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleEnviarWhatsApp(atividade)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMarcarConcluida(atividade)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
