# 📊 Guia de Loading States

## Visão Geral

Sistema padronizado de loading states para garantir consistência visual e melhor UX em toda a aplicação.

## Componentes Disponíveis

### 1. LoadingSpinner
Spinner básico de carregamento.

```tsx
import { LoadingSpinner } from '@/components/ui/LoadingState';

<LoadingSpinner size="md" text="Carregando dados..." />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' (padrão: 'md')
- `text`: string (opcional)
- `className`: string (opcional)

### 2. LoadingPage
Loading para página inteira.

```tsx
import { LoadingPage } from '@/components/ui/LoadingState';

<LoadingPage text="Carregando..." />
```

### 3. LoadingSection
Loading para seção/card.

```tsx
import { LoadingSection } from '@/components/ui/LoadingState';

<LoadingSection text="Carregando dados..." />
```

### 4. LoadingStatsCards
Skeleton para cards de estatísticas.

```tsx
import { LoadingStatsCards } from '@/components/ui/LoadingState';

<LoadingStatsCards count={4} />
```

### 5. LoadingTableRows
Skeleton para linhas de tabela.

```tsx
import { LoadingTableRows } from '@/components/ui/LoadingState';

<TableBody>
  <LoadingTableRows rows={5} cols={8} />
</TableBody>
```

### 6. LoadingList
Skeleton para lista de itens.

```tsx
import { LoadingList } from '@/components/ui/LoadingState';

<LoadingList items={5} />
```

### 7. LoadingWrapper
Wrapper que mostra loading ou conteúdo.

```tsx
import { LoadingWrapper } from '@/components/ui/LoadingState';

<LoadingWrapper 
  isLoading={isLoading}
  loadingComponent={<LoadingSection />}
>
  <Conteudo />
</LoadingWrapper>
```

## Hook: useLoadingState

Hook para gerenciar estado de loading.

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

function MeuComponente() {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoadingState();

  const carregarDados = async () => {
    await withLoading(async () => {
      const dados = await fetchDados();
      // ...
    }, 'Carregando dados...');
  };

  return (
    <LoadingWrapper isLoading={isLoading}>
      <Conteudo />
    </LoadingWrapper>
  );
}
```

## Padrões de Uso

### Padrão 1: Tabela com Loading

```tsx
{loading ? (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Coluna 1</TableHead>
          <TableHead>Coluna 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <LoadingTableRows rows={5} cols={2} />
      </TableBody>
    </Table>
  </div>
) : (
  <Table>
    {/* Conteúdo real */}
  </Table>
)}
```

### Padrão 2: Cards com Loading

```tsx
{loading ? (
  <LoadingStatsCards count={4} />
) : (
  <div className="grid gap-4">
    {/* Cards reais */}
  </div>
)}
```

### Padrão 3: Lista com Loading

```tsx
{loading ? (
  <LoadingList items={5} />
) : items.length === 0 ? (
  <EmptyState variant="default" />
) : (
  <div>
    {/* Lista real */}
  </div>
)}
```

### Padrão 4: Página Inteira

```tsx
if (loading) {
  return <LoadingPage text="Carregando dados..." />;
}

return <Conteudo />;
```

## Boas Práticas

1. ✅ **Sempre use skeleton loaders** para tabelas e listas
2. ✅ **Mantenha a estrutura visual** durante o loading
3. ✅ **Use mensagens descritivas** quando apropriado
4. ✅ **Evite "flash" de conteúdo** - mostre skeleton primeiro
5. ✅ **Combine com EmptyState** para estados vazios

## Exemplos de Migração

### Antes:
```tsx
{loading && (
  <div className="flex justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
)}
```

### Depois:
```tsx
{loading ? (
  <LoadingSection text="Carregando..." />
) : (
  <Conteudo />
)}
```

## Checklist de Implementação

- [ ] Substituir spinners customizados por componentes padronizados
- [ ] Adicionar skeleton loaders em tabelas
- [ ] Adicionar skeleton loaders em cards
- [ ] Usar LoadingWrapper onde apropriado
- [ ] Adicionar mensagens descritivas
- [ ] Testar em diferentes tamanhos de tela
- [ ] Verificar transições suaves
