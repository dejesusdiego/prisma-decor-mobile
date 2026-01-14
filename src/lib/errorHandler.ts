/**
 * Sistema centralizado de tratamento de erros
 * Converte erros técnicos em mensagens amigáveis ao usuário
 */

import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { showError, showSuccess } from './toastMessages';

/**
 * Tipos de erro conhecidos do Supabase
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  CONSTRAINT = 'constraint',
  UNKNOWN = 'unknown',
}

/**
 * Interface para erro tratado
 */
export interface HandledError {
  type: ErrorType;
  message: string;
  userMessage: string;
  technicalMessage?: string;
  code?: string;
  hint?: string;
}

/**
 * Mapeia códigos de erro do PostgreSQL para mensagens amigáveis
 */
const ERROR_MESSAGES: Record<string, { type: ErrorType; message: string }> = {
  // Erros de autenticação
  'PGRST301': { type: ErrorType.AUTH, message: 'Sessão expirada. Por favor, faça login novamente.' },
  'PGRST116': { type: ErrorType.NOT_FOUND, message: 'Registro não encontrado.' },
  
  // Erros de permissão
  '42501': { type: ErrorType.PERMISSION, message: 'Você não tem permissão para realizar esta ação.' },
  
  // Erros de constraint
  '23503': { type: ErrorType.CONSTRAINT, message: 'Não é possível realizar esta ação porque existem registros relacionados.' },
  '23505': { type: ErrorType.CONSTRAINT, message: 'Já existe um registro com estes dados.' },
  '23502': { type: ErrorType.VALIDATION, message: 'Campos obrigatórios não foram preenchidos.' },
  '23514': { type: ErrorType.VALIDATION, message: 'Os dados informados não são válidos.' },
  
  // Erros de rede
  'PGRST204': { type: ErrorType.NETWORK, message: 'Erro de conexão. Verifique sua internet e tente novamente.' },
  'ECONNREFUSED': { type: ErrorType.NETWORK, message: 'Não foi possível conectar ao servidor. Tente novamente em alguns instantes.' },
  
  // Erros de validação
  '22P02': { type: ErrorType.VALIDATION, message: 'Formato de dados inválido.' },
  '22007': { type: ErrorType.VALIDATION, message: 'Formato de data inválido.' },
  '22008': { type: ErrorType.VALIDATION, message: 'Valor numérico inválido.' },
};

/**
 * Mensagens amigáveis por tipo de erro
 */
const TYPE_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Erro de conexão. Verifique sua internet e tente novamente.',
  [ErrorType.AUTH]: 'Erro de autenticação. Por favor, faça login novamente.',
  [ErrorType.PERMISSION]: 'Você não tem permissão para realizar esta ação.',
  [ErrorType.VALIDATION]: 'Os dados informados não são válidos. Verifique e tente novamente.',
  [ErrorType.NOT_FOUND]: 'Registro não encontrado.',
  [ErrorType.CONSTRAINT]: 'Não é possível realizar esta ação devido a restrições do sistema.',
  [ErrorType.UNKNOWN]: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
};

/**
 * Trata erro do Supabase e retorna mensagem amigável
 */
