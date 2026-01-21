/**
 * Hook para aplicar tema fixo StudioOS na landing page
 * Desacopla a LP do tema da organização logada
 * Respeita o toggle light/dark do ThemeToggle
 */

import { useEffect } from 'react';
import { getTheme, applyTheme } from '@/lib/themes';

export function useStudioOSTheme() {
  useEffect(() => {
    // Verificar se estamos na LP do StudioOS
    const isStudioOSPage = window.location.pathname === '/studioos';
    
    if (isStudioOSPage) {
      // Aplicar tema StudioOS fixo, mas respeitando o modo dark/light do toggle
      const studioosTheme = getTheme('studioos');
      
      // Verificar preferência do usuário (respeitar ThemeToggle)
      const savedTheme = localStorage.getItem('studioos-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      
      // Aplicar tema StudioOS com o modo correto
      applyTheme(studioosTheme, isDark);
      
      // Aplicar classe dark conforme preferência
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
      
      // Listener para mudanças no localStorage (quando ThemeToggle muda)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'studioos-theme') {
          const newIsDark = e.newValue === 'dark';
          applyTheme(studioosTheme, newIsDark);
          if (newIsDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
          }
        }
      };
      
      // Listener customizado para mudanças no localStorage (mesma aba)
      const handleLocalStorageChange = () => {
        const currentTheme = localStorage.getItem('studioos-theme');
        if (currentTheme) {
          const newIsDark = currentTheme === 'dark';
          applyTheme(studioosTheme, newIsDark);
          if (newIsDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
          }
        }
      };
      
      // Observar mudanças no localStorage
      window.addEventListener('storage', handleStorageChange);
      
      // Listener para mudanças no localStorage via evento customizado (disparado pelo ThemeToggle)
      const handleCustomStorageEvent = () => {
        handleLocalStorageChange();
      };
      
      window.addEventListener('studioos-theme-change', handleCustomStorageEvent);
      
      // Polling para detectar mudanças no localStorage (mesma aba) - fallback
      const interval = setInterval(() => {
        const currentTheme = localStorage.getItem('studioos-theme');
        const currentIsDark = currentTheme ? currentTheme === 'dark' : prefersDark;
        const htmlHasDark = document.documentElement.classList.contains('dark');
        
        // Sincronizar se houver divergência
        if (currentIsDark !== htmlHasDark) {
          handleLocalStorageChange();
        }
      }, 200);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('studioos-theme-change', handleCustomStorageEvent);
        clearInterval(interval);
      };
    }
  }, []);

  // Reaplicar quando o pathname mudar (via window.location)
  useEffect(() => {
    const checkPath = () => {
      const isStudioOSPage = window.location.pathname === '/studioos';
      if (isStudioOSPage) {
        const studioosTheme = getTheme('studioos');
        const savedTheme = localStorage.getItem('studioos-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
        
        applyTheme(studioosTheme, isDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      }
    };
    
    // Verificar imediatamente
    checkPath();
    
    // Verificar periodicamente (fallback para mudanças de rota)
    const interval = setInterval(checkPath, 500);
    
    return () => clearInterval(interval);
  }, []);
}
