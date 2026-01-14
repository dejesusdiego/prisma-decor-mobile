# 📊 Guia de Monitoramento de Performance

## 🎯 Objetivo

Monitorar e identificar gargalos de performance em produção para otimizações contínuas.

---

## 🛠️ Ferramentas Disponíveis

### 1. Script de Teste de Performance

**Arquivo:** `scripts/teste-performance.mjs`

**Uso:**
```bash
node scripts/teste-performance.mjs
```

**O que faz:**
- Testa queries otimizadas vs antigas
- Compara tempo de execução
- Compara tamanho dos dados transferidos
- Gera relatório de melhorias

**Exemplo de saída:**
```
📊 RESULTADOS DOS TESTES

1. ✅ ListaOrcamentos (Otimizada)
   ⏱️  Tempo: 245ms
   📦 Registros: 500
   💾 Tamanho: 125.43 KB

2. ✅ ListaOrcamentos (Antiga - select *)
   ⏱️  Tempo: 892ms
   📦 Registros: 500
   💾 Tamanho: 487.21 KB

📈 COMPARAÇÕES

📋 ListaOrcamentos:
   ⚡ Melhoria de tempo: 72.5%
   💾 Redução de tamanho: 74.3%
```

---

### 2. Hook de Monitoramento (`usePerformanceMonitor`)

**Arquivo:** `src/hooks/usePerformanceMonitor.ts`

**Uso básico:**
```typescript
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function MeuComponente() {
  const { start, end, getMetrics } = usePerformanceMonitor();

  const carregarDados = async () => {
    start('carregar-dados');
    try {
      // ... operação
    } finally {
      end();
    }
  };

  // Ver métricas
  const metrics = getMetrics();
  console.log(metrics);
}
```

**Uso com função helper:**
```typescript
import { measurePerformance } from '@/hooks/usePerformanceMonitor';

const dados = await measurePerformance('buscar-orcamentos', async () => {
  return await supabase.from('orcamentos').select('*');
});
```

**Acesso direto ao monitor:**
```typescript
import { monitor } from '@/hooks/usePerformanceMonitor';

// Em desenvolvimento, também disponível em window.__performanceMonitor
const metrics = monitor.getMetrics();
const exportData = monitor.export();
```

---

## 📈 Métricas Coletadas

### Por Operação:
- **Nome:** Identificador da operação
- **Duração:** Tempo em milissegundos
- **Timestamp:** Quando foi executado
- **Metadata:** Dados adicionais (opcional)

### Agregadas:
- **Média:** Tempo médio de execução
- **Mínimo:** Menor tempo registrado
- **Máximo:** Maior tempo registrado
- **Contagem:** Quantidade de execuções

---

## 🎯 Casos de Uso

### 1. Monitorar Queries do React Query

```typescript
import { useQueryPerformance } from '@/hooks/usePerformanceMonitor';

function MeuComponente() {
  useQueryPerformance('orcamentos'); // Monitora automaticamente
  
  const { data } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      // ... query
    }
  });
}
```

### 2. Monitorar Operações Assíncronas

```typescript
import { measurePerformance } from '@/hooks/usePerformanceMonitor';

const resultado = await measurePerformance(
  'processar-pagamento',
  async () => {
    // ... operação complexa
  },
  { userId: user.id } // metadata opcional
);
```

### 3. Monitorar Operações Síncronas

```typescript
import { measurePerformanceSync } from '@/hooks/usePerformanceMonitor';

const resultado = measurePerformanceSync(
  'calcular-totais',
  () => {
    // ... cálculo complexo
  }
);
```

---

## 📊 Análise de Métricas

### Em Desenvolvimento

O monitor loga automaticamente operações lentas (> 1s) e todas as operações em modo DEV.

```typescript
// Console output:
⏱️  [Performance] query:orcamentos: 245ms
⏱️  [Performance] processar-pagamento: 1234ms { userId: '...' }
```

### Exportar Dados

```typescript
import { monitor } from '@/hooks/usePerformanceMonitor';

// Exportar para análise
const data = monitor.export();
console.log(JSON.stringify(data, null, 2));

// Ou salvar em arquivo
const fs = require('fs');
fs.writeFileSync('performance-metrics.json', JSON.stringify(data, null, 2));
```

---

## 🔍 Identificando Gargalos

### Queries Lentas (> 500ms)
- Verificar se está usando `select('*')`
- Adicionar limites (`limit()`)
- Verificar índices no banco
- Considerar paginação

### Operações Repetitivas
- Verificar cache do React Query
- Aumentar `staleTime` se dados mudam pouco
- Usar `useMemo` para cálculos pesados

### Múltiplas Queries
- Paralelizar com `Promise.all`
- Combinar queries quando possível
- Usar RPC functions para agregações

---

## 📝 Checklist de Monitoramento

- [ ] Executar script de teste após cada otimização
- [ ] Monitorar queries críticas em produção
- [ ] Revisar métricas semanalmente
- [ ] Identificar e corrigir operações > 1s
- [ ] Documentar melhorias aplicadas

---

## 🚀 Próximos Passos

1. **Integrar com ferramentas de APM** (ex: Sentry, New Relic)
2. **Criar dashboard de métricas** em tempo real
3. **Alertas automáticos** para queries lentas
4. **Análise histórica** de tendências de performance
