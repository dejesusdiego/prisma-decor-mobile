import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getEnvironment } from '@/lib/environment';

/**
 * Redireciona usuário após login baseado em role
 * 
 * Prioridade:
 * 1. Supplier → fornecedores.studioos.pro
 * 2. Platform Admin → admin.studioos.pro
 * 3. Organization User/Admin → app da organização (custom ou {slug}-app.studioos.pro)
 * 
 * @param user - Usuário autenticado
 * @param navigate - Função navigate do react-router (para dev/preview)
 * @returns Promise que resolve quando redirect é concluído ou não necessário
 */
export async function redirectAfterLogin(user: User, navigate?: (path: string) => void): Promise<void> {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const env = getEnvironment(hostname);
  const isProductionEnv = env === 'production';

  // 1. Verificar se é Supplier
  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('supplier_id, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (supplierUser) {
    if (isProductionEnv) {
      // Redirecionar para domínio de produção
      if (hostname !== 'fornecedores.studioos.pro') {
        window.location.assign('https://fornecedores.studioos.pro');
        return;
      }
    } else {
      // Dev/preview: usar path
      if (!hostname.includes('fornecedores')) {
        if (navigate) {
          navigate('/fornecedores');
        } else {
          window.location.href = window.location.origin + '/fornecedores';
        }
        return;
      }
    }
    // Já está no domínio correto, não redirecionar
    return;
  }

  // 2. Verificar se é Platform Admin
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (adminRole) {
    if (isProductionEnv) {
      if (hostname !== 'admin.studioos.pro' && hostname !== 'panel.studioos.pro') {
        window.location.assign('https://admin.studioos.pro');
        return;
      }
    } else {
      // Dev/preview: usar path
      if (navigate) {
        navigate('/gerenciarusuarios');
      } else {
        window.location.href = window.location.origin + '/gerenciarusuarios';
      }
      return;
    }
    // Já está no domínio correto
    return;
  }

  // 3. Verificar Organization Member
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      organizations!inner (
        id,
        slug
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle();

  if (orgMember && orgMember.organizations) {
    const org = Array.isArray(orgMember.organizations) 
      ? orgMember.organizations[0] 
      : orgMember.organizations;
    const orgSlug = org.slug;

    // Buscar domínio custom da organização (app.{slug}.com)
    const { data: customDomain } = await supabase
      .from('domains')
      .select('hostname')
      .eq('organization_id', org.id)
      .eq('role', 'app')
      .eq('active', true)
      .maybeSingle();

    if (customDomain && isProductionEnv) {
      // Usar domínio custom se existir
      const customHostname = customDomain.hostname;
      if (hostname !== customHostname) {
        window.location.assign(`https://${customHostname}`);
        return;
      }
    } else if (isProductionEnv) {
      // Usar {slug}-app.studioos.pro
      const appDomain = `https://${orgSlug}-app.studioos.pro`;
      if (hostname !== `${orgSlug}-app.studioos.pro` && hostname !== 'app.studioos.pro') {
        window.location.assign(appDomain);
        return;
      }
    } else {
      // Dev/preview: usar path
      if (navigate) {
        navigate('/gerarorcamento');
      } else {
        window.location.href = window.location.origin + '/gerarorcamento';
      }
      return;
    }
    // Já está no domínio correto
    return;
  }

  // Fallback: redirecionar para app padrão
  if (isProductionEnv) {
    if (hostname !== 'app.studioos.pro') {
      window.location.assign('https://app.studioos.pro/gerarorcamento');
      return;
    }
  } else {
    if (navigate) {
      navigate('/gerarorcamento');
    } else {
      window.location.href = window.location.origin + '/gerarorcamento';
    }
  }
}
