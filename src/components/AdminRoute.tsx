import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingPage } from '@/components/ui/LoadingState';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const location = useLocation();
  const hostname = window.location.hostname;

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          // Log apenas em desenvolvimento
          if (import.meta.env.DEV) {
            console.error('Error checking admin role:', error);
          }
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        // Log apenas em desenvolvimento
        if (import.meta.env.DEV) {
          console.error('Error checking admin role:', err);
        }
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    }

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  if (authLoading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingPage text="Verificando permissões..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    // Se está no domínio admin/panel, NÃO redireciona para /gerarorcamento
    // pois essa rota pode não existir aqui - vai para a home do próprio domínio
    if (hostname.includes('admin') || hostname.includes('panel')) {
      console.log('[AdminRoute] Non-admin on admin domain, redirecting to home');
      return <Navigate to="/" replace />;
    }
    
    // Se está no app normal, redireciona para dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
