# 🔄 Guia de Migração de Toasts

## 📊 Status da Migração

**Componentes migrados:** 5  
**Componentes restantes:** ~15  
**Progresso:** ~25%

---

## ✅ Componentes Migrados

1. ✅ **ListaOrcamentos** - 7 toasts migrados
2. ✅ **ContasPagar** - 4 toasts migrados
3. ✅ **MergeContatos** - 1 toast migrado
4. ✅ **ImportarDados** - 2 toasts migrados
5. ✅ **DialogRegistrarRecebimento** - 1 toast migrado

---

## 🔄 Padrão de Migração

### Antes (Radix Toast):
```typescript
toast({
  title: 'Sucesso',
  description: 'Orçamento criado',
});
```

### Depois (Sistema Unificado):
```typescript
import { ToastMessages } from '@/lib/toastMessages';

// Opção 1: Usar mensagem padronizada
ToastMessages.orcamento.criado();

// Opção 2: Mensagem customizada
const { showSuccess } = await import('@/lib/toastMessages');
showSuccess('Orçamento criado com sucesso!');
```

---

### Antes (Sonner):
```typescript
import { toast } from 'sonner';

toast.success('Conta excluída');
toast.error('Erro ao excluir');
```

### Depois (Sistema Unificado):
```typescript
const { showSuccess, showError } = await import('@/lib/toastMessages');

showSuccess('Conta excluída com sucesso');
showError('Erro ao excluir conta');
```

---

## 📝 Componentes Restantes

### Prioridade Alta:
- [ ] DialogCondicoesPagamento
- [ ] DialogGerarContasPagar
- [ ] DialogRegistrarPagamentoRapido
- [ ] ConciliacaoBancaria
- [ ] RelatorioLancamentosOrfaos

### Prioridade Média:
- [ ] DialogMaterial
- [ ] FichaPedido
- [ ] EtapaResumo
- [ ] EtapaProdutos
- [ ] CortinaCard

### Prioridade Baixa:
- [ ] OrcamentoSidebar
- [ ] ListaMateriais
- [ ] Outros componentes menores

---

## 🎯 Como Migrar

### Passo 1: Identificar Toasts
```bash
grep -r "toast(" src/components/[componente]
```

### Passo 2: Substituir

**Sucesso:**
```typescript
// Antes
toast({ title: 'Sucesso', description: '...' });
toast.success('...');

// Depois
const { showSuccess } = await import('@/lib/toastMessages');
showSuccess('...');
// ou
ToastMessages.[categoria].[acao]();
```

**Erro:**
```typescript
// Antes
toast({ title: 'Erro', description: '...', variant: 'destructive' });
toast.error('...');

// Depois
const { showHandledError } = await import('@/lib/errorHandler');
showHandledError(error, 'Mensagem customizada');
// ou
const { showError } = await import('@/lib/toastMessages');
showError('...');
```

**Aviso:**
```typescript
// Antes
toast({ title: 'Atenção', description: '...' });

// Depois
const { showWarning } = await import('@/lib/toastMessages');
showWarning('...');
```

### Passo 3: Remover Imports Antigos
```typescript
// Remover
import { toast } from 'sonner';
import { toast } from '@/hooks/use-toast';
```

---

## ✅ Checklist de Migração

Para cada componente:
- [ ] Identificar todos os toasts
- [ ] Substituir por sistema unificado
- [ ] Usar ToastMessages quando possível
- [ ] Remover imports antigos
- [ ] Testar funcionalidade
- [ ] Verificar visual

---

## 📊 Benefícios da Migração

1. **Consistência:** Todas as mensagens seguem o mesmo padrão
2. **Manutenibilidade:** Fácil atualizar mensagens
3. **UX:** Mensagens mais claras e informativas
4. **Produtividade:** Mensagens pré-definidas aceleram desenvolvimento

---

## 🚀 Próximos Passos

1. Migrar componentes de prioridade alta
2. Migrar componentes de prioridade média
3. Migrar componentes restantes
4. Remover imports antigos não utilizados
5. Documentar padrões estabelecidos
