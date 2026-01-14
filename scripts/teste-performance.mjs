/**
 * Script para testar performance de queries
 * Compara tempo de execução antes e depois das otimizações
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
  console.error('Certifique-se de que .env.local existe com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ID de organização para teste (ajustar conforme necessário)
const ORG_ID = process.env.TEST_ORG_ID || '11111111-1111-1111-1111-111111111111';

async function testQuery(name, queryFn) {
  const start = performance.now();
  try {
    const result = await queryFn();
    const end = performance.now();
    const duration = end - start;
    const count = Array.isArray(result) ? result.length : (result?.data?.length || 0);
    
    return {
      name,
      success: true,
      duration: Math.round(duration),
      count,
      size: JSON.stringify(result).length
    };
  } catch (error) {
    const end = performance.now();
    return {
      name,
      success: false,
      duration: Math.round(end - start),
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de performance...\n');
  console.log(`📊 Organização: ${ORG_ID}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const tests = [];

  // Teste 1: ListaOrcamentos - Query otimizada
  tests.push(await testQuery(
    'ListaOrcamentos (Otimizada)',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, cliente_telefone, endereco, cidade, status, total_geral, total_com_desconto, created_at, updated_at, validade_dias, custo_total, margem_percent')
        .eq('organization_id', ORG_ID)
        .order('created_at', { ascending: false })
        .limit(500);
      return data;
    }
  ));

  // Teste 2: ListaOrcamentos - Query antiga (para comparação)
  tests.push(await testQuery(
    'ListaOrcamentos (Antiga - select *)',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('organization_id', ORG_ID)
        .order('created_at', { ascending: false })
        .limit(500);
      return data;
    }
  ));

  // Teste 3: useMetricasCentralizadas - Orcamentos otimizado
  tests.push(await testQuery(
    'Métricas - Orcamentos (Otimizado)',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('id, status, total_geral, total_com_desconto, custo_total, created_at, cliente_telefone')
        .eq('organization_id', ORG_ID);
      return data;
    }
  ));

  // Teste 4: useMetricasCentralizadas - Orcamentos antigo
  tests.push(await testQuery(
    'Métricas - Orcamentos (Antigo - select *)',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('organization_id', ORG_ID);
      return data;
    }
  ));

  // Teste 5: useDashboardData - Período atual otimizado
  const dataInicio = new Date();
  dataInicio.setMonth(dataInicio.getMonth() - 1);
  
  tests.push(await testQuery(
    'Dashboard - Período Atual (Otimizado)',
    async () => {
      const { data } = await supabase
        .from('orcamentos')
        .select('id, codigo, status, total_geral, total_com_desconto, custo_total, created_at, cliente_telefone')
        .eq('organization_id', ORG_ID)
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      return data;
    }
  ));

  // Teste 6: useProducaoData - Pedidos otimizado
  tests.push(await testQuery(
    'Produção - Pedidos (Otimizado)',
    async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status_producao, created_at, data_entrada, orcamento_id')
        .eq('organization_id', ORG_ID)
        .order('data_entrada', { ascending: false })
        .limit(100);
      return data;
    }
  ));

  // Teste 7: useProducaoData - Pedidos completo (para comparação)
  tests.push(await testQuery(
    'Produção - Pedidos (Completo com joins)',
    async () => {
      const { data } = await supabase
        .from('pedidos')
        .select(`
          *,
          orcamento:orcamentos (
            codigo,
            cliente_nome,
            cliente_telefone,
            endereco,
            cidade,
            total_com_desconto,
            total_geral
          ),
          itens_pedido (
            *,
            cortina_item:cortina_items (
              nome_identificacao,
              tipo_cortina,
              tipo_produto,
              largura,
              altura,
              quantidade,
              ambiente,
              preco_venda,
              motorizada
            )
          ),
          instalacoes (*)
        `)
        .eq('organization_id', ORG_ID)
        .order('data_entrada', { ascending: false })
        .limit(100);
      return data;
    }
  ));

  // Exibir resultados
  console.log('📊 RESULTADOS DOS TESTES\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  tests.forEach((test, index) => {
    if (test.success) {
      const sizeKB = (test.size / 1024).toFixed(2);
      console.log(`${index + 1}. ✅ ${test.name}`);
      console.log(`   ⏱️  Tempo: ${test.duration}ms`);
      console.log(`   📦 Registros: ${test.count}`);
      console.log(`   💾 Tamanho: ${sizeKB} KB`);
    } else {
      console.log(`${index + 1}. ❌ ${test.name}`);
      console.log(`   ⏱️  Tempo: ${test.duration}ms`);
      console.log(`   ❌ Erro: ${test.error}`);
    }
    console.log('');
  });

  // Comparações
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📈 COMPARAÇÕES\n');

  // Comparação 1: ListaOrcamentos
  const listaOtimizada = tests[0];
  const listaAntiga = tests[1];
  if (listaOtimizada.success && listaAntiga.success) {
    const melhoria = ((listaAntiga.duration - listaOtimizada.duration) / listaAntiga.duration * 100).toFixed(1);
    const reducaoTamanho = ((listaAntiga.size - listaOtimizada.size) / listaAntiga.size * 100).toFixed(1);
    console.log('📋 ListaOrcamentos:');
    console.log(`   ⚡ Melhoria de tempo: ${melhoria}%`);
    console.log(`   💾 Redução de tamanho: ${reducaoTamanho}%`);
    console.log('');
  }

  // Comparação 2: Métricas
  const metricasOtimizada = tests[2];
  const metricasAntiga = tests[3];
  if (metricasOtimizada.success && metricasAntiga.success) {
    const melhoria = ((metricasAntiga.duration - metricasOtimizada.duration) / metricasAntiga.duration * 100).toFixed(1);
    const reducaoTamanho = ((metricasAntiga.size - metricasOtimizada.size) / metricasAntiga.size * 100).toFixed(1);
    console.log('📊 Métricas Centralizadas:');
    console.log(`   ⚡ Melhoria de tempo: ${melhoria}%`);
    console.log(`   💾 Redução de tamanho: ${reducaoTamanho}%`);
    console.log('');
  }

  // Comparação 3: Produção
  const producaoOtimizada = tests[5];
  const producaoCompleta = tests[6];
  if (producaoOtimizada.success && producaoCompleta.success) {
    const melhoria = ((producaoCompleta.duration - producaoOtimizada.duration) / producaoCompleta.duration * 100).toFixed(1);
    const reducaoTamanho = ((producaoCompleta.size - producaoOtimizada.size) / producaoCompleta.size * 100).toFixed(1);
    console.log('🏭 Produção - Pedidos:');
    console.log(`   ⚡ Melhoria de tempo: ${melhoria}%`);
    console.log(`   💾 Redução de tamanho: ${reducaoTamanho}%`);
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Testes concluídos!\n');
}

runTests().catch(console.error);
