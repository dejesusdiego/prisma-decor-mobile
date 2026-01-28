/**
 * Sistema centralizado de tratamento de erros
 * Mapeia códigos de erro do Supabase/PostgreSQL para mensagens amigáveis
 */

export interface ErrorMapping {
  code: string;
  message: string;
  userMessage: string;
  action?: string;
}

/**
 * Mapeamento de erros comuns do Supabase/PostgreSQL
 */
export const ERROR_MAPPINGS: ErrorMapping[] = [
  // ============================================================
  // ERROS DE AUTENTICAÇÃO E AUTORIZAÇÃO
  // ============================================================
  {
    code: 'not_authorized',
    message: 'Apenas service_role pode aprovar fornecedores',
    userMessage: 'Você não tem permissão para realizar esta ação. Entre em contato com o administrador.',
    action: 'Contatar administrador do sistema'
  },
  {
    code: 'PGRST301',
    message: 'JWT expired',
    userMessage: 'Sua sessão expirou. Por favor, faça login novamente.',
    action: 'Fazer login novamente'
  },
  {
    code: 'PGRST302',
    message: 'JWT invalid',
    userMessage: 'Sessão inválida. Por favor, faça login novamente.',
    action: 'Fazer login novamente'
  },
  {
    code: 'permission denied',
    message: 'permission denied',
    userMessage: 'Você não tem permissão para acessar este recurso.',
    action: 'Verificar suas permissões ou contatar administrador'
  },
  {
    code: 'insufficient_privilege',
    message: 'insufficient_privilege',
    userMessage: 'Você não tem privilégios suficientes para realizar esta ação.',
    action: 'Contatar administrador do sistema'
  },

  // ============================================================
  // ERROS DE VALIDAÇÃO (register_supplier)
  // ============================================================
  {
    code: 'name_required',
    message: 'Nome da empresa é obrigatório',
    userMessage: 'O nome da empresa é obrigatório. Por favor, preencha este campo.',
    action: 'Preencher o nome da empresa'
  },
  {
    code: 'email_required',
    message: 'E-mail é obrigatório',
    userMessage: 'O e-mail é obrigatório. Por favor, preencha este campo.',
    action: 'Preencher o e-mail'
  },
  {
    code: 'email_invalid',
    message: 'Formato de e-mail inválido',
    userMessage: 'O formato do e-mail está inválido. Verifique se digitou corretamente (exemplo: seu@email.com).',
    action: 'Corrigir o formato do e-mail'
  },
  {
    code: 'cnpj_invalid',
    message: 'CNPJ deve ter 14 dígitos',
    userMessage: 'O CNPJ deve conter exatamente 14 dígitos. Verifique se digitou corretamente.',
    action: 'Corrigir o CNPJ (apenas números)'
  },
  {
    code: 'user_id_required',
    message: 'ID do usuário é obrigatório',
    userMessage: 'Erro de autenticação. Por favor, recarregue a página e tente novamente.',
    action: 'Recarregar a página e tentar novamente'
  },
  {
    code: 'supplier_id_required',
    message: 'ID do fornecedor é obrigatório',
    userMessage: 'Erro interno. Por favor, tente novamente ou contate o suporte.',
    action: 'Tentar novamente ou contatar suporte'
  },

  // ============================================================
  // ERROS DE DUPLICIDADE
  // ============================================================
  {
    code: 'cnpj_already_registered',
    message: 'CNPJ já cadastrado',
    userMessage: 'Não foi possível completar o cadastro. Verifique os dados informados.',
    action: 'Se você já possui cadastro, faça login. Caso contrário, verifique os dados e tente novamente.'
  },
  {
    code: 'email_already_registered',
    message: 'E-mail já cadastrado',
    userMessage: 'Não foi possível completar o cadastro. Verifique os dados informados.',
    action: 'Se você já possui cadastro, faça login. Caso contrário, verifique os dados e tente novamente.'
  },
  {
    code: '23505',
    message: 'duplicate key value violates unique constraint',
    userMessage: 'Já existe um registro com estas informações. Verifique se você já possui uma conta.',
    action: 'Verificar se já possui conta'
  },
  {
    code: 'unique_violation',
    message: 'unique_violation',
    userMessage: 'Já existe um registro com estas informações no sistema.',
    action: 'Verificar dados ou contatar suporte'
  },

  // ============================================================
  // ERROS DE BANCO DE DADOS (PostgreSQL)
  // ============================================================
  {
    code: '42703',
    message: 'column does not exist',
    userMessage: 'Erro interno do sistema. Por favor, tente novamente ou contate o suporte técnico.',
    action: 'Tentar novamente ou contatar suporte técnico'
  },
  {
    code: '42P01',
    message: 'relation does not exist',
    userMessage: 'Erro interno do sistema. Por favor, tente novamente ou contate o suporte técnico.',
    action: 'Tentar novamente ou contatar suporte técnico'
  },
  {
    code: '23503',
    message: 'foreign key violation',
    userMessage: 'Erro ao processar dados. Verifique se todas as informações estão corretas.',
    action: 'Verificar dados informados'
  },
  {
    code: '23502',
    message: 'not null violation',
    userMessage: 'Alguns campos obrigatórios não foram preenchidos. Verifique o formulário.',
    action: 'Preencher todos os campos obrigatórios'
  },
  {
    code: '23514',
    message: 'check violation',
    userMessage: 'Algum dado informado não está no formato correto. Verifique os campos do formulário.',
    action: 'Verificar formato dos dados'
  },
  {
    code: 'PGRST204',
    message: 'Could not find column',
    userMessage: 'Erro interno do sistema. Por favor, tente novamente ou contate o suporte técnico.',
    action: 'Tentar novamente ou contatar suporte técnico'
  },
  {
    code: 'PGRST301',
    message: 'JWT expired',
    userMessage: 'Sua sessão expirou. Por favor, faça login novamente.',
    action: 'Fazer login novamente'
  },

  // ============================================================
  // ERROS DE SUPPLIER (aprove_supplier)
  // ============================================================
  {
    code: 'supplier_not_found',
    message: 'Fornecedor não encontrado',
    userMessage: 'O fornecedor informado não foi encontrado no sistema.',
    action: 'Verificar o ID do fornecedor ou contatar suporte'
  },
  {
    code: 'supplier_already_processed',
    message: 'Fornecedor não encontrado ou já aprovado/rejeitado',
    userMessage: 'Este fornecedor já foi processado (aprovado ou rejeitado) ou não existe no sistema.',
    action: 'Verificar status do fornecedor'
  },

  // ============================================================
  // ERROS DE GERAÇÃO/CRIAÇÃO
  // ============================================================
  {
    code: 'slug_generation_failed',
    message: 'Não foi possível gerar slug único após múltiplas tentativas',
    userMessage: 'Erro ao processar cadastro. Por favor, tente novamente ou entre em contato com o suporte.',
    action: 'Tentar novamente ou contatar suporte'
  },
  {
    code: 'insert_failed',
    message: 'Erro ao inserir fornecedor',
    userMessage: 'Erro ao salvar os dados. Por favor, tente novamente ou contate o suporte.',
    action: 'Tentar novamente ou contatar suporte'
  },

  // ============================================================
  // ERROS DE AUTENTICAÇÃO SUPABASE
  // ============================================================
  {
    code: 'email_not_confirmed',
    message: 'Email not confirmed',
    userMessage: 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou entre em contato com o suporte.',
    action: 'Verificar e-mail ou contatar suporte'
  },
  {
    code: 'invalid_credentials',
    message: 'Invalid login credentials',
    userMessage: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
    action: 'Verificar e-mail e senha'
  },
  {
    code: 'user_not_found',
    message: 'User not found',
    userMessage: 'Usuário não encontrado. Verifique se o e-mail está correto ou crie uma conta.',
    action: 'Verificar e-mail ou criar conta'
  },
  {
    code: 'too_many_requests',
    message: 'Too many requests',
    userMessage: 'Muitas tentativas. Por favor, aguarde alguns minutos e tente novamente.',
    action: 'Aguardar alguns minutos e tentar novamente'
  },

  // ============================================================
  // ERROS GENÉRICOS
  // ============================================================
  {
    code: 'network_error',
    message: 'Network error',
    userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
    action: 'Verificar conexão e tentar novamente'
  },
  {
    code: 'timeout',
    message: 'Request timeout',
    userMessage: 'A requisição demorou muito para responder. Por favor, tente novamente.',
    action: 'Tentar novamente'
  },
  {
    code: 'unknown_error',
    message: 'Unknown error',
    userMessage: 'Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.',
    action: 'Tentar novamente ou contatar suporte'
  }
];

