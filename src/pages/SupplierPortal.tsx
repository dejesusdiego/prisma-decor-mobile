import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SupplierCatalog } from '@/components/supplier/SupplierCatalog';
import { SupplierDashboard } from '@/pages/supplier/Dashboard';
import { SupplierStatusBadge } from '@/components/supplier/SupplierStatusBadge';
import { LayoutDashboard, Package, LogOut } from 'lucide-react';
import { logError, getErrorMessage } from '@/lib/errorMessages';
import { logger } from '@/lib/logger';

interface SupplierInfo {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export default function SupplierPortal() {
  const { user, signIn, signOut } = useAuth();
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog'>('dashboard');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Verificar se usuário está autenticado e buscar info do fornecedor
  useEffect(() => {
    async function checkAuthAndLoadSupplier() {
      setIsCheckingAuth(true);
      
      if (!user) {
        setIsCheckingAuth(false);
        setIsLoading(false);
        return;
      }

      try {
        // Buscar fornecedor vinculado ao usuário
        const { data, error } = await supabase
          .from('supplier_users')
          .select(`
            supplier_id,
            suppliers (
              id,
              name,
              slug,
              email,
              phone,
              status
            )
          `)
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (error) throw error;

        if (data && data.suppliers) {
          const supplier = data.suppliers as SupplierInfo;
          
          // Permitir acesso mesmo com status='pending' (acesso limitado)
          // Apenas bloquear se status='rejected'
          if (supplier.status === 'rejected') {
            // Fornecedor rejeitado - não permitir acesso
            setSupplierInfo(supplier);
            return;
          }
          
          // Permitir acesso (pending ou approved)
          setSupplierInfo(supplier);
        } else {
          // Usuário não está vinculado a nenhum fornecedor via supplier_users
          // Verificar se existe supplier com mesmo email (pode ter sido cadastrado antes da migration)
          logger.debug('[SupplierPortal] Buscando supplier por email:', user.email);
          
          const { data: pendingSupplier, error: supplierError } = await supabase
            .from('suppliers')
            .select('id, name, slug, email, phone, status')
            .eq('email', user.email?.toLowerCase() || '')
            .maybeSingle();

          if (supplierError) {
            console.error('[SupplierPortal] Erro ao buscar supplier:', supplierError);
          }

          logger.debug('[SupplierPortal] Supplier encontrado por email:', pendingSupplier);

          if (pendingSupplier) {
            // Existe supplier (pendente ou aprovado) - permitir acesso limitado
            // Se for rejeitado, bloquear
            if (pendingSupplier.status === 'rejected') {
              setSupplierInfo({
                id: pendingSupplier.id,
                name: pendingSupplier.name || '',
                slug: pendingSupplier.slug || '',
                email: pendingSupplier.email,
                phone: pendingSupplier.phone,
                status: 'rejected'
              });
              return;
            }
            
            // Permitir acesso (pending ou approved) mesmo sem vínculo supplier_users
            // Isso cobre casos onde o fornecedor foi cadastrado antes da migration atualizar
            logger.debug('[SupplierPortal] Definindo supplierInfo para:', pendingSupplier);
            setSupplierInfo({
              id: pendingSupplier.id,
              name: pendingSupplier.name || '',
              slug: pendingSupplier.slug || '',
              email: pendingSupplier.email,
              phone: pendingSupplier.phone,
              status: pendingSupplier.status as 'pending' | 'approved' | 'rejected'
            });
            // Não fazer return aqui - deixar continuar para mostrar o painel
          } else {
            // Não tem vínculo nem supplier encontrado
            logger.debug('[SupplierPortal] Nenhum supplier encontrado para o email:', user.email);
            // Não fazer logout automático - apenas mostrar mensagem
            toast.error('Você não está vinculado a nenhum fornecedor. Verifique se o cadastro foi concluído.');
          }
        }
      } catch (error: any) {
        logError(error, 'SupplierPortal - checkAuthAndLoadSupplier');
        const { message, action } = getErrorMessage(error);
        const fullMessage = action ? `${message}\n\nAção sugerida: ${action}` : message;
        toast.error(fullMessage);
      } finally {
        setIsCheckingAuth(false);
        setIsLoading(false);
      }
    }

    checkAuthAndLoadSupplier();
  }, [user, signOut]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha e-mail e senha');
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Usar sistema centralizado de tratamento de erros
        logError(error, 'SupplierPortal - signIn');
        
        const { message, action } = getErrorMessage(error);
        const fullMessage = action ? `${message}\n\nAção sugerida: ${action}` : message;
        
        toast.error(fullMessage);
        throw error;
      }

      if (data.user) {
        toast.success('Login realizado com sucesso!');
        // O useEffect vai recarregar as informações do fornecedor automaticamente
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      // Erro já foi tratado acima
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setSupplierInfo(null);
      toast.success('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error(error.message || 'Erro ao fazer logout');
    }
  };

  // Loading inicial
  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Portal de Fornecedores</CardTitle>
            <CardDescription>
              Faça login para acessar o portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" disabled={isLoggingIn} className="w-full">
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bloqueio: apenas fornecedor rejeitado
  if (supplierInfo && supplierInfo.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cadastro Rejeitado</CardTitle>
            <CardDescription>
              Seu cadastro foi rejeitado. Entre em contato para mais informações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplierInfo.name && (
              <div className="text-sm">
                <p className="font-medium">Empresa:</p>
                <p className="text-muted-foreground">{supplierInfo.name}</p>
              </div>
            )}
            
            <Button variant="outline" onClick={handleLogout} className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading: aguardar verificação de autenticação
  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando informações do fornecedor...</p>
        </div>
      </div>
    );
  }

  // Bloqueio: usuário logado mas sem supplierInfo (não encontrou fornecedor vinculado)
  // Só mostrar se a verificação já terminou E não encontrou supplier
  if (user && !isLoading && !isCheckingAuth && !supplierInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acesso Não Autorizado</CardTitle>
            <CardDescription>
              Você não está vinculado a nenhum fornecedor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se você já se cadastrou, aguarde alguns instantes e recarregue a página.
                Se ainda não se cadastrou, acesse a página de cadastro.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleLogout} className="flex-1">
                  Sair
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/cadastro-fornecedor">Cadastrar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard do fornecedor (aprovado ou pendente)
  // Se chegou aqui e tem supplierInfo, renderizar o painel
  if (!supplierInfo) {
    // Se ainda não tem supplierInfo mas está carregando, mostrar loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando informações do fornecedor...</p>
        </div>
      </div>
    );
  }

  const isPending = supplierInfo.status === 'pending';
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">StudioOS</h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  Fornecedor: <span className="font-medium">{supplierInfo.name}</span>
                  <SupplierStatusBadge status={supplierInfo.status} />
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Banner de Status (se pendente) */}
      {isPending && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400 text-sm">⏳</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Cadastro aguardando aprovação
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Você pode gerenciar seu catálogo, mas os materiais só estarão visíveis para clientes após aprovação.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/30">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'catalog' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab('catalog')}
            >
              <Package className="h-4 w-4" />
              Catálogo
            </Button>
          </nav>
        </aside>

        {/* Área de Conteúdo */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {activeTab === 'dashboard' && (
              <SupplierDashboard supplierId={supplierInfo.id} supplierStatus={supplierInfo.status} />
            )}
            {activeTab === 'catalog' && (
              <SupplierCatalog supplierId={supplierInfo.id} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
