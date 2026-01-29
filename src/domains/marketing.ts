/**
 * Domínio: Marketing (studioos.pro)
 * 
 * Landing page principal do StudioOS.
 * Rotas públicas para apresentação do produto.
 */

import { lazy } from 'react';
import type { DomainConfig } from './types';
import LandingPageStudioOS from '@/pages/studioos/LandingPageStudioOS';

// Lazy load para otimizar bundle
const LoginGateway = lazy(() => import('@/pages/LoginGateway'));
const SupplierRegistration = lazy(() => import('@/pages/CadastroFornecedor'));

export const marketingDomain: DomainConfig = {
  id: 'marketing',
  name: 'StudioOS Marketing',
  description: 'Landing page principal e gateway de autenticação',
  
  hostnames: [
    'studioos.pro',
    'www.studioos.pro',
    'localhost',
    '127.0.0.1',
  ],
  
  matchesHostname: (hostname: string): boolean => {
    const marketingHosts = [
      'studioos.pro',
      'www.studioos.pro',
      'localhost',
      '127.0.0.1',
    ];
    return marketingHosts.includes(hostname.toLowerCase());
  },
  
  routes: [
    {
      path: '/',
      component: LandingPageStudioOS,
      requireAuth: false,
      meta: {
        title: 'StudioOS - Sistema Completo para Empresas de Cortinas e Persianas',
        description: 'Gerencie orçamentos, pedidos, produção e finanças em um só lugar.',
        includeInSitemap: true,
      },
    },
    {
      path: '/login',
      component: LoginGateway,
      requireAuth: false,
      meta: {
        title: 'Login - StudioOS',
        description: 'Acesse sua conta StudioOS',
      },
    },
    {
      path: '/auth',
      component: LoginGateway,
      requireAuth: false,
      meta: {
        title: 'Autenticação - StudioOS',
      },
    },
    {
      path: '/cadastro-fornecedor',
      component: SupplierRegistration,
      requireAuth: false,
      meta: {
        title: 'Cadastro de Fornecedor - StudioOS',
        description: 'Cadastre-se como fornecedor do StudioOS',
      },
    },
    {
      path: '/precos',
      component: LandingPageStudioOS, // TODO: Criar página de preços
      requireAuth: false,
      meta: {
        title: 'Preços - StudioOS',
        description: 'Planos e preços do StudioOS',
        includeInSitemap: true,
      },
    },
    {
      path: '/sobre',
      component: LandingPageStudioOS, // TODO: Criar página sobre
      requireAuth: false,
      meta: {
        title: 'Sobre - StudioOS',
        description: 'Conheça o StudioOS',
        includeInSitemap: true,
      },
    },
  ],
  
  redirects: [
    // Redirecionar rotas de app para o domínio correto
    {
      from: '/gerarorcamento',
      to: '/login',
      type: 'internal',
      condition: (ctx) => !ctx.user,
    },
    {
      from: '/dashboard',
      to: '/login',
      type: 'internal',
      condition: (ctx) => !ctx.user,
    },
    // Redirecionar /admin-supremo para o domínio admin
    {
      from: '/admin-supremo/*',
      to: 'https://admin.studioos.pro',
      type: 'cross-domain',
      preservePath: true,
    },
    // Alias para login
    {
      from: '/entrar',
      to: '/login',
      type: 'internal',
    },
    {
      from: '/acessar',
      to: '/login',
      type: 'internal',
    },
  ],
  
  guards: [
    {
      name: 'block-app-routes',
      validate: (ctx, route) => {
        // Bloqueia rotas de app em domínio de marketing
        const appRoutes = ['/orcamentos', '/pedidos', '/clientes', '/financeiro'];
        if (appRoutes.some(r => ctx.pathname.startsWith(r))) {
          return {
            allowed: false,
            reason: 'App routes not available on marketing domain',
            redirectTo: ctx.user ? `https://app.studioos.pro${ctx.pathname}` : '/login',
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
    allowAnonymous: true,
    isDynamicSubdomain: false,
    enabledFeatures: ['landing_page', 'supplier_registration', 'auth_gateway'],
    analytics: {
      enabled: true,
      trackingId: 'marketing',
    },
    seo: {
      titleTemplate: '%s | StudioOS',
      defaultTitle: 'StudioOS',
      defaultDescription: 'Sistema completo para empresas de cortinas e persianas',
    },
  },
};