/**
 * Função para encontrar mensagem de erro amigável
 */
export function getErrorMessage(error: any): { message: string; action?: string } {
  if (!error) {
    return {
      message: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
      action: 'Tentar novamente'
    };
  }

  // Extrair código e mensagem do erro
  const errorCode = error.code || error.error?.code || '';
  const errorMessage = error.message || error.error?.message || error.toString() || '';

  // Buscar mapeamento exato por código
  let mapping = ERROR_MAPPINGS.find(m => m.code === errorCode);

  // Se não encontrar por código, buscar por mensagem
  if (!mapping) {
    mapping = ERROR_MAPPINGS.find(m => 
      errorMessage.toLowerCase().includes(m.message.toLowerCase()) ||
      errorMessage.toLowerCase().includes(m.code.toLowerCase())
    );
  }

  // Buscar por padrões comuns na mensagem
  if (!mapping) {
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('column') && lowerMessage.includes('does not exist')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === '42703');
    } else if (lowerMessage.includes('relation') && lowerMessage.includes('does not exist')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === '42P01');
    } else if (lowerMessage.includes('duplicate key') || lowerMessage.includes('unique constraint')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === '23505');
    } else if (lowerMessage.includes('not null')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === '23502');
    } else if (lowerMessage.includes('foreign key')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === '23503');
    } else if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('email_not_confirmed')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === 'email_not_confirmed');
    } else if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
      if (lowerMessage.includes('cnpj')) {
        mapping = ERROR_MAPPINGS.find(m => m.code === 'cnpj_already_registered');
      } else if (lowerMessage.includes('email')) {
        mapping = ERROR_MAPPINGS.find(m => m.code === 'email_already_registered');
      }
    } else if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('wrong password')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === 'invalid_credentials');
    } else if (lowerMessage.includes('permission denied') || lowerMessage.includes('not authorized')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === 'permission denied');
    } else if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === 'timeout');
    } else if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      mapping = ERROR_MAPPINGS.find(m => m.code === 'network_error');
    }
  }

  // Retornar mensagem mapeada ou genérica
  if (mapping) {
    return {
      message: mapping.userMessage,
      action: mapping.action
    };
  }

  // Mensagem genérica com detalhes do erro (apenas em desenvolvimento)
  const isDevelopment = import.meta.env.DEV;
  return {
    message: isDevelopment 
      ? `Erro: ${errorMessage || errorCode || 'Erro desconhecido'}`
      : 'Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.',
    action: 'Tentar novamente ou contatar suporte'
  };
}

/**
 * Função auxiliar para log de erros (desenvolvimento)
 */
export function logError(error: any, context?: string) {
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]`, {
      code: error?.code || error?.error?.code,
      message: error?.message || error?.error?.message,
      fullError: error
    });
  }
}
