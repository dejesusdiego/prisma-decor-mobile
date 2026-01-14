/**
 * Script para aplicar migration de Feature Flags no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🚀 Aplicando Feature Flags migration...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260114_feature_flags.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL carregado:', sqlPath);
    console.log('📊 Tamanho:', sqlContent.length, 'caracteres\n');

    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // Se exec_sql não existir, vamos executar via REST API diretamente
      console.log('⚠️ exec_sql não disponível, tentando método alternativo...\n');
      
      // Dividir em statements e executar um por um
      // Para esse SQL específico, vamos executar os principais componentes
      
      // 1. Criar enum
      console.log('1. Criando enum subscription_plan...');
      const { error: enumError } = await supabase.from('planos_config').select('id').limit(1);
      if (enumError?.code === '42P01') {
        // Tabela não existe, precisamos criar
        console.log('   Tabela não existe ainda, criando estrutura...');
      }

      // Vamos usar uma abordagem diferente - executar via SQL Editor seria o ideal
      // Mas podemos tentar criar a estrutura via operações do Supabase
      
      console.log('\n⚠️ A migration SQL precisa ser executada diretamente no SQL Editor do Supabase.');
      console.log('📋 Copie o conteúdo do arquivo:');
      console.log('   supabase/migrations/20260114_feature_flags.sql');
      console.log('🔗 E execute em: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql/new');
      console.log('\n📌 Ou vamos tentar criar a estrutura básica via API...\n');

      // Tentar verificar se já existe
      const { data: existingPlanos, error: checkError } = await supabase
        .from('planos_config')
        .select('*')
        .limit(1);

      if (checkError?.code === '42P01') {
        console.log('❌ Tabela planos_config não existe.');
        console.log('   Execute o SQL manualmente no Supabase Dashboard.\n');
      } else if (existingPlanos) {
        console.log('✅ Tabela planos_config já existe!');
        console.log('   Dados encontrados:', existingPlanos.length);
        
        // Verificar se organizations tem coluna plano
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('plano')
          .limit(1);
        
        if (orgError) {
          console.log('⚠️ Coluna "plano" não encontrada em organizations.');
          console.log('   Execute o SQL para adicionar a coluna.\n');
        } else {
          console.log('✅ Coluna "plano" já existe em organizations!');
          console.log('   Plano atual:', orgData?.[0]?.plano || 'não definido');
        }
      }
    } else {
      console.log('✅ SQL executado com sucesso!');
    }

    // Verificar resultado
    console.log('\n📊 Verificando estrutura...\n');
    
    const { data: planos, error: planosError } = await supabase
      .from('planos_config')
      .select('*')
      .order('preco_mensal');

    if (planosError) {
      console.log('❌ Erro ao verificar planos_config:', planosError.message);
      console.log('\n⚠️ Execute o SQL manualmente no Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql/new\n');
    } else {
      console.log('✅ Planos configurados:');
      planos?.forEach(p => {
        console.log(`   - ${p.nome_exibicao}: R$ ${p.preco_mensal}/mês (${p.usuarios_base} usuários)`);
      });
    }

    // Verificar organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, plano')
      .limit(5);

    if (orgsError) {
      console.log('\n❌ Erro ao verificar organizations:', orgsError.message);
    } else {
      console.log('\n📋 Organizações:');
      orgs?.forEach(o => {
        console.log(`   - ${o.name}: plano ${o.plano || 'não definido'}`);
      });
    }

    console.log('\n✨ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
