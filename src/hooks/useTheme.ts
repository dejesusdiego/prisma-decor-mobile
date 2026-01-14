/**
 * Hook para gerenciar temas da organização
 */

import { useEffect, useState } from 'react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { ThemeName, getTheme, applyTheme, themes } from '@/lib/themes';

export function useTheme() {
  const { organization } = useOrganizationContext();
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');

  // Detectar preferência de dark mode do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    } else {
      setIsDark(mediaQuery.matches);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('darkMode') === null) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Aplicar tema da organização
  useEffect(() => {
    if (!organization) return;

    const themeName = (organization.theme_name as ThemeName) || 'default';
    setCurrentTheme(themeName);
    
    const theme = getTheme(themeName);
    applyTheme(theme, isDark);
  }, [organization, isDark]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('darkMode', String(newValue));
    
    // Reaplicar tema com novo modo
    if (organization) {
      const themeName = (organization.theme_name as ThemeName) || 'default';
      const theme = getTheme(themeName);
      applyTheme(theme, newValue);
    }
  };

  // Obter tema atual
  const theme = getTheme(currentTheme);

  return {
    currentTheme,
    theme,
    isDark,
    toggleDarkMode,
    availableThemes: Object.values(themes),
  };
}
