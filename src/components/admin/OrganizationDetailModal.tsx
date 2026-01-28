import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  CreditCard,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  users: number;
  orcamentos: number;
  created_at: string;
}

interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  domain: string | null;
  whatsapp: string | null;
  address: string | null;
  email: string | null;
  logo_url: string | null;
  theme: string | null;
}

interface UserInfo {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

interface OrcamentoInfo {
  id: string;
  numero: string;
  cliente_nome: string;
  valor_total: number;
  status: string;
  created_at: string;
}

interface SubscriptionInfo {
  plan_type: string;
  status: string;
  price_cents: number;
  created_at: string;
  current_period_end: string | null;
}

interface OrganizationDetailModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrganizationDetailModal({ 
  organization, 
  isOpen, 
  onClose 
}: OrganizationDetailModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [details, setDetails] = useState<OrganizationDetail | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoInfo[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    if (isOpen && organization) {
      loadOrganizationDetails();
    }
  }, [isOpen, organization]);

  const loadOrganizationDetails = async () => {
    if (!organization) return;
    
    try {
      setIsLoading(true);

      // Load organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single();

      if (orgError) throw orgError;
      setDetails(orgData as OrganizationDetail);

      // Load users
      const { data: usersData, error: usersError } = await (supabase as any)
        .from('organization_users')
        .select(`
          user_id,
          role,
          created_at,
          user:users(id, email, last_sign_in_at)
        `)
        .eq('organization_id', organization.id);

      if (usersError) throw usersError;
      
      const formattedUsers: UserInfo[] = (usersData || []).map((u: any) => ({
        id: u.user_id,
        email: u.user?.email || '-',
        role: u.role,
        created_at: u.created_at,
        last_sign_in: u.user?.last_sign_in_at,
      }));
      setUsers(formattedUsers);

      // Load recent orcamentos
      const { data: orcData, error: orcError } = await supabase
        .from('orcamentos')
        .select('id, numero, cliente_nome, valor_total, status, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (orcError) throw orcError;
      setOrcamentos((orcData || []) as OrcamentoInfo[]);

      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_type, status, price_cents, created_at, current_period_end')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') throw subError;
      setSubscription(subData as SubscriptionInfo | null);

    } catch (err: any) {
      console.error('Error loading organization details:', err);
      toast.error('Erro ao carregar detalhes da organização');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600',
      trialing: 'bg-blue-500/10 text-blue-600',
      paused: 'bg-yellow-500/10 text-yellow-600',
      canceled: 'bg-red-500/10 text-red-600',
      pending: 'bg-gray-500/10 text-gray-600',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-600';
  };

  const getOrcamentoStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-500/10 text-gray-600',
      pending: 'bg-yellow-500/10 text-yellow-600',
      approved: 'bg-green-500/10 text-green-600',
      rejected: 'bg-red-500/10 text-red-600',
      completed: 'bg-blue-500/10 text-blue-600',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-600';
  };

  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-xl">{organization.name}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {organization.slug}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
              <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Criado em
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      {details?.created_at 
                        ? format(new Date(details.created_at), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Domínio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      {details?.domain || 'Não configurado'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      {details?.email || 'Não configurado'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      {details?.whatsapp || 'Não configurado'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {details?.address && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{details.address}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-sm text-muted-foreground">Usuários</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{orcamentos.length}</p>
                      <p className="text-sm text-muted-foreground">Orçamentos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">
                        {subscription ? formatCurrency(subscription.price_cents) : 'Gratuito'}
                      </p>
                      <p className="text-sm text-muted-foreground">Plano {subscription?.plan_type || 'starter'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Adicionado em {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="capitalize">
                          {user.role}
                        </Badge>
                        {user.last_sign_in && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Último acesso: {format(new Date(user.last_sign_in), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Orcamentos Tab */}
            <TabsContent value="orcamentos" className="space-y-4">
              {orcamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum orçamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orcamentos.map((orc) => (
                    <div key={orc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{orc.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {orc.cliente_nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(orc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(orc.valor_total)}</p>
                        <Badge className={getOrcamentoStatusBadge(orc.status)} variant="secondary">
                          {orc.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4">
              {subscription ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Plano Atual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Plano</span>
                        <Badge className={getStatusBadge(subscription.status)} variant="secondary">
                          {subscription.plan_type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge className={getStatusBadge(subscription.status)} variant="secondary">
                          {subscription.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Valor Mensal</span>
                        <span className="font-semibold">{formatCurrency(subscription.price_cents)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Início</span>
                        <span>
                          {format(new Date(subscription.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      {subscription.current_period_end && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Próxima Cobrança</span>
                          <span>
                            {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Alterar Plano
                    </Button>
                    <Button variant="destructive" className="flex-1">
                      Cancelar Assinatura
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sem assinatura ativa</p>
                  <Button className="mt-4">Ativar Plano</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
