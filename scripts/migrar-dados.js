/**
 * Script de Migração de Dados para Novo Supabase
 * 
 * Este script lê os CSVs exportados e insere no novo projeto Supabase.
 * 
 * COMO USAR:
 * 1. Coloque os CSVs na pasta especificada abaixo (ou altere o caminho)
 * 2. Execute: node scripts/migrar-dados.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ============================================================
// CONFIGURAÇÃO - ALTERE AQUI SE NECESSÁRIO
// ============================================================

// Caminho dos CSVs - pode ser a pasta Downloads ou backup
const CSV_PATH = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS';
// Alternativa: const CSV_PATH = path.join(__dirname, '..', 'docs', 'backup', 'csv');

// Credenciais do NOVO Supabase (destino)
const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'COLE_SUA_SERVICE_ROLE_KEY_AQUI';

// ============================================================
// MAPEAMENTO DE ARQUIVOS CSV -> TABELAS
// ============================================================

const CSV_MAPPING = [
  // Ordem importa! Respeita Foreign Keys
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
  const files = fs.readdirSync(CSV_PATH);
  const found = files.find(f => f.startsWith(baseName) && f.endsWith('.csv'));
  return found ? path.join(CSV_PATH, found) : null;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  // Primeira linha é o header (remove o número da linha se houver)
  let headerLine = lines[0];
  if (headerLine.match(/^\s*\d+\|/)) {
    headerLine = headerLine.replace(/^\s*\d+\|/, '');
  }
  
  const headers = headerLine.split(';').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    
    // Remove número da linha se houver
    if (line.match(/^\s*\d+\|/)) {
      line = line.replace(/^\s*\d+\|/, '');
    }
    
    const values = parseCSVLine(line, ';');
    
    if (values.length !== headers.length) {
      // Linha pode ter quebra - tentar juntar com próxima
      continue;
    }
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Converter valores especiais
      if (value === '' || value === 'null' || value === undefined) {
        value = null;
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value === '[]') {
        value = [];
      } else if (value && value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Manter como string
        }
      } else if (value && value.startsWith('{') && value.endsWith('}')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Manter como string
        }
      }
      
      row[header] = value;
    });
    
    rows.push(row);
  }
  
  return rows;
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

async function insertData(supabase, tableName, rows) {
  if (rows.length === 0) {
    console.log(`  ⚠️  ${tableName}: Nenhum registro para inserir`);
    return { success: 0, errors: 0 };
  }
  
  let success = 0;
  let errors = 0;
  
  // Inserir em batches de 100
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    
    if (error) {
      console.error(`  ❌ Erro no batch ${i}-${i + batch.length}: ${error.message}`);
      errors += batch.length;
    } else {
      success += batch.length;
    }
  }
  
  return { success, errors };
}

// ============================================================
// EXECUÇÃO PRINCIPAL
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       MIGRAÇÃO DE DADOS - PRISMA DECOR ERP               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Validar configuração
  if (SUPABASE_SERVICE_KEY === 'COLE_SUA_SERVICE_ROLE_KEY_AQUI') {
    console.error('❌ ERRO: Configure a SUPABASE_SERVICE_ROLE_KEY!');
    console.log('');
    console.log('Opção 1: Defina a variável de ambiente:');
    console.log('  set SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
    console.log('');
    console.log('Opção 2: Edite este arquivo e cole a chave diretamente.');
    console.log('');
    console.log('Você encontra a Service Role Key em:');
    console.log('  Supabase Dashboard → Settings → API → service_role key');
    console.log('  (NÃO a anon/public key!)');
    process.exit(1);
  }
  
  // Verificar pasta de CSVs
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ ERRO: Pasta de CSVs não encontrada: ${CSV_PATH}`);
    process.exit(1);
  }
  
  console.log(`📁 Pasta de CSVs: ${CSV_PATH}`);
  console.log(`🎯 Destino: ${SUPABASE_URL}`);
  console.log('');
  
  // Conectar ao Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Processar cada tabela
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const { file, table } of CSV_MAPPING) {
    const csvPath = findCSVFile(file);
    
    if (!csvPath) {
      console.log(`⏭️  ${table}: Arquivo não encontrado (${file}*.csv) - pulando`);
      continue;
    }
    
    console.log(`📊 Processando: ${table}`);
    
    try {
      const rows = parseCSV(csvPath);
      console.log(`   Registros encontrados: ${rows.length}`);
      
      const { success, errors } = await insertData(supabase, table, rows);
      
      console.log(`   ✅ Inseridos: ${success} | ❌ Erros: ${errors}`);
      
      totalSuccess += success;
      totalErrors += errors;
    } catch (error) {
      console.error(`   ❌ Erro ao processar: ${error.message}`);
      totalErrors++;
    }
    
    console.log('');
  }
  
  // Resumo
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Total inseridos: ${totalSuccess}`);
  console.log(`❌ Total erros: ${totalErrors}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  if (totalErrors === 0) {
    console.log('');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  } else {
    console.log('');
    console.log('⚠️  Migração concluída com alguns erros. Verifique os logs acima.');
  }
}

main().catch(console.error);
