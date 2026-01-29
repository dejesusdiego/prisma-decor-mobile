/**
 * RouteValidator - Validação de Acesso a Rotas
 * 
 * Valida se o usuário tem permissão para acessar uma rota específica.
 * Executa guards e verifica autenticação/autorização.
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { DomainRoute, RoutingContext, GuardResult } from '@/domains/types';
import { logger } from '@/lib/logger';

interface RouteValidatorProps {
  route: DomainRoute;
  context: RoutingContext;
  children: ReactNode;
}

export function RouteValidator({ route, context, children }: RouteValidatorProps) {
  const location = useLocation();
  const [guardResult, setGuardResult] = useState<GuardResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  
  useEffect(() => {
    async function validateRoute() {
      setIsValidating(true);
      
      try {
        // Verificar autenticação
        if (route.requireAuth && !context.user) {
          logger.warn(`Auth required for route ${route.path}, redirecting to login`);
          setGuardResult({
            allowed: false,
            reason: 'Authentication required',
            redirectTo: route.fallbackRoute || '/login',
          });
          return;
        }
        
        // Verificar roles
        if (route.allowedRoles && route.allowedRoles.length > 0) {
          const userRoles = context.user?.roles || [];
          const userRole = context.user?.role;
          
          const hasAllowedRole = route.allowedRoles.some(role => 
            userRoles.includes(role) || userRole === role
          );
          
          if (!hasAllowedRole && !context.user?.isSuperAdmin) {
            logger.warn(`Insufficient role for route ${route.path}`);
            setGuardResult({
              allowed: false,
              reason: 'Insufficient role',
              redirectTo: route.fallbackRoute || '/',
            });
            return;
          }
        }
        
        // Verificar permissões
        if (route.requiredPermissions && route.requiredPermissions.length > 0) {
          const userPermissions = context.user?.permissions || [];
          
          const hasAllPermissions = route.requiredPermissions.every(perm =>
            userPermissions.includes(perm) || userPermissions.includes('*')
          );
          
          if (!hasAllPermissions && !context.user?.isSuperAdmin) {
            logger.warn(`Insufficient permissions for route ${route.path}`);
            setGuardResult({
              allowed: false,
              reason: 'Insufficient permissions',
              redirectTo: route.fallbackRoute || '/',
            });
            return;
          }
        }
        
        // Rota permitida
        setGuardResult({ allowed: true });
        
      } catch (error) {
        logger.error('Route validation error:', error);
        setGuardResult({
          allowed: false,
          reason: 'Validation error',
          redirectTo: '/',
        });
      } finally {
        setIsValidating(false);
      }
    }
    
    validateRoute();
  }, [route, context, location.pathname]);
  
  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect if not allowed
  if (guardResult && !guardResult.allowed) {
    return <Navigate to={guardResult.redirectTo || '/'} replace state={{ from: location }} />;
  }
  
  // Render children
  return <>{children}</>;
}
