import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando verificação de atrasos de produção...');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Executar verificação de atrasos de produção
    const { error: error1 } = await supabaseAdmin.rpc('verificar_atrasos_producao');
    if (error1) {
      console.error('Erro ao verificar atrasos de produção:', error1);
      throw error1;
    }
    console.log('verificar_atrasos_producao executada com sucesso');

    // Executar verificação de itens parados
    const { error: error2 } = await supabaseAdmin.rpc('verificar_itens_parados');
    if (error2) {
      console.error('Erro ao verificar itens parados:', error2);
      throw error2;
    }
    console.log('verificar_itens_parados executada com sucesso');

    const result = {
      success: true,
      message: 'Verificação de atrasos concluída com sucesso',
      timestamp: new Date().toISOString(),
      checks: ['verificar_atrasos_producao', 'verificar_itens_parados']
    };

    console.log('Resultado:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na verificação de atrasos:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
