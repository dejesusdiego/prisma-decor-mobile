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

    // Buscar todas as organizações ativas
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name');

    let totalOrcamentosAtualizados = 0;
    let totalVisitasAtualizadas = 0;
    let totalNotificacoesEmprestimo = 0;

    // Processar cada organização separadamente
    for (const org of (organizations || [])) {
      console.log(`Processando organização: ${org.name} (${org.id})`);
      
      // ========== ORÇAMENTOS ==========
      
      // Buscar configuração de dias para sem_resposta de orçamentos (por organização)
      const { data: configOrcamentos } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'dias_sem_resposta')
        .eq('organization_id', org.id)
        .maybeSingle();

      const diasSemRespostaOrcamentos = configOrcamentos?.valor ? Number(configOrcamentos.valor) : 7;
      
      // Calcular a data limite para orçamentos
      const dataLimiteOrcamentos = new Date();
      dataLimiteOrcamentos.setDate(dataLimiteOrcamentos.getDate() - diasSemRespostaOrcamentos);

      // Buscar orçamentos com status 'enviado' e status_updated_at anterior à data limite (por organização)
      const { data: orcamentosExpirados, error: fetchOrcError } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, status_updated_at')
        .eq('organization_id', org.id)
        .eq('status', 'enviado')
        .lt('status_updated_at', dataLimiteOrcamentos.toISOString());

      if (!fetchOrcError && orcamentosExpirados && orcamentosExpirados.length > 0) {
        console.log(`Org ${org.name}: ${orcamentosExpirados.length} orçamentos para atualizar`);

        const ids = orcamentosExpirados.map(o => o.id);
        
        const { error: updateOrcError } = await supabase
          .from('orcamentos')
          .update({ status: 'sem_resposta' })
          .in('id', ids);

        if (!updateOrcError) {
          totalOrcamentosAtualizados += orcamentosExpirados.length;
        }
      }

      // ========== SOLICITAÇÕES DE VISITA ==========
      
      // Buscar configuração de dias para sem_resposta de visitas (por organização)
      const { data: configVisitas } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'dias_sem_resposta_visitas')
        .eq('organization_id', org.id)
        .maybeSingle();

      const diasSemRespostaVisitas = configVisitas?.valor ? Number(configVisitas.valor) : 3;
      
      // Calcular a data limite para visitas
      const dataLimiteVisitas = new Date();
      dataLimiteVisitas.setDate(dataLimiteVisitas.getDate() - diasSemRespostaVisitas);

      // Buscar visitas com status 'pendente' e status_updated_at anterior à data limite (por organização)
      const { data: visitasExpiradas, error: fetchVisError } = await supabase
        .from('solicitacoes_visita')
        .select('id, nome, telefone, status_updated_at')
        .eq('organization_id', org.id)
        .eq('status', 'pendente')
        .lt('status_updated_at', dataLimiteVisitas.toISOString());

      if (!fetchVisError && visitasExpiradas && visitasExpiradas.length > 0) {
        console.log(`Org ${org.name}: ${visitasExpiradas.length} visitas para atualizar`);

        const visitaIds = visitasExpiradas.map(v => v.id);
        
        const { error: updateVisError } = await supabase
          .from('solicitacoes_visita')
          .update({ status: 'sem_resposta' })
          .in('id', visitaIds);

        if (!updateVisError) {
          totalVisitasAtualizadas += visitasExpiradas.length;
        }
      }

      // ========== EMPRÉSTIMOS ATRASADOS ==========
      
      // Buscar contas a receber de empréstimos atrasadas (por organização)
      const { data: emprestimosAtrasados, error: empError } = await supabase
        .from('contas_receber')
        .select('id, cliente_nome, valor_total, data_vencimento, created_by_user_id, organization_id')
        .eq('organization_id', org.id)
        .not('lancamento_origem_id', 'is', null)
        .in('status', ['pendente', 'parcial'])
        .lt('data_vencimento', new Date().toISOString().split('T')[0]);
      
      if (!empError && emprestimosAtrasados && emprestimosAtrasados.length > 0) {
        console.log(`Org ${org.name}: ${emprestimosAtrasados.length} empréstimos atrasados`);
        
        for (const emp of emprestimosAtrasados) {
          const diasAtraso = Math.floor((new Date().getTime() - new Date(emp.data_vencimento).getTime()) / (1000 * 60 * 60 * 24));
          
          const { error: notifError } = await supabase
            .from('notificacoes')
            .upsert({
              user_id: emp.created_by_user_id,
              tipo: 'emprestimo_atrasado',
              titulo: 'Empréstimo atrasado!',
              mensagem: `Empréstimo "${emp.cliente_nome}" (R$ ${emp.valor_total}) está atrasado há ${diasAtraso} dia(s)`,
              prioridade: 'urgente',
              referencia_tipo: 'emprestimo',
              referencia_id: emp.id,
              data_lembrete: new Date().toISOString(),
              organization_id: org.id
            }, { 
              onConflict: 'referencia_id,referencia_tipo',
              ignoreDuplicates: true 
            });
          
          if (!notifError) totalNotificacoesEmprestimo++;
        }
      }
    }

    console.log(`Total: ${totalOrcamentosAtualizados} orçamentos, ${totalVisitasAtualizadas} visitas, ${totalNotificacoesEmprestimo} notificações`);

    // ========== RESPOSTA ==========
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${totalOrcamentosAtualizados} orçamento(s) e ${totalVisitasAtualizadas} visita(s) atualizado(s) para "Sem Resposta"`,
        orcamentos: {
          updated: totalOrcamentosAtualizados
        },
        visitas: {
          updated: totalVisitasAtualizadas
        },
        notificacoes: {
          emprestimos: totalNotificacoesEmprestimo
        },
        organizationsProcessed: organizations?.length || 0
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
