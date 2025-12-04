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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configuração de dias para sem_resposta
    const { data: configData, error: configError } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'dias_sem_resposta')
      .maybeSingle();

    if (configError) {
      console.error('Erro ao buscar configuração:', configError);
      throw configError;
    }

    // Default 7 dias se não configurado
    const diasSemResposta = configData?.valor ? Number(configData.valor) : 7;
    
    console.log(`Verificando orçamentos enviados há mais de ${diasSemResposta} dias...`);

    // Calcular a data limite
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasSemResposta);

    // Buscar orçamentos com status 'enviado' e status_updated_at anterior à data limite
    const { data: orcamentosExpirados, error: fetchError } = await supabase
      .from('orcamentos')
      .select('id, codigo, cliente_nome, status_updated_at')
      .eq('status', 'enviado')
      .lt('status_updated_at', dataLimite.toISOString());

    if (fetchError) {
      console.error('Erro ao buscar orçamentos:', fetchError);
      throw fetchError;
    }

    if (!orcamentosExpirados || orcamentosExpirados.length === 0) {
      console.log('Nenhum orçamento expirado encontrado.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum orçamento expirado encontrado',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontrados ${orcamentosExpirados.length} orçamentos para atualizar`);

    // Atualizar status para 'sem_resposta'
    const ids = orcamentosExpirados.map(o => o.id);
    
    const { error: updateError } = await supabase
      .from('orcamentos')
      .update({ status: 'sem_resposta' })
      .in('id', ids);

    if (updateError) {
      console.error('Erro ao atualizar orçamentos:', updateError);
      throw updateError;
    }

    const orcamentosAtualizados = orcamentosExpirados.map(o => ({
      codigo: o.codigo,
      cliente: o.cliente_nome
    }));

    console.log('Orçamentos atualizados:', orcamentosAtualizados);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${orcamentosExpirados.length} orçamento(s) atualizado(s) para "Sem Resposta"`,
        updated: orcamentosExpirados.length,
        orcamentos: orcamentosAtualizados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Erro na função update-overdue-status:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
