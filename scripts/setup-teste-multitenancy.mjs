/**
 * Script de Teste Multi-Tenancy
 * 
 * Este script cria uma segunda organização para testar o isolamento de dados.
 * 
 * Uso:
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "sua_key"
 *   node scripts/setup-teste-multitenancy.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Dados da segunda organização de teste
const ORG_TESTE = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Decorações ABC (Teste)',
  slug: 'decoracoes-abc',
  email: 'contato@decoracoesabc.com.br',
  phone: '(11) 99999-9999',
  cnpj: '12.345.678/0001-90',
  active: true,
  primary_color: '#2563eb' // azul
};

// Dados do usuário owner da org de teste
const USER_TESTE = {
  email: 'owner@decoracoesabc.com.br',
  password: 'Teste@123456',
  name: 'João Silva (Owner ABC)'
};

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       SETUP MULTI-TENANCY - ORGANIZAÇÃO DE TESTE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Configure a SUPABASE_SERVICE_ROLE_KEY!');
    console.log('\nNo PowerShell:');
    console.log('$env:SUPABASE_SERVICE_ROLE_KEY = "sua_key"');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // ─────────────────────────────────────────────────────────────
    // PASSO 1: Criar a organização de teste
    // ─────────────────────────────────────────────────────────────
    console.log('📦 PASSO 1: Criando organização de teste...\n');

    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .or(`slug.eq.${ORG_TESTE.slug},id.eq.${ORG_TESTE.id}`)
      .maybeSingle();

    if (existingOrg) {
      console.log(`   ⚠️  Organização "${existingOrg.name}" já existe (ID: ${existingOrg.id})`);
    } else {
      const { error: orgError } = await supabase
        .from('organizations')
        .insert(ORG_TESTE);

      if (orgError) {
        throw new Error(`Erro ao criar organização: ${orgError.message}`);
      }
      console.log(`   ✅ Organização "${ORG_TESTE.name}" criada com sucesso!`);
    }

    // ─────────────────────────────────────────────────────────────
    // PASSO 2: Criar usuário owner para a org de teste
    // ─────────────────────────────────────────────────────────────
    console.log('\n👤 PASSO 2: Criando usuário owner...\n');

    // Verificar se usuário já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === USER_TESTE.email);

    let userId;

    if (existingUser) {
      console.log(`   ⚠️  Usuário ${USER_TESTE.email} já existe (ID: ${existingUser.id})`);
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: USER_TESTE.email,
        password: USER_TESTE.password,
        email_confirm: true,
        user_metadata: { name: USER_TESTE.name }
      });

      if (userError) {
        throw new Error(`Erro ao criar usuário: ${userError.message}`);
      }

      userId = newUser.user.id;
      console.log(`   ✅ Usuário ${USER_TESTE.email} criado com sucesso!`);
    }

    // ─────────────────────────────────────────────────────────────
    // PASSO 3: Vincular usuário à organização como owner
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔗 PASSO 3: Vinculando usuário à organização...\n');

    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', ORG_TESTE.id)
      .maybeSingle();

    if (existingMember) {
      console.log('   ⚠️  Usuário já é membro da organização');
    } else {
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: ORG_TESTE.id,
          role: 'owner'
        });

      if (memberError) {
        throw new Error(`Erro ao vincular usuário: ${memberError.message}`);
      }
      console.log('   ✅ Usuário vinculado como owner da organização!');
    }

    // ─────────────────────────────────────────────────────────────
    // PASSO 4: Criar role admin para o usuário
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔐 PASSO 4: Configurando permissões...\n');

    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRole) {
      console.log('   ⚠️  Usuário já tem role configurado');
    } else {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (roleError) {
        throw new Error(`Erro ao criar role: ${roleError.message}`);
      }
      console.log('   ✅ Role admin configurado!');
    }

    // ─────────────────────────────────────────────────────────────
    // PASSO 5: Criar dados de exemplo para a org de teste
    // ─────────────────────────────────────────────────────────────
    console.log('\n📊 PASSO 5: Criando dados de exemplo...\n');

    // Criar alguns materiais de exemplo
    const materiaisExemplo = [
      {
        nome: 'Tecido Linho Natural ABC',
        categoria: 'tecido',
        preco_custo: 45.00,
        preco_tabela: 89.90,
        margem_tabela_percent: 100,
        unidade: 'm',
        organization_id: ORG_TESTE.id,
        ativo: true
      },
      {
        nome: 'Trilho Alumínio Premium ABC',
        categoria: 'trilho',
        preco_custo: 35.00,
        preco_tabela: 69.90,
        margem_tabela_percent: 100,
        unidade: 'm',
        organization_id: ORG_TESTE.id,
        ativo: true
      }
    ];

    const { error: matError } = await supabase
      .from('materiais')
      .upsert(materiaisExemplo, { onConflict: 'id' });

    if (matError) {
      console.log(`   ⚠️  Erro ao criar materiais: ${matError.message}`);
    } else {
      console.log('   ✅ Materiais de exemplo criados!');
    }

    // Criar um contato de exemplo
    const contatoExemplo = {
      nome: 'Maria Santos (Cliente ABC)',
      telefone: '(11) 98888-8888',
      email: 'maria@email.com',
      tipo: 'lead',
      organization_id: ORG_TESTE.id,
      created_by_user_id: userId
    };

    const { error: contatoError } = await supabase
      .from('contatos')
      .insert(contatoExemplo);

    if (contatoError && !contatoError.message.includes('duplicate')) {
      console.log(`   ⚠️  Erro ao criar contato: ${contatoError.message}`);
    } else {
      console.log('   ✅ Contato de exemplo criado!');
    }

    // ─────────────────────────────────────────────────────────────
    // RESUMO
    // ─────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                      ✅ SETUP COMPLETO!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 ORGANIZAÇÕES PARA TESTE:\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ ORG 1: Prisma Decor (existente)                             │');
    console.log('│   • Usuário: carlosmartins2187@gmail.com                    │');
    console.log('│   • Deve ver APENAS dados da Prisma                         │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ ORG 2: Decorações ABC (nova)                                │');
    console.log(`│   • Usuário: ${USER_TESTE.email}                       │`);
    console.log(`│   • Senha: ${USER_TESTE.password}                                 │`);
    console.log('│   • Deve ver APENAS dados da ABC                            │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    console.log('\n🧪 COMO TESTAR:\n');
    console.log('1. Acesse https://prisma-decor-mobile.vercel.app');
    console.log('2. Login com carlosmartins2187@gmail.com → veja os dados');
    console.log('3. Logout');
    console.log(`4. Login com ${USER_TESTE.email} → deve ver dados DIFERENTES`);
    console.log('5. Se cada um vê apenas seus dados, MULTI-TENANCY FUNCIONANDO! ✅\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

main();
