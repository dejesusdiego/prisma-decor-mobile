/**
 * Domain Middleware
 * 
 * Middleware para resolução de domínios no frontend.
 * 
 * ⚠️ MVP: Resolve no frontend (client-side)
 * 📌 Scale: Migrar para Vercel Edge Middleware quando necessário
 * 
 * Este módulo contém funções para:
 * - Extrair informações do hostname/subdomínio
 * - Validar domínios permitidos
 * - Resolver organizações baseadas no slug
 */

import { extractSlugFromHostname, isLandingPageSubdomain, isAppSubdomain } from '@/lib/domainResolver';

export interface DomainContext {
  hostname: string;
  subdomain: string | null;
  isStudioOSDomain: boolean;
  isLandingPageSubdomain: boolean;
  isAppSubdomain: boolean;
  organizationSlug: string | null;
  environment: 'production' | 'staging' | 'preview' | 'local';
}

/**
 * Detecta o ambiente baseado no hostname
 */
export function detectEnvironment(hostname: string): 'production' | 'staging' | 'preview' | 'local' {
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'local';
  }
  
  if (hostname.includes('studioos.pro') || hostname.includes('studioos.com.br')) {
    return 'production';
  }
  
  // Vercel preview deployments
  if (hostname.includes('vercel.app') || hostname.includes('-git-')) {
    return 'preview';
  }
  
  // Staging (quando configurado)
  if (hostname.includes('staging.')) {
    return 'staging';
  }
  
  return 'production';
}

/**
 * Extrai o contexto do domínio atual
 */
export function getDomainContext(hostname: string = window.location.hostname): DomainContext {
  const subdomain = extractSlugFromHostname(hostname);
  const environment = detectEnvironment(hostname);
  
  const isStudioOSDomain = hostname.includes('studioos.pro') || hostname.includes('studioos.com.br');
  const isLPSubdomain = isLandingPageSubdomain(hostname);
  const isAppSub = isAppSubdomain(hostname);
  
  return {
    hostname,
    subdomain,
    isStudioOSDomain,
    isLandingPageSubdomain: isLPSubdomain,
    isAppSubdomain: isAppSub,
    organizationSlug: isLPSubdomain ? subdomain : null,
    environment,
  };
}

/**
 * Lista de slugs reservados que não podem ser usados por organizações
 */
export const RESERVED_SLUGS = [
  'admin',
  'panel',
  'fornecedores',
  'fornecedor',
  'app',
  'api',
  'www',
  'mail',
  'ftp',
  'studioos',
  'studio',
  'os',
  'login',
  'auth',
  'logout',
  'register',
  'signup',
  'dashboard',
  'settings',
  'config',
  'api',
  'graphql',
  'rest',
  'webhook',
  'cdn',
  'static',
  'assets',
  'images',
  'files',
  'docs',
  'documentation',
  'help',
  'support',
  'contact',
  'about',
  'blog',
  'news',
  'store',
  'shop',
  'payment',
  'payments',
  'billing',
  'invoice',
  'invoices',
  'subscription',
  'plan',
  'plans',
  'pricing',
  'trial',
  'demo',
  'test',
  'testing',
  'staging',
  'dev',
  'development',
  'local',
  'localhost',
];

/**
 * Valida se um slug pode ser usado
 */
export function isValidSlug(slug: string): boolean {
  // Deve ter pelo menos 3 caracteres
  if (slug.length < 3) return false;
  
  // Máximo 63 caracteres (limite DNS)
  if (slug.length > 63) return false;
  
  // Apenas letras minúsculas, números e hífens
  if (!/^[a-z0-9-]+$/.test(slug)) return false;
  
  // Não pode começar ou terminar com hífen
  if (slug.startsWith('-') || slug.endsWith('-')) return false;
  
  // Não pode ter hífens consecutivos
  if (slug.includes('--')) return false;
  
  // Não pode ser um slug reservado
  if (RESERVED_SLUGS.includes(slug)) return false;
  
  return true;
}

/**
 * Gera sugestões de slug baseado no nome da organização
 */
export function generateSlugSuggestions(name: string): string[] {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-'); // Espaços viram hífens
  
  const suggestions: string[] = [];
  
  // Sugestão base
  if (base.length >= 3) {
    suggestions.push(base);
  }
  
  // Sugestões com sufixos
  if (base.length >= 2) {
    suggestions.push(`${base}-decor`);
    suggestions.push(`${base}-cortinas`);
    suggestions.push(`${base}-persianas`);
  }
  
  // Sugestões com números aleatórios curto
  if (base.length >= 3) {
    const shortNum = Math.floor(Math.random() * 100);
    suggestions.push(`${base}${shortNum}`);
  }
  
  return suggestions.filter(isValidSlug);
}

/**
 * Formata um subdomínio para exibição
 * Ex: prisma-decor → Prisma Decor
 */
export function formatSubdomainForDisplay(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Constrói a URL completa de um subdomínio
 */
export function buildSubdomainUrl(
  slug: string, 
  type: 'landing' | 'app' = 'landing',
  domain: string = 'studioos.com.br'
): string {
  if (type === 'app') {
    return `https://${slug}-app.${domain}`;
  }
  return `https://${slug}.${domain}`;
}

/**
 * Verifica se um hostname é seguro/confiável
 */
export function isTrustedHostname(hostname: string): boolean {
  const trustedDomains = [
    'studioos.pro',
    'studioos.com.br',
    'localhost',
    '127.0.0.1',
  ];
  
  return trustedDomains.some(domain => 
    hostname === domain || 
    hostname.endsWith(`.${domain}`) ||
    hostname.includes('vercel.app')
  );
}

/**
 * Middleware principal - executa antes do carregamento da aplicação
 * Pode ser usado para redirecionamentos ou validações
 */
export function domainMiddleware(): { redirect?: string; allowed: boolean } {
  const hostname = window.location.hostname;
  const context = getDomainContext(hostname);
  
  // Verificar se o domínio é confiável
  if (!isTrustedHostname(hostname)) {
    console.warn('Untrusted hostname:', hostname);
    // Em produção, você pode querer bloquear ou redirecionar
    // return { allowed: false };
  }
  
  // Redirecionar www para non-www
  if (hostname.startsWith('www.')) {
    const newUrl = window.location.href.replace('www.', '');
    return { redirect: newUrl, allowed: true };
  }
  
  // Verificar se é um subdomínio de landing page com slug inválido
  if (context.isLandingPageSubdomain && context.subdomain) {
    if (!isValidSlug(context.subdomain)) {
      console.warn('Invalid slug in subdomain:', context.subdomain);
      // Redirecionar para página de erro ou domínio principal
      return { redirect: 'https://studioos.com.br', allowed: false };
    }
  }
  
  return { allowed: true };
}
