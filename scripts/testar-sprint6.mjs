#!/usr/bin/env node
/**
 * Script de Testes de Regressão - Sprint 6
 * Valida as correções aplicadas no hotfix
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar .env
config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_KEY são necessários');
  console.log('\nCrie um arquivo .env na raiz com:');
  console.log('SUPABASE_URL=https://tjwpqrlfhngibuwqodcn.supabase.co');
  console.log('SUPABASE_SERVICE_KEY=sua_service_role_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Testes de Regressão - Sprint 6\n');
  console.log('=' .repeat(50));
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Erro: ${error.message}`);
      failed++;
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`\n📊 Resultado: ${passed} passaram, ${failed} falharam`);
  
  if (failed === 0) {
    console.log('\n🎉 Todos os testes passaram! Pronto para deploy.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Revise antes do deploy.');
    process.exit(1);
  }
}

// ============================================
// TESTES
// ============================================

// T6.4 - Verificar funções de sincronização
test('T6.4: Função sync_contas_receber_from_orcamento existe', async () => {
  const { data, error } = await supabase.rpc('sync_contas_receber_from_orcamento');
  // Deve dar erro de parâmetro, não de função inexistente
  if (error && error.message.includes('does not exist')) {
    throw new Error('Função não existe');
  }
});

test('T6.4: Trigger trigger_sync_contas_receber_from_orcamento existe', async () => {
  const { data, error } = await supabase
    .from('pg_trigger')
    .select('tgname')
    .eq('tgname', 'trigger_sync_contas_receber_from_orcamento')
    .single();
  
  if (error || !data) {
    // Tentar via SQL raw
    const { error: sqlError } = await supabase.sql`
      SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_contas_receber_from_orcamento'
    `;
    if (sqlError) throw new Error('Trigger não encontrada');
  }
});

test('T6.4: Função sync_parcelas_from_conta_receber existe', async () => {
  const { error } = await supabase.rpc('sync_parcelas_from_conta_receber');
  if (error && error.message.includes('does not exist')) {
    throw new Error('Função não existe');
  }
});

// T6.7 - Verificar soft delete
test('T6.7: Coluna deleted_at existe em user_roles', async () => {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'user_roles')
    .eq('column_name', 'deleted_at')
    .single();
  
  if (error || !data) {
    throw new Error('Coluna deleted_at não existe');
  }
});

test('T6.7: Coluna deleted_by existe em user_roles', async () => {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'user_roles')
    .eq('column_name', 'deleted_by')
    .single();
  
  if (error || !data) {
    throw new Error('Coluna deleted_by não existe');
  }
});

test('T6.7: Função soft_delete_user existe', async () => {
  const { error } = await supabase.rpc('soft_delete_user', { p_user_id: '00000000-0000-0000-0000-000000000000' });
  if (error && error.message.includes('does not exist')) {
    throw new Error('Função não existe');
  }
});

test('T6.7: Função restore_user existe', async () => {
  const { error } = await supabase.rpc('restore_user', { p_user_id: '00000000-0000-0000-0000-000000000000' });
  if (error && error.message.includes('does not exist')) {
    throw new Error('Função não existe');
  }
});

test('T6.7: View v_users_with_status existe', async () => {
  const { data, error } = await supabase
    .from('v_users_with_status')
    .select('*')
    .limit(1);
  
  if (error && error.message.includes('does not exist')) {
    throw new Error('View não existe');
  }
});

// T6.2 - Verificar RLS supplier
test('T6.2: Tabela supplier_users existe', async () => {
  const { data, error } = await supabase
    .from('supplier_users')
    .select('id')
    .limit(1);
  
  if (error && error.message.includes('does not exist')) {
    throw new Error('Tabela não existe');
  }
});

// Rodar testes
runTests();
