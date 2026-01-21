#!/usr/bin/env node

/**
 * Script para verificar e adicionar role de admin a um usuário
 * Uso: node scripts/verificar-adicionar-admin.mjs [email]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Certifique-se de que .env.local contém:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verificarUsuario(email) {
  console.log(`\n🔍 Buscando usuário: ${email}...`);
  
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    return null;
  }
  
  const user = users.users.find(u => u.email === email);
  
  if (!user) {
    console.error(`❌ Usuário não encontrado: ${email}`);
    return null;
  }
  
  console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`);
  return user;
}

async function verificarRole(userId) {
  console.log(`\n🔍 Verificando role do usuário...`);
  
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('❌ Erro ao verificar role:', error);
    return null;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Roles encontradas:');
    data.forEach(role => {
      console.log(`   - ${role.role}`);
    });
    return data;
  }
  
  console.log('⚠️  Nenhuma role encontrada');
  return [];
}

async function adicionarRoleAdmin(userId) {
  console.log(`\n➕ Adicionando role 'admin' ao usuário...`);
  
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'admin'
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Role admin já existe para este usuário');
      return true;
    }
    console.error('❌ Erro ao adicionar role:', error);
    return false;
  }
  
  console.log('✅ Role admin adicionada com sucesso!');
  return true;
}

async function listarTodosUsuarios() {
  console.log(`\n📋 Listando todos os usuários...`);
  
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Erro ao listar usuários:', error);
    return;
  }
  
  console.log(`\n📊 Total de usuários: ${users.users.length}\n`);
  
  for (const user of users.users) {
    const roles = await verificarRole(user.id);
    const isAdmin = roles?.some(r => r.role === 'admin') || false;
    
    console.log(`${isAdmin ? '👑' : '👤'} ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Admin: ${isAdmin ? 'Sim' : 'Não'}`);
    console.log('');
  }
}

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('📋 Listando todos os usuários e suas roles...\n');
    await listarTodosUsuarios();
    console.log('\n💡 Para adicionar role admin a um usuário:');
    console.log('   node scripts/verificar-adicionar-admin.mjs email@exemplo.com');
    return;
  }
  
  // Verificar usuário
  const user = await verificarUsuario(email);
  if (!user) {
    return;
  }
  
  // Verificar roles atuais
  const roles = await verificarRole(user.id);
  
  // Verificar se já é admin
  const isAdmin = roles?.some(r => r.role === 'admin') || false;
  
  if (isAdmin) {
    console.log('\n✅ Usuário já possui role de admin!');
    return;
  }
  
  // Adicionar role admin
  const sucesso = await adicionarRoleAdmin(user.id);
  
  if (sucesso) {
    console.log('\n🎉 Processo concluído!');
    console.log('⚠️  IMPORTANTE: O usuário precisa fazer logout e login novamente para as mudanças terem efeito.');
  }
}

main().catch(console.error);
