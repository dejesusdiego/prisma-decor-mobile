/**
 * Sistema de Rotas Multi-Domínio - Configurações Export
 * 
 * Centraliza todas as configurações de domínios para fácil importação.
 */

import type { DomainConfig, DomainId } from './types';
import { marketingDomain } from './marketing';
import { appTenantDomain } from './app-tenant';
import { superAdminDomain } from './super-admin';
import { landingOrgDomain } from './landing-org';
import { supplierDomain } from './supplier';

// Exportar tipos
export * from './types';

// Exportar configurações individuais
export { marketingDomain };
export { appTenantDomain };
export { superAdminDomain };
export { landingOrgDomain };
export { supplierDomain };

// Array com todas as configurações (ordem importa para resolução)
export const allDomains: DomainConfig[] = [
  // Domínios específicos primeiro (mais específicos têm prioridade)
  superAdminDomain,    // admin.studioos.pro
  appTenantDomain,     // {slug}-app.studioos.pro
  supplierDomain,      // fornecedores.studioos.pro
  landingOrgDomain,    // {slug}.studioos.pro
  marketingDomain,     // studioos.pro (catch-all)
];

// Mapa para acesso rápido por ID
export const domainsById: Record<DomainId, DomainConfig> = {
  marketing: marketingDomain,
  'app-tenant': appTenantDomain,
  'super-admin': superAdminDomain,
  'landing-org': landingOrgDomain,
  supplier: supplierDomain,
  // TODO: Implementar quando necessário
  affiliates: marketingDomain, // Placeholder
  status: marketingDomain,     // Placeholder
};

/**
 * Resolve qual domínio corresponde ao hostname
 */
export function resolveDomainByHostname(hostname: string): DomainConfig | null {
  // Ordem importa: verificar do mais específico para o mais genérico
  for (const domain of allDomains) {
    if (domain.matchesHostname(hostname)) {
      return domain;
    }
  }
  return null;
}

/**
 * Verifica se um domínio existe
 */
export function domainExists(domainId: DomainId): boolean {
  return domainId in domainsById;
}

/**
 * Obtém configuração de domínio por ID
 */
export function getDomainById(domainId: DomainId): DomainConfig | null {
  return domainsById[domainId] || null;
}

/**
 * Lista todos os IDs de domínios ativos
 */
export function getActiveDomainIds(): DomainId[] {
  return allDomains
    .filter(d => d.settings.isActive)
    .map(d => d.id);
}

/**
 * Verifica se um hostname pertence a um domínio dinâmico
 */
export function isDynamicSubdomain(hostname: string): boolean {
  const domain = resolveDomainByHostname(hostname);
  return domain?.settings.isDynamicSubdomain ?? false;
}

/**
 * Extrai slug de subdomínio dinâmico
 */
export function extractSlugFromHostname(hostname: string): string | null {
  const domain = resolveDomainByHostname(hostname);
  if (!domain?.settings.isDynamicSubdomain) {
    return null;
  }
  
  const pattern = domain.settings.slugPattern;
  if (pattern) {
    const match = hostname.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Fallback: pegar primeira parte do hostname
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts[0];
  }
  
  return null;
}
