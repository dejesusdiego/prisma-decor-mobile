# ⚡ Plano de Otimização de Performance

## 📊 Problemas Identificados

### 1. Queries sem Paginação (Crítico)

#### `useMetricasCentralizadas`
- **Problema:** Busca TODOS os dados de todas as tabelas (`select('*')`)
- **Impacto:** Alto - pode buscar milhares de registros
- **Solução:** Adicionar filtros de data e limitar campos

#### `useDashboardData`
- **Problema:** Busca todos os orçamentos do período sem limite
- **Impacto:** Médio - pode ser lento com muitos orçamentos
- **Solução:** Adicionar paginação ou limitar a 1000 registros

#### `useProducaoData`
- **Problema:** Busca todos os pedidos com joins complexos
- **Impacto:** Médio - joins podem ser lentos
- **Solução:** Otimizar selects, adicionar índices

#### `ListaOrcamentos`
- **Problema:** Busca todos os orçamentos sem paginação
- **Impacto:** Alto - primeira carga lenta
- **Solução:** Implementar paginação virtual ou lazy loading

#### `useContatosComMetricas`
- **Problema:** Múltiplas queries sequenciais
- **Impacto:** Médio - pode ser otimizado com Promise.all
- **Solução:** Paralelizar queries onde possível

---

## 🎯 Plano de Ação

### Fase 1: Otimização de Queries (Prioridade Alta)

#### 1.1 Adicionar Paginação em `ListaOrcamentos`
- [ ] Implementar paginação virtual (react-window ou similar)
- [ ] Carregar apenas 50-100 orçamentos por vez
- [ ] Adicionar scroll infinito ou botão "Carregar mais"

#### 1.2 Otimizar `useMetricasCentralizadas`
- [ ] Adicionar filtros de data obrigatórios
- [ ] Selecionar apenas campos necessários (não `select('*')`)
- [ ] Adicionar cache mais agressivo (30 minutos)

#### 1.3 Otimizar `useDashboardData`
- [ ] Limitar busca a últimos 1000 orçamentos
- [ ] Adicionar índices no banco para `created_at` e `organization_id`
- [ ] Usar agregações SQL quando possível

#### 1.4 Otimizar `useProducaoData`
- [ ] Reduzir campos no select
- [ ] Adicionar paginação
- [ ] Cache mais longo (dados mudam pouco)

---

### Fase 2: Cache e Memoização (Prioridade Média)

#### 2.1 Ajustar Cache do React Query
- [ ] Aumentar `staleTime` para dados estáticos (materiais, configurações)
- [ ] Reduzir `staleTime` para dados dinâmicos (orçamentos, pedidos)
- [ ] Adicionar `gcTime` apropriado

#### 2.2 Memoização de Componentes
- [ ] Usar `React.memo` em componentes pesados
- [ ] Memoizar cálculos complexos com `useMemo`
- [ ] Evitar re-renders desnecessários

---

### Fase 3: Lazy Loading e Code Splitting (Prioridade Baixa)

#### 3.1 Code Splitting
- [ ] Lazy load de rotas pesadas
- [ ] Lazy load de componentes grandes (relatórios, BI)

#### 3.2 Lazy Loading de Dados
- [ ] Carregar dados sob demanda
- [ ] Implementar skeleton loaders

---

## 📈 Métricas de Sucesso

- **Tempo de carregamento inicial:** < 2s
- **Tempo de carregamento de lista:** < 1s
- **Tempo de resposta de queries:** < 500ms
- **Uso de memória:** Redução de 30%+

---

## 🔧 Implementação

### Exemplo: Paginação em ListaOrcamentos

```typescript
// Antes
const { data: orcamentos } = await supabase
  .from('orcamentos')
  .select('*')
  .eq('organization_id', organizationId)
  .order('created_at', { ascending: false });

// Depois
const PAGE_SIZE = 50;
const { data: orcamentos } = await supabase
  .from('orcamentos')
  .select('id, codigo, cliente_nome, status, total_geral, created_at')
  .eq('organization_id', organizationId)
  .order('created_at', { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

### Exemplo: Otimizar useMetricasCentralizadas

```typescript
// Antes
const fetchData = async <T>(table: string): Promise<T[]> => {
  const { data } = await supabase.from(table).select('*');
  return (data || []) as T[];
};

// Depois
const fetchData = async <T>(
  table: string, 
  fields: string[],
  dateFilter?: { start: Date; end: Date }
): Promise<T[]> => {
  let query = supabase.from(table).select(fields.join(','));
  if (dateFilter) {
    query = query
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString());
  }
  const { data } = await query;
  return (data || []) as T[];
};
```

---

## 📝 Checklist

- [ ] Adicionar paginação em ListaOrcamentos
- [ ] Otimizar useMetricasCentralizadas
- [ ] Otimizar useDashboardData
- [ ] Otimizar useProducaoData
- [ ] Ajustar cache do React Query
- [ ] Adicionar memoização onde necessário
- [ ] Testar performance após cada mudança
