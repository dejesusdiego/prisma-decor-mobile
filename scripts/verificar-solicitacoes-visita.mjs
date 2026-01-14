import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tjwpqrlfhngibuwqodcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI'
);

async function main() {
  console.log('Verificando tabela solicitacoes_visita...\n');

  const { data, error, count } = await supabase
    .from('solicitacoes_visita')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.log('Erro:', error.message);
    console.log('Codigo:', error.code);
  } else {
    console.log('Tabela solicitacoes_visita existe');
    console.log('Total de registros:', count || 0);
    if (data && data.length > 0) {
      console.log('\nExemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('\nNenhum registro encontrado na tabela.');
    }
  }
}

main();
