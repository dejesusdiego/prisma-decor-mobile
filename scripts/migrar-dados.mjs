/**
 * ═══════════════════════════════════════════════════════════════
 * SCRIPT DE MIGRAÇÃO DE DADOS - PRISMA DECOR ERP
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const CSV_PATH = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS';

// ============================================================
// MAPEAMENTO CSV -> TABELAS (ordem respeita foreign keys)
// ============================================================

const CSV_MAPPING = [
  { file: 'contatos-export', table: 'contatos' },
  { file: 'categorias_financeiras-export', table: 'categorias_financeiras' },
  { file: 'servicos_confeccao-export', table: 'servicos_confeccao' },
  { file: 'materiais-export', table: 'materiais' },
  { file: 'orcamentos-export', table: 'orcamentos' },
  { file: 'cortina_items-export', table: 'cortina_items' },
  { file: 'oportunidades-export', table: 'oportunidades' },
  { file: 'atividades_crm-export', table: 'atividades_crm' },
  { file: 'contas_receber-export', table: 'contas_receber' },
  { file: 'parcelas_receber-export', table: 'parcelas_receber' },
  { file: 'lancamentos_financeiros-export', table: 'lancamentos_financeiros' },
  { file: 'comissoes-export', table: 'comissoes' },
  { file: 'configuracoes_comissao-export', table: 'configuracoes_comissao' },
];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

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
  
  // Detectar separador (vírgula ou ponto-vírgula)
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
      
      // Limpar aspas extras
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // Converter valores especiais
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

async function insertData(supabase, tableName, rows) {
  if (rows.length === 0) {
    console.log(`   ⚠️  Nenhum registro`);
    return { success: 0, errors: 0 };
  }
  
  let success = 0;
  let errors = 0;
  const batchSize = 50;
  
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    
    if (error) {
      console.log(`   ❌ Batch ${i}-${i + batch.length}: ${error.message}`);
      errors += batch.length;
    } else {
      success += batch.length;
      process.stdout.write(`   ⏳ ${success}/${rows.length}\r`);
    }
  }
  
  return { success, errors };
}

// ============================================================
// EXECUÇÃO PRINCIPAL
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     MIGRAÇÃO DE DADOS - PRISMA DECOR ERP                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Configure a SUPABASE_SERVICE_ROLE_KEY!');
    console.log('');
    console.log('No PowerShell:');
    console.log('  $env:SUPABASE_SERVICE_ROLE_KEY = "sua_service_role_key"');
    process.exit(1);
  }
  
  console.log(`📁 CSVs: ${CSV_PATH}`);
  console.log(`🎯 Destino: ${SUPABASE_URL}`);
  console.log('');
  
  // Verificar se pasta existe
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Pasta de CSVs não encontrada: ${CSV_PATH}`);
    process.exit(1);
  }
  
  // Listar arquivos disponíveis
  const files = fs.readdirSync(CSV_PATH).filter(f => f.endsWith('.csv'));
  console.log(`📄 CSVs encontrados: ${files.length}`);
  console.log('');
  
  // Conectar
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  // Testar conexão
  const { error: testError } = await supabase.from('organizations').select('id').limit(1);
  if (testError) {
    console.error(`❌ Erro de conexão: ${testError.message}`);
    process.exit(1);
  }
  console.log('✅ Conexão OK!\n');
  
  // Importar dados
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const { file, table } of CSV_MAPPING) {
    const csvPath = findCSVFile(file);
    
    if (!csvPath) {
      console.log(`⏭️  ${table}: CSV não encontrado (${file}*)`);
      continue;
    }
    
    console.log(`📊 ${table}`);
    
    try {
      const rows = parseCSV(csvPath);
      console.log(`   ${rows.length} registros encontrados`);
      
      if (rows.length > 0) {
        const { success, errors } = await insertData(supabase, table, rows);
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
  
  if (totalErrors === 0) {
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  } else {
    console.log('\n⚠️  Migração concluída com alguns erros.');
  }
}

main().catch(console.error);
