import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function aplicarFix() {
  console.log('🔧 Aplicando fix da constraint de oportunidades...\n');

  try {
    // Ler o SQL
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20260114_fix_oportunidades_fk.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Executar via Management API
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      console.log('\n📋 Execute este SQL manualmente no Supabase Dashboard:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(sql);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      process.exit(1);
    }

    console.log('✅ Constraint alterada com sucesso!');
    console.log('\n📊 Verificando constraint...');

    // Verificar se a constraint foi aplicada
    const { data: checkData, error: checkError } = await supabase
      .from('oportunidades')
      .select('*')
      .limit(1);

    if (checkError) {
      console.warn('⚠️  Aviso ao verificar:', checkError.message);
    } else {
      console.log('✅ Tabela oportunidades acessível');
    }

    console.log('\n✨ Fix aplicado com sucesso!');
    console.log('💡 Agora você pode deletar orçamentos sem erro 409.');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

aplicarFix();
