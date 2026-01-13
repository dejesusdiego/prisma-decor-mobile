/**
 * ═══════════════════════════════════════════════════════════════
 * SCRIPT DE MIGRAÇÃO V2 - LIMPA FKs QUEBRADAS
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CSV_PATH = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS';

// Mapeamento com FKs a limpar
const CSV_MAPPING = [
  { file: 'cortina_items-export', table: 'cortina_items', clearFKs: ['orcamento_id', 'motor_id'] },
  { file: 'oportunidades-export', table: 'oportunidades', clearFKs: ['orcamento_id', 'contato_id'] },
  { file: 'atividades_crm-export', table: 'atividades_crm', clearFKs: ['orcamento_id', 'contato_id', 'oportunidade_id'] },
  { file: 'contas_receber-export', table: 'contas_receber', clearFKs: ['orcamento_id', 'lancamento_origem_id'] },
  { file: 'parcelas_receber-export', table: 'parcelas_receber', clearFKs: ['conta_receber_id', 'forma_pagamento_id'] },
  { file: 'lancamentos_financeiros-export', table: 'lancamentos_financeiros', clearFKs: ['categoria_id', 'forma_pagamento_id', 'conta_pagar_id', 'parcela_receber_id'] },
  { file: 'comissoes-export', table: 'comissoes', clearFKs: ['orcamento_id'] },
];

function findCSVFile(baseName) {
  if (!fs.existsSync(CSV_PATH)) return null;
  const files = fs.readdirSync(CSV_PATH);
  const found = files.find(f => f.startsWith(baseName) && f.endsWith('.csv'));
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
  
  let headerLine = lines[0];
  if (headerLine.match(/^\s*\d+\|/)) {
    headerLine = headerLine.replace(/^\s*\d+\|/, '');
  }
  
  const headers = parseCSVLine(headerLine, separator);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    if (line.match(/^\s*\d+\|/)) {
      line = line.replace(/^\s*\d+\|/, '');
    }
    
    const values = parseCSVLine(line, separator);
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      if (value === '' || value === 'null' || value === 'NULL' || value === undefined) {
        value = null;
      } else if (value === 'true' || value === 'TRUE') {
        value = true;
      } else if (value === 'false' || value === 'FALSE') {
        value = false;
      } else if (value === '[]') {
        value = [];
      } else if (value === '{}') {
        value = {};
      } else if (value?.startsWith('[') && value?.endsWith(']')) {
        try { value = JSON.parse(value); } catch (e) {}
      } else if (value?.startsWith('{') && value?.endsWith('}')) {
        try { value = JSON.parse(value); } catch (e) {}
      }
      
      row[header] = value;
    });
    
    rows.push(row);
  }
  
  return rows;
}

async function getExistingIds(supabase, tableName) {
  const { data, error } = await supabase.from(tableName).select('id');
  if (error) return new Set();
  return new Set(data.map(r => r.id));
}

async function insertData(supabase, tableName, rows, clearFKs = []) {
  if (rows.length === 0) {
    console.log(`   ⚠️  Nenhum registro`);
    return { success: 0, errors: 0 };
  }
  
  // Buscar IDs existentes das tabelas referenciadas
  const existingOrcamentos = await getExistingIds(supabase, 'orcamentos');
  const existingContatos = await getExistingIds(supabase, 'contatos');
  const existingOportunidades = await getExistingIds(supabase, 'oportunidades');
  const existingContasReceber = await getExistingIds(supabase, 'contas_receber');
  const existingParcelas = await getExistingIds(supabase, 'parcelas_receber');
  const existingCategorias = await getExistingIds(supabase, 'categorias_financeiras');
  const existingFormas = await getExistingIds(supabase, 'formas_pagamento');
  const existingLancamentos = await getExistingIds(supabase, 'lancamentos_financeiros');
  const existingMateriais = await getExistingIds(supabase, 'materiais');
  
  // Limpar FKs inválidas
  const cleanedRows = rows.map(row => {
    const cleaned = { ...row };
    
    // Validar cada FK
    if (cleaned.orcamento_id && !existingOrcamentos.has(cleaned.orcamento_id)) {
      cleaned.orcamento_id = null;
    }
    if (cleaned.contato_id && !existingContatos.has(cleaned.contato_id)) {
      cleaned.contato_id = null;
    }
    if (cleaned.oportunidade_id && !existingOportunidades.has(cleaned.oportunidade_id)) {
      cleaned.oportunidade_id = null;
    }
    if (cleaned.conta_receber_id && !existingContasReceber.has(cleaned.conta_receber_id)) {
      cleaned.conta_receber_id = null;
    }
    if (cleaned.parcela_receber_id && !existingParcelas.has(cleaned.parcela_receber_id)) {
      cleaned.parcela_receber_id = null;
    }
    if (cleaned.categoria_id && !existingCategorias.has(cleaned.categoria_id)) {
      cleaned.categoria_id = null;
    }
    if (cleaned.forma_pagamento_id && !existingFormas.has(cleaned.forma_pagamento_id)) {
      cleaned.forma_pagamento_id = null;
    }
    if (cleaned.lancamento_origem_id && !existingLancamentos.has(cleaned.lancamento_origem_id)) {
      cleaned.lancamento_origem_id = null;
    }
    if (cleaned.motor_id && !existingMateriais.has(cleaned.motor_id)) {
      cleaned.motor_id = null;
    }
    if (cleaned.conta_pagar_id) {
      cleaned.conta_pagar_id = null; // Não temos contas_pagar exportadas
    }
    
    return cleaned;
  });
  
  // Filtrar registros com FKs obrigatórias faltando
  let validRows = cleanedRows;
  
  // Para cortina_items, orcamento_id é obrigatório
  if (tableName === 'cortina_items') {
    validRows = cleanedRows.filter(r => r.orcamento_id !== null);
  }
  
  // Para parcelas_receber, conta_receber_id é obrigatório
  if (tableName === 'parcelas_receber') {
    validRows = cleanedRows.filter(r => r.conta_receber_id !== null);
  }
  
  console.log(`   ${validRows.length}/${rows.length} registros válidos após limpeza de FKs`);
  
  if (validRows.length === 0) {
    return { success: 0, errors: 0 };
  }
  
  let success = 0;
  let errors = 0;
  const batchSize = 50;
  
  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    
    if (error) {
      console.log(`   ❌ Batch ${i}-${i + batch.length}: ${error.message}`);
      errors += batch.length;
    } else {
      success += batch.length;
      process.stdout.write(`   ⏳ ${success}/${validRows.length}\r`);
    }
  }
  
  return { success, errors };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   MIGRAÇÃO V2 - COM LIMPEZA DE FKs QUEBRADAS             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Configure a SUPABASE_SERVICE_ROLE_KEY!');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  console.log('✅ Conectando...\n');
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const { file, table, clearFKs } of CSV_MAPPING) {
    const csvPath = findCSVFile(file);
    
    if (!csvPath) {
      console.log(`⏭️  ${table}: CSV não encontrado`);
      continue;
    }
    
    console.log(`📊 ${table}`);
    
    try {
      const rows = parseCSV(csvPath);
      console.log(`   ${rows.length} registros no CSV`);
      
      if (rows.length > 0) {
        const { success, errors } = await insertData(supabase, table, rows, clearFKs);
        console.log(`   ✅ ${success} inseridos | ❌ ${errors} erros`);
        
        totalSuccess += success;
        totalErrors += errors;
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
      totalErrors++;
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`TOTAL: ✅ ${totalSuccess} inseridos | ❌ ${totalErrors} erros`);
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(console.error);
