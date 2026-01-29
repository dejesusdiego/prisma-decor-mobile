/**
 * Script para criar usuários de teste no Supabase
 * Executar: node scripts/criar-usuarios-teste.js
 * 
 * Requer: npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.production' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env.production');
  process.exit(1);
}

// Client com Service Role Key (acesso total)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Credenciais de teste
const TEST_USERS = {
  superAdmin: {
    email: 'teste.superadmin@studioos.local',
    password: 'Teste@123456',
    name: 'Teste Super Admin',
    role: 'super_admin',
  },
  adminOrg: {
    email: 'teste.admin@prisma.local',
    password: 'Teste@123456',
    name: 'Teste Admin Org',
    role: 'admin',
    orgSlug: 'prisma',
  },
  usuarioComum: {
    email: 'teste.usuario@prisma.local',
    password: 'Teste@123456',
    name: 'Teste Usuario',
    role: 'member',
    orgSlug: 'prisma',
  },
  fornecedor: {
    email: 'teste.fornecedor@studioos.local',
    password: 'Teste@123456',
    name: 'Teste Fornecedor',
  },
};

async function cleanupExistingUser(email) {
  console.log(`🧹 Limpando usuário existente: ${email}`);
  
  // Buscar usuário por email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError.message);
    return;
  }
  
  const existingUser = users.users.find(u => u.email === email);
  
  if (existingUser) {
    // Deletar usuário
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    
    if (deleteError) {
      console.error('❌ Erro ao deletar usuário:', deleteError.message);
    } else {
      console.log(`✅ Usuário ${email} removido`);
    }
  }
}

async function createSuperAdmin() {
  console.log('\n🎯 Criando SUPER ADMIN...');
  
  const { email, password, name } = TEST_USERS.superAdmin;
  
  // Limpar usuário existente
  await cleanupExistingUser(email);
  
  // Criar usuário
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  
  if (createError) {
    console.error('❌ Erro ao criar Super Admin:', createError.message);
    return false;
  }
  
  const userId = userData.user.id;
  console.log(`✅ Usuário criado: ${userId}`);
  
  // Adicionar role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role: 'admin' });
  
  if (roleError) {
    console.error('❌ Erro ao adicionar role:', roleError.message);
    return false;
  }
  
  console.log('✅ Role adicionada');
  return true;
}

async function getOrCreateOrganization(slug, name) {
  // Buscar organização
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (orgError && orgError.code !== 'PGRST116') {
    console.error('❌ Erro ao buscar org:', orgError.message);
    return null;
  }
  
  if (org) {
    console.log(`🏢 Organização encontrada: ${org.id}`);
    return org.id;
  }
  
  // Criar organização
  console.log(`🏢 Criando organização: ${slug}`);
  const { data: newOrg, error: createError } = await supabase
    .from('organizations')
    .insert({
      slug,
      name,
      plan: 'pro',
      email: `contato@${slug}.local`,
      phone: '(11) 99999-8888',
      active: true,
    })
    .select('id')
    .single();
  
  if (createError) {
    console.error('❌ Erro ao criar org:', createError.message);
    return null;
  }
  
  console.log(`✅ Organização criada: ${newOrg.id}`);
  return newOrg.id;
}

async function createAdminOrg() {
  console.log('\n🎯 Criando ADMIN DE ORGANIZAÇÃO...');
  
  const { email, password, name, orgSlug } = TEST_USERS.adminOrg;
  
  // Obter/criar organização
  const orgId = await getOrCreateOrganization(orgSlug, 'Prisma Decorações (Teste)');
  if (!orgId) return false;
  
  // Limpar usuário existente
  await cleanupExistingUser(email);
  
  // Criar usuário
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  
  if (createError) {
    console.error('❌ Erro ao criar Admin Org:', createError.message);
    return false;
  }
  
  const userId = userData.user.id;
  console.log(`✅ Usuário criado: ${userId}`);
  
  // Adicionar como membro da organização
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: userId,
      role: 'admin',
    });
  
  if (memberError) {
    console.error('❌ Erro ao adicionar membro:', memberError.message);
    return false;
  }
  
  console.log('✅ Membro adicionado com role admin');
  return true;
}

async function createUsuarioComum() {
  console.log('\n🎯 Criando USUÁRIO COMUM...');
  
  const { email, password, name, orgSlug } = TEST_USERS.usuarioComum;
  
  // Obter organização
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();
  
  if (orgError) {
    console.error('❌ Organização não encontrada:', orgError.message);
    return false;
  }
  
  // Limpar usuário existente
  await cleanupExistingUser(email);
  
  // Criar usuário
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  
  if (createError) {
    console.error('❌ Erro ao criar Usuario:', createError.message);
    return false;
  }
  
  const userId = userData.user.id;
  console.log(`✅ Usuário criado: ${userId}`);
  
  // Adicionar como membro da organização
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'member',
    });
  
  if (memberError) {
    console.error('❌ Erro ao adicionar membro:', memberError.message);
    return false;
  }
  
  console.log('✅ Membro adicionado com role member');
  return true;
}

async function createFornecedor() {
  console.log('\n🎯 Criando FORNECEDOR...');
  
  const { email, password, name } = TEST_USERS.fornecedor;
  
  // Limpar usuário existente
  await cleanupExistingUser(email);
  
  // Criar usuário
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  
  if (createError) {
    console.error('❌ Erro ao criar Fornecedor:', createError.message);
    return false;
  }
  
  const userId = userData.user.id;
  console.log(`✅ Usuário criado: ${userId}`);
  
  // Criar registro de fornecedor
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .insert({
      razao_social: 'Fornecedor Teste StudioOS LTDA',
      nome_fantasia: 'Fornecedor Teste',
      email,
      cnpj: '12.345.678/0001-90',
      phone: '(11) 98888-7777',
      status: 'approved',
      categories: ['tecidos', 'trilhos', 'acessorios'],
      endereco: 'Rua dos Testes, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
    })
    .select('id')
    .single();
  
  if (supplierError) {
    console.error('❌ Erro ao criar fornecedor:', supplierError.message);
    return false;
  }
  
  console.log(`✅ Fornecedor criado: ${supplier.id}`);
  
  // Vincular usuário ao fornecedor
  const { error: linkError } = await supabase
    .from('supplier_users')
    .insert({
      supplier_id: supplier.id,
      user_id: userId,
      active: true,
    });
  
  if (linkError) {
    console.error('❌ Erro ao vincular usuário:', linkError.message);
    return false;
  }
  
  console.log('✅ Usuário vinculado ao fornecedor');
  return true;
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 CREDENCIAIS DE TESTE CRIADAS');
  console.log('='.repeat(60));
  
  const table = [
    ['Perfil', 'Email', 'Senha', 'Domínio de Acesso'],
    ['—'.repeat(15), '—'.repeat(30), '—'.repeat(15), '—'.repeat(25)],
    ['SUPER ADMIN', TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password, 'admin.studioos.pro'],
    ['ADMIN ORG', TEST_USERS.adminOrg.email, TEST_USERS.adminOrg.password, 'prisma-app.studioos.pro'],
    ['USUÁRIO', TEST_USERS.usuarioComum.email, TEST_USERS.usuarioComum.password, 'prisma-app.studioos.pro'],
    ['FORNECEDOR', TEST_USERS.fornecedor.email, TEST_USERS.fornecedor.password, 'fornecedores.studioos.pro'],
  ];
  
  table.forEach(row => {
    console.log(`${row[0].padEnd(15)} | ${row[1].padEnd(30)} | ${row[2].padEnd(15)} | ${row[3]}`);
  });
  
  console.log('='.repeat(60));
  console.log('🚀 Pronto para testes!');
  console.log('💡 Dica: Execute o roteiro de testes no browser para validar cada perfil');
}

async function main() {
  console.log('🚀 Criando usuários de teste no Supabase...');
  console.log(`🔗 URL: ${SUPABASE_URL}`);
  
  try {
    const results = {
      superAdmin: await createSuperAdmin(),
      adminOrg: await createAdminOrg(),
      usuarioComum: await createUsuarioComum(),
      fornecedor: await createFornecedor(),
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([key, success]) => {
      const icon = success ? '✅' : '❌';
      const name = {
        superAdmin: 'Super Admin',
        adminOrg: 'Admin Org',
        usuarioComum: 'Usuário Comum',
        fornecedor: 'Fornecedor',
      }[key];
      console.log(`${icon} ${name}: ${success ? 'CRIADO' : 'FALHOU'}`);
    });
    
    if (Object.values(results).every(r => r)) {
      await printSummary();
      process.exit(0);
    } else {
      console.log('\n⚠️ Alguns usuários não foram criados. Verifique os erros acima.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();