export function handleSupabaseError(error: unknown): HandledError {
  // Se já for um HandledError, retorna direto
  if (error && typeof error === 'object' && 'type' in error && 'userMessage' in error) {
    return error as HandledError;
  }

  // Erro do Supabase (PostgrestError)
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    const code = pgError.code || '';
    
    // Buscar mensagem específica para o código
    const errorInfo = ERROR_MESSAGES[code];
    
    if (errorInfo) {
      return {
        type: errorInfo.type,
        message: pgError.message,
        userMessage: errorInfo.message,
        technicalMessage: pgError.message,
        code: code,
        hint: pgError.hint || undefined,
      };
    }
    
    // Erro de constraint específico
    if (code === '23503') {
      const constraintMatch = pgError.message.match(/constraint "([^"]+)"/);
      const constraintName = constraintMatch ? constraintMatch[1] : '';
      
      // Mensagens específicas por constraint
      const constraintMessages: Record<string, string> = {
        'orcamentos_contato_id_fkey': 'Não é possível excluir este contato porque existem orçamentos vinculados.',
        'contas_receber_orcamento_id_fkey': 'Não é possível excluir este orçamento porque existem contas a receber vinculadas.',
        'contas_pagar_orcamento_id_fkey': 'Não é possível excluir este orçamento porque existem contas a pagar vinculadas.',
        'cortina_items_orcamento_id_fkey': 'Não é possível excluir este orçamento porque existem itens vinculados.',
      };
      
      const constraintMessage = constraintMessages[constraintName] || TYPE_MESSAGES[ErrorType.CONSTRAINT];
      
      return {
        type: ErrorType.CONSTRAINT,
        message: pgError.message,
        userMessage: constraintMessage,
        technicalMessage: pgError.message,
        code: code,
        hint: pgError.hint || undefined,
      };
    }
    
    // Erro de permissão
    if (code === '42501' || pgError.message?.includes('permission') || pgError.message?.includes('policy')) {
      return {
        type: ErrorType.PERMISSION,
        message: pgError.message,
        userMessage: TYPE_MESSAGES[ErrorType.PERMISSION],
        technicalMessage: pgError.message,
        code: code,
        hint: pgError.hint || undefined,
      };
    }
    
    // Erro não encontrado
    if (code === 'PGRST116' || pgError.message?.includes('not found')) {
      return {
        type: ErrorType.NOT_FOUND,
        message: pgError.message,
        userMessage: TYPE_MESSAGES[ErrorType.NOT_FOUND],
        technicalMessage: pgError.message,
        code: code,
      };
    }
  }
  
  // Erro padrão do JavaScript
  if (error instanceof Error) {
    // Erros de rede
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return {
        type: ErrorType.NETWORK,
        message: error.message,
        userMessage: TYPE_MESSAGES[ErrorType.NETWORK],
        technicalMessage: error.message,
      };
    }
    
    // Erros de autenticação
    if (error.message.includes('auth') || error.message.includes('session') || error.message.includes('token')) {
      return {
        type: ErrorType.AUTH,
        message: error.message,
        userMessage: TYPE_MESSAGES[ErrorType.AUTH],
        technicalMessage: error.message,
      };
    }
    
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      userMessage: error.message || TYPE_MESSAGES[ErrorType.UNKNOWN],
      technicalMessage: error.message,
    };
  }
  
  // Erro desconhecido
  return {
    type: ErrorType.UNKNOWN,
    message: String(error),
    userMessage: TYPE_MESSAGES[ErrorType.UNKNOWN],
    technicalMessage: String(error),
  };
}

/**
 * Exibe erro tratado via toast (usando shadcn/ui toast)
 */
export function showHandledError(error: unknown, customMessage?: string) {
  const handled = handleSupabaseError(error);
  
  // Log técnico no console (apenas em desenvolvimento)
  if (import.meta.env.DEV && handled.technicalMessage) {
    console.error('Erro tratado:', {
      type: handled.type,
      message: handled.message,
      technical: handled.technicalMessage,
      code: handled.code,
      hint: handled.hint,
    });
  }
  
  // Exibir mensagem ao usuário usando sistema unificado
  const message = customMessage || handled.userMessage;
  const description = handled.hint ? `${message}\n\n${handled.hint}` : message;
  
  // Usar showError do sistema unificado de toasts
  showError(message, {
    description: handled.hint ? handled.hint : undefined,
    duration: handled.type === ErrorType.NETWORK ? 6000 : 5000, // Erros de rede ficam mais tempo
  });
  
  return handled;
}

/**
 * Wrapper para promises que trata erros automaticamente
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  options?: {
    onError?: (error: HandledError) => void;
    customErrorMessage?: string;
    showToast?: boolean;
  }
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    const handled = handleSupabaseError(error);
    
    if (options?.showToast !== false) {
      showHandledError(error, options?.customErrorMessage);
    }
    
    if (options?.onError) {
      options.onError(handled);
    }
    
    return null;
  }
}

/**
 * Hook helper para usar em componentes
 */
export function useErrorHandler() {
  return {
    handle: handleSupabaseError,
    show: showHandledError,
    withHandling: withErrorHandling,
  };
}
