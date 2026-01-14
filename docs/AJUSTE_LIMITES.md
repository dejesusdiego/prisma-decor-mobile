# 🔧 Guia de Ajuste de Limites

## 📊 Visão Geral

Este guia explica como ajustar limites de paginação e cache conforme o uso real do sistema.

---

## 🎯 Quando Ajustar Limites

### Reduzir Limites (Se carregamento está lento)

**Sinais:**
- Tempo de carregamento > 1s
- Queries > 500ms
- Tamanho dos dados > 500KB
- Uso de memória alto

**Ações:**
1. Reduzir `PAGE_SIZE` ou `limit()`
2. Aumentar `staleTime` (cache mais longo)
3. Reduzir campos no `select()`

---

### Aumentar Limites (Se usuário precisa ver mais dados)

**Sinais:**
- Usuário frequentemente clica "Carregar mais"
- Usuário reclama de dados faltando
- Performance está boa (< 500ms)

**Ações:**
1. Aumentar `PAGE_SIZE` ou `limit()`
2. Reduzir `staleTime` (dados mais frescos)
3. Implementar paginação virtual

---

## 📝 Limites Atuais

### ListaOrcamentos
```typescript
.limit(500) // 500 orçamentos
```

**Ajustar para:**
- **Lento:** `.limit(250)`
- **Rápido:** `.limit(1000)`

---

### useMetricasCentralizadas
```typescript
// Sem limite (busca todos)
// Cache: 5 minutos
```

**Ajustar para:**
- **Lento:** Adicionar limite por tabela
- **Rápido:** Reduzir cache para 2 minutos

---

### useDashboardData
```typescript
.limit(1000) // 1000 orçamentos por período
```

**Ajustar para:**
- **Lento:** `.limit(500)`
- **Rápido:** `.limit(2000)`

---

### useProducaoData
```typescript
.limit(200) // 200 pedidos
// Cache: 2 minutos
```

**Ajustar para:**
- **Lento:** `.limit(100)` + cache 5 minutos
- **Rápido:** `.limit(500)` + cache 1 minuto

---

### ContasPagar
```typescript
.limit(500) // 500 contas
// Cache: 2 minutos
```

**Ajustar para:**
- **Lento:** `.limit(250)` + cache 5 minutos
- **Rápido:** `.limit(1000)` + cache 1 minuto

---

## 🔍 Como Identificar Necessidade de Ajuste

### 1. Monitorar Métricas

```typescript
import { monitor } from '@/hooks/usePerformanceMonitor';

// Ver métricas
const metrics = monitor.getMetrics();
console.table(metrics);
```

### 2. Verificar Tempo de Carregamento

```javascript
// No console do navegador
performance.getEntriesByType('navigation')[0].loadEventEnd - 
performance.getEntriesByType('navigation')[0].fetchStart
```

### 3. Verificar Tamanho dos Dados

```javascript
// No Network tab do Chrome DevTools
// Verificar Size column
```

---

## 📈 Processo de Ajuste

### Passo 1: Identificar Problema
- Query lenta? → Reduzir limite
- Dados faltando? → Aumentar limite
- Cache desatualizado? → Reduzir staleTime

### Passo 2: Fazer Ajuste
- Editar arquivo do hook/componente
- Ajustar `limit()` ou `PAGE_SIZE`
- Ajustar `staleTime` e `gcTime`

### Passo 3: Testar
```bash
node scripts/teste-performance.mjs
```

### Passo 4: Validar
```bash
node scripts/validar-metricas-staging.mjs
```

### Passo 5: Deploy e Monitorar
- Deploy em staging
- Monitorar métricas por 24-48h
- Ajustar se necessário
- Deploy em produção

---

## 🎯 Valores Recomendados

### Por Tamanho da Organização

#### Pequena (< 1000 registros)
- **Limite:** 500-1000
- **Cache:** 5-10 minutos
- **Página:** 50-100 itens

#### Média (1000-10000 registros)
- **Limite:** 500-1000
- **Cache:** 2-5 minutos
- **Página:** 25-50 itens

#### Grande (> 10000 registros)
- **Limite:** 200-500
- **Cache:** 1-2 minutos
- **Página:** 25 itens
- **Considerar:** Paginação virtual

---

## 📝 Checklist de Ajuste

- [ ] Identificar problema (lento ou dados faltando)
- [ ] Verificar métricas atuais
- [ ] Decidir ajuste (aumentar ou reduzir)
- [ ] Fazer alteração no código
- [ ] Testar localmente
- [ ] Validar em staging
- [ ] Monitorar após deploy
- [ ] Documentar mudança

---

## 🚨 Alertas Automáticos

O sistema alerta automaticamente quando:
- Query > 1s
- Tamanho > 1MB
- Memória > 200MB

**Ação:** Verificar e ajustar limites se necessário.

---

## 📊 Exemplo de Ajuste

### Antes (Lento):
```typescript
.limit(1000)
staleTime: 30 * 1000 // 30 segundos
```

### Depois (Otimizado):
```typescript
.limit(500) // Reduzido
staleTime: 5 * 60 * 1000 // 5 minutos (aumentado)
```

**Resultado esperado:**
- ⚡ Tempo: 2s → 0.8s
- 💾 Tamanho: 800KB → 400KB
- ✅ Cache mais eficiente

---

## 🎯 Conclusão

Ajustar limites é um processo contínuo. Monitore métricas regularmente e ajuste conforme necessário para manter a melhor performance e experiência do usuário.
