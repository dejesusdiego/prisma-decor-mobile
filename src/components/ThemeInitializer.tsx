/**
 * Componente para inicializar o tema da organização
 */

import { useEffect, ReactNode } from 'react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useTheme } from '@/hooks/useTheme';

interface ThemeInitializerProps {
  children: ReactNode;
}

export function ThemeInitializer({ children }: ThemeInitializerProps) {
  const { organization } = useOrganizationContext();
  const { isDark } = useTheme();

  // Este componente apenas garante que o tema seja aplicado
  // O hook useTheme já faz o trabalho pesado
  useEffect(() => {
    // Força re-render quando organização ou tema mudam
  }, [organization?.theme_name, isDark]);

  return <>{children}</>;
}
