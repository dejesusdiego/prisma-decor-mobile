/**
 * Script para criar pedidos baseado no histórico de produção
 * Extrai informações dos pedidos das descrições do histórico
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CSV_PATH = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS\\historico_producao-export-2026-01-14_23-06-59.csv';

function parseCSVLine(line, separator) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0], ';').map(h => h.replace(/"/g, '').trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], ';');
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      row[header] = value === '' ? null : value;
    });
    rows.push(row);
  }
  
  return rows;
}

async function criarPedidosDoHistorico() {
  console.log('📥 Analisando histórico de produção...\n');

  const rows = parseCSV(CSV_PATH);
  console.log(`📊 Total de registros no histórico: ${rows.length}\n`);

  // Extrair pedidos únicos e suas informações
  const pedidosInfo = new Map();

  for (const row of rows) {
    if (!row.pedido_id) continue;

    if (!pedidosInfo.has(row.pedido_id)) {
      pedidosInfo.set(row.pedido_id, {
        pedido_id: row.pedido_id,
        usuario_id: row.usuario_id,
        usuario_nome: row.usuario_nome,
        primeira_data: row.data_evento,
        descricoes: [],
      });
    }

    const info = pedidosInfo.get(row.pedido_id);
    if (row.descricao && row.descricao.includes('ORC-')) {
      info.descricoes.push(row.descricao);
    }
    if (row.data_evento && (!info.primeira_data || row.data_evento < info.primeira_data)) {
      info.primeira_data = row.data_evento;
    }
  }

  console.log(`🔍 Encontrados ${pedidosInfo.size} pedidos únicos no histórico\n`);

  // Extrair códigos de orçamento das descrições
  const pedidosComOrcamento = [];
  for (const [pedidoId, info] of pedidosInfo) {
    // Procurar código de orçamento nas descrições
    let orcamentoCodigo = null;
    for (const desc of info.descricoes) {
      const match = desc.match(/ORC-(\d{4}-\d+)/);
      if (match) {
        orcamentoCodigo = match[0];
        break;
      }
    }

    if (orcamentoCodigo) {
      pedidosComOrcamento.push({
        pedido_id: pedidoId,
        orcamento_codigo: orcamentoCodigo,
        usuario_id: info.usuario_id,
        usuario_nome: info.usuario_nome,
        primeira_data: info.primeira_data,
      });
    }
  }

  console.log(`📋 ${pedidosComOrcamento.length} pedidos com código de orçamento identificado\n`);

  // Buscar orçamentos no banco
  const orcamentoCodigos = [...new Set(pedidosComOrcamento.map(p => p.orcamento_codigo))];
  const { data: orcamentos } = await supabase
    .from('orcamentos')
    .select('id, codigo, status, cliente_nome, total_com_desconto, total_geral, created_by_user_id, organization_id')
    .in('codigo', orcamentoCodigos);

  const orcamentosMap = new Map(orcamentos?.map(o => [o.codigo, o]) || []);

  console.log(`✅ ${orcamentosMap.size} orçamentos encontrados no banco\n`);

  // Criar pedidos
  let criados = 0;
  let erros = 0;
  let jaExistem = 0;

  for (const pedidoInfo of pedidosComOrcamento) {
    const orcamento = orcamentosMap.get(pedidoInfo.orcamento_codigo);
    if (!orcamento) {
      console.log(`⚠️  Orçamento ${pedidoInfo.orcamento_codigo} não encontrado para pedido ${pedidoInfo.pedido_id}`);
      continue;
    }

    // Verificar se pedido já existe
    const { data: pedidoExistente } = await supabase
      .from('pedidos')
      .select('id')
      .eq('id', pedidoInfo.pedido_id)
      .single();

    if (pedidoExistente) {
      jaExistem++;
      continue;
    }

    try {
      // Gerar número do pedido baseado na data
      const dataPedido = new Date(pedidoInfo.primeira_data);
      const ano = dataPedido.getFullYear();
      
      // Buscar último número do ano
      const { data: ultimoPedido } = await supabase
        .from('pedidos')
        .select('numero_pedido')
        .like('numero_pedido', `PED-${ano}-%`)
        .order('numero_pedido', { ascending: false })
        .limit(1);
      
      let sequencia = 1;
      if (ultimoPedido && ultimoPedido.length > 0) {
        const match = ultimoPedido[0].numero_pedido.match(/PED-\d{4}-(\d+)/);
        if (match) {
          sequencia = parseInt(match[1]) + 1;
        }
      }
      
      const numeroPedido = `PED-${ano}-${sequencia.toString().padStart(4, '0')}`;

      // Determinar prioridade
      let prioridade = 'normal';
      if (orcamento.status === 'pago') {
        prioridade = 'alta';
      }

      // Calcular previsão
      const previsaoEntrega = new Date(dataPedido);
      previsaoEntrega.setDate(previsaoEntrega.getDate() + 15);

      // Criar pedido com ID específico
      const { error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          id: pedidoInfo.pedido_id, // Usar o ID do CSV
          orcamento_id: orcamento.id,
          numero_pedido: numeroPedido,
          status_producao: 'aguardando_materiais',
          prioridade: prioridade,
          previsao_entrega: previsaoEntrega.toISOString().split('T')[0],
          data_prevista: previsaoEntrega.toISOString(),
          observacoes_producao: `Pedido importado do histórico. Orçamento: ${orcamento.codigo}`,
          observacoes: `Pedido importado do histórico`,
          created_by_user_id: pedidoInfo.usuario_id || orcamento.created_by_user_id,
          organization_id: orcamento.organization_id,
          data_entrada: pedidoInfo.primeira_data,
        });

      if (errorPedido) {
        console.error(`❌ Erro ao criar pedido ${pedidoInfo.pedido_id}:`, errorPedido.message);
        erros++;
        continue;
      }

      // Criar itens do pedido
      const { data: cortinas } = await supabase
        .from('cortina_items')
        .select('id')
        .eq('orcamento_id', orcamento.id);

      if (cortinas && cortinas.length > 0) {
        const itensPedido = cortinas.map(cortina => ({
          pedido_id: pedidoInfo.pedido_id,
          cortina_item_id: cortina.id,
          status_item: 'fila',
        }));

        await supabase
          .from('itens_pedido')
          .insert(itensPedido);
      }

      criados++;
      console.log(`✅ Pedido ${numeroPedido} (${pedidoInfo.pedido_id}) criado para orçamento ${orcamento.codigo}`);
    } catch (error) {
      console.error(`❌ Erro ao processar pedido ${pedidoInfo.pedido_id}:`, error.message);
      erros++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`✅ Pedidos criados: ${criados}`);
  console.log(`⚠️  Já existiam: ${jaExistem}`);
  console.log(`❌ Erros: ${erros}`);
  console.log('='.repeat(60));

  if (criados > 0) {
    console.log('\n✨ Agora você pode importar o histórico de produção!');
    console.log('   Execute: node scripts/importar-historico-producao.mjs');
  }
}

criarPedidosDoHistorico().catch(console.error);
