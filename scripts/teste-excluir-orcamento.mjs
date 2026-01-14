/**
 * Script para testar exclusão de orçamento e identificar problemas
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Pegar um orçamento de teste (E2E)
const ORCAMENTO_TESTE = process.argv[2] || 'E2E-842721';

async function main() {
  console.log(`🔍 Testando exclusão do orçamento: ${ORCAMENTO_TESTE}\n`);

  try {
    // 1. Buscar orçamento
    const { data: orcamento, error: fetchError } = await supabase
      .from('orcamentos')
      .select('id, codigo, organization_id, status')
      .eq('codigo', ORCAMENTO_TESTE)
      .single();

    if (fetchError || !orcamento) {
      console.log('❌ Orçamento não encontrado:', fetchError?.message);
      return;
    }

    console.log('✅ Orçamento encontrado:');
    console.log(`   ID: ${orcamento.id}`);
    console.log(`   Código: ${orcamento.codigo}`);
    console.log(`   Organization: ${orcamento.organization_id}`);
    console.log(`   Status: ${orcamento.status}\n`);

    // 2. Verificar dependências
    console.log('📋 Verificando dependências...\n');

    // Contas a receber
    const { data: contasReceber, count: countCR } = await supabase
      .from('contas_receber')
      .select('id', { count: 'exact' })
      .eq('orcamento_id', orcamento.id);

    console.log(`   Contas a receber: ${countCR || 0}`);

    // Contas a pagar
    const { data: contasPagar, count: countCP } = await supabase
      .from('contas_pagar')
      .select('id', { count: 'exact' })
      .eq('orcamento_id', orcamento.id);

    console.log(`   Contas a pagar: ${countCP || 0}`);

    // Cortina items
    const { data: cortinas, count: countCortinas } = await supabase
      .from('cortina_items')
      .select('id', { count: 'exact' })
      .eq('orcamento_id', orcamento.id);

    console.log(`   Cortina items: ${countCortinas || 0}`);

    // Pedidos
    const { data: pedidos, count: countPedidos } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact' })
      .eq('orcamento_id', orcamento.id);

    console.log(`   Pedidos: ${countPedidos || 0}\n`);

    // 3. Tentar deletar (usando service_role para bypass RLS)
    console.log('🗑️ Tentando deletar orçamento...\n');

    // Deletar dependências primeiro
    if (contasReceber && contasReceber.length > 0) {
      const contaIds = contasReceber.map(c => c.id);
      
      // Parcelas
      const { error: parcelasError } = await supabase
        .from('parcelas_receber')
        .delete()
        .in('conta_receber_id', contaIds);
      
      if (parcelasError) {
        console.log('⚠️ Erro ao deletar parcelas:', parcelasError.message);
      } else {
        console.log('✅ Parcelas deletadas');
      }

      // Contas
      const { error: crError } = await supabase
        .from('contas_receber')
        .delete()
        .in('id', contaIds);
      
      if (crError) {
        console.log('❌ Erro ao deletar contas a receber:', crError.message);
      } else {
        console.log('✅ Contas a receber deletadas');
      }
    }

    // Contas a pagar
    if (contasPagar && contasPagar.length > 0) {
      const { error: cpError } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('orcamento_id', orcamento.id);
      
      if (cpError) {
        console.log('❌ Erro ao deletar contas a pagar:', cpError.message);
      } else {
        console.log('✅ Contas a pagar deletadas');
      }
    }

    // Cortina items
    if (cortinas && cortinas.length > 0) {
      const { error: cortinasError } = await supabase
        .from('cortina_items')
        .delete()
        .eq('orcamento_id', orcamento.id);
      
      if (cortinasError) {
        console.log('❌ Erro ao deletar cortina_items:', cortinasError.message);
      } else {
        console.log('✅ Cortina items deletados');
      }
    }

    // Orçamento
    const { error: orcError } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', orcamento.id);

    if (orcError) {
      console.log('\n❌ ERRO ao deletar orçamento:');
      console.log(`   Código: ${orcError.code}`);
      console.log(`   Mensagem: ${orcError.message}`);
      console.log(`   Detalhes: ${JSON.stringify(orcError, null, 2)}`);
    } else {
      console.log('\n✅ Orçamento deletado com sucesso!');
    }

  } catch (error) {
    console.error('\n❌ Erro geral:', error);
  }
}

main();
