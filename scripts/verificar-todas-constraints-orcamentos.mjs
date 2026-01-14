import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verificarTodasConstraints() {
  console.log('🔍 Verificando TODAS as constraints que referenciam orcamentos...\n');

  try {
    // Buscar todas as foreign keys que referenciam orcamentos
    const query = `
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        AND ccu.table_name = 'orcamentos'
        AND ccu.column_name = 'id'
      ORDER BY tc.table_name, kcu.column_name;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql: query });

    if (error) {
      // Tentar método alternativo via query direta
      console.log('⚠️  Não foi possível usar exec_sql, tentando método alternativo...\n');
      
      // Lista manual de tabelas conhecidas
      const tabelasConhecidas = [
        { tabela: 'cortina_items', coluna: 'orcamento_id', esperado: 'CASCADE' },
        { tabela: 'contas_receber', coluna: 'orcamento_id', esperado: 'CASCADE' },
        { tabela: 'contas_pagar', coluna: 'orcamento_id', esperado: 'CASCADE' },
        { tabela: 'oportunidades', coluna: 'orcamento_id', esperado: 'CASCADE' },
        { tabela: 'atividades_crm', coluna: 'orcamento_id', esperado: 'CASCADE' },
        { tabela: 'historico_descontos', coluna: 'orcamento_id', esperado: 'CASCADE' },
        { tabela: 'pedidos', coluna: 'orcamento_id', esperado: 'CASCADE' },
      ];

      console.log('📋 Verificando constraints conhecidas:\n');
      
      for (const item of tabelasConhecidas) {
        // Verificar se a tabela existe e tem a coluna
        const { data: checkData, error: checkError } = await supabase
          .from(item.tabela)
          .select(item.coluna)
          .limit(1);

        if (checkError && checkError.code !== 'PGRST116') {
          console.log(`   ✅ ${item.tabela}.${item.coluna} - Tabela existe`);
        } else if (checkError && checkError.code === 'PGRST116') {
          console.log(`   ⚠️  ${item.tabela}.${item.coluna} - Tabela não encontrada`);
        } else {
          console.log(`   ✅ ${item.tabela}.${item.coluna} - Tabela existe`);
        }
      }

      console.log('\n💡 Para verificar as constraints reais, execute este SQL no Supabase Dashboard:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(query);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  Nenhuma constraint encontrada (isso é estranho)');
      return;
    }

    console.log(`📊 Encontradas ${data.length} constraint(s):\n`);

    const problemas = [];
    const corretas = [];

    data.forEach((constraint, index) => {
      const status = constraint.delete_rule === 'CASCADE' ? '✅' : '❌';
      const info = `${status} ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name} (${constraint.delete_rule})`;
      
      if (constraint.delete_rule === 'CASCADE') {
        corretas.push(constraint);
        console.log(info);
      } else {
        problemas.push(constraint);
        console.log(info);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (problemas.length === 0) {
      console.log('✅ Todas as constraints estão configuradas como CASCADE!');
      console.log('   O problema pode ser outro (RLS, triggers, etc.)\n');
    } else {
      console.log(`❌ Encontradas ${problemas.length} constraint(s) que precisam ser corrigidas:\n`);
      
      console.log('📝 SQL para corrigir:\n');
      console.log('-- =============================================');
      console.log('-- FIX: Alterar constraints para ON DELETE CASCADE');
      console.log('-- =============================================\n');

      problemas.forEach((constraint, index) => {
        const constraintName = `${constraint.table_name}_${constraint.column_name}_fkey`;
        console.log(`-- ${index + 1}. ${constraint.table_name}`);
        console.log(`ALTER TABLE public.${constraint.table_name}`);
        console.log(`  DROP CONSTRAINT IF EXISTS ${constraintName};`);
        console.log('');
        console.log(`ALTER TABLE public.${constraint.table_name}`);
        console.log(`  ADD CONSTRAINT ${constraintName}`);
        console.log(`  FOREIGN KEY (${constraint.column_name})`);
        console.log(`  REFERENCES public.${constraint.foreign_table_name}(${constraint.foreign_column_name})`);
        console.log(`  ON DELETE CASCADE;`);
        console.log('');
      });
    }

    // Verificar também se há triggers que possam interferir
    console.log('\n🔍 Verificando triggers em orcamentos...\n');
    
    const triggerQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'orcamentos'
        AND event_object_schema = 'public';
    `;

    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerQuery });

    if (!triggerError && triggers && triggers.length > 0) {
      console.log(`📋 Encontrados ${triggers.length} trigger(s):`);
      triggers.forEach(t => {
        console.log(`   - ${t.trigger_name} (${t.event_manipulation})`);
      });
    } else {
      console.log('   (Não foi possível verificar triggers via API)');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

verificarTodasConstraints();
