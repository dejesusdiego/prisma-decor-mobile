/**
 * Script para executar SQL diretamente via PostgREST
 * Abordagem: Usar a função sql do rpc 
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// SQL quebrado em partes menores para executar via funções específicas
async function main() {
  console.log('🚀 Configurando Feature Flags via API...\n');

  try {
    // 1. Criar tipo enum via raw SQL 
    // Como não temos acesso direto ao SQL, vamos criar a estrutura de forma diferente:
    // Usar tabela simples com validação no aplicativo

    // Verificar se tabela já existe
    const { error: checkError } = await supabase.from('planos_config').select('id').limit(1);
    
    if (checkError?.code === '42P01') {
      console.log('❌ Tabela planos_config não existe.');
      console.log('\n📋 INSTRUÇÕES PARA EXECUTAR MANUALMENTE:\n');
      console.log('1. Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql/new');
      console.log('2. Cole e execute o conteúdo do arquivo:');
      console.log('   supabase/migrations/20260114_feature_flags.sql');
      console.log('\n3. Após executar, rode este script novamente para verificar.\n');
      
      // Mostrar o SQL para facilitar
      const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260114_feature_flags.sql');
      console.log('📄 Conteúdo do SQL:\n');
      console.log('=' .repeat(80));
      console.log(fs.readFileSync(sqlPath, 'utf-8'));
      console.log('=' .repeat(80));
      
      return;
    }

    // Se chegou aqui, a tabela existe
    console.log('✅ Tabela planos_config encontrada!\n');

    // Verificar planos
    const { data: planos } = await supabase
      .from('planos_config')
      .select('*')
      .order('preco_mensal');

    if (planos?.length) {
      console.log('📊 Planos configurados:');
      planos.forEach(p => {
        const features = [];
        if (p.crm_avancado) features.push('CRM Avançado');
        if (p.financeiro_completo) features.push('Financeiro');
        if (p.relatorios_bi) features.push('BI');
        if (p.whatsapp_integrado) features.push('WhatsApp');
        if (p.api_acesso) features.push('API');
        
        console.log(`\n   📦 ${p.nome_exibicao}`);
        console.log(`      Preço: R$ ${p.preco_mensal}/mês`);
        console.log(`      Usuários: ${p.usuarios_base}`);
        console.log(`      Orçamentos: ${p.limite_orcamentos || '∞'}/mês`);
        console.log(`      Features: ${features.length ? features.join(', ') : 'Básico'}`);
      });
    }

    // Verificar organizações
    console.log('\n\n📋 Verificando organizações...');
    
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug, plano')
      .order('name');

    if (orgsError) {
      if (orgsError.message.includes('plano does not exist')) {
        console.log('⚠️ Coluna "plano" ainda não foi adicionada à tabela organizations.');
        console.log('   Execute o SQL completo no Supabase Dashboard.');
      } else {
        console.log('❌ Erro:', orgsError.message);
      }
    } else {
      console.log('\n   Organizações cadastradas:');
      orgs?.forEach(o => {
        console.log(`   - ${o.name} (${o.slug}): plano ${o.plano || 'starter'}`);
      });

      // Atualizar organização Prisma para plano Enterprise (para testes)
      console.log('\n\n🔄 Atualizando Prisma Decor Lab para plano Enterprise...');
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ plano: 'enterprise' })
        .eq('slug', 'prisma-decor-lab');

      if (updateError) {
        console.log('❌ Erro ao atualizar:', updateError.message);
      } else {
        console.log('✅ Plano atualizado com sucesso!');
      }
    }

    // Testar função org_get_features
    console.log('\n\n🧪 Testando função org_get_features...');
    
    const { data: features, error: featuresError } = await supabase
      .rpc('org_get_features', { org_id: '11111111-1111-1111-1111-111111111111' });

    if (featuresError) {
      console.log('⚠️ Função org_get_features não encontrada ou erro:', featuresError.message);
      console.log('   Execute o SQL completo para criar as funções.');
    } else {
      console.log('✅ Features da organização:');
      console.log(JSON.stringify(features?.[0], null, 2));
    }

    console.log('\n✨ Configuração verificada!');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();
