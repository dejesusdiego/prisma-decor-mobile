/**
 * Script para importar histórico de produção do CSV
 * Arquivo: historico_producao-export-2026-01-14_23-06-59.csv
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CSV_PATH = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS';

function findCSVFile(baseName) {
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`⚠️ Pasta não encontrada: ${CSV_PATH}`);
    return null;
  }
  const files = fs.readdirSync(CSV_PATH);
  const found = files.find(f => f.toLowerCase().includes(baseName.toLowerCase()) && f.endsWith('.csv'));
  return found ? path.join(CSV_PATH, found) : null;
}

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
  
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  
  const headers = parseCSVLine(firstLine, separator).map(h => h.replace(/"/g, '').trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], separator);
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      if (value === '' || value === 'null' || value === 'NULL' || value === undefined) {
        value = null;
      }
      
      row[header] = value;
    });
    
    rows.push(row);
  }
  
  return rows;
}

async function main() {
  console.log('📥 Importando Histórico de Produção...\n');

  // Procurar arquivo CSV
  let csvFile = findCSVFile('historico_producao') || findCSVFile('historico-producao');
  
  if (!csvFile) {
    // Tentar caminho específico fornecido pelo usuário
    const specificPath = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS\\historico_producao-export-2026-01-14_23-06-59.csv';
    if (fs.existsSync(specificPath)) {
      csvFile = specificPath;
    } else {
      console.log('❌ Arquivo CSV de histórico de produção não encontrado!');
      console.log(`   Procurando em: ${CSV_PATH}`);
      console.log('   Nomes esperados: historico_producao, historico-producao');
      return;
    }
  }

  console.log(`✅ Arquivo encontrado: ${path.basename(csvFile)}\n`);

  // Parse CSV
  const rows = parseCSV(csvFile);
  console.log(`📊 Total de linhas no CSV: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log('⚠️ Nenhuma linha encontrada no CSV');
    return;
  }

  // Mapear colunas do CSV para o schema do banco
  const mappedRows = rows.map((row, index) => {
    const mapped = {
      id: row.id || null,
      pedido_id: row.pedido_id || null,
      item_pedido_id: row.item_pedido_id || null,
      tipo_evento: row.tipo_evento || null,
      status_anterior: row.status_anterior || null,
      status_novo: row.status_novo || null,
      descricao: row.descricao || null,
      data_evento: row.data_evento || new Date().toISOString(),
      usuario_id: row.usuario_id || null,
      usuario_nome: row.usuario_nome || null,
    };

    // Validar campos obrigatórios
    if (!mapped.pedido_id) {
      console.warn(`⚠️ Linha ${index + 1} ignorada: pedido_id faltando`);
      return null;
    }
    if (!mapped.tipo_evento) {
      console.warn(`⚠️ Linha ${index + 1} ignorada: tipo_evento faltando`);
      return null;
    }
    if (!mapped.descricao) {
      console.warn(`⚠️ Linha ${index + 1} ignorada: descricao faltando`);
      return null;
    }
    if (!mapped.usuario_id) {
      console.warn(`⚠️ Linha ${index + 1} ignorada: usuario_id faltando`);
      return null;
    }
    if (!mapped.usuario_nome) {
      console.warn(`⚠️ Linha ${index + 1} ignorada: usuario_nome faltando`);
      return null;
    }

    // Converter data_evento se necessário
    if (mapped.data_evento) {
      try {
        const date = new Date(mapped.data_evento);
        if (isNaN(date.getTime())) {
          mapped.data_evento = new Date().toISOString();
        } else {
          mapped.data_evento = date.toISOString();
        }
      } catch (e) {
        mapped.data_evento = new Date().toISOString();
      }
    }

    return mapped;
  }).filter(r => r !== null);

  console.log(`✅ ${mappedRows.length} registros válidos para importar\n`);

  if (mappedRows.length === 0) {
    console.log('❌ Nenhum registro válido encontrado');
    return;
  }

  // Verificar quais pedidos existem no banco
  console.log('🔍 Verificando pedidos existentes no banco...\n');
  const pedidoIds = [...new Set(mappedRows.map(r => r.pedido_id).filter(Boolean))];
  
  const { data: pedidosExistentes } = await supabase
    .from('pedidos')
    .select('id')
    .in('id', pedidoIds);
  
  const pedidosExistentesIds = new Set(pedidosExistentes?.map(p => p.id) || []);
  const pedidosFaltantes = pedidoIds.filter(id => !pedidosExistentesIds.has(id));
  
  if (pedidosFaltantes.length > 0) {
    console.log(`⚠️  ${pedidosFaltantes.length} pedidos não encontrados no banco:`);
    pedidosFaltantes.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    if (pedidosFaltantes.length > 10) {
      console.log(`   ... e mais ${pedidosFaltantes.length - 10} pedidos`);
    }
    console.log(`\n💡 Filtrando registros apenas para pedidos existentes...\n`);
  } else {
    console.log(`✅ Todos os ${pedidoIds.length} pedidos existem no banco\n`);
  }

  // Filtrar apenas registros com pedidos existentes
  let registrosValidos = mappedRows.filter(r => pedidosExistentesIds.has(r.pedido_id));
  
  // Verificar item_pedido_id se presente
  const itemPedidoIds = [...new Set(registrosValidos.map(r => r.item_pedido_id).filter(Boolean))];
  if (itemPedidoIds.length > 0) {
    const { data: itensExistentes } = await supabase
      .from('itens_pedido')
      .select('id')
      .in('id', itemPedidoIds);
    
    const itensExistentesIds = new Set(itensExistentes?.map(i => i.id) || []);
    
    // Filtrar registros que têm item_pedido_id mas o item não existe
    const registrosComItemInvalido = registrosValidos.filter(r => 
      r.item_pedido_id && !itensExistentesIds.has(r.item_pedido_id)
    );
    
    if (registrosComItemInvalido.length > 0) {
      console.log(`⚠️  ${registrosComItemInvalido.length} registros com item_pedido_id inválido serão importados sem item_pedido_id\n`);
      // Remover item_pedido_id inválido
      registrosValidos = registrosValidos.map(r => {
        if (r.item_pedido_id && !itensExistentesIds.has(r.item_pedido_id)) {
          return { ...r, item_pedido_id: null };
        }
        return r;
      });
    }
  }
  
  console.log(`📊 Registros válidos após verificação: ${registrosValidos.length}`);
  console.log(`⚠️  Registros ignorados (pedido não existe): ${mappedRows.length - registrosValidos.length}\n`);

  if (registrosValidos.length === 0) {
    console.log('❌ Nenhum registro válido para importar (nenhum pedido existe no banco)');
    console.log('\n💡 SOLUÇÃO:');
    console.log('   1. Importe os pedidos primeiro (CSV de pedidos)');
    console.log('   2. Ou crie os pedidos manualmente no sistema');
    console.log('   3. Depois execute este script novamente');
    return;
  }

  // Inserir em lotes
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;
  let duplicates = 0;

  for (let i = 0; i < registrosValidos.length; i += BATCH_SIZE) {
    const batch = registrosValidos.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('historico_producao')
      .upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select('id');

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        duplicates += batch.length;
        console.log(`⚠️ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} registros já existem (duplicados)`);
      } else {
        errors += batch.length;
        console.error(`❌ Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        
        // Tentar inserir um por um para identificar o problema
        if (batch.length > 1 && error.message.includes('foreign key')) {
          console.log(`   🔍 Tentando inserir individualmente para identificar problemas...`);
          for (const registro of batch) {
            try {
              const { error: singleError } = await supabase
                .from('historico_producao')
                .upsert(registro, {
                  onConflict: 'id',
                  ignoreDuplicates: false
                });
              
              if (singleError) {
                if (singleError.code === '23505' || singleError.message.includes('duplicate')) {
                  duplicates++;
                } else if (singleError.message.includes('foreign key')) {
                  errors++;
                  console.error(`      ❌ FK error no registro ${registro.id || 'N/A'}: pedido_id ${registro.pedido_id} não existe`);
                } else {
                  errors++;
                  console.error(`      ❌ Erro no registro ${registro.id || 'N/A'}:`, singleError.message);
                }
              } else {
                inserted++;
              }
            } catch (err) {
              errors++;
              console.error(`      ❌ Erro ao inserir registro ${registro.id || 'N/A'}:`, err.message);
            }
          }
        }
      }
    } else {
      inserted += data?.length || 0;
      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${data?.length || 0} registros inseridos`);
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Inseridos: ${inserted}`);
  console.log(`   ⚠️  Duplicados: ${duplicates}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📝 Total processado: ${registrosValidos.length}`);
  console.log(`   ⚠️  Ignorados (pedido não existe): ${mappedRows.length - registrosValidos.length}\n`);
}

main().catch(console.error);
