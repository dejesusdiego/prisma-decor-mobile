import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingPage } from '@/components/ui/LoadingState';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isSupplier, setIsSupplier] = useState<boolean | null>(null);
  const [checkingSupplier, setCheckingSupplier] = useState(true);

  useEffect(() => {
    async function checkIfSupplier() {
      if (!user) {
        setCheckingSupplier(false);
        setIsSupplier(false);
        return;
      }

      try {
        // Verificar se o usuário é fornecedor (tem registro em supplier_users)
        const { data, error } = await supabase
          .from('supplier_users')
          .select('id')
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (error) {
          console.error('Error checking supplier status:', error);
          setIsSupplier(false);
        } else {
          // Se encontrou registro, é fornecedor
          setIsSupplier(!!data);
        }
      } catch (err) {
        console.error('Error in checkIfSupplier:', err);
        setIsSupplier(false);
      } finally {
        setCheckingSupplier(false);
      }
    }

    if (!loading && user) {
      checkIfSupplier();
    } else if (!loading && !user) {
      setCheckingSupplier(false);
      setIsSupplier(false);
    }
  }, [user, loading]);

  if (loading || checkingSupplier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingPage text="Verificando autenticação..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se for fornecedor, redirecionar para o portal de fornecedores
  if (isSupplier) {
    // Verificar se já está no domínio correto
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isSupplierDomain = hostname.includes('fornecedores') || hostname.includes('supplier');
    
    if (!isSupplierDomain) {
      // Redirecionar para o portal de fornecedores
      window.location.href = 'https://fornecedores.studioos.pro';
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingPage text="Redirecionando para o portal de fornecedores..." />
        </div>
      );
    }
  }

  return <>{children}</>;
}
