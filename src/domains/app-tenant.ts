/**
 * Domínio: App Tenant ({slug}-app.studioos.pro)
 * 
 * Aplicativo principal das organizações/tenants.
 * Aqui os usuários gerenciam orçamentos, pedidos, clientes, etc.
 */

import { lazy } from 'react';
import type { DomainConfig } from './types';

// Lazy load das páginas do app
const GerarOrcamento = lazy(() => import('@/pages/GerarOrcamento'));
const LoginGateway = lazy(() => import('@/pages/LoginGateway'));
const NovoOrcamento = lazy(() => import('@/components/orcamento/NovoOrcamento'));
const VisualizarOrcamento = lazy(() => import('@/components/orcamento/VisualizarOrcamento'));
const ConfiguracoesOrganizacao = lazy(() => import('@/pages/ConfiguracoesOrganizacao'));
const ConfiguracoesFaturamento = lazy(() => import('@/pages/ConfiguracoesFaturamento'));
const ConfiguracoesUsuarios = lazy(() => import('@/pages/ConfiguracoesUsuarios'));

export const appTenantDomain: DomainConfig = {
  id: 'app-tenant',
  name: 'StudioOS App',
  description: 'Aplicativo das organizações para gestão completa',
  
  hostnames: [
    '*-app.studioos.pro',
    'app.studioos.pro',
    '*-app.localhost',
    '*-app.staging.studioos.pro',
  ],
  
  matchesHostname: (hostname: string): boolean => {
    // Padrão: {slug}-app.studioos.pro ou app.studioos.pro (fallback)
    return hostname.includes('-app.') || hostname === 'app.studioos.pro';
  },
  
  routes: [
    {
      path: '/',
      component: GerarOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Dashboard - StudioOS',
        description: 'Dashboard da organização',
      },
    },
    {
      path: '/login',
      component: LoginGateway,
      requireAuth: false,
      meta: {
        title: 'Login - StudioOS',
        description: 'Acesse sua conta',
      },
    },
    // Nova estrutura de rotas /orcamentos/*
    {
      path: '/orcamentos',
      component: GerarOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Orçamentos - StudioOS',
      },
    },
    {
      path: '/orcamentos/novo',
      component: NovoOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Novo Orçamento - StudioOS',
      },
    },
    {
      path: '/orcamentos/:id',
      component: VisualizarOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Visualizar Orçamento - StudioOS',
      },
    },
    // Rota legada (será redirecionada)
    {
      path: '/gerarorcamento',
      component: GerarOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Orçamentos - StudioOS',
      },
    },
    // Configurações
    {
      path: '/configuracoes/organizacao',
      component: ConfiguracoesOrganizacao,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Configurações da Organização - StudioOS',
      },
    },
    {
      path: '/configuracoes/faturamento',
      component: ConfiguracoesFaturamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Faturamento - StudioOS',
      },
    },
    {
      path: '/configuracoes/usuarios',
      component: ConfiguracoesUsuarios,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Usuários - StudioOS',
      },
    },
    // Financeiro
    {
      path: '/financeiro/consolidado',
      component: GerarOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Financeiro - StudioOS',
      },
    },
    // CRM
    {
      path: '/crm/painel',
      component: GerarOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'CRM - StudioOS',
      },
    },
    // Produção
    {
      path: '/producao/pedidos',
      component: GerarOrcamento,
      requireAuth: true,
      fallbackRoute: '/login',
      meta: {
        title: 'Produção - StudioOS',
      },
    },
  ],
  
  redirects: [
    // Migrar rotas antigas para novas
    {
      from: '/gerarorcamento',
      to: '/orcamentos',
      type: 'internal',
    },
    // Redirecionar /dashboard para /
    {
      from: '/dashboard',
      to: '/',
      type: 'internal',
    },
    // Redirecionar paths de admin para domínio correto
    {
      from: '/admin-supremo/*',
      to: 'https://admin.studioos.pro',
      type: 'cross-domain',
      preservePath: true,
    },
    // Redirecionar /fornecedores para domínio de fornecedores
    {
      from: '/fornecedores',
      to: 'https://fornecedores.studioos.pro',
      type: 'cross-domain',
    },
  ],
  
  guards: [
    {
      name: 'organization-member',
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
        
        // Verificar se usuário pertence a alguma organização
        if (!ctx.user.organizationId && !ctx.user.isSuperAdmin) {
          return {
            allowed: false,
            reason: 'No organization assigned',
            redirectTo: '/login',
          };
        }
        
        // Verificar roles específicas
        if (route.allowedRoles && route.allowedRoles.length > 0) {
          const hasRole = route.allowedRoles.some(role => 
            ctx.user?.roles.includes(role) || ctx.user?.role === role
          );
          
          if (!hasRole && !ctx.user?.isSuperAdmin) {
            return {
              allowed: false,
              reason: 'Insufficient role',
              redirectTo: '/',
            };
          }
        }
        
        return { allowed: true };
      },
    },
    {
      name: 'organization-active',
      validate: (ctx) => {
        if (ctx.organization && !ctx.organization.isActive && !ctx.user?.isSuperAdmin) {
          return {
            allowed: false,
            reason: 'Organization inactive',
            redirectTo: '/login',
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
    isDynamicSubdomain: true,
    slugPattern: /^([a-z0-9-]+)-app\./,
    enabledFeatures: [
      'orcamentos',
      'pedidos',
      'clientes',
      'financeiro',
      'crm',
      'producao',
      'relatorios',
      'configuracoes',
    ],
    analytics: {
      enabled: true,
      trackingId: 'app',
    },
    seo: {
      titleTemplate: '%s | StudioOS',
      defaultTitle: 'StudioOS',
      defaultDescription: 'Sistema de gestão para empresas de cortinas',
    },
  },
};
