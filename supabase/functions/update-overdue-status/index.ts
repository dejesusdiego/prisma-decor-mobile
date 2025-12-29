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

    // ========== ORÇAMENTOS ==========
    
    // Buscar configuração de dias para sem_resposta de orçamentos
    const { data: configOrcamentos, error: configOrcError } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'dias_sem_resposta')
      .maybeSingle();

    if (configOrcError) {
      console.error('Erro ao buscar configuração de orçamentos:', configOrcError);
    }

    const diasSemRespostaOrcamentos = configOrcamentos?.valor ? Number(configOrcamentos.valor) : 7;
    
    console.log(`Verificando orçamentos enviados há mais de ${diasSemRespostaOrcamentos} dias...`);

    // Calcular a data limite para orçamentos
    const dataLimiteOrcamentos = new Date();
    dataLimiteOrcamentos.setDate(dataLimiteOrcamentos.getDate() - diasSemRespostaOrcamentos);

    // Buscar orçamentos com status 'enviado' e status_updated_at anterior à data limite
    const { data: orcamentosExpirados, error: fetchOrcError } = await supabase
      .from('orcamentos')
      .select('id, codigo, cliente_nome, status_updated_at')
      .eq('status', 'enviado')
      .lt('status_updated_at', dataLimiteOrcamentos.toISOString());

    let orcamentosAtualizados = 0;
    
    if (fetchOrcError) {
      console.error('Erro ao buscar orçamentos:', fetchOrcError);
    } else if (orcamentosExpirados && orcamentosExpirados.length > 0) {
      console.log(`Encontrados ${orcamentosExpirados.length} orçamentos para atualizar`);

      const ids = orcamentosExpirados.map(o => o.id);
      
      const { error: updateOrcError } = await supabase
        .from('orcamentos')
        .update({ status: 'sem_resposta' })
        .in('id', ids);

      if (updateOrcError) {
        console.error('Erro ao atualizar orçamentos:', updateOrcError);
      } else {
        orcamentosAtualizados = orcamentosExpirados.length;
        console.log('Orçamentos atualizados:', orcamentosExpirados.map(o => ({
          codigo: o.codigo,
          cliente: o.cliente_nome
        })));
      }
    } else {
      console.log('Nenhum orçamento expirado encontrado.');
    }

    // ========== SOLICITAÇÕES DE VISITA ==========
    
    // Buscar configuração de dias para sem_resposta de visitas
    const { data: configVisitas, error: configVisError } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'dias_sem_resposta_visitas')
      .maybeSingle();

    if (configVisError) {
      console.error('Erro ao buscar configuração de visitas:', configVisError);
    }

    const diasSemRespostaVisitas = configVisitas?.valor ? Number(configVisitas.valor) : 3;
    
    console.log(`Verificando visitas pendentes há mais de ${diasSemRespostaVisitas} dias...`);

    // Calcular a data limite para visitas
    const dataLimiteVisitas = new Date();
    dataLimiteVisitas.setDate(dataLimiteVisitas.getDate() - diasSemRespostaVisitas);

    // Buscar visitas com status 'pendente' e status_updated_at anterior à data limite
    const { data: visitasExpiradas, error: fetchVisError } = await supabase
      .from('solicitacoes_visita')
      .select('id, nome, telefone, status_updated_at')
      .eq('status', 'pendente')
      .lt('status_updated_at', dataLimiteVisitas.toISOString());

    let visitasAtualizadas = 0;
    
    if (fetchVisError) {
      console.error('Erro ao buscar visitas:', fetchVisError);
    } else if (visitasExpiradas && visitasExpiradas.length > 0) {
      console.log(`Encontradas ${visitasExpiradas.length} visitas para atualizar`);

      const visitaIds = visitasExpiradas.map(v => v.id);
      
      const { error: updateVisError } = await supabase
        .from('solicitacoes_visita')
        .update({ status: 'sem_resposta' })
        .in('id', visitaIds);

      if (updateVisError) {
        console.error('Erro ao atualizar visitas:', updateVisError);
      } else {
        visitasAtualizadas = visitasExpiradas.length;
        console.log('Visitas atualizadas:', visitasExpiradas.map(v => ({
          nome: v.nome,
          telefone: v.telefone
        })));
      }
    } else {
      console.log('Nenhuma visita expirada encontrada.');
    }

    // ========== EMPRÉSTIMOS ATRASADOS ==========
    
    console.log('Verificando empréstimos atrasados...');
    
    // Buscar contas a receber de empréstimos atrasadas
    const { data: emprestimosAtrasados, error: empError } = await supabase
      .from('contas_receber')
      .select('id, cliente_nome, valor_total, data_vencimento, created_by_user_id')
      .not('lancamento_origem_id', 'is', null)
      .in('status', ['pendente', 'parcial'])
      .lt('data_vencimento', new Date().toISOString().split('T')[0]);
    
    let notificacoesEmprestimo = 0;
    
    if (empError) {
      console.error('Erro ao buscar empréstimos atrasados:', empError);
    } else if (emprestimosAtrasados && emprestimosAtrasados.length > 0) {
      console.log(`Encontrados ${emprestimosAtrasados.length} empréstimos atrasados`);
      
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
            data_lembrete: new Date().toISOString()
          }, { 
            onConflict: 'referencia_id,referencia_tipo',
            ignoreDuplicates: true 
          });
        
        if (!notifError) notificacoesEmprestimo++;
      }
    }

    // ========== RESPOSTA ==========
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${orcamentosAtualizados} orçamento(s) e ${visitasAtualizadas} visita(s) atualizado(s) para "Sem Resposta"`,
        orcamentos: {
          updated: orcamentosAtualizados,
          diasConfiguracao: diasSemRespostaOrcamentos
        },
        visitas: {
          updated: visitasAtualizadas,
          diasConfiguracao: diasSemRespostaVisitas
        }
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
