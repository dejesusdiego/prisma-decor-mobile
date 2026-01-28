import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingPage } from '@/components/ui/LoadingState';
import { redirectAfterLogin } from '@/lib/redirectAfterLogin';

/**
 * Gateway de Autenticação para app.studioos.pro
 * 
 * Funciona como porta de entrada:
 * - Se não autenticado: mostra tela de login
 * - Se autenticado: redireciona automaticamente para domínio correto baseado em role
 * 
 * Rotas canônicas: /login e /auth (ambas apontam para este componente)
 */
export default function LoginGateway() {
  const { user, loading, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const navigate = useNavigate();

  // Redirect automático se já autenticado
  useEffect(() => {
    async function handleAutoRedirect() {
      if (!user || loading || isRedirecting) return;

      setIsRedirecting(true);
      try {
        await redirectAfterLogin(user, navigate);
      } catch (error) {
        console.error('Error in auto redirect:', error);
      } finally {
        setIsRedirecting(false);
      }
    }

    handleAutoRedirect();
  }, [user, loading, isRedirecting, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      // redirectAfterLogin será chamado automaticamente pelo signIn
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingPage text={isRedirecting ? "Redirecionando..." : "Carregando..."} />
      </div>
    );
  }

  // Se já está autenticado, o useEffect vai redirecionar
  // Mas enquanto isso, mostrar loading
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingPage text="Redirecionando..." />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">StudioOS</CardTitle>
          <CardDescription className="text-center">
            ERP para Decoração
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResetDialog(true)}
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
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
            <DialogFooter>
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
                {isResetting ? 'Enviando...' : 'Enviar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
