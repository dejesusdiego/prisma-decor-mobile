/**
 * Domínio: Super Admin (admin.studioos.pro)
 * 
 * Painel administrativo para super administradores.
 * Acesso a todas as organizações, fornecedores e configurações globais.
 */

import { lazy } from 'react';
import type { DomainConfig } from './types';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { SupplierApprovalList } from '@/components/admin/SupplierApprovalList';
import { OrganizationsList } from '@/components/admin/OrganizationsList';

// Lazy load das páginas de admin
const GerenciarUsuarios = lazy(() => import('@/pages/GerenciarUsuarios'));
const LoginGateway = lazy(() => import('@/pages/LoginGateway'));

export const superAdminDomain: DomainConfig = {
  id: 'super-admin',
  name: 'StudioOS Admin',
  description: 'Painel administrativo para super administradores',
  
  hostnames: [
    'admin.studioos.pro',
    'admin.localhost',
    'admin.staging.studioos.pro',
  ],
  
  matchesHostname: (hostname: string): boolean => {
    return hostname.toLowerCase().startsWith('admin.');
  },
  
  routes: [
    {
      path: '/',
      component: SuperAdminDashboard,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Dashboard Admin - StudioOS',
        description: 'Painel administrativo do StudioOS',
      },
    },
    {
      path: '/login',
      component: LoginGateway,
      requireAuth: false,
      meta: {
        title: 'Login Admin - StudioOS',
        description: 'Acesse o painel administrativo',
      },
    },
    {
      path: '/admin-supremo',
      component: SuperAdminDashboard,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Dashboard Admin - StudioOS',
      },
    },
    {
      path: '/admin-supremo/fornecedores',
      component: SupplierApprovalList,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Aprovação de Fornecedores - StudioOS',
      },
    },
    {
      path: '/admin-supremo/organizacoes',
      component: OrganizationsList,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Organizações - StudioOS',
      },
    },
    {
      path: '/admin-supremo/usuarios',
      component: GerenciarUsuarios,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Gerenciar Usuários - StudioOS',
      },
    },
    {
      path: '/fornecedores',
      component: SupplierApprovalList,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Aprovação de Fornecedores - StudioOS',
      },
    },
    {
      path: '/organizacoes',
      component: OrganizationsList,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Organizações - StudioOS',
      },
    },
    {
      path: '/usuarios',
      component: GerenciarUsuarios,
      requireAuth: true,
      allowedRoles: ['super_admin'],
      fallbackRoute: '/login',
      meta: {
        title: 'Gerenciar Usuários - StudioOS',
      },
    },
  ],
  
  redirects: [
    // Garantir que rotas antigas funcionem
    {
      from: '/dashboard',
      to: '/',
      type: 'internal',
    },
    // Bloquear rotas de app no domínio admin
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
    {
      from: '/pedidos/*',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
    {
      from: '/financeiro/*',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
    {
      from: '/crm/*',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
    {
      from: '/configuracoes/*',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
    {
      from: '/producao/*',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
  ],
  
  guards: [
    {
      name: 'super-admin-only',
      validate: (ctx, route) => {
        // Se a rota requer auth, verificar super_admin
        if (route.requireAuth) {
          if (!ctx.user) {
            return {
              allowed: false,
              reason: 'Not authenticated',
              redirectTo: '/login',
            };
          }
          
          if (!ctx.user.isSuperAdmin && !ctx.user.roles.includes('super_admin')) {
            return {
              allowed: false,
              reason: 'Not a super admin',
              redirectTo: '/login',
            };
          }
        }
        
        return { allowed: true };
      },
    },
    {
      name: 'block-app-routes',
      validate: (ctx) => {
        const appRoutes = ['/gerarorcamento', '/orcamentos', '/pedidos', '/financeiro', '/crm', '/producao'];
        if (appRoutes.some(r => ctx.pathname.startsWith(r))) {
          return {
            allowed: false,
            reason: 'App routes not available on admin domain',
            redirectTo: '/',
          };
        }
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
    enabledFeatures: ['super_admin', 'supplier_approval', 'org_management', 'user_management'],
    analytics: {
      enabled: true,
      trackingId: 'admin',
    },
    seo: {
      titleTemplate: '%s | StudioOS Admin',
      defaultTitle: 'StudioOS Admin',
      defaultDescription: 'Painel administrativo StudioOS',
    },
  },
};
