import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar quantidade atual
    const { count: currentCount } = await supabaseAdmin
      .from('materiais')
      .select('*', { count: 'exact', head: true });

    if (currentCount && currentCount > 100) {
      return new Response(
        JSON.stringify({ message: 'Database already populated', count: currentCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting database population...');

    // Buscar arquivos JSON do origin
    const origin = req.headers.get('origin') || 'https://ab175f0d-b05f-4ac4-90f9-1bacdf43dd9b.lovableproject.com';
    
    const materialsRes = await fetch(`${origin}/data/seed-materials.json`);
    const confeccaoRes = await fetch(`${origin}/data/seed-servicos-confeccao.json`);
    const instalacaoRes = await fetch(`${origin}/data/seed-servicos-instalacao.json`);

    if (!materialsRes.ok || !confeccaoRes.ok || !instalacaoRes.ok) {
      throw new Error('Failed to fetch seed data files');
    }

    const materialsData = await materialsRes.json();
    const confeccaoData = await confeccaoRes.json();
    const instalacaoData = await instalacaoRes.json();

    console.log(`Processing ${materialsData.length} materials...`);

    // Inserir materiais em lotes de 100
    let materiaisImportados = 0;
    const batchSize = 100;
    
    for (let i = 0; i < materialsData.length; i += batchSize) {
      const batch = materialsData.slice(i, Math.min(i + batchSize, materialsData.length));
      const materialsToInsert = batch.map((item: any) => {
        const precoCusto = Number(item.precoCusto) / 100;
        const precoTabela = precoCusto * 1.615;
        
        return {
          codigo_item: item.codigoItem,
          nome: item.nome,
          categoria: item.categoria,
          unidade: item.unidade || 'M',
          largura_metro: item.larguraMetro || null,
          preco_custo: precoCusto,
          preco_tabela: precoTabela,
          margem_tabela_percent: 61.5,
          perda_percent: 10,
          ativo: item.ativo !== false,
        };
      });

      const { error } = await supabaseAdmin
        .from('materiais')
        .upsert(materialsToInsert, {
          onConflict: 'codigo_item',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Error inserting materials batch:', error);
        throw error;
      }
      
      materiaisImportados += batch.length;
      console.log(`Materials progress: ${materiaisImportados}/${materialsData.length}`);
    }

    // Inserir serviços de confecção
    console.log(`Processing ${confeccaoData.length} sewing services...`);
    const confeccaoToInsert = confeccaoData.map((item: any) => {
      const precoCusto = Number(item.precoCusto) / 100;
      const precoTabela = precoCusto * 1.55;
      
      return {
        codigo_item: item.codigoItem,
        nome_modelo: item.nomeModelo,
        unidade: item.unidade || 'mt',
        preco_custo: precoCusto,
        preco_tabela: precoTabela,
        margem_tabela_percent: 55,
        ativo: item.ativo !== false,
      };
    });

    const { error: confeccaoError } = await supabaseAdmin
      .from('servicos_confeccao')
      .upsert(confeccaoToInsert, {
        onConflict: 'codigo_item',
        ignoreDuplicates: false,
      });

    if (confeccaoError) {
      console.error('Error inserting sewing services:', confeccaoError);
      throw confeccaoError;
    }

    // Inserir serviços de instalação
    console.log(`Processing ${instalacaoData.length} installation services...`);
    const instalacaoToInsert = instalacaoData.map((item: any) => {
      const precoCustoPorPonto = Number(item.precoCustoPorPonto);
      const precoTabelaPorPonto = precoCustoPorPonto * 1.615;
      
      return {
        codigo_item: item.codigoItem,
        nome: item.nome,
        preco_custo_por_ponto: precoCustoPorPonto,
        preco_tabela_por_ponto: precoTabelaPorPonto,
        margem_tabela_percent: 61.5,
        ativo: item.ativo !== false,
      };
    });

    const { error: instalacaoError } = await supabaseAdmin
      .from('servicos_instalacao')
      .upsert(instalacaoToInsert, {
        onConflict: 'codigo_item',
        ignoreDuplicates: false,
      });

    if (instalacaoError) {
      console.error('Error inserting installation services:', instalacaoError);
      throw instalacaoError;
    }

    console.log('Database population completed!');

    return new Response(
      JSON.stringify({
        success: true,
        materialsCount: materiaisImportados,
        confeccaoCount: confeccaoData.length,
        instalacaoCount: instalacaoData.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Population error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
