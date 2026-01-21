import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'user';

interface UseUserRoleResult {
  role: AppRole | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar role do usuário:', error);
          console.error('User ID:', user.id);
          setRole('user'); // Default to user if no role found
        } else if (!data) {
          console.warn('Nenhuma role encontrada para o usuário:', user.id);
          console.warn('Usuário será tratado como "user" por padrão');
          setRole('user');
        } else {
          console.log('Role encontrada:', data.role, 'para usuário:', user.id);
          setRole(data.role as AppRole);
        }
      } catch (error) {
        console.error('Erro ao buscar role:', error);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    isAdmin: role === 'admin',
    isLoading,
  };
}
