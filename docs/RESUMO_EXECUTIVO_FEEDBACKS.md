# 📋 Resumo Executivo - Feedbacks e Bugs

**Data:** 2026-01-16  
**Prioridade:** Alta

---

## 🎯 PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICOS (Corrigir Imediatamente)

1. **Dashboard com dados zerados**
   - KPIs mostrando "0 dias"
   - Gráficos vazios
   - **Causa:** Queries retornando vazio ou `organizationId` null

2. **Botão "Novo Orçamento" duplicado**
   - Aparece no header E na sidebar
   - **Causa:** Componentes duplicados

### 🟡 ALTOS (1-2 semanas)

3. **Gráficos sem legendas**
   - `GraficoCustos.tsx` tem `Legend` importado mas não renderizado
   - **Causa:** Componente não está sendo usado

4. **Ícone sem tooltip**
   - Coluna "Pagamento" sem explicação
   - **Causa:** Falta `Tooltip` component

5. **Contas a receber - Status incorreto**
   - Aparece como "atrasado" mesmo após pagamento
   - **Causa:** Lógica de cálculo não prioriza status "pago"

6. **Falta apagar usuário**
   - Não há funcionalidade para remover/desativar
   - **Causa:** Não implementado

7. **Contas não "conversam" com orçamento**
   - Falta sincronização bidirecional
   - **Causa:** Múltiplos triggers, sem sincronização

### 🟠 MÉDIOS (1 mês)

8. **Campo endereço único**
   - Deveria ser separado (rua, número, CEP)
   - **Causa:** Schema tem apenas `endereco TEXT`

9. **Sem "Esqueci minha senha"**
   - Tela de login incompleta
   - **Causa:** Não implementado

10. **Sem paginação visível**
    - Listagem sem controle de páginas
    - **Causa:** Não implementado

### 🟢 BAIXOS (Backlog)

11. **Sem filtros** (data, vendedor)
12. **Sem ordenação** de colunas
13. **Sem histórico** de atividades

---

## 📊 MAPEAMENTO RÁPIDO

### Onde está cada coisa:

- **Usuários:** `src/pages/GerenciarUsuarios.tsx`
- **Contas a Receber:** `src/components/financeiro/ContasReceber.tsx`
- **Dashboard:** `src/hooks/useDashboardData.ts`
- **Gráficos:** `src/components/orcamento/charts/`
- **Lista Orçamentos:** `src/components/orcamento/ListaOrcamentos.tsx`
- **Login:** `src/pages/Auth.tsx`

---

## ✅ AÇÕES IMEDIATAS

1. Validar `organizationId` no dashboard
2. Remover botão duplicado do header
3. Adicionar `<Legend />` no `GraficoCustos.tsx`
4. Adicionar tooltip no ícone de pagamento
5. Corrigir lógica de status "atrasado"
6. Implementar soft delete de usuários

---

**Ver documento completo:** `docs/DIAGNOSTICO_FEEDBACKS_USUARIOS.md`
