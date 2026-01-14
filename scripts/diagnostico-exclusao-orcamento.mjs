import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnosticarOrcamento(orcamentoId) {
  console.log(`\n🔍 Diagnosticando orçamento: ${orcamentoId}\n`);

  try {
    // 1. Buscar informações do orçamento
    const { data: orcamento, error: orcError } = await supabase
      .from('orcamentos')
      .select('id, codigo, cliente_nome, status, organization_id, created_by_user_id')
      .eq('id', orcamentoId)
      .single();

    if (orcError || !orcamento) {
      console.error('❌ Orçamento não encontrado:', orcError);
      return;
    }

    console.log('📋 Orçamento encontrado:');
    console.log(`   Código: ${orcamento.codigo}`);
    console.log(`   Cliente: ${orcamento.cliente_nome}`);
    console.log(`   Status: ${orcamento.status}`);
    console.log(`   Organization ID: ${orcamento.organization_id}`);
    console.log(`   Created by: ${orcamento.created_by_user_id}`);

    // 2. Verificar dependências
    console.log('\n📊 Verificando dependências...\n');

    // Cortina items
    const { count: cortinaItemsCount } = await supabase
      .from('cortina_items')
      .select('*', { count: 'exact', head: true })
      .eq('orcamento_id', orcamentoId);

    console.log(`   cortina_items: ${cortinaItemsCount || 0}`);

    // Contas a receber
    const { data: contasReceber, count: contasReceberCount } = await supabase
      .from('contas_receber')
      .select('id', { count: 'exact' })
      .eq('orcamento_id', orcamentoId);

    console.log(`   contas_receber: ${contasReceberCount || 0}`);

    // Parcelas receber
    if (contasReceber && contasReceber.length > 0) {
      const contaIds = contasReceber.map(c => c.id);
      const { count: parcelasCount } = await supabase
        .from('parcelas_receber')
        .select('*', { count: 'exact', head: true })
        .in('conta_receber_id', contaIds);

      console.log(`   parcelas_receber: ${parcelasCount || 0}`);
    } else {
      console.log(`   parcelas_receber: 0`);
    }

    // Contas a pagar
    const { count: contasPagarCount } = await supabase
      .from('contas_pagar')
      .select('*', { count: 'exact', head: true })
      .eq('orcamento_id', orcamentoId);

    console.log(`   contas_pagar: ${contasPagarCount || 0}`);

    // Oportunidades
    const { count: oportunidadesCount } = await supabase
      .from('oportunidades')
      .select('*', { count: 'exact', head: true })
      .eq('orcamento_id', orcamentoId);

    console.log(`   oportunidades: ${oportunidadesCount || 0}`);

    // Histórico descontos
    const { count: historicoCount } = await supabase
      .from('historico_descontos')
      .select('*', { count: 'exact', head: true })
      .eq('orcamento_id', orcamentoId);

    console.log(`   historico_descontos: ${historicoCount || 0}`);

    // Pedidos
    const { count: pedidosCount } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('orcamento_id', orcamentoId);

    console.log(`   pedidos: ${pedidosCount || 0}`);

    // Atividades CRM
    const { count: atividadesCount } = await supabase
      .from('atividades_crm')
      .select('*', { count: 'exact', head: true })
      .eq('orcamento_id', orcamentoId);

    console.log(`   atividades_crm: ${atividadesCount || 0}`);

    // 3. Verificar constraints
    console.log('\n🔗 Verificando constraints...\n');

    // Verificar se há outras tabelas que referenciam orcamentos
    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'orcamentos'
          AND ccu.column_name = 'id'
        ORDER BY tc.table_name;
      `
    });

    if (!constraintsError && constraints) {
      console.log('   Constraints encontradas:');
      constraints.forEach(c => {
        console.log(`   - ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name} (${c.delete_rule})`);
      });
    }

    // 4. Tentar deletar (simulação)
    console.log('\n🧪 Testando exclusão...\n');

    // Primeiro, verificar se podemos deletar as dependências manualmente
    console.log('   Tentando deletar dependências manualmente...');

    // Deletar atividades_crm primeiro (se houver)
    if (atividadesCount > 0) {
      const { error: atividadesError } = await supabase
        .from('atividades_crm')
        .delete()
        .eq('orcamento_id', orcamentoId);

      if (atividadesError) {
        console.log(`   ⚠️  Erro ao deletar atividades_crm: ${atividadesError.message}`);
      } else {
        console.log(`   ✅ atividades_crm deletadas`);
      }
    }

    // Tentar deletar o orçamento
    const { error: deleteError } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', orcamentoId);

    if (deleteError) {
      console.log(`   ❌ Erro ao deletar orçamento: ${deleteError.message}`);
      console.log(`   Código: ${deleteError.code}`);
      console.log(`   Detalhes: ${deleteError.details}`);
      console.log(`   Hint: ${deleteError.hint}`);
    } else {
      console.log(`   ✅ Orçamento deletado com sucesso!`);
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

// Pegar o ID do orçamento da linha de comando
const orcamentoId = process.argv[2];

if (!orcamentoId) {
  console.log('❌ Por favor, forneça o ID do orçamento como argumento.');
  console.log('   Uso: node scripts/diagnostico-exclusao-orcamento.mjs <orcamento_id>');
  process.exit(1);
}

diagnosticarOrcamento(orcamentoId);
