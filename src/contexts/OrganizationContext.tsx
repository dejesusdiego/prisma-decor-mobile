import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useOrganization, Organization, OrganizationMember } from '@/hooks/useOrganization';

interface OrganizationContextType {
  organization: Organization | null | undefined;
  membership: OrganizationMember | null | undefined;
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  organizationId: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const orgData = useOrganization();
  
  // Apply theme based on organization
  useEffect(() => {
    if (!orgData.organization) return;
    
    // Importar e aplicar tema
    import('@/lib/themes').then(({ getTheme, applyTheme }) => {
      const themeName = (orgData.organization?.theme_name as any) || 'default';
      const theme = getTheme(themeName);
      
      // Detectar dark mode
      const isDark = document.documentElement.classList.contains('dark') || 
                     localStorage.getItem('darkMode') === 'true';
      
      applyTheme(theme, isDark);
    });
  }, [orgData.organization?.theme_name]);

  return (
    <OrganizationContext.Provider value={orgData}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  // Return default values during initial render or HMR to prevent crashes
  if (context === undefined) {
    return {
      organization: null,
      membership: null,
      isLoading: true,
      isOwner: false,
      isAdmin: false,
      isMember: false,
      organizationId: null,
    };
  }
  return context;
}

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string | null {
  // Remove #
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
