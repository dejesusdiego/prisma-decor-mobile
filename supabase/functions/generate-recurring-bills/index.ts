import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria_id: string | null;
  forma_pagamento_id: string | null;
  fornecedor: string | null;
  observacoes: string | null;
  recorrente: boolean;
  frequencia_recorrencia: string | null;
  created_by_user_id: string;
}

function addInterval(date: Date, frequencia: string): Date {
  const newDate = new Date(date);
  
  switch (frequencia) {
    case 'semanal':
      newDate.setDate(newDate.getDate() + 7);
      break;
    case 'quinzenal':
      newDate.setDate(newDate.getDate() + 15);
      break;
    case 'mensal':
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case 'bimestral':
      newDate.setMonth(newDate.getMonth() + 2);
      break;
    case 'trimestral':
      newDate.setMonth(newDate.getMonth() + 3);
      break;
    case 'semestral':
      newDate.setMonth(newDate.getMonth() + 6);
      break;
    case 'anual':
      newDate.setFullYear(newDate.getFullYear() + 1);
      break;
    default:
      newDate.setMonth(newDate.getMonth() + 1); // Default mensal
  }
  
  return newDate;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Iniciando geração de contas recorrentes...');
    
    const hoje = new Date();
    const proximoMes = new Date(hoje);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    
    // Buscar todas as contas recorrentes pagas ou com vencimento passado
    const { data: contasRecorrentes, error: fetchError } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('recorrente', true)
      .not('frequencia_recorrencia', 'is', null)
      .in('status', ['pago', 'pendente', 'atrasado']);
    
    if (fetchError) {
      console.error('Erro ao buscar contas recorrentes:', fetchError);
      throw fetchError;
    }
    
    console.log(`Encontradas ${contasRecorrentes?.length || 0} contas recorrentes`);
    
    let contasGeradas = 0;
    let contasIgnoradas = 0;
    const erros: string[] = [];
    
    for (const conta of (contasRecorrentes || []) as ContaPagar[]) {
      try {
        const dataVencimentoAtual = new Date(conta.data_vencimento);
        const frequencia = conta.frequencia_recorrencia || 'mensal';
        
        // Calcular próxima data de vencimento
        const proximaData = addInterval(dataVencimentoAtual, frequencia);
        const proximaDataStr = formatDate(proximaData);
        
        // Verificar se a próxima data está dentro do próximo período (até 35 dias à frente)
        const limiteFuturo = new Date(hoje);
        limiteFuturo.setDate(limiteFuturo.getDate() + 35);
        
        if (proximaData > limiteFuturo) {
          console.log(`Conta ${conta.id} - próxima data ${proximaDataStr} muito distante, ignorando`);
          contasIgnoradas++;
          continue;
        }
        
        // Verificar se já existe conta com mesma descrição e data de vencimento
        const { data: existente, error: checkError } = await supabase
          .from('contas_pagar')
          .select('id')
          .eq('descricao', conta.descricao)
          .eq('data_vencimento', proximaDataStr)
          .eq('created_by_user_id', conta.created_by_user_id)
          .maybeSingle();
        
        if (checkError) {
          console.error(`Erro ao verificar duplicata para conta ${conta.id}:`, checkError);
          erros.push(`Conta ${conta.id}: ${checkError.message}`);
          continue;
        }
        
        if (existente) {
          console.log(`Conta ${conta.id} - já existe conta para ${proximaDataStr}, ignorando`);
          contasIgnoradas++;
          continue;
        }
        
        // Criar nova conta com rastreamento da origem
        const { error: insertError } = await supabase
          .from('contas_pagar')
          .insert({
            descricao: conta.descricao,
            valor: conta.valor,
            data_vencimento: proximaDataStr,
            categoria_id: conta.categoria_id,
            forma_pagamento_id: conta.forma_pagamento_id,
            fornecedor: conta.fornecedor,
            observacoes: `Gerada automaticamente a partir de conta recorrente. ${conta.observacoes || ''}`.trim(),
            recorrente: true,
            frequencia_recorrencia: conta.frequencia_recorrencia,
            created_by_user_id: conta.created_by_user_id,
            status: 'pendente',
            conta_origem_id: conta.id
          });
        
        if (insertError) {
          console.error(`Erro ao criar conta para ${conta.id}:`, insertError);
          erros.push(`Conta ${conta.id}: ${insertError.message}`);
          continue;
        }
        
        console.log(`Conta gerada: ${conta.descricao} para ${proximaDataStr}`);
        contasGeradas++;
        
      } catch (err) {
        console.error(`Erro processando conta ${conta.id}:`, err);
        erros.push(`Conta ${conta.id}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }
    
    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      resumo: {
        total_recorrentes: contasRecorrentes?.length || 0,
        contas_geradas: contasGeradas,
        contas_ignoradas: contasIgnoradas,
        erros: erros.length
      },
      erros: erros.length > 0 ? erros : undefined
    };
    
    console.log('Resultado:', JSON.stringify(resultado));
    
    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});