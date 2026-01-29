/**
 * Sistema de Rotas Multi-Domínio - Tipos Base
 * 
 * Define as interfaces e tipos para o sistema de roteamento baseado em domínios.
 * Cada domínio tem suas próprias rotas, guards e comportamentos específicos.
 */

import { ComponentType, ReactNode } from 'react';

// ============================================================================
// DOMÍNIOS SUPORTADOS
// ============================================================================

export type DomainId = 
  | 'marketing'      // studioos.pro - Landing page principal
  | 'app-tenant'     // {slug}-app.studioos.pro - Aplicativo das organizações
  | 'super-admin'    // admin.studioos.pro - Painel do super admin
  | 'landing-org'    // {slug}.studioos.pro - Landing pages das orgs
  | 'supplier'       // fornecedores.studioos.pro - Portal de fornecedores
  | 'affiliates'     // afiliados.studioos.pro - Programa de afiliados
  | 'status';        // status.studioos.pro - Status page pública

// ============================================================================
// CONFIGURAÇÃO DE ROTAS
// ============================================================================

export interface DomainRoute {
  /** Caminho da rota (ex: '/', '/orcamentos', '/admin-supremo') */
  path: string;
  /** Componente a ser renderizado */
  component: ComponentType<any>;
  /** Se a rota requer autenticação */
  requireAuth?: boolean;
  /** Roles permitidas (se vazio, qualquer usuário autenticado) */
  allowedRoles?: string[];
  /** Permissões específicas necessárias */
  requiredPermissions?: string[];
  /** Rota padrão quando usuário não tem permissão */
  fallbackRoute?: string;
  /** Metadados da rota */
  meta?: RouteMeta;
}

export interface RouteMeta {
  /** Título da página */
  title?: string;
  /** Descrição para SEO */
  description?: string;
  /** Se deve aparecer no sitemap */
  includeInSitemap?: boolean;
  /** Tags para analytics */
  analyticsTags?: string[];
}

// ============================================================================
// CONFIGURAÇÃO DE REDIRECIONAMENTOS
// ============================================================================

export interface RedirectRule {
  /** De onde redirecionar */
  from: string;
  /** Para onde redirecionar */
  to: string;
  /** Tipo de redirecionamento */
  type: 'internal' | 'external' | 'cross-domain';
  /** Se deve preservar o pathname ao redirecionar entre domínios */
  preservePath?: boolean;
  /** Condição para aplicar o redirecionamento */
  condition?: (context: RoutingContext) => boolean;
}

export interface CrossDomainRedirect {
  /** Domínio de origem */
  fromDomain: DomainId;
  /** Domínio de destino */
  toDomain: DomainId;
  /** Path de origem */
  fromPath: string;
  /** Path de destino (se diferente) */
  toPath?: string;
  /** Se deve transferir query params */
  preserveQuery?: boolean;
}

// ============================================================================
// CONTEXTO DE ROTEAMENTO
// ============================================================================

export interface RoutingContext {
  /** Domínio atual detectado */
  currentDomain: DomainId;
  /** Hostname atual */
  hostname: string;
  /** Pathname atual */
  pathname: string;
  /** Usuário atual (se autenticado) */
  user: UserContext | null;
  /** Organização atual (se aplicável) */
  organization: OrganizationContext | null;
  /** Query params da URL */
  searchParams: URLSearchParams;
}

export interface UserContext {
  id: string;
  email: string;
  role: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  isSupplier: boolean;
  isAffiliate: boolean;
  organizationId?: string;
  organizationRole?: string;
}

export interface OrganizationContext {
  id: string;
  slug: string;
  name: string;
  plan: string;
  isActive: boolean;
  settings?: Record<string, any>;
}

// ============================================================================
// GUARDS E VALIDAÇÃO
// ============================================================================

export type GuardResult = 
  | { allowed: true }
  | { allowed: false; reason: string; redirectTo: string };

export interface RouteGuard {
  /** Nome do guard */
  name: string;
  /** Função de validação */
  validate: (context: RoutingContext, route: DomainRoute) => GuardResult | Promise<GuardResult>;
  /** Se o guard deve ser executado mesmo em modo de desenvolvimento */
  enforceInDev?: boolean;
}

// ============================================================================
// CONFIGURAÇÃO DE DOMÍNIO
// ============================================================================

