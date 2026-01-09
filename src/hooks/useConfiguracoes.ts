import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

export interface CoeficientesPorTipo {
  wave: number;
  prega: number;
  painel: number;
  rolo: number;
  horizontal: number;
  vertical: number;
  romana: number;
  celular: number;
  madeira: number;
  outro: number;
  [key: string]: number;
}

export interface ServicosPorTipoCortina {
  wave: string[];
  prega: string[];
  painel: string[];
  rolo: string[];
  [key: string]: string[];
}

export interface OpcaoMargem {
  label: string;
  valor: number;
}

export interface Configuracoes {
  coeficientesTecido: CoeficientesPorTipo;
  coeficientesForro: CoeficientesPorTipo;
  servicosPorTipoCortina: ServicosPorTipoCortina;
  servicoForroPadrao: string | null;
  opcoesMargem: OpcaoMargem[];
  opcoesAmbiente: string[];
  diasSemResposta: number;
  diasSemRespostaVisitas: number;
}

const DEFAULT_CONFIGS: Configuracoes = {
  coeficientesTecido: {
    wave: 3.5, prega: 3.5, painel: 2.5, rolo: 3.5,
    horizontal: 1.0, vertical: 1.0, romana: 1.0, celular: 1.0, madeira: 1.0, outro: 1.0
  },
  coeficientesForro: {
    wave: 2.5, prega: 2.5, painel: 2.5, rolo: 2.5,
    horizontal: 1.0, vertical: 1.0, romana: 1.0, celular: 1.0, madeira: 1.0, outro: 1.0
  },
  servicosPorTipoCortina: { wave: [], prega: [], painel: [], rolo: [] },
  servicoForroPadrao: null,
  opcoesMargem: [
    { label: 'Baixa (40%)', valor: 40 },
    { label: 'Padrão (61.5%)', valor: 61.5 },
    { label: 'Premium (80%)', valor: 80 }
  ],
  opcoesAmbiente: [
    'Sala de Estar', 'Sala de Jantar', 'Quarto', 'Cozinha',
    'Escritório', 'Varanda', 'Banheiro', 'Lavanderia', 'Área Externa', 'Outros'
  ],
  diasSemResposta: 7,
  diasSemRespostaVisitas: 3
};

