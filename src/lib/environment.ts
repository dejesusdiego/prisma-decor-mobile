/**
 * Detecção de Ambiente
 * 
 * Determina o ambiente atual baseado no hostname.
 * Usado para decidir quando permitir rotas de desenvolvimento.
 */

export type Environment = 'local' | 'preview' | 'staging' | 'production';

/**
 * Detecta o ambiente atual baseado no hostname
 * 
 * @param hostname - Hostname atual (window.location.hostname)
 * @returns Ambiente detectado
 * 
 * @example
 * getEnvironment('localhost') // 'local'
 * getEnvironment('studioos.pro') // 'production'
 * getEnvironment('staging.studioos.pro') // 'staging'
 * getEnvironment('prisma-decor-mobile-abc123.vercel.app') // 'preview'
 */
export function getEnvironment(hostname: string): Environment {
  // Desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return 'local';
  }

  // Preview (Vercel preview deployments)
  if (hostname.includes('.vercel.app')) {
    return 'preview';
  }

  // Staging (subdomínio staging.*)
  if (hostname.startsWith('staging.') || hostname.includes('.staging.')) {
    return 'staging';
  }

  // Produção (domínios reais)
  return 'production';
}

/**
 * Verifica se o ambiente permite rotas de desenvolvimento
 * 
 * Rotas de desenvolvimento (`/studioos`, `/lp/:slug`) são permitidas apenas em:
 * - local: desenvolvimento local
 * - preview: preview deployments (Vercel)
 * - staging: ambiente de staging
 * 
 * Em produção, apenas subdomínios devem ser usados.
 * 
 * @param hostname - Hostname atual
 * @returns true se rotas de dev são permitidas
 */
export function allowsDevRoutes(hostname: string): boolean {
  const env = getEnvironment(hostname);
  return env === 'local' || env === 'preview' || env === 'staging';
}

/**
 * Verifica se está em produção real
 * 
 * @param hostname - Hostname atual
 * @returns true se está em produção
 */
export function isProduction(hostname: string): boolean {
  return getEnvironment(hostname) === 'production';
}
