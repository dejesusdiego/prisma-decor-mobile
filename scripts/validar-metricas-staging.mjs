/**
 * Script para validar métricas de performance em staging
 * Compara com benchmarks e gera relatório
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Benchmarks de performance
const BENCHMARKS = {
  listaOrcamentos: { maxTime: 1000, maxSize: 500 * 1024 }, // 1s, 500KB
  metricasCentralizadas: { maxTime: 1500, maxSize: 1000 * 1024 }, // 1.5s, 1MB
  dashboardData: { maxTime: 1200, maxSize: 800 * 1024 }, // 1.2s, 800KB
  producaoData: { maxTime: 1500, maxSize: 1000 * 1024 }, // 1.5s, 1MB
  contasPagar: { maxTime: 1000, maxSize: 500 * 1024 }, // 1s, 500KB
};

const ORG_ID = process.env.TEST_ORG_ID || '11111111-1111-1111-1111-111111111111';

async function testQuery(name, queryFn, benchmark) {
  const start = performance.now();
  try {
    const result = await queryFn();
    const end = performance.now();
    const duration = end - start;
    const size = JSON.stringify(result).length;
    const count = Array.isArray(result) ? result.length : (result?.data?.length || 0);
    
    const passed = duration <= benchmark.maxTime && size <= benchmark.maxSize;
    
    return {
      name,
      passed,
      duration: Math.round(duration),
      size: Math.round(size / 1024), // KB
      count,
      benchmark: {
        maxTime: benchmark.maxTime,
        maxSize: Math.round(benchmark.maxSize / 1024), // KB
      },
      status: passed ? '✅ PASSOU' : '❌ FALHOU',
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error.message,
      status: '❌ ERRO',
    };
  }
}

async function runValidation() {
  console.log('🔍 Validando métricas de performance em staging...\n');
  console.log(`📊 Organização: ${ORG_ID}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  // Teste 1: ListaOrcamentos
  results.push(await testQuery(
    'ListaOrcamentos',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, cliente_telefone, endereco, cidade, status, total_geral, total_com_desconto, created_at, updated_at, validade_dias, custo_total, margem_percent')
        .eq('organization_id', ORG_ID)
        .order('created_at', { ascending: false })
        .limit(500);
      return data;
    },
    BENCHMARKS.listaOrcamentos
  ));

  // Teste 2: Métricas Centralizadas (simulado)
  results.push(await testQuery(
    'Métricas Centralizadas - Orcamentos',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('id, status, total_geral, total_com_desconto, custo_total, created_at, cliente_telefone')
        .eq('organization_id', ORG_ID);
      return data;
    },
    BENCHMARKS.metricasCentralizadas
  ));

  // Teste 3: Dashboard Data
  const dataInicio = new Date();
  dataInicio.setMonth(dataInicio.getMonth() - 1);
  
  results.push(await testQuery(
    'Dashboard Data - Período Atual',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('id, codigo, status, total_geral, total_com_desconto, custo_total, created_at, cliente_telefone')
        .eq('organization_id', ORG_ID)
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      return data;
    },
    BENCHMARKS.dashboardData
  ));

  // Teste 4: Produção Data
  results.push(await testQuery(
    'Produção Data - Pedidos',
    async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status_producao, created_at, data_entrada, orcamento_id')
        .eq('organization_id', ORG_ID)
        .order('data_entrada', { ascending: false })
        .limit(200);
      return data;
    },
    BENCHMARKS.producaoData
  ));

  // Teste 5: Contas Pagar
  results.push(await testQuery(
    'Contas Pagar',
    async () => {
      const { data } = await supabase
        .from('contas_pagar')
        .select('id, descricao, valor_total, valor_pago, data_vencimento, status, observacoes, orcamento_id, created_at')
        .eq('organization_id', ORG_ID)
        .order('data_vencimento', { ascending: true })
        .limit(500);
      return data;
    },
    BENCHMARKS.contasPagar
  ));

  // Exibir resultados
  console.log('📊 RESULTADOS DA VALIDAÇÃO\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passedCount = 0;
  let failedCount = 0;

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.status} ${result.name}`);
    
    if (result.error) {
      console.log(`   ❌ Erro: ${result.error}`);
      failedCount++;
    } else {
      console.log(`   ⏱️  Tempo: ${result.duration}ms (meta: ≤${result.benchmark.maxTime}ms)`);
      console.log(`   💾 Tamanho: ${result.size} KB (meta: ≤${result.benchmark.maxSize} KB)`);
      console.log(`   📦 Registros: ${result.count}`);
      
      if (result.passed) {
        passedCount++;
        const timeMargin = result.benchmark.maxTime - result.duration;
        const sizeMargin = result.benchmark.maxSize - result.size;
        console.log(`   ✅ Margem: ${timeMargin}ms tempo, ${sizeMargin} KB tamanho`);
      } else {
        failedCount++;
        if (result.duration > result.benchmark.maxTime) {
          console.log(`   ⚠️  Tempo acima do benchmark por ${result.duration - result.benchmark.maxTime}ms`);
        }
        if (result.size > result.benchmark.maxSize) {
          console.log(`   ⚠️  Tamanho acima do benchmark por ${result.size - result.benchmark.maxSize} KB`);
        }
      }
    }
    console.log('');
  });

  // Resumo
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📈 RESUMO\n');
  console.log(`✅ Passou: ${passedCount}/${results.length}`);
  console.log(`❌ Falhou: ${failedCount}/${results.length}`);
  console.log(`📊 Taxa de sucesso: ${((passedCount / results.length) * 100).toFixed(1)}%\n`);

  if (failedCount === 0) {
    console.log('🎉 Todas as métricas passaram nos benchmarks!');
    console.log('✅ Sistema pronto para produção.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Algumas métricas falharam nos benchmarks.');
    console.log('💡 Considere ajustar limites ou otimizar queries antes do deploy.\n');
    process.exit(1);
  }
}

runValidation().catch(console.error);
