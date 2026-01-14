# 🚀 Guia de Deploy em Produção

## 📋 Checklist Pré-Deploy

### 1. Validação de Métricas
```bash
# Executar validação completa
node scripts/validar-metricas-staging.mjs
```

**Resultado esperado:** ✅ Todas as métricas passando

---

### 2. Testes de Performance
```bash
# Executar testes de performance
node scripts/teste-performance.mjs
```

**Verificar:**
- ✅ Queries otimizadas mais rápidas
- ✅ Redução de tamanho dos dados
- ✅ Melhorias de 50%+ em tempo

---

### 3. Verificar Build
```bash
npm run build
```

**Verificar:**
- ✅ Build sem erros
- ✅ Tamanho do bundle razoável
- ✅ Sem warnings críticos

---

## 🚀 Processo de Deploy

### Passo 1: Deploy em Staging

1. **Fazer deploy em staging**
2. **Aguardar 5-10 minutos** para estabilização
3. **Executar validação:**
   ```bash
   node scripts/validar-metricas-staging.mjs
   ```

### Passo 2: Monitoramento Inicial (24-48h)

**Métricas a monitorar:**
- Tempo de carregamento
- Tamanho dos dados
- Taxa de erro
- Uso de memória

**Ferramentas:**
- Chrome DevTools
- Performance Monitor Hook
- Scripts de validação

### Passo 3: Ajustes (Se Necessário)

**Se métricas não estão boas:**
1. Identificar queries problemáticas
2. Ajustar limites conforme `docs/AJUSTE_LIMITES.md`
3. Re-deploy e re-validar

### Passo 4: Deploy em Produção

**Após validação em staging:**
1. Deploy em produção
2. Monitorar por 1-2 horas
3. Verificar métricas críticas

---

## 📊 Monitoramento Pós-Deploy

### Primeiras 24 Horas

**Verificar a cada 4 horas:**
- [ ] Tempo de carregamento médio
- [ ] Queries lentas (> 1s)
- [ ] Taxa de erro
- [ ] Uso de memória

**Ferramentas:**
```javascript
// No console do navegador
window.__performanceMonitor.getMetrics()
```

### Primeira Semana

**Verificar diariamente:**
- [ ] Métricas de performance
- [ ] Feedback dos usuários
- [ ] Queries problemáticas
- [ ] Necessidade de ajustes

**Ações:**
- Ajustar limites se necessário
- Documentar problemas encontrados
- Planejar melhorias futuras

---

## 🎯 Métricas de Sucesso

### Tempo de Carregamento
- ✅ Listas: < 1s
- ✅ Queries: < 500ms
- ✅ Página completa: < 2s

### Tamanho dos Dados
- ✅ Queries: < 500KB
- ✅ Página inicial: < 2MB

### Taxa de Erro
- ✅ < 1%
- ✅ Queries com erro: < 0.5%

### Uso de Memória
- ✅ Inicial: < 50MB
- ✅ Após uso prolongado: < 200MB

---

## 🚨 Alertas e Ações

### Query > 1s
**Ação:**
1. Verificar campos selecionados
2. Adicionar limite se necessário
3. Verificar índices no banco

### Tamanho > 1MB
**Ação:**
1. Reduzir campos selecionados
2. Adicionar paginação
3. Considerar compressão

### Taxa de Erro > 1%
**Ação:**
1. Verificar logs de erro
2. Melhorar tratamento de erros
3. Adicionar retry logic

---

## 📝 Relatório Pós-Deploy

**Template:**
```markdown
# Relatório de Deploy - [Data]

## Métricas
- Tempo médio de carregamento: Xms
- Tamanho médio dos dados: XKB
- Taxa de erro: X%
- Uso de memória: XMB

## Problemas Encontrados
- [ ] Problema 1
- [ ] Problema 2

## Ajustes Aplicados
- [ ] Ajuste 1
- [ ] Ajuste 2

## Próximos Passos
- [ ] Otimização 1
- [ ] Otimização 2
```

---

## ✅ Conclusão

Seguir este processo garante um deploy seguro e monitorado, com capacidade de ajustar rapidamente se necessário.