// Cache global por organização para evitar múltiplas requisições
const cachedConfigsMap = new Map<string, Configuracoes>();
const cacheTimestampMap = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useConfiguracoes() {
  const { organizationId } = useOrganization();
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(DEFAULT_CONFIGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarConfiguracoes = useCallback(async (forceRefresh = false) => {
    if (!organizationId) {
      setConfiguracoes(DEFAULT_CONFIGS);
      setLoading(false);
      return DEFAULT_CONFIGS;
    }

    // Usar cache se válido e não forçar refresh
    const cachedConfigs = cachedConfigsMap.get(organizationId);
    const cacheTimestamp = cacheTimestampMap.get(organizationId) || 0;
    
    if (!forceRefresh && cachedConfigs && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setConfiguracoes(cachedConfigs);
      setLoading(false);
      return cachedConfigs;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('configuracoes_sistema')
        .select('chave, valor')
        .eq('organization_id', organizationId);

      if (fetchError) throw fetchError;

      const configs: Configuracoes = { ...DEFAULT_CONFIGS };

      if (data) {
        for (const item of data) {
          switch (item.chave) {
            case 'coeficientes_tecido':
              configs.coeficientesTecido = item.valor as CoeficientesPorTipo;
              break;
            case 'coeficientes_forro':
              configs.coeficientesForro = item.valor as CoeficientesPorTipo;
              break;
            case 'servicos_por_tipo_cortina':
              configs.servicosPorTipoCortina = item.valor as ServicosPorTipoCortina;
              break;
            case 'servico_forro_padrao':
              configs.servicoForroPadrao = item.valor as string | null;
              break;
          case 'opcoes_margem':
              configs.opcoesMargem = item.valor as unknown as OpcaoMargem[];
              break;
            case 'opcoes_ambiente':
              configs.opcoesAmbiente = item.valor as string[];
              break;
            case 'dias_sem_resposta':
              configs.diasSemResposta = Number(item.valor) || 7;
              break;
            case 'dias_sem_resposta_visitas':
              configs.diasSemRespostaVisitas = Number(item.valor) || 3;
              break;
          }
        }
      }

      // Atualizar cache por organização
      cachedConfigsMap.set(organizationId, configs);
      cacheTimestampMap.set(organizationId, Date.now());
      
      setConfiguracoes(configs);
      setError(null);
      return configs;
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações');
      return DEFAULT_CONFIGS;
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const salvarConfiguracao = useCallback(async (chave: string, valor: unknown) => {
    if (!organizationId) throw new Error('Organization ID required');
    
    try {
      const { error: updateError } = await supabase
        .from('configuracoes_sistema')
        .update({ valor: valor as never })
        .eq('chave', chave)
        .eq('organization_id', organizationId);

      if (updateError) throw updateError;

      // Invalidar cache para esta organização
      cachedConfigsMap.delete(organizationId);
      cacheTimestampMap.delete(organizationId);

      // Recarregar configurações
      await carregarConfiguracoes(true);
      return true;
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      throw err;
    }
  }, [carregarConfiguracoes, organizationId]);

  const invalidarCache = useCallback(() => {
    if (organizationId) {
      cachedConfigsMap.delete(organizationId);
      cacheTimestampMap.delete(organizationId);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      carregarConfiguracoes();
    }
  }, [organizationId, carregarConfiguracoes]);

  return {
    configuracoes,
    loading,
    error,
    carregarConfiguracoes,
    salvarConfiguracao,
    invalidarCache
  };
}

// Função utilitária para buscar configurações de forma síncrona (usa cache)
// Nota: Esta função é usada para acesso rápido ao cache global, retorna configs default se não houver cache
export function getConfiguracoesSync(organizationId?: string): Configuracoes {
  if (organizationId && cachedConfigsMap.has(organizationId)) {
    return cachedConfigsMap.get(organizationId)!;
  }
  // Retorna primeira organização em cache ou default
  const firstCached = cachedConfigsMap.values().next().value;
  return firstCached || DEFAULT_CONFIGS;
}

// Função assíncrona para buscar configurações (para uso em funções de cálculo)
export async function fetchConfiguracoes(organizationId?: string): Promise<Configuracoes> {
  // Se tiver cache válido para a organização, retornar
  if (organizationId) {
    const cached = cachedConfigsMap.get(organizationId);
    const timestamp = cacheTimestampMap.get(organizationId) || 0;
    if (cached && Date.now() - timestamp < CACHE_DURATION) {
      return cached;
    }
  }

  try {
    let query = supabase.from('configuracoes_sistema').select('chave, valor');
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    const configs: Configuracoes = { ...DEFAULT_CONFIGS };

    if (data) {
      for (const item of data) {
        switch (item.chave) {
          case 'coeficientes_tecido':
            configs.coeficientesTecido = item.valor as CoeficientesPorTipo;
            break;
          case 'coeficientes_forro':
            configs.coeficientesForro = item.valor as CoeficientesPorTipo;
            break;
          case 'servicos_por_tipo_cortina':
            configs.servicosPorTipoCortina = item.valor as ServicosPorTipoCortina;
            break;
          case 'servico_forro_padrao':
            configs.servicoForroPadrao = item.valor as string | null;
            break;
          case 'opcoes_margem':
              configs.opcoesMargem = item.valor as unknown as OpcaoMargem[];
              break;
          case 'opcoes_ambiente':
            configs.opcoesAmbiente = item.valor as string[];
            break;
          case 'dias_sem_resposta':
            configs.diasSemResposta = Number(item.valor) || 7;
            break;
          case 'dias_sem_resposta_visitas':
            configs.diasSemRespostaVisitas = Number(item.valor) || 3;
            break;
        }
      }
    }

    // Atualizar cache se tiver organizationId
    if (organizationId) {
      cachedConfigsMap.set(organizationId, configs);
      cacheTimestampMap.set(organizationId, Date.now());
    }
    
    return configs;
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    return DEFAULT_CONFIGS;
  }
}
