# 🛡️ Sistema de Tratamento de Erros

## Visão Geral

O sistema centralizado de tratamento de erros converte erros técnicos do Supabase/PostgreSQL em mensagens amigáveis ao usuário.

## Uso Básico

### 1. Tratamento Simples

```typescript
import { showHandledError } from '@/lib/errorHandler';

try {
  const { error } = await supabase.from('orcamentos').insert(data);
  if (error) throw error;
} catch (error) {
  showHandledError(error, 'Não foi possível criar o orçamento');
}
```

### 2. Com Mensagem Customizada

```typescript
import { showHandledError } from '@/lib/errorHandler';

try {
  // ... operação
} catch (error) {
  showHandledError(error, 'Erro ao salvar dados');
}
```

### 3. Sem Exibir Toast (apenas log)

```typescript
import { handleSupabaseError } from '@/lib/errorHandler';

try {
  // ... operação
} catch (error) {
  const handled = handleSupabaseError(error);
  console.error('Erro:', handled);
  // Fazer algo customizado com o erro
}
```

### 4. Wrapper para Promises

```typescript
import { withErrorHandling } from '@/lib/errorHandler';

const result = await withErrorHandling(
  supabase.from('orcamentos').select('*'),
  {
    customErrorMessage: 'Erro ao carregar orçamentos',
    onError: (handled) => {
      // Callback customizado
    }
  }
);
```

## Tipos de Erro Tratados

- **NETWORK**: Erros de conexão
- **AUTH**: Erros de autenticação
- **PERMISSION**: Erros de permissão (RLS)
- **VALIDATION**: Erros de validação
- **NOT_FOUND**: Registro não encontrado
- **CONSTRAINT**: Violação de constraints (FK, unique, etc)
- **UNKNOWN**: Erros desconhecidos

## Mensagens Automáticas

O sistema mapeia códigos de erro comuns:

- `23503`: Foreign key constraint
- `23505`: Unique constraint
- `42501`: Permission denied
- `PGRST116`: Not found
- E muitos outros...

## Exemplos de Uso

### Exemplo 1: Criar Orçamento

```typescript
const criarOrcamento = async (data: OrcamentoData) => {
  try {
    const { error } = await supabase
      .from('orcamentos')
      .insert(data);
    
    if (error) throw error;
    
    toast({ title: 'Sucesso', description: 'Orçamento criado!' });
  } catch (error) {
    showHandledError(error, 'Não foi possível criar o orçamento');
  }
};
```

### Exemplo 2: Deletar com Validação

```typescript
const deletarOrcamento = async (id: string) => {
  try {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast({ title: 'Sucesso', description: 'Orçamento excluído!' });
  } catch (error) {
    showHandledError(error, 'Não foi possível excluir o orçamento');
  }
};
```

### Exemplo 3: Hook Customizado

```typescript
import { useErrorHandler } from '@/lib/errorHandler';

function MeuComponente() {
  const { show, withHandling } = useErrorHandler();
  
  const salvar = async () => {
    const result = await withHandling(
      supabase.from('tabela').insert(data),
      { customErrorMessage: 'Erro ao salvar' }
    );
    
    if (result) {
      // Sucesso
    }
  };
}
```

## Migração de Código Antigo

### Antes:
```typescript
catch (error: any) {
  console.error('Erro:', error);
  toast({
    title: 'Erro',
    description: error?.message || 'Erro desconhecido',
    variant: 'destructive',
  });
}
```

### Depois:
```typescript
catch (error: any) {
  showHandledError(error, 'Mensagem customizada se necessário');
}
```

## Benefícios

1. ✅ Mensagens amigáveis ao usuário
2. ✅ Log técnico detalhado (dev mode)
3. ✅ Tratamento consistente em toda aplicação
4. ✅ Mapeamento automático de códigos de erro
5. ✅ Menos código repetitivo