export interface DomainConfig {
  /** Identificador único do domínio */
  id: DomainId;
  /** Nome amigável */
  name: string;
  /** Descrição do propósito */
  description: string;
  /** Padrões de hostname que identificam este domínio */
  hostnames: string[];
  /** Função para verificar se um hostname pertence a este domínio */
  matchesHostname: (hostname: string) => boolean;
  /** Rotas disponíveis neste domínio */
  routes: DomainRoute[];
  /** Regras de redirecionamento específicas */
  redirects: RedirectRule[];
  /** Guards aplicados a todas as rotas do domínio */
  guards: RouteGuard[];
  /** Rota padrão (quando usuário acessa '/') */
  defaultRoute: string;
  /** Rota de login para este domínio */
  loginRoute: string;
  /** Rota de fallback quando usuário não tem permissão */
  unauthorizedRoute: string;
  /** Configurações específicas do domínio */
  settings: DomainSettings;
}

export interface DomainSettings {
  /** Se o domínio está ativo */
  isActive: boolean;
  /** Se requer HTTPS */
  requireHttps?: boolean;
  /** Se permite acesso anônimo */
  allowAnonymous?: boolean;
  /** Se é um domínio de subdomínio dinâmico (ex: {slug}.studioos.pro) */
  isDynamicSubdomain?: boolean;
  /** Padrão para extrair slug de subdomínios dinâmicos */
  slugPattern?: RegExp;
  /** Features habilitadas neste domínio */
  enabledFeatures?: string[];
  /** Configurações de analytics */
  analytics?: {
    trackingId?: string;
    enabled: boolean;
  };
  /** SEO padrão */
  seo?: {
    titleTemplate?: string;
    defaultTitle?: string;
    defaultDescription?: string;
  };
}

// ============================================================================
// RESOLUÇÃO DE DOMÍNIO
// ============================================================================

export interface DomainResolutionResult {
  /** Domínio identificado */
  domain: DomainId;
  /** Se a resolução foi bem-sucedida */
  resolved: boolean;
  /** Slug extraído (para domínios dinâmicos) */
  slug?: string;
  /** Informações adicionais */
  metadata?: Record<string, any>;
  /** Erro de resolução (se houver) */
  error?: string;
}

// ============================================================================
// ESTADO DE ROTEAMENTO
// ============================================================================

export interface RoutingState {
  /** Domínio atual */
  currentDomain: DomainId | null;
  /** Se está carregando a resolução do domínio */
  isResolving: boolean;
  /** Erro de resolução */
  error: string | null;
  /** Se o usuário tem acesso ao domínio atual */
  hasAccess: boolean;
  /** Guards que falharam */
  failedGuards: string[];
  /** Redirecionamento pendente */
  pendingRedirect: string | null;
}

// ============================================================================
// COMPONENTES DO SISTEMA
// ============================================================================

export interface DomainRouterProps {
  /** Configurações de domínios disponíveis */
  domains: DomainConfig[];
  /** Componente de loading */
  loadingComponent?: ReactNode;
  /** Componente de erro */
  errorComponent?: ReactNode;
  /** Callback quando domínio é resolvido */
  onDomainResolved?: (result: DomainResolutionResult) => void;
  /** Callback quando redirecionamento ocorre */
  onRedirect?: (from: string, to: string, reason: string) => void;
}

export interface RouteValidatorProps {
  /** Rota a ser validada */
  route: DomainRoute;
  /** Contexto de roteamento */
  context: RoutingContext;
  /** Componente children (renderizado se válido) */
  children: ReactNode;
  /** Componente de fallback (quando não válido) */
  fallback?: ReactNode;
}

export interface RedirectHandlerProps {
  /** Regras de redirecionamento */
  rules: RedirectRule[];
  /** Contexto atual */
  context: RoutingContext;
  /** Componente children (renderizado se não houver redirecionamento) */
  children: ReactNode;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const DOMAIN_IDS: Record<DomainId, DomainId> = {
  marketing: 'marketing',
  'app-tenant': 'app-tenant',
  'super-admin': 'super-admin',
  'landing-org': 'landing-org',
  supplier: 'supplier',
  affiliates: 'affiliates',
  status: 'status',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: [
    'dashboard:view',
    'orcamentos:*',
    'pedidos:*',
    'clientes:*',
    'financeiro:*',
    'produtos:*',
    'configuracoes:*',
  ],
  user: [
    'dashboard:view',
    'orcamentos:view',
    'orcamentos:create',
    'clientes:view',
  ],
  supplier: [
    'supplier:portal:access',
    'supplier:materials:manage',
    'supplier:orders:view',
  ],
  affiliate: [
    'affiliate:portal:access',
    'affiliate:links:manage',
    'affiliate:commissions:view',
  ],
};

export const ROUTE_ALIASES: Record<string, string> = {
  '/gerarorcamento': '/orcamentos/novo',
  '/orcamento': '/orcamentos/novo',
  '/pedidos': '/producao/pedidos',
  '/financeiro': '/financeiro/consolidado',
  '/crm': '/crm/painel',
  '/config': '/configuracoes/organizacao',
};
