# 🚀 Guia de Monitoramento em Produção

## 📊 Visão Geral

Este guia descreve como monitorar e ajustar as otimizações de performance em produção.

---

## 🔍 Métricas a Monitorar

### 1. Tempo de Carregamento

**O que medir:**
- Tempo até primeiro conteúdo (FCP)
- Tempo até interatividade (TTI)
- Tempo de carregamento de listas
- Tempo de resposta de queries

**Como medir:**
```javascript
// No console do navegador
performance.getEntriesByType('navigation')[0].loadEventEnd - performance.getEntriesByType('navigation')[0].fetchStart
```

**Meta:**
- Listas: < 1s
- Queries: < 500ms
- Página completa: < 2s

---

### 2. Tamanho dos Dados Transferidos

**O que medir:**
- Tamanho das respostas das queries
- Tamanho total da página
- Tamanho dos assets

**Como medir:**
```javascript
// No console do navegador (Chrome DevTools)
// Network tab → Size column
```

**Meta:**
- Queries: < 500KB
- Página inicial: < 2MB
- Assets: < 5MB total

---

### 3. Uso de Memória

**O que medir:**
- Memória heap usada
- Vazamentos de memória
- Crescimento ao longo do tempo

**Como medir:**
```javascript
// No console do navegador
performance.memory.usedJSHeapSize / 1048576 // MB
```

**Meta:**
- Uso inicial: < 50MB
- Após uso prolongado: < 200MB
- Sem crescimento contínuo

---

### 4. Taxa de Erro

**O que medir:**
- Erros de queries
- Erros de renderização
- Timeouts

**Como medir:**
- Console do navegador
- Ferramentas de APM (Sentry, etc.)
- Logs do servidor

**Meta:**
- Taxa de erro: < 1%
- Queries com erro: < 0.5%

---

## 🛠️ Ferramentas de Monitoramento

### 1. Chrome DevTools

**Performance Tab:**
- Gravar sessão de uso
- Identificar gargalos
- Analisar tempo de renderização

**Network Tab:**
- Ver tamanho das requisições
- Ver tempo de resposta
- Identificar requisições lentas

**Memory Tab:**
- Detectar vazamentos
- Ver uso de memória
- Analisar snapshots

---

### 2. React Query DevTools

**Instalação:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// No App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

**Uso:**
- Ver queries em cache
- Ver tempo de stale
- Invalidar queries manualmente

---

### 3. Performance Monitor Hook

**Uso em desenvolvimento:**
```typescript
import { monitor } from '@/hooks/usePerformanceMonitor';

// Ver métricas
const metrics = monitor.getMetrics();
console.table(metrics);

// Exportar dados
const data = monitor.export();
```

**Acesso via console:**
```javascript
// Em desenvolvimento
window.__performanceMonitor.getMetrics()
window.__performanceMonitor.export()
```

---

### 4. Script de Teste

**Executar:**
```bash
node scripts/teste-performance.mjs
```

**O que faz:**
- Testa queries otimizadas vs antigas
- Compara tempo e tamanho
- Gera relatório

---

## 📈 Ajustes Conforme Necessário

### 1. Ajustar Limites de Paginação

**Se carregamento ainda está lento:**
```typescript
// Aumentar cache time
staleTime: 5 * 60 * 1000, // 5 minutos

// Reduzir tamanho da página
const PAGE_SIZE = 25; // Reduzir de 50 para 25
```

**Se usuário precisa ver mais dados:**
```typescript
// Aumentar tamanho da página
const PAGE_SIZE = 100; // Aumentar de 50 para 100

// Reduzir cache time (dados mais frescos)
staleTime: 30 * 1000, // 30 segundos
```

---

### 2. Ajustar Cache do React Query

**Para dados que mudam pouco:**
```typescript
staleTime: 10 * 60 * 1000, // 10 minutos
gcTime: 30 * 60 * 1000, // 30 minutos
```

**Para dados que mudam frequentemente:**
```typescript
staleTime: 30 * 1000, // 30 segundos
gcTime: 5 * 60 * 1000, // 5 minutos
```

---

### 3. Otimizar Queries Específicas

**Se uma query específica está lenta:**

1. Verificar campos selecionados
2. Adicionar índices no banco
3. Considerar RPC function para agregações
4. Adicionar filtros de data

**Exemplo:**
```typescript
// Antes
.select('*')

// Depois
.select('id, nome, status, created_at') // Apenas campos necessários
.limit(100) // Limitar resultados
```

---

## 🚨 Alertas e Ações

### Query > 1s

**Ação:**
1. Verificar campos selecionados
2. Verificar se há `select('*')`
3. Adicionar limite se necessário
4. Verificar índices no banco

---

### Tamanho > 1MB

**Ação:**
1. Reduzir campos selecionados
2. Adicionar paginação
3. Considerar compressão (gzip)

---

### Memória > 200MB

**Ação:**
1. Verificar vazamentos de memória
2. Limpar cache periodicamente
3. Usar paginação virtual
4. Lazy load de componentes

---

### Taxa de Erro > 1%

**Ação:**
1. Verificar logs de erro
2. Melhorar tratamento de erros
3. Adicionar retry logic
4. Verificar conectividade

---

## 📝 Checklist Semanal

- [ ] Executar script de teste de performance
- [ ] Revisar métricas do monitor
- [ ] Verificar queries lentas (> 500ms)
- [ ] Verificar tamanho dos dados (> 500KB)
- [ ] Verificar uso de memória
- [ ] Revisar taxa de erro
- [ ] Ajustar limites se necessário
- [ ] Documentar melhorias aplicadas

---

## 🔄 Processo de Otimização Contínua

1. **Monitorar** - Coletar métricas regularmente
2. **Identificar** - Encontrar gargalos
3. **Otimizar** - Aplicar melhorias
4. **Testar** - Verificar impacto
5. **Documentar** - Registrar mudanças
6. **Repetir** - Ciclo contínuo

---

## 📊 Relatório de Performance

**Template:**
```markdown
# Relatório de Performance - [Data]

## Métricas
- Tempo médio de carregamento: Xms
- Tamanho médio dos dados: XKB
- Uso de memória: XMB
- Taxa de erro: X%

## Queries Lentas
1. Query X: Xms (meta: < 500ms)
2. Query Y: Xms (meta: < 500ms)

## Ajustes Aplicados
- [ ] Ajuste 1
- [ ] Ajuste 2

## Próximos Passos
- [ ] Otimização 1
- [ ] Otimização 2
```

---

## 🎯 Conclusão

O monitoramento contínuo é essencial para manter a performance. Use as ferramentas disponíveis e ajuste conforme necessário para garantir a melhor experiência do usuário.
