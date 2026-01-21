import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SupplierCatalog } from '@/components/supplier/SupplierCatalog';

interface SupplierInfo {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
}

export default function SupplierPortal() {
  const { user, signIn, signOut } = useAuth();
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
              phone
            )
          `)
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (error) throw error;

        if (data && data.suppliers) {
          setSupplierInfo(data.suppliers as SupplierInfo);
        } else {
          // Usuário não está vinculado a nenhum fornecedor
          toast.error('Você não está vinculado a nenhum fornecedor');
          await signOut();
        }
      } catch (error: any) {
        console.error('Erro ao carregar informações do fornecedor:', error);
        toast.error(error.message || 'Erro ao carregar informações do fornecedor');
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
      await signIn(email, password);
      // O signIn já mostra toast de sucesso e navega, mas no portal de fornecedores não queremos navegar
      // O useEffect vai recarregar as informações do fornecedor
    } catch (error: any) {
      // Erro já foi tratado no signIn (toast mostrado)
      console.error('Erro ao fazer login:', error);
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

  // Dashboard do fornecedor (placeholder)
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Portal de Fornecedores</h1>
              {supplierInfo && (
                <p className="text-muted-foreground mt-1">
                  {supplierInfo.name}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList>
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="dashboard" disabled>Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="catalog">
            <SupplierCatalog supplierId={supplierInfo.id} />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>
                  Em breve você poderá visualizar pedidos, estatísticas e muito mais.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
