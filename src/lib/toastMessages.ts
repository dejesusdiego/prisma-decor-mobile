/**
 * Sistema centralizado de mensagens toast
 * Padroniza mensagens de sucesso, erro, aviso e informação
 */

import { toast as sonnerToast } from 'sonner';
import { toast as radixToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/**
 * Opções para toast
 */
interface ToastOptions {
  /** Descrição adicional */
  description?: string;
  /** Duração em milissegundos */
  duration?: number;
  /** Ação customizada */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** ID para controle manual */
  id?: string | number;
}

/**
 * Mostra mensagem de sucesso
 */
export function showSuccess(message: string, options?: ToastOptions) {
  if (typeof sonnerToast.success === 'function') {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      id: options?.id,
    });
  } else if (typeof radixToast === 'function') {
    radixToast({
      title: message,
      description: options?.description,
      variant: 'default',
    });
  }
}

/**
 * Mostra mensagem de erro
 */
export function showError(message: string, options?: ToastOptions) {
  if (typeof sonnerToast.error === 'function') {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <XCircle className="h-5 w-5 text-destructive" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      id: options?.id,
    });
  } else if (typeof radixToast === 'function') {
    radixToast({
      title: message,
      description: options?.description,
      variant: 'destructive',
    });
  }
}

/**
 * Mostra mensagem de aviso
 */
export function showWarning(message: string, options?: ToastOptions) {
  if (typeof sonnerToast.warning === 'function') {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      id: options?.id,
    });
  } else if (typeof radixToast === 'function') {
    radixToast({
      title: message,
      description: options?.description,
      variant: 'default',
    });
  }
}

/**
 * Mostra mensagem informativa
 */
export function showInfo(message: string, options?: ToastOptions) {
  if (typeof sonnerToast.info === 'function') {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <Info className="h-5 w-5 text-blue-500" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      id: options?.id,
    });
  } else if (typeof radixToast === 'function') {
    radixToast({
      title: message,
      description: options?.description,
      variant: 'default',
    });
  }
}

/**
 * Mostra toast de loading
 */
export function showLoading(message: string, id?: string | number) {
  if (typeof sonnerToast.loading === 'function') {
    return sonnerToast.loading(message, {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
      id,
    });
  }
  return null;
}

/**
 * Atualiza toast de loading para sucesso
 */
export function dismissToast(id?: string | number) {
  if (typeof sonnerToast.dismiss === 'function') {
    sonnerToast.dismiss(id);
  }
}

/**
 * Mostra promise toast (loading -> success/error)
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  if (typeof sonnerToast.promise === 'function') {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: (data: T) => {
        if (typeof messages.success === 'function') {
          return messages.success(data);
        }
        return messages.success;
      },
      error: (error: any) => {
        if (typeof messages.error === 'function') {
          return messages.error(error);
        }
        return messages.error;
      },
    });
  }
  
  // Fallback para radix toast
  showLoading(messages.loading);
  promise
    .then((data) => {
      dismissToast();
      const successMsg = typeof messages.success === 'function' 
        ? messages.success(data) 
        : messages.success;
      showSuccess(successMsg);
    })
    .catch((error) => {
      dismissToast();
      const errorMsg = typeof messages.error === 'function'
        ? messages.error(error)
        : messages.error;
      showError(errorMsg);
    });
}

/**
 * Mensagens padronizadas para ações comuns
 */
export const ToastMessages = {
  // Orçamentos
  orcamento: {
    criado: () => showSuccess('Orçamento criado com sucesso!'),
    atualizado: () => showSuccess('Orçamento atualizado com sucesso!'),
    excluido: () => showSuccess('Orçamento excluído com sucesso!'),
    duplicado: () => showSuccess('Orçamento duplicado com sucesso!'),
    erroCriar: (error?: any) => showError('Não foi possível criar o orçamento', { description: error?.message }),
    erroAtualizar: (error?: any) => showError('Não foi possível atualizar o orçamento', { description: error?.message }),
    erroExcluir: (error?: any) => showError('Não foi possível excluir o orçamento', { description: error?.message }),
  },

  // Contatos
  contato: {
    criado: () => showSuccess('Contato criado com sucesso!'),
    atualizado: () => showSuccess('Contato atualizado com sucesso!'),
    excluido: () => showSuccess('Contato excluído com sucesso!'),
    mesclado: () => showSuccess('Contatos mesclados com sucesso!'),
    erroCriar: (error?: any) => showError('Não foi possível criar o contato', { description: error?.message }),
    erroAtualizar: (error?: any) => showError('Não foi possível atualizar o contato', { description: error?.message }),
  },

  // Financeiro
  financeiro: {
    contaCriada: () => showSuccess('Conta criada com sucesso!'),
    pagamentoRegistrado: () => showSuccess('Pagamento registrado com sucesso!'),
    recebimentoRegistrado: () => showSuccess('Recebimento registrado com sucesso!'),
    conciliacaoRealizada: (count: number) => showSuccess(`${count} movimentação(ões) conciliada(s) com sucesso!`),
    erroRegistrarPagamento: (error?: any) => showError('Não foi possível registrar o pagamento', { description: error?.message }),
    erroRegistrarRecebimento: (error?: any) => showError('Não foi possível registrar o recebimento', { description: error?.message }),
  },

  // Produção
  producao: {
    pedidoCriado: () => showSuccess('Pedido criado com sucesso!'),
    statusAtualizado: () => showSuccess('Status atualizado com sucesso!'),
    instalacaoAgendada: () => showSuccess('Instalação agendada com sucesso!'),
    erroAtualizarStatus: (error?: any) => showError('Não foi possível atualizar o status', { description: error?.message }),
  },

  // Materiais
  materiais: {
    importados: (count: number) => showSuccess(`${count} material(is) importado(s) com sucesso!`),
    atualizados: (count: number) => showSuccess(`${count} material(is) atualizado(s) com sucesso!`),
    erroImportar: (error?: any) => showError('Não foi possível importar os materiais', { description: error?.message }),
  },

  // Geral
  geral: {
    salvando: () => showLoading('Salvando...'),
    carregando: () => showLoading('Carregando...'),
    sucesso: (message: string) => showSuccess(message),
    erro: (message: string, error?: any) => showError(message, { description: error?.message }),
    aviso: (message: string) => showWarning(message),
    info: (message: string) => showInfo(message),
  },
};
