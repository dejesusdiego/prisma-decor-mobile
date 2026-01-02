import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface UseSalvarItemOptions<T> {
  /** Nome da tabela no Supabase */
  table: TableName;
  /** Função para preparar dados antes de salvar */
  prepararDados: (item: T, orcamentoId: string) => Record<string, unknown>;
  /** Função de validação - retorna mensagem de erro ou null */
  validar?: (item: T) => string | null;
  /** Callback após salvar com sucesso */
  onSuccess?: (data: Record<string, unknown>, item: T) => void;
  /** Mensagem de sucesso */
  mensagemSucesso?: string;
  /** Mensagem de erro */
  mensagemErro?: string;
}

interface UseSalvarItemReturn<T> {
  salvar: (item: T, orcamentoId: string) => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>;
}

/**
 * Hook reutilizável para salvar items no banco de dados
 * Encapsula: validação, insert/update, feedback de sucesso/erro
 */
export function useSalvarItem<T extends { id?: string }>(
  options: UseSalvarItemOptions<T>
): UseSalvarItemReturn<T> {
  const {
    table,
    prepararDados,
    validar,
    onSuccess,
    mensagemSucesso = 'Item salvo com sucesso',
    mensagemErro = 'Não foi possível salvar o item',
  } = options;

  const salvar = useCallback(async (item: T, orcamentoId: string) => {
    try {
      // Validar
      if (validar) {
        const erro = validar(item);
        if (erro) {
          toast({
            title: 'Atenção',
            description: erro,
            variant: 'destructive',
          });
          return { success: false, error: erro };
        }
      }

      // Preparar dados
      const dados = prepararDados(item, orcamentoId);

      // Insert ou Update usando query builder genérico
      let result;
      if (item.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query = supabase.from(table as any).update(dados).eq('id', item.id).select().single();
        result = await query;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query = supabase.from(table as any).insert(dados).select().single();
        result = await query;
      }

      if (result.error) throw result.error;

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(result.data as Record<string, unknown>, item);
      }

      toast({
        title: 'Sucesso',
        description: mensagemSucesso,
      });

      return { success: true, data: result.data as Record<string, unknown> };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : mensagemErro;
      console.error(`Erro ao salvar em ${table}:`, error);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  }, [table, prepararDados, validar, onSuccess, mensagemSucesso, mensagemErro]);

  return { salvar };
}
