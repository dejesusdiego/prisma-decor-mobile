/**
 * Constantes do Sistema
 * 
 * Valores reservados e configurações globais.
 */

/**
 * Slug reservado da plataforma
 * 
 * ⚠️ IMPORTANTE: Este slug é RESERVADO para a organização interna StudioOS.
 * Nenhuma organização cliente pode usar este slug.
 * 
 * A organização interna StudioOS (type='internal') sempre usa slug='studioos'.
 * 
 * Validação futura: Criar constraint ou validação no admin para prevenir uso deste slug.
 */
export const RESERVED_PLATFORM_SLUG = 'studioos';

/**
 * ID fixo da organização interna StudioOS
 * 
 * Esta organização é usada para:
 * - Vincular domínio marketing StudioOS (studioos.pro)
 * - Manter constraint válida (marketing sempre tem organization_id)
 * - Não poluir lista de clientes (type='internal')
 */
export const STUDIOOS_INTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Verifica se um slug é reservado
 * 
 * @param slug - Slug a verificar
 * @returns true se o slug é reservado
 */
export function isReservedSlug(slug: string): boolean {
  return slug === RESERVED_PLATFORM_SLUG;
}
