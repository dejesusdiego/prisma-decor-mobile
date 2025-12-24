import * as React from 'react';
import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TipBannerProps {
  id: string; // Identificador único para salvar no localStorage
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'success' | 'warning';
  dismissible?: boolean;
  className?: string;
}

export function TipBanner({ 
  id, 
  title = 'Dica', 
  children, 
  variant = 'tip',
  dismissible = true,
  className 
}: TipBannerProps) {
  const [dismissed, setDismissed] = useState(true); // Começa oculto para evitar flash

  useEffect(() => {
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '{}');
    setDismissed(dismissedTips[id] === true);
  }, [id]);

  const handleDismiss = () => {
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '{}');
    dismissedTips[id] = true;
    localStorage.setItem('dismissedTips', JSON.stringify(dismissedTips));
    setDismissed(true);
  };

  if (dismissed) return null;

  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    tip: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
    warning: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
  };

  const iconStyles = {
    info: 'text-blue-600 dark:text-blue-400',
    tip: 'text-amber-600 dark:text-amber-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <Alert className={cn(variantStyles[variant], className)}>
      <Lightbulb className={cn("h-4 w-4", iconStyles[variant])} />
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {dismissible && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-1">
        {children}
      </AlertDescription>
    </Alert>
  );
}

// Função utilitária para resetar dicas (para testes/debug)
export function resetDismissedTips() {
  localStorage.removeItem('dismissedTips');
}
