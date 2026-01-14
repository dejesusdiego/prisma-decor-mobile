/**
 * Script de Verificação de Cálculos de Margem e Custos
 * Valida se os cálculos financeiros estão corretos
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ORG_PRISMA = '11111111-1111-1111-1111-111111111111';

// Função para formatar moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

// Função para formatar percentual
const formatPercent = (value) => {
  return `${(value || 0).toFixed(2)}%`;
};

async function verificarCalculosOrcamento() {
  console.log('📊 === VERIFICAÇÃO DE CÁLCULOS DE ORÇAMENTOS ===\n');
  
  // Buscar orçamentos com dados completos
  const { data: orcamentos, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('organization_id', ORG_PRISMA)
    .not('total_geral', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Erro ao buscar orçamentos:', error.message);
    return;
  }
  
  console.log(`Analisando ${orcamentos?.length || 0} orçamentos...\n`);
  
  let totalProblemas = 0;
  
  for (const orc of orcamentos || []) {
    console.log(`\n📝 ${orc.codigo} - ${orc.cliente_nome}`);
    console.log(`   Status: ${orc.status}`);
    
    // Dados do orçamento
    const totalGeral = Number(orc.total_geral) || 0;
    const totalComDesconto = Number(orc.total_com_desconto) || totalGeral;
    const custoTotal = Number(orc.custo_total) || 0;
    const margemPercent = Number(orc.margem_percent) || 0;
    const subtotalMateriais = Number(orc.subtotal_materiais) || 0;
    const subtotalCostura = Number(orc.subtotal_mao_obra_costura) || 0;
    const subtotalInstalacao = Number(orc.subtotal_instalacao) || 0;
    
    console.log(`\n   📈 Valores:`);
    console.log(`      Total Geral: ${formatCurrency(totalGeral)}`);
    console.log(`      Total c/ Desconto: ${formatCurrency(totalComDesconto)}`);
    console.log(`      Custo Total: ${formatCurrency(custoTotal)}`);
    console.log(`      Margem Configurada: ${formatPercent(margemPercent)}`);
    
    // Verificação 1: Soma dos custos
    const somaCustos = subtotalMateriais + subtotalCostura + subtotalInstalacao;
    console.log(`\n   🔍 Verificação de Custos:`);
    console.log(`      Materiais: ${formatCurrency(subtotalMateriais)}`);
    console.log(`      Costura: ${formatCurrency(subtotalCostura)}`);
    console.log(`      Instalação: ${formatCurrency(subtotalInstalacao)}`);
    console.log(`      Soma: ${formatCurrency(somaCustos)}`);
    console.log(`      Custo Total Registrado: ${formatCurrency(custoTotal)}`);
    
    if (Math.abs(somaCustos - custoTotal) > 0.01 && custoTotal > 0) {
      console.log(`      ⚠️ DIFERENÇA: ${formatCurrency(Math.abs(somaCustos - custoTotal))}`);
      totalProblemas++;
    } else {
      console.log(`      ✅ Custos OK`);
    }
    
    // Verificação 2: Cálculo da margem
    // Fórmula: preco_venda = custo / (1 - margem/100)
    // Ou: margem = (preco_venda - custo) / preco_venda * 100
    if (custoTotal > 0 && totalGeral > 0) {
      const margemCalculada = ((totalGeral - custoTotal) / totalGeral) * 100;
      const margemMarkup = ((totalGeral / custoTotal) - 1) * 100;
      
      console.log(`\n   💰 Verificação de Margem:`);
      console.log(`      Margem s/ Total (bruta): ${formatPercent(margemCalculada)}`);
      console.log(`      Markup s/ Custo: ${formatPercent(margemMarkup)}`);
      console.log(`      Margem Configurada: ${formatPercent(margemPercent)}`);
      
      // Verificar se a margem bate com o markup esperado
      // Markup de 61.5% significa: preço = custo * 1.615
      // Margem sobre venda seria: (1.615*custo - custo) / (1.615*custo) = 0.615/1.615 = 38.1%
      const precoEsperado = custoTotal * (1 + margemPercent / 100);
      const diferencaPreco = Math.abs(precoEsperado - totalGeral);
      
      console.log(`\n      Preço esperado (custo × ${(1 + margemPercent/100).toFixed(3)}): ${formatCurrency(precoEsperado)}`);
      console.log(`      Preço registrado: ${formatCurrency(totalGeral)}`);
      
      if (diferencaPreco > 1 && totalGeral > 0) {
        console.log(`      ⚠️ DIFERENÇA: ${formatCurrency(diferencaPreco)}`);
        totalProblemas++;
      } else {
        console.log(`      ✅ Margem aplicada corretamente`);
      }
    }
    
    console.log('   ' + '-'.repeat(50));
  }
  
  console.log(`\n📊 Resumo: ${totalProblemas} problema(s) encontrado(s) em ${orcamentos?.length || 0} orçamentos`);
  
  return totalProblemas;
}

async function verificarContasReceber() {
  console.log('\n\n💰 === VERIFICAÇÃO DE CONTAS A RECEBER ===\n');
  
  // Buscar contas a receber com orçamentos vinculados
  const { data: contas, error } = await supabase
    .from('contas_receber')
    .select(`
      *,
      orcamento:orcamentos(id, codigo, total_geral, total_com_desconto)
    `)
    .eq('organization_id', ORG_PRISMA)
    .limit(10);
  
  if (error) {
    console.error('❌ Erro ao buscar contas:', error.message);
    return;
  }
  
  console.log(`Analisando ${contas?.length || 0} contas a receber...\n`);
  
  let totalProblemas = 0;
  
  for (const conta of contas || []) {
    const orc = conta.orcamento;
    
    console.log(`\n💳 Conta ${conta.id.substring(0, 8)}...`);
    console.log(`   Cliente: ${conta.cliente_nome}`);
    console.log(`   Orçamento: ${orc?.codigo || 'N/A'}`);
    
    const valorTotal = Number(conta.valor_total) || 0;
    const valorPago = Number(conta.valor_pago) || 0;
    const valorOrcamento = orc ? (Number(orc.total_com_desconto) || Number(orc.total_geral)) : 0;
    
    console.log(`\n   Valores:`);
    console.log(`      Valor da Conta: ${formatCurrency(valorTotal)}`);
    console.log(`      Valor do Orçamento: ${formatCurrency(valorOrcamento)}`);
    console.log(`      Valor Pago: ${formatCurrency(valorPago)}`);
    console.log(`      Pendente: ${formatCurrency(valorTotal - valorPago)}`);
    
    // Verificar se valor da conta bate com orçamento
    if (orc && Math.abs(valorTotal - valorOrcamento) > 0.01) {
      console.log(`      ⚠️ Valor da conta difere do orçamento!`);
      totalProblemas++;
    } else if (orc) {
      console.log(`      ✅ Valor OK`);
    }
    
    // Verificar parcelas
    const { data: parcelas } = await supabase
      .from('parcelas_receber')
      .select('*')
      .eq('conta_receber_id', conta.id);
    
    if (parcelas?.length) {
      const somaParcelas = parcelas.reduce((acc, p) => acc + Number(p.valor), 0);
      const somaRecebido = parcelas.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor), 0);
      
      console.log(`\n   Parcelas (${parcelas.length}):`);
      console.log(`      Soma das parcelas: ${formatCurrency(somaParcelas)}`);
      console.log(`      Total recebido: ${formatCurrency(somaRecebido)}`);
      
      if (Math.abs(somaParcelas - valorTotal) > 0.01) {
        console.log(`      ⚠️ Soma das parcelas não bate com valor total!`);
        totalProblemas++;
      } else {
        console.log(`      ✅ Parcelas OK`);
      }
    }
  }
  
  console.log(`\n📊 Resumo: ${totalProblemas} problema(s) em contas a receber`);
  
  return totalProblemas;
}

async function verificarMargemReal() {
  console.log('\n\n📈 === VERIFICAÇÃO DE MARGEM REAL ===\n');
  
  // Buscar orçamentos com pagamentos
  const { data: orcamentos, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('organization_id', ORG_PRISMA)
    .in('status', ['pago', 'pago_40', 'pago_parcial', 'finalizado'])
    .limit(5);
  
  if (error || !orcamentos?.length) {
    console.log('⚠️ Nenhum orçamento com pagamento encontrado');
    return 0;
  }
  
  console.log(`Analisando ${orcamentos.length} orçamentos com pagamento...\n`);
  
  for (const orc of orcamentos) {
    // Buscar conta a receber
    const { data: contaReceber } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('orcamento_id', orc.id)
      .maybeSingle();
    
    // Buscar contas a pagar
    const { data: contasPagar } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('orcamento_id', orc.id);
    
    const valorOrcamento = Number(orc.total_com_desconto) || Number(orc.total_geral) || 0;
    const custoOrcado = Number(orc.custo_total) || 0;
    const valorRecebido = contaReceber ? Number(contaReceber.valor_pago) : 0;
    const custoReal = contasPagar?.reduce((acc, cp) => acc + Number(cp.valor), 0) || custoOrcado;
    
    const margemProjetada = Number(orc.margem_percent) || 0;
    const margemReal = valorRecebido > 0 ? ((valorRecebido - custoReal) / valorRecebido) * 100 : 0;
    
    console.log(`📝 ${orc.codigo} - ${orc.cliente_nome}`);
    console.log(`   Orçado: ${formatCurrency(valorOrcamento)} | Recebido: ${formatCurrency(valorRecebido)}`);
    console.log(`   Custo Orçado: ${formatCurrency(custoOrcado)} | Custo Real: ${formatCurrency(custoReal)}`);
    console.log(`   Margem Projetada: ${formatPercent(margemProjetada)} | Margem Real: ${formatPercent(margemReal)}`);
    console.log(`   Diferença: ${formatPercent(margemReal - margemProjetada)}`);
    console.log('');
  }
  
  return 0;
}

async function main() {
  console.log('🔍 VERIFICAÇÃO DE CÁLCULOS DO SISTEMA\n');
  console.log('='.repeat(60));
  
  try {
    const problemasOrcamento = await verificarCalculosOrcamento();
    const problemasContas = await verificarContasReceber();
    await verificarMargemReal();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMO FINAL:');
    console.log(`   Problemas em Orçamentos: ${problemasOrcamento || 0}`);
    console.log(`   Problemas em Contas: ${problemasContas || 0}`);
    
    const totalProblemas = (problemasOrcamento || 0) + (problemasContas || 0);
    
    if (totalProblemas === 0) {
      console.log('\n✅ Todos os cálculos estão corretos!');
    } else {
      console.log(`\n⚠️ ${totalProblemas} problema(s) encontrado(s) que precisam de atenção`);
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error);
  }
}

main();
