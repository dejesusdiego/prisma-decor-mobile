/**
 * FeedbackToast - Funções helper para feedback consistente via toast
 */

import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast de sucesso
 */
export function showSuccess(message: string, options?: ToastOptions) {
  toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
}

/**
 * Toast de erro
 */
export function showError(message: string, options?: ToastOptions) {
  toast.error(message, {
    description: options?.description,
    duration: options?.duration || 6000,
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
}

/**
 * Toast de aviso
 */
export function showWarning(message: string, options?: ToastOptions) {
  toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
}

/**
 * Toast informativo
 */
export function showInfo(message: string, options?: ToastOptions) {
  toast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    icon: <Info className="h-5 w-5 text-blue-500" />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
}

/**
 * Toast de carregamento (retorna ID para dismiss)
 */
export function showLoading(message: string) {
  return toast.loading(message, {
    icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />
  });
}

/**
 * Dismiss toast por ID
 */
export function dismissToast(id: string | number) {
  toast.dismiss(id);
}

/**
 * Toast de promessa (loading -> success/error automaticamente)
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error
  });
}

// Ações comuns pré-definidas
export const feedbackActions = {
  // Salvar
  saving: () => showLoading('Salvando...'),
  saved: () => showSuccess('Salvo com sucesso!'),
  saveFailed: (error?: string) => showError('Erro ao salvar', { description: error }),

  // Deletar
  deleting: () => showLoading('Excluindo...'),
  deleted: () => showSuccess('Excluído com sucesso!'),
  deleteFailed: (error?: string) => showError('Erro ao excluir', { description: error }),

  // Criar
  creating: () => showLoading('Criando...'),
  created: (item: string) => showSuccess(`${item} criado com sucesso!`),
  createFailed: (error?: string) => showError('Erro ao criar', { description: error }),

  // Atualizar
  updating: () => showLoading('Atualizando...'),
  updated: () => showSuccess('Atualizado com sucesso!'),
  updateFailed: (error?: string) => showError('Erro ao atualizar', { description: error }),

  // Copiar
  copied: () => showSuccess('Copiado para a área de transferência!'),

  // PDF
  generatingPdf: () => showLoading('Gerando PDF...'),
  pdfGenerated: () => showSuccess('PDF gerado com sucesso!'),
  pdfFailed: () => showError('Erro ao gerar PDF'),

  // Email
  sendingEmail: () => showLoading('Enviando email...'),
  emailSent: () => showSuccess('Email enviado com sucesso!'),
  emailFailed: () => showError('Erro ao enviar email'),
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  dismiss: dismissToast,
  promise: showPromise,
  actions: feedbackActions
};
