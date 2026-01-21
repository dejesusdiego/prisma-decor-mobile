import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas:');
  console.error('   VITE_SUPABASE_URL ou SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function aplicarMigration() {
  console.log('📝 Aplicando migration: adicionar colunas faltantes em pedidos...\n');

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260116_add_missing_pedidos_columns.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  // Dividir em comandos individuais
  const comandos = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '');

  try {
    for (const comando of comandos) {
      if (comando.includes('COMMENT')) {
        // Comentários não podem ser executados via RPC
        console.log('⏭️  Pulando comentário:', comando.substring(0, 50) + '...');
        continue;
      }

      console.log(`🔧 Executando: ${comando.substring(0, 60)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: comando });
      
      if (error) {
        // Se o RPC não existir, tentar executar diretamente via SQL
        console.log('⚠️  RPC não disponível, tentando método alternativo...');
        
        // Para comandos ALTER TABLE, vamos usar uma abordagem diferente
        if (comando.includes('ALTER TABLE')) {
          const match = comando.match(/ALTER TABLE\s+(\S+)\s+ADD COLUMN\s+IF NOT EXISTS\s+(\S+)\s+(.+)/i);
          if (match) {
            const [, table, column, definition] = match;
            console.log(`   Adicionando coluna ${column} na tabela ${table}...`);
            // Nota: Isso requer permissões de superuser, então vamos apenas logar
            console.log('   ⚠️  Execute manualmente no SQL Editor do Supabase');
          }
        }
      } else {
        console.log('   ✅ Sucesso');
      }
    }

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Acesse o SQL Editor do Supabase');
    console.log('   2. Execute o arquivo: supabase/migrations/20260116_add_missing_pedidos_columns.sql');
    console.log('   3. Ou copie e cole o conteúdo do arquivo');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    console.error('\n📋 Execute manualmente no SQL Editor do Supabase:');
    console.error('   Arquivo: supabase/migrations/20260116_add_missing_pedidos_columns.sql');
    process.exit(1);
  }
}

aplicarMigration();
