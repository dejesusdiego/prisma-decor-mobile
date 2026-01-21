/**
 * Script de Auditoria Completa do Sistema
 * Verifica integridade, consistência e partes faltantes
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

// Extrair tabelas do types.ts
function extrairTabelasTypes() {
  const typesPath = path.join(__dirname, '..', 'src', 'integrations', 'supabase', 'types.ts');
  const content = fs.readFileSync(typesPath, 'utf-8');
  
  const tabelas = [];
  const regex = /(\w+):\s*\{[\s\S]*?Row:/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const nome = match[1];
    if (!nome.includes('__') && nome !== 'public' && nome !== 'Tables') {
      tabelas.push(nome);
    }
  }
  
  return [...new Set(tabelas)].sort();
}

// Extrair tabelas das migrations
function extrairTabelasMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  
  const tabelas = new Set();
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const matches = content.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/gi);
    for (const match of matches) {
      tabelas.add(match[1]);
    }
  }
  
  return [...tabelas].sort();
}

// Extrair tabelas referenciadas no código
function extrairTabelasCodigo() {
  const srcDir = path.join(__dirname, '..', 'src');
  const tabelas = new Set();
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules') && entry.name !== 'dist') {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const matches = content.matchAll(/\.from\(['"]([^'"]+)['"]\)/g);
          for (const match of matches) {
            const tabela = match[1];
            if (tabela && !tabela.includes('(') && !tabela.includes(')')) {
              tabelas.add(tabela);
            }
          }
        } catch (e) {
          // Ignorar erros de leitura
        }
      }
    }
  }
  
  scanDir(srcDir);
  return [...tabelas].sort();
}

// Verificar tabelas no banco
async function verificarTabelasBanco() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
  });
  
  if (error) {
    // Tentar método alternativo
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    return tables?.map(t => t.table_name).sort() || [];
  }
  
  return [];
}

// Verificar colunas de uma tabela
async function verificarColunasTabela(tabela) {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .limit(0);
    
    if (error) {
      return { existe: false, erro: error.message };
    }
    
    return { existe: true };
  } catch (e) {
    return { existe: false, erro: e.message };
  }
}

async function main() {
  console.log('🔍 AUDITORIA COMPLETA DO SISTEMA\n');
  console.log('='.repeat(80));
  
  // 1. Extrair tabelas de diferentes fontes
  console.log('\n📊 1. EXTRAINDO TABELAS...\n');
  
  const tabelasTypes = extrairTabelasTypes();
  console.log(`✅ Tabelas no types.ts: ${tabelasTypes.length}`);
  
  const tabelasMigrations = extrairTabelasMigrations();
  console.log(`✅ Tabelas nas migrations: ${tabelasMigrations.length}`);
  
  const tabelasCodigo = extrairTabelasCodigo();
  console.log(`✅ Tabelas referenciadas no código: ${tabelasCodigo.length}`);
  
  // 2. Verificar inconsistências
  console.log('\n\n🔍 2. VERIFICANDO INCONSISTÊNCIAS...\n');
  
  const tabelasTypesSet = new Set(tabelasTypes);
  const tabelasMigrationsSet = new Set(tabelasMigrations);
  const tabelasCodigoSet = new Set(tabelasCodigo);
  
  // Tabelas no types mas não nas migrations
  const faltamMigrations = tabelasTypes.filter(t => !tabelasMigrationsSet.has(t));
  if (faltamMigrations.length > 0) {
    console.log(`⚠️  Tabelas no types.ts mas SEM migration:`);
    faltamMigrations.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log(`✅ Todas as tabelas do types.ts têm migrations`);
  }
  
  // Tabelas no código mas não no types
  const faltamTypes = tabelasCodigo.filter(t => !tabelasTypesSet.has(t));
  if (faltamTypes.length > 0) {
    console.log(`\n⚠️  Tabelas usadas no código mas NÃO no types.ts:`);
    faltamTypes.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log(`\n✅ Todas as tabelas usadas no código estão no types.ts`);
  }
  
  // Tabelas nas migrations mas não no types
  const faltamTypesFromMigrations = tabelasMigrations.filter(t => !tabelasTypesSet.has(t));
  if (faltamTypesFromMigrations.length > 0) {
    console.log(`\n⚠️  Tabelas nas migrations mas NÃO no types.ts:`);
    faltamTypesFromMigrations.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log(`\n✅ Todas as tabelas das migrations estão no types.ts`);
  }
  
  // 3. Verificar tabelas no banco
  console.log('\n\n🗄️  3. VERIFICANDO BANCO DE DADOS...\n');
  
  const tabelasBanco = await verificarTabelasBanco();
  console.log(`📊 Tabelas encontradas no banco: ${tabelasBanco.length}`);
  
  // Verificar se tabelas importantes existem
  const tabelasImportantes = [
    'organizations', 'user_roles', 'orcamentos', 'pedidos', 
    'contatos', 'contas_receber', 'contas_pagar', 'instalacoes',
    'historico_producao', 'itens_pedido'
  ];
  
  console.log('\n🔍 Verificando tabelas importantes:');
  for (const tabela of tabelasImportantes) {
    const status = await verificarColunasTabela(tabela);
    if (status.existe) {
      console.log(`   ✅ ${tabela}`);
    } else {
      console.log(`   ❌ ${tabela} - ${status.erro || 'não existe'}`);
    }
  }
  
  // 4. Verificar funcionalidades
  console.log('\n\n📋 4. VERIFICANDO FUNCIONALIDADES...\n');
  
  const funcionalidades = {
    'Orçamentos': ['orcamentos', 'cortina_items'],
    'CRM': ['contatos', 'oportunidades', 'atividades_crm'],
    'Produção': ['pedidos', 'itens_pedido', 'historico_producao', 'instalacoes'],
    'Financeiro': ['contas_receber', 'contas_pagar', 'lancamentos_financeiros', 'extratos_bancarios'],
    'Multi-tenancy': ['organizations', 'organization_members', 'user_roles'],
    'Planos/Assinaturas': ['plans', 'subscriptions', 'subscription_payments']
  };
  
  for (const [modulo, tabelas] of Object.entries(funcionalidades)) {
    const todasExistem = tabelas.every(t => tabelasTypesSet.has(t));
    if (todasExistem) {
      console.log(`✅ ${modulo}: Completo`);
    } else {
      const faltantes = tabelas.filter(t => !tabelasTypesSet.has(t));
      console.log(`⚠️  ${modulo}: Faltam ${faltantes.join(', ')}`);
    }
  }
  
  // 5. Resumo
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESUMO DA AUDITORIA');
  console.log('='.repeat(80));
  console.log(`Total de tabelas no types.ts: ${tabelasTypes.length}`);
  console.log(`Total de tabelas nas migrations: ${tabelasMigrations.length}`);
  console.log(`Total de tabelas usadas no código: ${tabelasCodigo.length}`);
  console.log(`Tabelas no banco: ${tabelasBanco.length}`);
  console.log(`\n⚠️  Inconsistências encontradas: ${faltamMigrations.length + faltamTypes.length + faltamTypesFromMigrations.length}`);
  console.log('='.repeat(80));
  
  // 6. Gerar relatório
  const relatorio = {
    data: new Date().toISOString(),
    tabelas: {
      types: tabelasTypes,
      migrations: tabelasMigrations,
      codigo: tabelasCodigo,
      banco: tabelasBanco
    },
    inconsistencias: {
      faltamMigrations,
      faltamTypes,
      faltamTypesFromMigrations
    }
  };
  
  const relatorioPath = path.join(__dirname, '..', 'docs', 'AUDITORIA_SISTEMA.json');
  fs.writeFileSync(relatorioPath, JSON.stringify(relatorio, null, 2));
  console.log(`\n📄 Relatório salvo em: ${relatorioPath}`);
}

main().catch(console.error);
