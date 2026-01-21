import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getTheme, applyTheme } from '@/lib/themes';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Verificar preferência salva ou sistema
    const saved = localStorage.getItem('studioos-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved ? saved === 'dark' : prefersDark;
    
    setIsDark(shouldBeDark);
    applyThemeToStudioOS(shouldBeDark);
  }, []);

  const applyThemeToStudioOS = (dark: boolean) => {
    // Aplicar tema StudioOS
    const studioosTheme = getTheme('studioos');
    applyTheme(studioosTheme, dark);
    
    // Aplicar classe dark e colorScheme
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('studioos-theme', newTheme ? 'dark' : 'light');
    applyThemeToStudioOS(newTheme);
    
    // Disparar evento customizado para sincronizar com useStudioOSTheme
    window.dispatchEvent(new CustomEvent('studioos-theme-change', { detail: { isDark: newTheme } }));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-md border border-border/40 bg-background/80 backdrop-blur-sm hover:bg-accent"
      aria-label="Alternar tema"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
