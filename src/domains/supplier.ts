/**
 * Domínio: Supplier Portal (fornecedores.studioos.pro)
 * 
 * Portal para fornecedores gerenciarem materiais e pedidos.
 */

import { lazy } from 'react';
import type { DomainConfig } from './types';

// Lazy load das páginas
const SupplierPortal = lazy(() => import('@/pages/SupplierPortal'));
const LoginGateway = lazy(() => import('@/pages/LoginGateway'));
const SupplierRegistration = lazy(() => import('@/pages/CadastroFornecedor'));

export const supplierDomain: DomainConfig = {
  id: 'supplier',
  name: 'StudioOS Fornecedores',
  description: 'Portal de fornecedores',
  
  hostnames: [
    'fornecedores.studioos.pro',
    'fornecedores.localhost',
    'supplier.studioos.pro',
  ],
  
  matchesHostname: (hostname: string): boolean => {
    return hostname.toLowerCase().startsWith('fornecedores.') || 
           hostname.toLowerCase().startsWith('supplier.');
  },
  
  routes: [
    {
      path: '/',
      component: SupplierPortal,
      requireAuth: true,
      allowedRoles: ['supplier', 'super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Portal do Fornecedor - StudioOS',
        description: 'Gerencie seus materiais e pedidos',
      },
    },
    {
      path: '/login',
      component: LoginGateway,
      requireAuth: false,
      meta: {
        title: 'Login Fornecedor - StudioOS',
        description: 'Acesse sua conta de fornecedor',
      },
    },
    {
      path: '/cadastro',
      component: SupplierRegistration,
      requireAuth: false,
      meta: {
        title: 'Cadastro de Fornecedor - StudioOS',
        description: 'Cadastre-se como fornecedor',
      },
    },
  ],
  
  redirects: [
    {
      from: '/registrar',
      to: '/cadastro',
      type: 'internal',
    },
    {
      from: '/signup',
      to: '/cadastro',
      type: 'internal',
    },
    // Bloquear rotas de app
    {
      from: '/gerarorcamento',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
    {
      from: '/orcamentos/*',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
  ],
  
  guards: [
    {
      name: 'supplier-only',
      validate: (ctx, route) => {
        if (!route.requireAuth) {
          return { allowed: true };
        }
        
        if (!ctx.user) {
          return {
            allowed: false,
            reason: 'Not authenticated',
            redirectTo: '/login',
          };
        }
        
        if (!ctx.user.isSupplier && !ctx.user.isSuperAdmin) {
          return {
            allowed: false,
            reason: 'Not a supplier',
            redirectTo: '/login',
          };
        }
        
        return { allowed: true };
      },
    },
    {
      name: 'supplier-approved',
      validate: (ctx) => {
        // TODO: Verificar se fornecedor foi aprovado
        // Isso seria feito via API/Supabase
        return { allowed: true };
      },
    },
  ],
  
  defaultRoute: '/',
  loginRoute: '/login',
  unauthorizedRoute: '/login',
  
  settings: {
    isActive: true,
    requireHttps: true,
    allowAnonymous: false,
    isDynamicSubdomain: false,
    enabledFeatures: ['supplier_portal', 'materials', 'orders_view'],
    analytics: {
      enabled: true,
      trackingId: 'supplier',
    },
    seo: {
      titleTemplate: '%s | StudioOS Fornecedores',
      defaultTitle: 'Portal do Fornecedor',
      defaultDescription: 'Portal para fornecedores do StudioOS',
    },
  },
};
