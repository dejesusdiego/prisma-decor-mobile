import { supabase } from '@/integrations/supabase/client';

/**
 * Popula o banco de dados com os dados iniciais dos arquivos JSON
 * Esta função deve ser executada uma única vez para garantir que o sistema
 * tenha todos os materiais e serviços necessários
 */
export async function popularDadosIniciais() {
  try {
    console.log('🔄 Verificando se é necessário popular dados iniciais...');

    // Verificar quantos materiais existem
    const { count: materiaisCount } = await supabase
      .from('materiais')
      .select('*', { count: 'exact', head: true });

    const { count: confeccaoCount } = await supabase
      .from('servicos_confeccao')
      .select('*', { count: 'exact', head: true });

    const { count: instalacaoCount } = await supabase
      .from('servicos_instalacao')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Contagem atual:', {
      materiais: materiaisCount,
      confeccao: confeccaoCount,
      instalacao: instalacaoCount,
    });

    // Se já existem dados suficientes, não fazer nada
    if ((materiaisCount || 0) > 500 && (confeccaoCount || 0) > 30) {
      console.log('✅ Dados já populados, nenhuma ação necessária');
      return { success: true, message: 'Dados já existem' };
    }

    console.log('📦 Carregando dados dos arquivos JSON...');

    // Carregar materiais
    const materialsResponse = await fetch('/data/materials.json');
    const materialsData = await materialsResponse.json();

    console.log(`📦 ${materialsData.length} materiais encontrados no JSON`);

    // Inserir materiais em lotes
    const materiaisFormatados = materialsData.map((item: any) => ({
      codigo_item: item.codigoItem,
      nome: item.nome,
      categoria: item.categoria,
      unidade: item.unidade || 'M',
      largura_metro: item.larguraMetro || null,
      preco_custo: Number(item.precoCusto) / 100,
      preco_tabela: (Number(item.precoCusto) / 100) * 1.615,
      margem_tabela_percent: 61.5,
      perda_percent: 10,
      ativo: item.ativo !== false,
    }));

    // Inserir em lotes de 100
    const batchSize = 100;
    for (let i = 0; i < materiaisFormatados.length; i += batchSize) {
      const batch = materiaisFormatados.slice(i, i + batchSize);
      const { error } = await supabase
        .from('materiais')
        .upsert(batch, { onConflict: 'codigo_item', ignoreDuplicates: false });

      if (error) {
        console.error(`❌ Erro ao inserir lote ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`✅ Lote ${i / batchSize + 1} de materiais inserido (${batch.length} itens)`);
    }

    // Carregar serviços de confecção
    const confeccaoResponse = await fetch('/data/servicos_confeccao.json');
    const confeccaoData = await confeccaoResponse.json();

    console.log(`🧵 ${confeccaoData.length} serviços de confecção encontrados no JSON`);

    const confeccaoFormatados = confeccaoData.map((item: any) => ({
      codigo_item: item.codigoItem,
      nome_modelo: item.nomeModelo,
      unidade: item.unidade || 'mt',
      preco_custo: Number(item.precoCusto) / 100,
      preco_tabela: (Number(item.precoCusto) / 100) * 1.55,
      margem_tabela_percent: 55,
      ativo: item.ativo !== false,
    }));

    const { error: confeccaoError } = await supabase
      .from('servicos_confeccao')
      .upsert(confeccaoFormatados, { onConflict: 'codigo_item', ignoreDuplicates: false });

    if (confeccaoError) {
      console.error('❌ Erro ao inserir serviços de confecção:', confeccaoError);
      throw confeccaoError;
    }

    console.log('✅ Serviços de confecção inseridos');

    // Carregar serviços de instalação
    const instalacaoResponse = await fetch('/data/servicos_instalacao.json');
    const instalacaoData = await instalacaoResponse.json();

    console.log(`🔨 ${instalacaoData.length} serviços de instalação encontrados no JSON`);

    const instalacaoFormatados = instalacaoData.map((item: any) => ({
      codigo_item: item.codigoItem,
      nome: item.nome,
      preco_custo_por_ponto: Number(item.precoCustoPorPonto),
      preco_tabela_por_ponto: Number(item.precoCustoPorPonto) * 1.615,
      margem_tabela_percent: 61.5,
      ativo: item.ativo !== false,
    }));

    const { error: instalacaoError } = await supabase
      .from('servicos_instalacao')
      .upsert(instalacaoFormatados, { onConflict: 'codigo_item', ignoreDuplicates: false });

    if (instalacaoError) {
      console.error('❌ Erro ao inserir serviços de instalação:', instalacaoError);
      throw instalacaoError;
    }

    console.log('✅ Serviços de instalação inseridos');

    // Verificar contagem final
    const { count: finalMateriaisCount } = await supabase
      .from('materiais')
      .select('*', { count: 'exact', head: true });

    const { count: finalConfeccaoCount } = await supabase
      .from('servicos_confeccao')
      .select('*', { count: 'exact', head: true });

    const { count: finalInstalacaoCount } = await supabase
      .from('servicos_instalacao')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Contagem final:', {
      materiais: finalMateriaisCount,
      confeccao: finalConfeccaoCount,
      instalacao: finalInstalacaoCount,
    });

    return {
      success: true,
      message: 'Dados populados com sucesso',
      counts: {
        materiais: finalMateriaisCount,
        confeccao: finalConfeccaoCount,
        instalacao: finalInstalacaoCount,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao popular dados iniciais:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
