import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tjwpqrlfhngibuwqodcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI'
);

async function main() {
  console.log('🔄 Atualizando planos das organizações...\n');

  // Atualizar Prisma Interiores para Enterprise
  const { error } = await supabase
    .from('organizations')
    .update({ plano: 'enterprise' })
    .eq('slug', 'prisma');
  
  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('✅ Prisma Interiores atualizada para Enterprise!');
  }
  
  // Verificar todas
  const { data } = await supabase.from('organizations').select('name, slug, plano');
  console.log('\n📋 Organizações:');
  data?.forEach(o => console.log(`   - ${o.name} (${o.slug}): ${o.plano}`));

  // Testar função org_get_features para Prisma
  console.log('\n\n🧪 Testando features da Prisma Interiores...');
  const prismaOrg = data?.find(o => o.slug === 'prisma');
  if (prismaOrg) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'prisma')
      .single();
    
    if (orgData) {
      const { data: features, error: featError } = await supabase
        .rpc('org_get_features', { org_id: orgData.id });
      
      if (featError) {
        console.log('❌ Erro ao testar:', featError.message);
      } else {
        console.log('✅ Features:', JSON.stringify(features?.[0], null, 2));
      }
    }
  }

  console.log('\n✨ Pronto!');
}

main();
