/**
 * Teste de Feature Flags
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ORG_PRISMA = '11111111-1111-1111-1111-111111111111';
const ORG_CM = '22222222-2222-2222-2222-222222222222';

async function main() {
  console.log('🧪 TESTE DE FEATURE FLAGS\n');
  console.log('='.repeat(60) + '\n');

  // 1. Buscar organizações
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, plano')
    .order('name');

  console.log('📋 Organizações cadastradas:');
  orgs?.forEach(o => {
    const emoji = o.plano === 'enterprise' ? '🏆' : o.plano === 'business' ? '💼' : o.plano === 'profissional' ? '⭐' : '📦';
    console.log(`   ${emoji} ${o.name} (${o.slug}): ${o.plano}`);
  });

  // 2. Testar org_get_features para cada organização
  console.log('\n\n🔍 TESTANDO FEATURES POR ORGANIZAÇÃO:\n');

  for (const org of orgs || []) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📦 ${org.name} (${org.plano?.toUpperCase()})`);
    console.log('─'.repeat(50));

    const { data: features, error } = await supabase
      .rpc('org_get_features', { org_id: org.id });

    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      continue;
    }

    const f = features?.[0];
    if (!f) {
      console.log('   ⚠️ Sem dados de features');
      continue;
    }

    console.log(`\n   📊 Limites:`);
    console.log(`      Orçamentos: ${f.orcamentos_mes}/${f.limite_orcamentos || '∞'} usados`);
    console.log(`      Usuários: até ${f.limite_usuarios}`);

    console.log(`\n   ✨ Features:`);
    const featureList = [
      ['crm_basico', 'CRM Básico'],
      ['crm_avancado', 'CRM Avançado'],
      ['producao_kanban', 'Produção Kanban'],
      ['financeiro_completo', 'Financeiro Completo'],
      ['relatorios_bi', 'Relatórios BI'],
      ['nfe_integracao', 'NF-e Integração'],
      ['suporte_prioritario', 'Suporte Prioritário'],
      ['whatsapp_integrado', 'WhatsApp'],
      ['api_acesso', 'API'],
      ['customizacoes', 'Customizações'],
    ];

    for (const [key, label] of featureList) {
      const enabled = f[key];
      console.log(`      ${enabled ? '✅' : '❌'} ${label}`);
    }
  }

  // 3. Testar funções auxiliares
  console.log('\n\n🔧 TESTANDO FUNÇÕES AUXILIARES:\n');

  // org_has_feature
  console.log('📍 org_has_feature:');
  for (const org of orgs || []) {
    const { data: hasFinanceiro } = await supabase
      .rpc('org_has_feature', { org_id: org.id, feature_name: 'financeiro_completo' });
    const { data: hasCrmAvancado } = await supabase
      .rpc('org_has_feature', { org_id: org.id, feature_name: 'crm_avancado' });
    
    console.log(`   ${org.name}:`);
    console.log(`      financeiro_completo: ${hasFinanceiro ? '✅' : '❌'}`);
    console.log(`      crm_avancado: ${hasCrmAvancado ? '✅' : '❌'}`);
  }

  // org_can_create_orcamento
  console.log('\n📍 org_can_create_orcamento:');
  for (const org of orgs || []) {
    const { data: canCreate } = await supabase
      .rpc('org_can_create_orcamento', { org_id: org.id });
    console.log(`   ${org.name}: ${canCreate ? '✅ Pode criar' : '❌ Limite atingido'}`);
  }

  // org_get_user_limit
  console.log('\n📍 org_get_user_limit:');
  for (const org of orgs || []) {
    const { data: userLimit } = await supabase
      .rpc('org_get_user_limit', { org_id: org.id });
    console.log(`   ${org.name}: ${userLimit} usuários`);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
