/**
 * Componente para seleção de tema
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Check } from 'lucide-react';
import { ThemeName, themes, getTheme, applyTheme } from '@/lib/themes';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/useTheme';
import { showSuccess, showError } from '@/lib/toastMessages';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export function ThemeSelector() {
  const { organization, organizationId, isOwner, isLoading } = useOrganizationContext();
  const { isDark, toggleDarkMode } = useTheme();
  
  // Debug: verificar se componente está sendo renderizado
  logger.debug('ThemeSelector renderizado', { isOwner, isLoading, organizationId, themeName: organization?.theme_name });
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(
    (organization?.theme_name as ThemeName) || 'default'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(isDark ? 'dark' : 'light');

  // Mostrar loading enquanto carrega dados
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tema de Cores</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Se não for owner, mostrar mensagem mas ainda permitir visualizar temas
  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tema de Cores</CardTitle>
          <CardDescription>
            Apenas proprietários podem alterar o tema da organização. 
            Tema atual: <strong>{themes[selectedTheme]?.displayName || 'Clássico'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(themes).map((theme) => {
              const isSelected = selectedTheme === theme.name;
              return (
                <div
                  key={theme.name}
                  className={cn(
                    "relative p-4 rounded-lg border-2 transition-all opacity-75",
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-border"
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div
                      className="h-12 rounded-md flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${theme.preview.primary} 0%, ${theme.preview.accent} 100%)`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.preview.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.preview.accent }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{theme.displayName}</p>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleThemeSelect = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    // Preview do tema
    const theme = getTheme(themeName);
    applyTheme(theme, previewMode === 'dark');
  };

  const handleSave = async () => {
    if (!organizationId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ theme_name: selectedTheme } as { theme_name: ThemeName })
        .eq('id', organizationId);

      if (error) throw error;

      showSuccess('Tema atualizado com sucesso!');
      
      // Recarregar página para aplicar mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      logger.error('Erro ao salvar tema:', error);
      showError('Não foi possível salvar o tema', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreviewMode = () => {
    const newMode = previewMode === 'light' ? 'dark' : 'light';
    setPreviewMode(newMode);
    
    // Aplicar tema com novo modo
    const theme = getTheme(selectedTheme);
    applyTheme(theme, newMode === 'dark');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tema de Cores</CardTitle>
            <CardDescription>
              Escolha o tema visual da sua organização. Cada tema possui versão clara e escura.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={togglePreviewMode}
            className="gap-2"
          >
            {previewMode === 'dark' ? (
              <>
                <Moon className="h-4 w-4" />
                Modo Escuro
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                Modo Claro
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.values(themes).map((theme) => {
            const isSelected = selectedTheme === theme.name;
            
            return (
              <button
                key={theme.name}
                onClick={() => handleThemeSelect(theme.name)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all",
                  "hover:scale-105 hover:shadow-md",
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border hover:border-primary/50"
                )}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div
                    className="h-12 rounded-md flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${theme.preview.primary} 0%, ${theme.preview.accent} 100%)`,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: theme.preview.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium text-sm">{theme.displayName}</p>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Tema selecionado: <strong>{themes[selectedTheme].displayName}</strong>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedTheme === (organization?.theme_name || 'default')}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>
                Salvar Tema
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
