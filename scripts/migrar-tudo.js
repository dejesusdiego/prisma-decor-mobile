/**
 * ═══════════════════════════════════════════════════════════════
 * SCRIPT DE MIGRAÇÃO COMPLETA - PRISMA DECOR ERP
 * ═══════════════════════════════════════════════════════════════
 * 
 * Este script faz TUDO automaticamente:
 * 1. Cria o schema (tipos, tabelas, funções)
 * 2. Insere dados base (organizações, planos, configs)
 * 3. Importa todos os CSVs com seus dados
 * 
 * COMO USAR:
 * 1. Obtenha a Service Role Key do novo Supabase
 * 2. Execute: node scripts/migrar-tudo.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// ============================================================
// CONFIGURAÇÃO - ALTERE SE NECESSÁRIO
// ============================================================

// Credenciais do NOVO Supabase (destino)
const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'COLE_SUA_SERVICE_ROLE_KEY_AQUI';

// Caminhos
const BACKUP_PATH = path.join(__dirname, '..', 'docs', 'backup');
const CSV_PATH = 'C:\\Users\\Gabri\\Downloads\\CSV TABELAS';

// ============================================================
// ARQUIVOS SQL A EXECUTAR (em ordem)
// ============================================================

const SQL_FILES = [
  '02_SCHEMA_TYPES.sql',
  '03_SCHEMA_TABLES.sql',
  '04_SCHEMA_FUNCTIONS_1.sql',
  '07_DATA_BASE.sql',
];

// ============================================================
// MAPEAMENTO CSV -> TABELAS
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
// FUNÇÕES DE EXECUÇÃO SQL
// ============================================================

async function executeSqlViaRest(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    
    // Primeiro tentamos via função RPC customizada
    // Se não existir, usamos a API do Postgres diretamente
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };
    
    // Na verdade, para executar SQL arbitrário precisamos usar o endpoint correto
    // Vamos usar a supabase-js com a função rpc ou query direta
    resolve({ success: true, message: 'Will use alternative method' });
  });
}

async function executeSqlFile(supabase, filePath, fileName) {
  console.log(`\n📄 Executando: ${fileName}`);
  
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  // Dividir em statements individuais
  const statements = sql
    .split(/;[\s]*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`   ${statements.length} statements encontrados`);
  
  let success = 0;
  let errors = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Pular comentários e statements vazios
    if (!stmt || stmt.startsWith('--') || stmt.length < 5) continue;
    
    try {
      // Usar RPC para executar SQL raw
      const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
      
      if (error) {
        // Se a função exec_sql não existe, vamos tentar criar
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          throw new Error('NEED_EXEC_FUNCTION');
        }
        throw error;
      }
      success++;
    } catch (err) {
      if (err.message === 'NEED_EXEC_FUNCTION') {
        throw err;
      }
      // Alguns erros são esperados (como "already exists")
      if (err.message?.includes('already exists') || 
          err.message?.includes('duplicate')) {
        success++;
      } else {
        console.log(`   ⚠️  Statement ${i + 1}: ${err.message?.substring(0, 80)}...`);
        errors++;
      }
    }
  }
  
  console.log(`   ✅ Sucesso: ${success} | ⚠️ Avisos: ${errors}`);
  return { success, errors };
}

// ============================================================
// FUNÇÕES CSV
// ============================================================

function findCSVFile(baseName) {
  if (!fs.existsSync(CSV_PATH)) return null;
  const files = fs.readdirSync(CSV_PATH);
  const found = files.find(f => f.startsWith(baseName) && f.endsWith('.csv'));
  return found ? path.join(CSV_PATH, found) : null;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  let headerLine = lines[0];
  if (headerLine.match(/^\s*\d+\|/)) {
    headerLine = headerLine.replace(/^\s*\d+\|/, '');
  }
  
  const headers = headerLine.split(';').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    if (line.match(/^\s*\d+\|/)) {
      line = line.replace(/^\s*\d+\|/, '');
    }
    
    const values = parseCSVLine(line, ';');
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      if (value === '' || value === 'null' || value === undefined) {
        value = null;
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value === '[]') {
        value = [];
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
    console.log(`   ⚠️  Nenhum registro`);
    return { success: 0, errors: 0 };
  }
  
  let success = 0;
  let errors = 0;
  const batchSize = 100;
  
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
    }
  }
  
  return { success, errors };
}

// ============================================================
// CRIAR FUNÇÃO exec_sql NO BANCO
// ============================================================

async function ensureExecSqlFunction(supabase) {
  // Tentar criar a função que permite executar SQL arbitrário
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
    END;
    $$;
  `;
  
  // Não podemos criar via RPC se a função não existe ainda
  // Precisamos de outra abordagem - usar a API SQL direta
  console.log('');
  console.log('⚠️  ATENÇÃO: Para executar SQL arbitrário, você precisa:');
  console.log('');
  console.log('   1. Acessar o SQL Editor do novo Supabase:');
  console.log('      https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql');
  console.log('');
  console.log('   2. Executar este comando para criar a função helper:');
  console.log('');
  console.log('   ─────────────────────────────────────────────────────');
  console.log(createFunctionSql);
  console.log('   ─────────────────────────────────────────────────────');
  console.log('');
  console.log('   3. Depois execute este script novamente!');
  console.log('');
  
  return false;
}

// ============================================================
// ALTERNATIVA: Gerar arquivo SQL único para execução manual
// ============================================================

async function generateCombinedSql() {
  console.log('');
  console.log('📝 Gerando arquivo SQL combinado...');
  
  let combinedSql = `-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO COMPLETA - PRISMA DECOR ERP
-- Gerado automaticamente em ${new Date().toISOString()}
-- ═══════════════════════════════════════════════════════════════

`;

  // Adicionar cada arquivo SQL
  for (const fileName of SQL_FILES) {
    const filePath = path.join(BACKUP_PATH, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      combinedSql += `\n-- ══════════════════════════════════════════════════════════════\n`;
      combinedSql += `-- ARQUIVO: ${fileName}\n`;
      combinedSql += `-- ══════════════════════════════════════════════════════════════\n\n`;
      combinedSql += content;
      combinedSql += '\n\n';
    }
  }
  
  const outputPath = path.join(BACKUP_PATH, 'MIGRACAO_COMPLETA.sql');
  fs.writeFileSync(outputPath, combinedSql);
  
  console.log(`✅ Arquivo gerado: ${outputPath}`);
  console.log('');
  console.log('   Copie o conteúdo deste arquivo e execute no SQL Editor do Supabase.');
  
  return outputPath;
}

// ============================================================
// EXECUÇÃO PRINCIPAL
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     MIGRAÇÃO COMPLETA - PRISMA DECOR ERP                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Validar configuração
  if (SUPABASE_SERVICE_KEY === 'COLE_SUA_SERVICE_ROLE_KEY_AQUI') {
    console.error('❌ Configure a SUPABASE_SERVICE_ROLE_KEY primeiro!');
    console.log('');
    console.log('No PowerShell:');
    console.log('  $env:SUPABASE_SERVICE_ROLE_KEY = "sua_service_role_key"');
    console.log('');
    console.log('Encontre a chave em:');
    console.log('  https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/settings/api');
    console.log('  → service_role key (a secreta!)');
    process.exit(1);
  }
  
  console.log(`📁 Backup: ${BACKUP_PATH}`);
  console.log(`📁 CSVs: ${CSV_PATH}`);
  console.log(`🎯 Destino: ${SUPABASE_URL}`);
  
  // Conectar
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  // ──────────────────────────────────────────────────────────────
  // FASE 1: Tentar executar SQL via RPC
  // ──────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FASE 1: SCHEMA E DADOS BASE');
  console.log('═══════════════════════════════════════════════════════════');
  
  let schemaOk = false;
  
  // Testar se a função exec_sql existe
  const { error: testError } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
  
  if (testError?.message?.includes('does not exist')) {
    // Função não existe - gerar SQL combinado para execução manual
    console.log('\n⚠️  A função exec_sql não existe no banco.');
    console.log('   Gerando arquivo SQL para execução manual...');
    
    const sqlPath = await generateCombinedSql();
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('');
    console.log('   1. Abra: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql');
    console.log(`   2. Copie o conteúdo de: ${sqlPath}`);
    console.log('   3. Cole no SQL Editor e execute');
    console.log('   4. Execute este script novamente para importar os CSVs');
    console.log('');
    
    // Perguntar se quer continuar só com CSVs
    console.log('Deseja tentar importar os CSVs agora mesmo assim? (as tabelas precisam existir!)');
    console.log('Se as tabelas ainda não existem, execute o SQL primeiro.');
    console.log('');
    
  } else if (testError) {
    console.log(`⚠️  Erro ao testar conexão: ${testError.message}`);
  } else {
    console.log('✅ Conexão OK! Função exec_sql disponível.');
    schemaOk = true;
    
    // Executar arquivos SQL
    for (const fileName of SQL_FILES) {
      const filePath = path.join(BACKUP_PATH, fileName);
      if (fs.existsSync(filePath)) {
        await executeSqlFile(supabase, filePath, fileName);
      } else {
        console.log(`⚠️  Arquivo não encontrado: ${fileName}`);
      }
    }
  }
  
  // ──────────────────────────────────────────────────────────────
  // FASE 2: Importar CSVs
  // ──────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FASE 2: IMPORTAR DADOS DOS CSVs');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`\n⚠️  Pasta de CSVs não encontrada: ${CSV_PATH}`);
    console.log('   Pule esta fase ou mova os CSVs para a pasta correta.');
  } else {
    let totalSuccess = 0;
    let totalErrors = 0;
    
    for (const { file, table } of CSV_MAPPING) {
      const csvPath = findCSVFile(file);
      
      if (!csvPath) {
        console.log(`\n⏭️  ${table}: CSV não encontrado`);
        continue;
      }
      
      console.log(`\n📊 ${table}`);
      
      try {
        const rows = parseCSV(csvPath);
        console.log(`   ${rows.length} registros`);
        
        const { success, errors } = await insertData(supabase, table, rows);
        console.log(`   ✅ ${success} inseridos | ❌ ${errors} erros`);
        
        totalSuccess += success;
        totalErrors += errors;
      } catch (err) {
        console.log(`   ❌ Erro: ${err.message}`);
        totalErrors++;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`TOTAL: ✅ ${totalSuccess} inseridos | ❌ ${totalErrors} erros`);
    console.log('═══════════════════════════════════════════════════════════');
  }
  
  console.log('\n🎉 Script finalizado!');
}

main().catch(console.error);
