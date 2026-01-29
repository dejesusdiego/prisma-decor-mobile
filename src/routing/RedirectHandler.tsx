/**
 * RedirectHandler - Gerenciamento de Redirecionamentos
 * 
 * Processa regras de redirecionamento baseadas no contexto atual.
 * Suporta redirecionamentos internos e cross-domain.
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { RedirectRule, RoutingContext } from '@/domains/types';
import { logger } from '@/lib/logger';

interface RedirectHandlerProps {
  rules: RedirectRule[];
  context: RoutingContext;
  children: ReactNode;
}

export function RedirectHandler({ rules, context, children }: RedirectHandlerProps) {
  const location = useLocation();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  
  useEffect(() => {
    async function checkRedirects() {
      for (const rule of rules) {
        // Verificar se a regra se aplica ao pathname atual
        const matchesPath = matchPath(rule.from, context.pathname);
        
        if (!matchesPath) {
          continue;
        }
        
        // Verificar condição personalizada
        if (rule.condition) {
          try {
            const shouldApply = rule.condition(context);
            if (!shouldApply) {
              continue;
            }
          } catch (error) {
            logger.error('Redirect condition error:', error);
            continue;
          }
        }
        
        // Construir URL de destino
        let targetUrl = rule.to;
        
        // Se for cross-domain e precisar preservar o path
        if (rule.type === 'cross-domain' && rule.preservePath) {
          // Extrair o path após o wildcard
          const fromPattern = rule.from.replace('/*', '');
          if (context.pathname.startsWith(fromPattern)) {
            const remainingPath = context.pathname.slice(fromPattern.length);
            targetUrl = rule.to + remainingPath;
          }
        }
        
        // Se for redirecionamento externo (cross-domain), usar window.location
        if (rule.type === 'cross-domain' || rule.type === 'external') {
          if (targetUrl.startsWith('http')) {
            logger.info(`Cross-domain redirect to: ${targetUrl}`);
            window.location.href = targetUrl;
            return;
          }
        }
        
        // Redirecionamento interno
        logger.info(`Internal redirect from ${context.pathname} to ${targetUrl}`);
        setRedirectTo(targetUrl);
        return;
      }
    }
    
    checkRedirects();
  }, [rules, context, location.pathname]);
  
  // Se há redirecionamento pendente
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Render children se não há redirecionamento
  return <>{children}</>;
}

/**
 * Verifica se um pathname corresponde a um padrão
 */
function matchPath(pattern: string, pathname: string): boolean {
  // Wildcard no final
  if (pattern.endsWith('/*')) {
    const basePattern = pattern.slice(0, -2);
    return pathname === basePattern || pathname.startsWith(basePattern + '/');
  }
  
  // Match exato
  return pathname === pattern;
}

/**
 * Utilitário para criar redirecionamentos programáticos
 */
export function createCrossDomainRedirect(
  targetDomain: string,
  path: string,
  preserveQuery = true
): string {
  const currentUrl = new URL(window.location.href);
  let targetUrl = `${targetDomain}${path}`;
  
  if (preserveQuery && currentUrl.search) {
    targetUrl += currentUrl.search;
  }
  
  return targetUrl;
}

/**
 * Verifica se deve redirecionar para outro domínio baseado no contexto
 */
export function shouldRedirectToDomain(
  currentDomain: string,
  targetDomain: string,
  userRole?: string
): boolean {
  // Lógica de redirecionamento baseada em roles
  if (targetDomain === 'admin' && userRole === 'super_admin') {
    return true;
  }
  
  if (targetDomain === 'supplier' && userRole === 'supplier') {
    return true;
  }
  
  return false;
}
