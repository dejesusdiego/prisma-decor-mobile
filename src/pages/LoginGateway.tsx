import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDomainRouting } from '@/hooks/useDomainRouting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingPage } from '@/components/ui/LoadingState';
import { redirectAfterLogin } from '@/lib/redirectAfterLogin';
import { Eye, EyeOff, Building2, User, Truck, Shield } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Login Gateway - Sistema de redirecionamento inteligente baseado em domínio/tipo de usuário
 * 
 * Funciona como porta de entrada universal:
 * - Se não autenticado: mostra tela de login apropriada ao contexto
 * - Se autenticado: redireciona automaticamente para o dashboard correto baseado em role
 * 
 * Suporta múltiplos tipos de entrada:
 * - app.studioos.pro → Gateway universal (detecta tipo de usuário)
 * - admin.studioos.pro → Admin login
 * - fornecedores.studioos.pro → Supplier portal
 * - {slug}-app.studioos.pro → App específico da organização
 * 
 * Rotas canônicas: /login e /auth (ambas apontam para este componente)
 */
export default function LoginGateway() {
  const { user, loading: authLoading, signIn, resetPassword } = useAuth();
  const { domainInfo, isLoading: domainLoading, isAdmin, isSupplier, isApp, organizationSlug } = useDomainRouting();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset password states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Redirect state
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect automático se já autenticado
  useEffect(() => {
    async function handleAutoRedirect() {
      if (!user || authLoading || isRedirecting || domainLoading) return;

      setIsRedirecting(true);
      try {
        await redirectAfterLogin(user, navigate);
      } catch (error) {
        console.error('Error in auto redirect:', error);
        toast.error('Erro ao redirecionar. Tente recarregar a página.');
      } finally {
        setIsRedirecting(false);
      }
    }

    handleAutoRedirect();
  }, [user, authLoading, isRedirecting, navigate, domainLoading]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, preencha email e senha');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      // redirectAfterLogin será chamado automaticamente pelo useEffect
    } catch (error) {
      console.error('Login error:', error);
      // Erro já é tratado no useAuth
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Por favor, informe seu email');
      return;
    }
    
    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error) {
      console.error('Reset password error:', error);
      // Erro já é tratado no useAuth
    } finally {
      setIsResetting(false);
    }
  };

  // Loading states
  if (authLoading || domainLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingPage text="Carregando..." />
      </div>
    );
  }

  // Se já está autenticado, mostrar loading de redirecionamento
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingPage text="Redirecionando..." />
      </div>
    );
  }

  // Determinar contexto de login baseado no domínio
  const getLoginContext = () => {
    if (isAdmin) {
      return {
        title: 'Admin StudioOS',
        subtitle: 'Acesso administrativo da plataforma',
        icon: Shield,
        accentColor: 'text-purple-600',
        bgGradient: 'from-purple-50 to-indigo-100',
      };
    }
    
    if (isSupplier) {
      return {
        title: 'Portal do Fornecedor',
        subtitle: 'Acesso exclusivo para fornecedores',
        icon: Truck,
        accentColor: 'text-orange-600',
        bgGradient: 'from-orange-50 to-amber-100',
      };
    }
    
    if (isApp && organizationSlug) {
      return {
        title: organizationSlug.charAt(0).toUpperCase() + organizationSlug.slice(1),
        subtitle: 'Acesse sua conta',
        icon: Building2,
        accentColor: 'text-blue-600',
        bgGradient: 'from-blue-50 to-cyan-100',
      };
    }
    
    // Default: Gateway universal
    return {
      title: 'StudioOS',
      subtitle: 'ERP para Decoração',
      icon: User,
      accentColor: 'text-primary',
      bgGradient: 'from-gray-50 to-gray-100',
    };
  };

  const context = getLoginContext();
  const Icon = context.icon;

  // Verificar se há mensagem de erro na URL (ex: token inválido)
  const errorMessage = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${context.bgGradient} p-4`}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className={`mx-auto w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2`}>
            <Icon className={`w-6 h-6 ${context.accentColor}`} />
          </div>
          <CardTitle className="text-2xl font-bold">{context.title}</CardTitle>
          <CardDescription>{context.subtitle}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Mensagens de erro da URL */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <p className="font-medium">Erro de autenticação</p>
              <p>{errorDescription || errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResetDialog(true)}
                className="text-sm text-muted-foreground hover:text-primary underline transition-colors"
                disabled={isSubmitting}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>

          {/* Links contextuais */}
          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            {isAdmin ? (
              <p>Acesso restrito a administradores da plataforma</p>
            ) : isSupplier ? (
              <p>
                É fornecedor e não tem acesso?{' '}
                <a href="/fornecedores/cadastro" className="text-primary hover:underline">
                  Cadastre-se
                </a>
              </p>
            ) : (
              <p>
                Não tem uma conta?{' '}
                <a href="https://studioos.pro" className="text-primary hover:underline">
                  Conheça o StudioOS
                </a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={isResetting}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetEmail('');
                }}
                disabled={isResetting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isResetting || !resetEmail}>
                {isResetting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
