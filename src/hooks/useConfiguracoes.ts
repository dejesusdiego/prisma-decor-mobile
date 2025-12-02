import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  ]
};

// Cache global para evitar múltiplas requisições
let cachedConfigs: Configuracoes | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(DEFAULT_CONFIGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarConfiguracoes = useCallback(async (forceRefresh = false) => {
    // Usar cache se válido e não forçar refresh
    if (!forceRefresh && cachedConfigs && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setConfiguracoes(cachedConfigs);
      setLoading(false);
      return cachedConfigs;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('configuracoes_sistema')
        .select('chave, valor');

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
          }
        }
      }

      // Atualizar cache
      cachedConfigs = configs;
      cacheTimestamp = Date.now();
      
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
  }, []);

  const salvarConfiguracao = useCallback(async (chave: string, valor: unknown) => {
    try {
      const { error: updateError } = await supabase
        .from('configuracoes_sistema')
        .update({ valor: valor as never })
        .eq('chave', chave);

      if (updateError) throw updateError;

      // Invalidar cache
      cachedConfigs = null;
      cacheTimestamp = 0;

      // Recarregar configurações
      await carregarConfiguracoes(true);
      return true;
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      throw err;
    }
  }, [carregarConfiguracoes]);

  const invalidarCache = useCallback(() => {
    cachedConfigs = null;
    cacheTimestamp = 0;
  }, []);

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

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
export function getConfiguracoesSync(): Configuracoes {
  return cachedConfigs || DEFAULT_CONFIGS;
}

// Função assíncrona para buscar configurações (para uso em funções de cálculo)
export async function fetchConfiguracoes(): Promise<Configuracoes> {
  if (cachedConfigs && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedConfigs;
  }

  try {
    const { data, error } = await supabase
      .from('configuracoes_sistema')
      .select('chave, valor');

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
        }
      }
    }

    cachedConfigs = configs;
    cacheTimestamp = Date.now();
    return configs;
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    return DEFAULT_CONFIGS;
  }
}
