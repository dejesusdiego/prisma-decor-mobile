/**
 * Domínio: Landing Page da Organização ({slug}.studioos.pro)
 * 
 * Landing pages personalizadas para cada organização.
 * Clientes finais acessam para ver catálogo e solicitar orçamentos.
 */

import { lazy } from 'react';
import type { DomainConfig } from './types';

// Lazy load da landing page
const LandingPageOrganizacao = lazy(() => import('@/pages/LandingPageOrganizacao'));
const LoginGateway = lazy(() => import('@/pages/LoginGateway'));

export const landingOrgDomain: DomainConfig = {
  id: 'landing-org',
  name: 'StudioOS Landing',
  description: 'Landing pages personalizadas das organizações',
  
  hostnames: [
    '*.studioos.pro',
  ],
  
  matchesHostname: (hostname: string): boolean => {
    // Excluir subdomínios especiais
    const excludedPrefixes = [
      'www.',
      'admin.',
      'app.',
      'fornecedores.',
      'afiliados.',
      'status.',
    ];
    
    const isExcluded = excludedPrefixes.some(prefix => 
      hostname.toLowerCase().startsWith(prefix)
    ) || hostname.includes('-app.');
    
    // Também excluir domínio principal
    const isMainDomain = hostname.toLowerCase() === 'studioos.pro' || 
                         hostname.toLowerCase() === 'www.studioos.pro';
    
    // Deve ter um subdomínio (contém ponto) e não ser excluído
    return hostname.includes('.') && !isExcluded && !isMainDomain;
  },
  
  routes: [
    {
      path: '/',
      component: LandingPageOrganizacao,
      requireAuth: false,
      meta: {
        title: 'Solicite seu Orçamento',
        description: 'Solicite um orçamento personalizado',
        includeInSitemap: true,
      },
    },
    {
      path: '/login',
      component: LoginGateway,
      requireAuth: false,
      meta: {
        title: 'Login',
        description: 'Acesse sua conta',
      },
    },
    {
      path: '/orcamento',
      component: LandingPageOrganizacao,
      requireAuth: false,
      meta: {
        title: 'Solicitar Orçamento',
        description: 'Preencha o formulário para receber seu orçamento',
      },
    },
  ],
  
  redirects: [
    // Redirecionar rotas de app para o domínio correto
    {
      from: '/gerarorcamento',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
    {
      from: '/dashboard',
      to: '/',
      type: 'internal',
      condition: () => true,
    },
    // Redirecionar paths de admin para domínio correto
    {
      from: '/admin-supremo/*',
      to: 'https://admin.studioos.pro',
      type: 'cross-domain',
      preservePath: true,
    },
  ],
  
  guards: [
    {
      name: 'valid-organization',
      validate: async (ctx) => {
        // Extrair slug do hostname
        const slug = ctx.hostname.split('.')[0];
        
        if (!slug || slug === 'www' || slug === 'admin') {
          return {
            allowed: false,
            reason: 'Invalid organization slug',
            redirectTo: 'https://studioos.pro',
          };
        }
        
        // Verificar se organização existe e está ativa
        // Isso seria verificado via API/Supabase na implementação real
        // Por enquanto, permitimos passar e a página carrega os dados
        
        return { allowed: true };
      },
    },
    {
      name: 'block-app-routes',
      validate: (ctx) => {
        const appRoutes = ['/orcamentos', '/pedidos', '/clientes', '/financeiro', '/crm', '/producao'];
        if (appRoutes.some(r => ctx.pathname.startsWith(r))) {
          return {
            allowed: false,
            reason: 'App routes not available on landing domain',
            redirectTo: '/',
          };
        }
        return { allowed: true };
      },
    },
  ],
  
  defaultRoute: '/',
  loginRoute: '/login',
  unauthorizedRoute: '/',
  
  settings: {
    isActive: true,
    requireHttps: true,
    allowAnonymous: true,
    isDynamicSubdomain: true,
    slugPattern: /^([a-z0-9-]+)\.studioos\.pro$/,
    enabledFeatures: ['landing_page', 'orcamento_form', 'whatsapp_integration'],
    analytics: {
      enabled: true,
      trackingId: 'landing',
    },
    seo: {
      titleTemplate: '%s',
      defaultTitle: 'Solicite seu Orçamento',
      defaultDescription: 'Solicite um orçamento personalizado para cortinas e persianas',
    },
  },
};
