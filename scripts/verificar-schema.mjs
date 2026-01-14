/**
 * Verificar schema das tabelas
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verificarTabela(nome) {
  console.log(`\n📋 Tabela: ${nome}`);
  
  // Buscar um registro para ver as colunas
  const { data, error } = await supabase
    .from(nome)
    .select('*')
    .limit(1);
  
  if (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return;
  }
  
  if (data && data.length > 0) {
    const colunas = Object.keys(data[0]);
    console.log(`   ✅ Colunas (${colunas.length}):`, colunas.join(', '));
  } else {
    console.log('   ⚠️ Tabela vazia');
  }
}

async function main() {
  console.log('🔍 Verificando schema das tabelas...\n');
  console.log('='.repeat(60));
  
  const tabelas = [
    'contatos',
    'atividades_crm',
    'pedidos',
    'instalacoes',
    'itens_pedido',
    'historico_producao',
    'materiais_pedido'
  ];
  
  for (const tabela of tabelas) {
    await verificarTabela(tabela);
  }
  
  console.log('\n' + '='.repeat(60));
}

main();
