# 📋 Resumo Executivo - Expansão e Generalização do ERP

**Data:** 2026-01-16  
**Objetivo:** Transformar sistema específico em ERP genérico para decoração

---

## 🎯 VISÃO GERAL

O sistema atual é **muito específico para cortinas/persianas**. Para expandir para outras categorias (móveis, tapetes, decoração), precisamos:

1. **Generalizar modelo de produtos**
2. **Implementar módulo de estoque**
3. **Criar módulo de integrações**
4. **Refatorar UI para ser genérica**

---

## 🔍 PRINCIPAIS DESCOBERTAS

### Partes Rígidas Identificadas:

1. **Tabela `cortina_items`** - Nome e estrutura específica
2. **Tabela `materiais`** - Categorias hardcoded (tecido, forro, trilho)
3. **Cálculos específicos** - Coeficientes fixos por tipo de cortina
4. **Componentes UI** - Cada tipo tem seu próprio Card component
5. **Fluxo de produção** - Hardcoded: corte → costura → acabamento
6. **Textos hardcoded** - "Cortinas", "Persianas" em vários lugares

### Arquivos Críticos a Generalizar:

- `src/types/orcamento.ts` - Interface `Cortina`
- `src/lib/calculosOrcamento.ts` - Todas as funções de cálculo
- `src/components/orcamento/wizard/*Card.tsx` - 6 componentes específicos
- `supabase/migrations/*cortina_items*.sql` - Schema específico

---

## 💡 SOLUÇÕES PROPOSTAS

### 1. Novo Modelo de Produtos

**Substituir:**
- `cortina_items` → `order_items`
- `materiais` → `products`

**Novas Tabelas:**
- `product_categories` - Categorias (Cortinas, Móveis, Tapetes, etc.)
- `product_types` - Tipos dentro de cada categoria
- `products` - Produtos genéricos (com ou sem dimensões)
- `product_variants` - Variações (cor, tamanho, material)
- `order_items` - Itens de orçamento genéricos

**Vantagens:**
- ✅ Suporta produtos com/sem dimensões
- ✅ Suporta múltiplas unidades (unit, m², ml, kg)
- ✅ Suporta variações
- ✅ Configurável por tipo de produto

### 2. Módulo de Estoque

**Tabelas:**
- `warehouses` - Depósitos/Lojas
- `inventory_items` - Itens em estoque
- `inventory_movements` - Movimentações (entrada/saída)

**Funcionalidades:**
- ✅ Controle de estoque por produto/depósito
- ✅ Alertas de estoque mínimo
- ✅ Histórico de movimentações
- ✅ Integração automática com orçamentos/pedidos

### 3. Módulo de Integrações

**Tabelas:**
- `integration_categories` - Categorias (Marketing, Fiscal, etc.)
- `integration_providers` - Provedores (Google Ads, PlugNotas, etc.)
- `connected_integrations` - Conexões ativas
- `integration_logs` - Logs de sincronização

**Funcionalidades:**
- ✅ Plug-and-play via API tokens
- ✅ Validação de credenciais
- ✅ Drivers abstratos para cada provedor
- ✅ Logs de sincronização

---

## 📊 CATEGORIAS QUE PODEM SER ATENDIDAS

### ✅ Pode Atender Agora:
- **Tapetes** (prontos e sob medida)
- **Móveis Soltos** (poltronas, cadeiras, sofás simples)
- **Papéis de Parede** (já parcialmente suportado)
- **Decoração** (almofadas, espelhos, quadros, luminárias)

### ❌ Não Deve Atender Agora:
- **Móveis Planejados Complexos** (requer CAD, renderização)
- **Marcenaria sob Projeto** (requer desenhos técnicos)

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### Q1 2026: Fundação (4-6 semanas)
- [ ] Criar tabelas de produtos genéricos
- [ ] Migrar dados existentes
- [ ] Refatorar UI para produtos genéricos
- [ ] Implementar módulo de estoque básico

### Q2 2026: Integrações (2-3 semanas)
- [ ] Módulo de integrações
- [ ] API pública básica
- [ ] Drivers básicos (webhook, PlugNotas)

### Q3 2026: Funcionalidades Avançadas (4-6 semanas)
- [ ] Permissões granulares
- [ ] Audit log completo
- [ ] Automações básicas
- [ ] Dashboards personalizáveis

### Q4 2026: Polimento (2-3 semanas)
- [ ] Performance
- [ ] Testes automatizados
- [ ] Documentação completa

---

## 💰 MELHORIAS ESSENCIAIS IDENTIFICADAS

### Must-Have (P0):
1. Permissões detalhadas por usuário
2. Histórico completo de ações (audit log)
3. API pública para integrações
4. Módulo de estoque
5. Módulo de integrações

### Nice-to-Have (P1):
6. Timeline de pedidos/orçamentos
7. Módulo de tarefas/checklist
8. Módulo de garantias
9. Comissões avançadas
10. Metas e performance

### Later (P2):
11. Configurador 3D
12. Integração com moodboards
13. Cálculo de frete

---

## ⚠️ RISCOS E MITIGAÇÕES

### Riscos:
1. **Migração de dados** - Pode perder dados
   - **Mitigação:** Backup completo + testes em staging

2. **Breaking changes** - Pode quebrar integrações
   - **Mitigação:** Feature flags + compatibilidade temporária

3. **Performance** - Novas queries podem ser lentas
   - **Mitigação:** Índices adequados + paginação

4. **Complexidade** - Sistema pode ficar muito complexo
   - **Mitigação:** Documentação + testes

---

## 📈 COMPARAÇÃO COM MERCADO

### O que já temos:
- ✅ Multi-tenant nativo
- ✅ UI moderna
- ✅ Feature flags por plano
- ✅ Cálculo de consumo de tecido

### O que falta:
- ❌ Estoque completo
- ❌ Integrações plug-and-play
- ❌ Permissões granulares
- ❌ API pública
- ❌ Automações

### Oportunidades de Diferenciação:
1. Interface superior aos concorrentes
2. Multi-tenant nativo (vantagem competitiva)
3. API pública (permitir integrações avançadas)
4. Automações inteligentes

---

## ✅ PRÓXIMOS PASSOS

1. **Revisar documento completo:** `docs/EXPANSAO_ERP_GENERALIZACAO.md`
2. **Priorizar implementação** conforme roadmap
3. **Criar feature flags** para rollout gradual
4. **Iniciar Fase 1** (Generalização de produtos)

---

**Ver documento completo:** `docs/EXPANSAO_ERP_GENERALIZACAO.md`
