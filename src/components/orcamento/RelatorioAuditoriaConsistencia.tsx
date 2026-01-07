import { useAuditoriaConsistencia, InconsistenciaItem } from '@/hooks/useAuditoriaConsistencia';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  FileWarning, 
  Package, 
  Receipt, 
  ArrowRightLeft,
  Coins,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';


const severidadeConfig = {
  critica: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' },
  alta: { label: 'Alta', className: 'bg-orange-500 text-white' },
  media: { label: 'Média', className: 'bg-yellow-500 text-white' }
};

const tipoConfig = {
  orcamento_sem_pedido: { 
    label: 'Orçamentos sem Produção', 
    icon: Package,
    description: 'Orçamentos com pagamento confirmado que não geraram pedido'
  },
  pedido_sem_pagamento: { 
    label: 'Pedidos sem Pagamento', 
    icon: Receipt,
    description: 'Pedidos ativos cujo orçamento não tem status de pagamento'
  },
  conta_orfa: { 
    label: 'Contas Órfãs', 
    icon: FileWarning,
    description: 'Contas a receber sem orçamento válido vinculado'
  },
  status_divergente: { 
    label: 'Status Divergente', 
    icon: ArrowRightLeft,
    description: 'Status do orçamento não corresponde ao percentual pago'
  },
  comissao_sem_recebimento: { 
    label: 'Comissões sem Recebimento', 
    icon: Coins,
    description: 'Comissões criadas sem pagamento correspondente'
  }
};

interface InconsistenciaCardProps {
  item: InconsistenciaItem;
  onNavigate?: (view: string, id?: string) => void;
}

function InconsistenciaCard({ item, onNavigate }: InconsistenciaCardProps) {
  const config = tipoConfig[item.tipo];
  const severidade = severidadeConfig[item.severidade];

  const handleNavegar = () => {
    if (!onNavigate) return;
    
    switch (item.tipo) {
      case 'orcamento_sem_pedido':
      case 'status_divergente':
        onNavigate('visualizarOrcamento', item.id);
        break;
      case 'pedido_sem_pagamento':
        onNavigate('prodKanban');
        break;
      case 'conta_orfa':
        onNavigate('finContasReceber');
        break;
      case 'comissao_sem_recebimento':
        onNavigate('finComissoes');
        break;
    }
  };

  return (
    <div className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={severidade.className}>{severidade.label}</Badge>
          <span className="text-sm font-medium">{item.dados.codigo || item.dados.numeroPedido || ''}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleNavegar}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{item.descricao}</p>
      {item.dados.valor && (
        <p className="text-sm">
          <span className="text-muted-foreground">Valor:</span>{' '}
          <span className="font-medium">{formatCurrency(item.dados.valor)}</span>
        </p>
      )}
      {item.dados.cliente && (
        <p className="text-sm">
          <span className="text-muted-foreground">Cliente:</span>{' '}
          <span>{item.dados.cliente}</span>
        </p>
      )}
    </div>
  );
}

function CategoriaSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

interface RelatorioAuditoriaConsistenciaProps {
  onNavigate?: (view: string, id?: string) => void;
}

export function RelatorioAuditoriaConsistencia({ onNavigate }: RelatorioAuditoriaConsistenciaProps) {
  const { data, isLoading, refetch, isFetching } = useAuditoriaConsistencia();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auditoria de Consistência</CardTitle>
          <CardDescription>Carregando análise...</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriaSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auditoria de Consistência</CardTitle>
          <CardDescription>Erro ao carregar dados</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const categorias = [
    { key: 'pedidosSemPagamento', items: data.pedidosSemPagamento, ...tipoConfig.pedido_sem_pagamento },
    { key: 'orcamentosSemPedido', items: data.orcamentosSemPedido, ...tipoConfig.orcamento_sem_pedido },
    { key: 'statusDivergente', items: data.statusDivergente, ...tipoConfig.status_divergente },
    { key: 'contasOrfas', items: data.contasOrfas, ...tipoConfig.conta_orfa },
    { key: 'comissoesSemRecebimento', items: data.comissoesSemRecebimento, ...tipoConfig.comissao_sem_recebimento }
  ].filter(cat => cat.items.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {data.total === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              Auditoria de Consistência
            </CardTitle>
            <CardDescription>
              Análise cross-módulos para identificar inconsistências
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{data.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{data.criticas}</p>
            <p className="text-xs text-muted-foreground">Críticas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-500/10">
            <p className="text-2xl font-bold text-orange-600">{data.altas}</p>
            <p className="text-xs text-muted-foreground">Altas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-600">{data.medias}</p>
            <p className="text-xs text-muted-foreground">Médias</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {data.total === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-green-600">Sistema Consistente</p>
            <p className="text-sm text-muted-foreground">
              Nenhuma inconsistência detectada entre os módulos
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="multiple" className="w-full">
              {categorias.map((categoria) => {
                const Icon = categoria.icon;
                return (
                  <AccordionItem key={categoria.key} value={categoria.key}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="font-medium">{categoria.label}</p>
                          <p className="text-xs text-muted-foreground">{categoria.description}</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {categoria.items.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {categoria.items.map((item) => (
                          <InconsistenciaCard key={item.id} item={item} onNavigate={onNavigate} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
