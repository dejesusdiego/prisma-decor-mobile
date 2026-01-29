import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Check,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowUp,
  History,
  Receipt,
  Shield,
  Zap,
  Users,
  Building2,
} from 'lucide-react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  maxUsers: number;
  maxStorage: string;
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 97,
    description: 'Ideal para pequenos negócios começando',
    maxUsers: 3,
    maxStorage: '5GB',
    features: [
      { name: 'Até 3 usuários', included: true },
      { name: '5GB armazenamento', included: true },
      { name: 'Orçamentos ilimitados', included: true },
      { name: 'Controle de pedidos', included: true },
      { name: 'Financeiro básico', included: true },
      { name: 'CRM simples', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Múltiplos usuários', included: false },
      { name: 'Relatórios avançados', included: false },
      { name: 'Integrações', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 197,
    description: 'Perfeito para empresas em crescimento',
    maxUsers: 10,
    maxStorage: '20GB',
    popular: true,
    features: [
      { name: 'Até 10 usuários', included: true },
      { name: '20GB armazenamento', included: true },
      { name: 'Orçamentos ilimitados', included: true },
      { name: 'Controle de pedidos', included: true },
      { name: 'Financeiro completo', included: true },
      { name: 'CRM avançado', included: true },
      { name: 'Suporte prioritário', included: true },
      { name: 'Múltiplos usuários', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Integrações', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 497,
    description: 'Para grandes operações',
    maxUsers: 50,
    maxStorage: '100GB',
    features: [
      { name: 'Até 50 usuários', included: true },
      { name: '100GB armazenamento', included: true },
      { name: 'Orçamentos ilimitados', included: true },
      { name: 'Controle de pedidos', included: true },
      { name: 'Financeiro completo', included: true },
      { name: 'CRM avançado', included: true },
      { name: 'Suporte 24/7', included: true },
      { name: 'Múltiplos usuários', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Integrações', included: true },
      { name: 'API access', included: true },
    ],
  },
];

const BILLING_HISTORY = [
  { id: 'INV-001', date: '2026-01-15', amount: 197.00, status: 'paid', description: 'Plano Profissional - Jan/2026' },
  { id: 'INV-002', date: '2025-12-15', amount: 197.00, status: 'paid', description: 'Plano Profissional - Dez/2025' },
  { id: 'INV-003', date: '2025-11-15', amount: 197.00, status: 'paid', description: 'Plano Profissional - Nov/2025' },
];

export default function ConfiguracoesFaturamento() {
  const { organization } = useOrganizationContext();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock current plan - in production this would come from organization.subscription_plan
  const currentPlan = 'pro';
  const currentPlanData = PLANS.find(p => p.id === currentPlan) || PLANS[1];

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setIsUpgradeDialogOpen(true);
  };

  const processUpgrade = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);

    // Mock ASAAS integration - in production this would redirect to ASAAS checkout
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success('Redirecionando para pagamento...', {
      description: 'Você será redirecionado para o ASAAS para completar o upgrade.',
    });

    setIsProcessing(false);
    setIsUpgradeDialogOpen(false);

    // In production: window.location.href = asaasCheckoutUrl;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Faturamento</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu plano, pagamentos e faturas
            </p>
          </div>

          {/* Current Plan Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Plano Atual: {currentPlanData.name}</CardTitle>
                    <CardDescription>
                      Renovação automática em 15/02/2026
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="text-sm">
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Usuários
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">5</span>
                    <span className="text-muted-foreground">/ {currentPlanData.maxUsers}</span>
                  </div>
                  <Progress value={(5 / currentPlanData.maxUsers) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Armazenamento
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">12.5</span>
                    <span className="text-muted-foreground">/ {currentPlanData.maxStorage}</span>
                  </div>
                  <Progress value={(12.5 / 20) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Próxima cobrança
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(currentPlanData.price)}
                  </div>
                  <p className="text-xs text-muted-foreground">Em 15/02/2026</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="plans" className="space-y-6">
            <TabsList>
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="payment">Pagamento</TabsTrigger>
            </TabsList>

            {/* Plans Tab */}
            <TabsContent value="plans" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col ${
                      plan.id === currentPlan
                        ? 'border-primary ring-1 ring-primary'
                        : ''
                    } ${plan.popular ? 'border-primary/50' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    {plan.id === currentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="outline" className="bg-background">
                          Plano Atual
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className={`flex items-center gap-2 text-sm ${
                              feature.included
                                ? 'text-foreground'
                                : 'text-muted-foreground line-through'
                            }`}
                          >
                            <Check
                              className={`h-4 w-4 ${
                                feature.included
                                  ? 'text-green-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            {feature.name}
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-4">
                      {plan.id === currentPlan ? (
                        <Button variant="outline" className="w-full" disabled>
                          Plano Atual
                        </Button>
                      ) : plan.price > currentPlanData.price ? (
                        <Button
                          className="w-full"
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Fazer Upgrade
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          Mudar Plano
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Histórico de Faturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {BILLING_HISTORY.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Receipt className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.id} • {formatDate(invoice.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            {formatCurrency(invoice.amount)}
                          </span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Pago
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Método de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Seus pagamentos são processados de forma segura pelo ASAAS.
                      Não armazenamos dados do seu cartão.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Cartão de Crédito</p>
                        <p className="text-sm text-muted-foreground">
                          **** **** **** 4242
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Principal</Badge>
                      <Button variant="ghost" size="sm">
                        Alterar
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Adicionar Cartão
                    </Button>
                    <Button variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      PIX
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Upgrade</DialogTitle>
            <DialogDescription>
              Você está fazendo upgrade para o plano{' '}
              <strong>{PLANS.find(p => p.id === selectedPlan)?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between p-4 bg-muted rounded-lg">
              <span>Novo valor mensal:</span>
              <span className="font-bold">
                {formatCurrency(PLANS.find(p => p.id === selectedPlan)?.price || 0)}
              </span>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você será redirecionado para o ASAAS para completar o pagamento.
                A cobrança será feita imediatamente.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpgradeDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={processUpgrade} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Continuar para Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
