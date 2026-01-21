# 🔍 Diagnóstico Técnico - Feedbacks de Usuários e Bugs

**Data:** 2026-01-16  
**Status:** Análise Completa

---

## 📊 RESUMO EM LINGUAGEM DE NEGÓCIO

### O que os usuários estão reclamando:

1. **Gestão de Usuários:** Não há forma de remover/desativar usuários do sistema, apenas criar e alterar senha.

2. **Contas a Receber:** 
   - Difícil editar contas a receber
   - Contas aparecem como "atrasadas" mesmo após pagamento
   - Não há sincronização automática entre orçamentos aprovados e contas a receber

3. **Dashboard:** 
   - KPIs mostrando valores zerados ("0 dias")
   - Gráficos vazios
   - Botão "Novo Orçamento" duplicado (header e sidebar)

4. **UX/UI:**
   - Gráficos sem legendas
   - Ícones sem tooltips explicativos
   - Campo de endereço único (deveria ser separado)
   - Sem "Esqueci minha senha"
   - Sem paginação visível em listagens
   - Sem filtros por data/vendedor
   - Sem ordenação de colunas
   - Sem histórico de atividades

**Impacto:** Usuários têm dificuldade para gerenciar o sistema, dados financeiros incorretos causam confusão, e a falta de funcionalidades básicas reduz a produtividade.

---

## 🧩 INTERPRETAÇÃO DOS FEEDBACKS

### Feedback 1: WhatsApp (Financeiro/Usuários)

#### "Tem que colocar um lugar para apagar usuário"
**Interpretação:** Usuários precisam de funcionalidade para remover/desativar usuários do sistema. Atualmente só é possível criar e alterar senha.

#### "Editar a receber do cliente mais fácil e desbugar ele"
**Interpretação:** 
- A edição de contas a receber não é intuitiva
- Há bugs no cálculo de status (atrasado vs pago)
- O sistema não atualiza corretamente o status após pagamento

#### "Pq fica atrasado e já tá pago"
**Interpretação:** Contas a receber continuam aparecendo como "atrasadas" mesmo após serem marcadas como pagas. Problema de lógica de cálculo de status.

#### "E não conversa com o orçamento"
**Interpretação:** Não há sincronização automática ou vínculo claro entre orçamentos aprovados e contas a receber. O sistema cria contas manualmente, mas não mantém a relação atualizada.

---

### Feedback 2: Auditoria Técnica

#### CRÍTICOS

**1. Dashboard com dados zerados**
- KPIs mostrando "0 dias"
- Gráficos vazios
- **Causa provável:** Queries retornando dados vazios, filtros de data incorretos, ou falta de dados no período

**2. Botão "Novo Orçamento" duplicado**
- Aparece no header e na sidebar
- **Causa provável:** Componentes duplicados sem coordenação

#### ALTOS

**3. Sem legendas em gráficos**
- Gráfico "Composição de Custos" sem labels
- **Causa provável:** Componente `Legend` do Recharts não está sendo renderizado

**4. Coluna "Pagamento" sem tooltip**
- Ícone sem explicação
- **Causa provável:** Falta componente `Tooltip` no ícone

**5. Nome inconsistente** ✅
- **Status:** Verificado - Todos os arquivos usam "Prisma Interiores"
- **Arquivos verificados:** Navbar, Footer, ContactForm, SolicitacoesVisita, Dashboard, NotificacoesFollowUp
- **Conclusão:** Não há mais inconsistência. Nome está padronizado como "Prisma Interiores"

#### MÉDIOS

**6. Campo endereço único**
- Deveria ser separado (rua, número, CEP)
- **Causa provável:** Schema do banco tem apenas `endereco TEXT`

**7. Sem "Esqueci minha senha"**
- Tela de login incompleta
- **Causa provável:** Não implementado em `Auth.tsx`

**8. Sem paginação visível**
- Listagem de 51+ orçamentos sem controle
- **Causa provável:** `ListaOrcamentos.tsx` não tem paginação implementada

#### BAIXOS

**9-12. Filtros, ordenação e histórico**
- Sem filtro por data/vendedor
- Sem ordenação de colunas
- Sem histórico de atividades
- **Causa provável:** Funcionalidades não implementadas

---

## 🗺️ MAPEAMENTO NO CÓDIGO

### Gestão de Usuários

**Arquivos:**
- `src/pages/GerenciarUsuarios.tsx` - Interface de gerenciamento
- `supabase/functions/list-users/index.ts` - Edge function para listar usuários
- `supabase/functions/update-user-password/index.ts` - Edge function para alterar senha
- `supabase/migrations/20251120122020_*.sql` - Tabela `user_roles`

**Funcionalidades existentes:**
- ✅ Criar usuário
- ✅ Listar usuários
- ✅ Alterar senha
- ❌ **FALTA:** Deletar/desativar usuário

**Tabelas:**
- `auth.users` (Supabase Auth)
- `user_roles` (roles customizados)

---

### Contas a Receber / Financeiro

**Arquivos:**
- `src/components/financeiro/ContasReceber.tsx` - Lista de contas a receber
- `src/components/financeiro/dialogs/DialogContaReceber.tsx` - Dialog de edição
- `src/components/financeiro/dialogs/DialogRegistrarRecebimento.tsx` - Registrar pagamento
- `src/lib/integracaoOrcamentoFinanceiro.ts` - Funções de integração
- `supabase/migrations/20251223194222_*.sql` - Tabela `contas_receber`
- `supabase/migrations/20251223194222_*.sql` - Tabela `parcelas_receber`

**Lógica de Status:**
- `ContasReceber.tsx` linhas 106-140: Cálculo dinâmico de status
- Usa `isPagamentoCompleto()` para verificar tolerância
- Verifica `data_vencimento` vs `startOfToday()`

**Problemas identificados:**
1. Status calculado dinamicamente mas pode não estar sincronizado com banco
2. Lógica de "atrasado" verifica apenas data, não considera pagamento recente
3. Não há atualização automática de status após pagamento

**Tabelas:**
- `contas_receber` (FK: `orcamento_id`)
- `parcelas_receber` (FK: `conta_receber_id`)

---

### Integração Orçamento ↔ Financeiro

**Arquivos:**
- `supabase/migrations/20251229194157_*.sql` - Trigger `auto_criar_conta_receber()`
- `supabase/migrations/20251229230538_*.sql` - Trigger `auto_criar_conta_receber_enviado()`
- `supabase/migrations/20260107193508_*.sql` - Trigger `ensure_conta_receber_on_payment_status()`
- `src/lib/integracaoOrcamentoFinanceiro.ts` - Função `gerarContaReceberOrcamento()`

**Triggers existentes:**
- ✅ Cria conta a receber quando status muda para pagamento
- ✅ Cria conta a receber quando status muda para "enviado"

**Problemas identificados:**
1. Múltiplos triggers podem causar conflitos
2. Não há sincronização bidirecional (mudanças em contas não atualizam orçamento)
3. Relacionamento existe mas não é visível na UI

---

### Dashboard

**Arquivos:**
- `src/components/orcamento/DashboardContent.tsx` - Dashboard principal
- `src/hooks/useDashboardData.ts` - Hook de dados do dashboard
- `src/components/orcamento/charts/GraficoCustos.tsx` - Gráfico de custos
- `src/components/orcamento/charts/GraficoFaturamentoMensal.tsx` - Gráfico de faturamento
- `src/components/orcamento/charts/DistribuicaoCidades.tsx` - Gráfico de cidades

**Queries:**
- `useDashboardData.ts` linhas 208-215: Query de orçamentos com `.limit(1000)`
- Filtros por período: `getDateRange(periodo)`

**Problemas identificados:**
1. KPIs podem retornar 0 se não houver dados no período
2. Gráficos não têm `Legend` component
3. Cálculos podem falhar se `organizationId` estiver null

---

### Listagem de Orçamentos

**Arquivos:**
- `src/components/orcamento/ListaOrcamentos.tsx` - Lista principal
- `src/hooks/useOrcamentosPaginados.ts` - Hook de paginação (se existir)

**Funcionalidades:**
- ✅ Busca por nome
- ✅ Filtro por status
- ❌ **FALTA:** Paginação
- ❌ **FALTA:** Filtro por data
- ❌ **FALTA:** Filtro por vendedor
- ❌ **FALTA:** Ordenação de colunas

**Query:**
- `ListaOrcamentos.tsx` linhas 115-137: Query sem paginação, sem filtros de data/vendedor

---

### Login / Recuperação de Senha

**Arquivos:**
- `src/pages/Auth.tsx` - Tela de login

**Funcionalidades:**
- ✅ Login
- ❌ **FALTA:** "Esqueci minha senha"
- ❌ **FALTA:** Integração com Supabase Auth `resetPasswordForEmail()`

---

### Campos de Endereço

**Arquivos:**
- `src/components/orcamento/wizard/EtapaCliente.tsx` - Formulário de cliente
- `src/components/orcamento/ListaOrcamentos.tsx` linha 53: Interface `endereco: string`

**Schema:**
- Tabela `orcamentos` tem apenas `endereco TEXT`
- Não há campos separados (rua, número, CEP, bairro, cidade)

---

## 🔧 DIAGNÓSTICO TÉCNICO POR ITEM

### 1. ❌ Apagar Usuário

**Problema:**
- Não existe funcionalidade de deletar/desativar usuário
- `GerenciarUsuarios.tsx` só tem criar e alterar senha

**Código atual:**
```typescript
// src/pages/GerenciarUsuarios.tsx
// Apenas: handleCreateUser, handleChangePassword
// FALTA: handleDeleteUser, handleDeactivateUser
```

**Riscos:**
- Hard delete pode quebrar foreign keys
- Soft delete é mais seguro
- Não pode deletar último admin

**Solução:**
- Implementar soft delete (campo `deleted_at` ou `active`)
- Ou usar `supabase.auth.admin.deleteUser()` com validações

---

### 2. ❌ Contas a Receber - Status Atrasado Após Pagamento

**Problema:**
- `ContasReceber.tsx` linhas 106-140 calcula status dinamicamente
- Mas a lógica verifica `data_vencimento < hoje` ANTES de verificar se está pago
- Se uma conta foi paga mas a data de vencimento é antiga, ainda aparece como atrasada

**Código problemático:**
```typescript
// src/components/financeiro/ContasReceber.tsx:131-135
const vencimentoConta = parseDateOnly(conta.data_vencimento);
const contaVencida = vencimentoConta && vencimentoConta < hoje;

if (temParcelaAtrasada || contaVencida) {
  return { ...conta, statusExibicao: 'atrasado' };
}
```

**Problema:** Esta verificação acontece DEPOIS da verificação de pagamento (linha 111-116), mas a lógica está correta. O problema pode ser:
1. Cache não atualizado
2. `valor_pago` não está sendo atualizado corretamente
3. Status no banco não está sendo atualizado

**Verificar:**
- `DialogRegistrarRecebimento.tsx` linhas 112-118: Atualiza `status` para 'pago' ou 'parcial'
- Mas o cálculo dinâmico pode estar sobrescrevendo

---

### 3. ❌ Contas a Receber Não "Conversam" com Orçamento

**Problema:**
- Existem triggers que criam contas automaticamente
- Mas não há sincronização bidirecional
- Mudanças em orçamento não atualizam contas existentes
- Mudanças em contas não atualizam orçamento

**Triggers existentes:**
- `auto_criar_conta_receber()` - Cria quando status muda para pagamento
- `auto_criar_conta_receber_enviado()` - Cria quando status muda para "enviado"
- `ensure_conta_receber_on_payment_status()` - Garante criação

**Problema:**
- Múltiplos triggers podem causar duplicação
- Não há atualização de contas existentes
- Não há vínculo visual na UI

**Solução:**
- Consolidar triggers
- Adicionar sincronização bidirecional
- Mostrar vínculo na UI

---

### 4. ❌ Dashboard com Dados Zerados

**Problema:**
- `useDashboardData.ts` linhas 208-215 faz query com filtros de data
- Se não houver dados no período, retorna arrays vazios
- KPIs calculam sobre arrays vazios = 0

**Código:**
```typescript
// src/hooks/useDashboardData.ts:208-215
const { data: orcamentos, error: orcError } = await supabase
  .from('orcamentos')
  .select('...')
  .eq('organization_id', organizationId)
  .gte('created_at', inicio.toISOString())
  .lte('created_at', fim.toISOString())
  .limit(1000);
```

**Possíveis causas:**
1. `organizationId` null ou incorreto
2. Período selecionado não tem dados
3. Filtros de data muito restritivos
4. Dados não foram importados

**Solução:**
- Adicionar validação de `organizationId`
- Mostrar mensagem quando não há dados
- Adicionar fallback para período maior

---

### 5. ❌ Botão "Novo Orçamento" Duplicado

**Problema:**
- Aparece em `OrcamentoSidebar.tsx` (linha 525-550)
- E em `DashboardContent.tsx` (linha 151-153)

**Código:**
```typescript
// src/components/orcamento/OrcamentoSidebar.tsx:525
const renderNovoOrcamentoButton = () => { ... }

// src/components/orcamento/DashboardContent.tsx:151
<Button onClick={onNovoOrcamento}>Novo Orçamento</Button>
```

**Solução:**
- Remover um dos botões (preferencialmente do header)
- Ou unificar em um componente compartilhado

---

### 6. ⚠️ Gráficos Sem Legendas

**Problema:**
- `GraficoCustos.tsx` não tem componente `Legend` do Recharts
- Tem legenda customizada abaixo (linhas 106-115), mas não no gráfico

**Código:**
```typescript
// src/components/orcamento/charts/GraficoCustos.tsx:2
import { Legend } from 'recharts'; // ✅ Já importado

// Linha 86-103: Legend está importado mas NÃO está sendo renderizado
<PieChart>
  <Pie ... />
  <Tooltip content={<CustomTooltip />} />
  {/* FALTA: <Legend /> - Componente importado mas não usado */}
</PieChart>

// Linha 106-115: Tem legenda customizada abaixo do gráfico, mas não no gráfico
```

**Solução:**
- Adicionar `<Legend />` do Recharts
- Ou melhorar legenda customizada existente

---

### 7. ⚠️ Ícone Sem Tooltip

**Problema:**
- Coluna "Pagamento" tem ícone sem explicação
- Falta componente `Tooltip`

**Solução:**
- Adicionar `Tooltip` do Radix UI
- Ou adicionar `title` attribute no ícone

---

### 8. ⚠️ Campo Endereço Único

**Problema:**
- Schema tem apenas `endereco TEXT`
- Deveria ser: `rua`, `numero`, `complemento`, `bairro`, `cidade`, `cep`

**Schema atual:**
```sql
-- Tabela orcamentos
endereco TEXT
cidade TEXT  -- Já existe separado!
```

**Solução:**
- Migration para adicionar campos separados
- Copiar dados existentes
- Atualizar formulários

---

### 9. ⚠️ Sem "Esqueci minha Senha"

**Problema:**
- `Auth.tsx` não tem link/funcionalidade de recuperação
- Supabase Auth tem `resetPasswordForEmail()` mas não está sendo usado

**Código:**
```typescript
// src/pages/Auth.tsx
// Apenas: handleSignIn
// FALTA: handleForgotPassword
```

**Solução:**
- Adicionar link "Esqueci minha senha"
- Implementar `supabase.auth.resetPasswordForEmail()`

---

### 10. ⚠️ Sem Paginação Visível

**Problema:**
- `ListaOrcamentos.tsx` carrega todos os orçamentos de uma vez
- Não há paginação ou infinite scroll

**Código:**
```typescript
// src/components/orcamento/ListaOrcamentos.tsx:115-137
const { data: orcamentos } = await supabase
  .from('orcamentos')
  .select('...')
  // Sem .range() ou paginação
```

**Solução:**
- Implementar paginação com `.range()`
- Ou usar `useOrcamentosPaginados` hook (se existir)
- Adicionar controles de paginação na UI

---

### 11-12. ℹ️ Filtros, Ordenação e Histórico

**Problema:**
- `ListaOrcamentos.tsx` só tem filtro por nome e status
- Não tem filtro por data/vendedor
- Não tem ordenação de colunas
- Não tem histórico de atividades

**Solução:**
- Adicionar filtros de data (date picker)
- Adicionar filtro por vendedor (select)
- Adicionar ordenação clicável nas colunas
- Criar tabela `log_alteracoes_status` (já existe!) e mostrar histórico

---

## 🎯 PLANO DE CORREÇÃO PRIORIZADO

### 🔴 CRÍTICOS (Corrigir Imediatamente)

#### 1. Dashboard com Dados Zerados
**Arquivos:**
- `src/hooks/useDashboardData.ts`
- `src/components/orcamento/DashboardContent.tsx`

**Ações:**
1. Validar `organizationId` antes de fazer queries
2. Adicionar mensagem quando não há dados
3. Adicionar fallback para período maior
4. Verificar se dados existem no banco

**Código sugerido:**
```typescript
// src/hooks/useDashboardData.ts
if (!organizationId) {
  setError('Organization ID não encontrado');
  return;
}

// Após query
if (!orcamentos || orcamentos.length === 0) {
  // Mostrar mensagem amigável
  setStats({ ...statsDefaults }); // Valores padrão
}
```

#### 2. Botão "Novo Orçamento" Duplicado
**Arquivos:**
- `src/components/orcamento/DashboardContent.tsx`

**Ações:**
1. Remover botão do header (linha 151-153)
2. Manter apenas na sidebar

**Código sugerido:**
```typescript
// Remover estas linhas de DashboardContent.tsx
<Button onClick={onNovoOrcamento}>
  <Plus className="h-4 w-4 mr-2" />
  Novo Orçamento
</Button>
```

---

### 🟡 ALTOS (Corrigir em 1-2 semanas)

#### 3. Gráficos Sem Legendas
**Arquivos:**
- `src/components/orcamento/charts/GraficoCustos.tsx`

**Ações:**
1. Adicionar componente `Legend` do Recharts
2. Ou melhorar legenda customizada existente

**Código sugerido:**
```typescript
// src/components/orcamento/charts/GraficoCustos.tsx
import { Legend } from 'recharts';

<PieChart>
  <Pie ... />
  <Tooltip content={<CustomTooltip />} />
  <Legend 
    verticalAlign="bottom" 
    height={36}
    formatter={(value) => <span className="text-sm">{value}</span>}
  />
</PieChart>
```

#### 4. Ícone Sem Tooltip
**Arquivos:**
- `src/components/orcamento/ListaOrcamentos.tsx` (coluna Pagamento)

**Ações:**
1. Adicionar `Tooltip` do Radix UI no ícone
2. Explicar o que significa o ícone

**Código sugerido:**
```typescript
<Tooltip>
  <TooltipTrigger>
    <Banknote className="h-4 w-4" />
  </TooltipTrigger>
  <TooltipContent>
    <p>Status de pagamento do orçamento</p>
  </TooltipContent>
</Tooltip>
```

#### 5. Contas a Receber - Status Atrasado Após Pagamento
**Arquivos:**
- `src/components/financeiro/ContasReceber.tsx`
- `src/components/financeiro/dialogs/DialogRegistrarRecebimento.tsx`

**Ações:**
1. Garantir que status seja atualizado no banco após pagamento
2. Invalidar cache após atualização
3. Adicionar validação: se está pago, nunca mostrar como atrasado

**Código sugerido:**
```typescript
// src/components/financeiro/ContasReceber.tsx:108-140
const contasComStatusDinamico = useMemo(() => {
  return contas.map(conta => {
    // PRIMEIRO: Verificar se está pago (prioridade máxima)
    const estaPago = conta.status === 'pago' || 
      isPagamentoCompleto(Number(conta.valor_total), Number(conta.valor_pago));
    
    if (estaPago) {
      return { ...conta, statusExibicao: 'pago' };
    }
    
    // Só verificar atraso se NÃO estiver pago
    const hoje = startOfToday();
    // ... resto da lógica
  });
}, [contas]);
```

---

### 🟠 MÉDIOS (Corrigir em 1 mês)

#### 6. Campo Endereço Separado
**Arquivos:**
- `supabase/migrations/` - Nova migration
- `src/components/orcamento/wizard/EtapaCliente.tsx`

**Ações:**
1. Criar migration para adicionar campos: `rua`, `numero`, `complemento`, `bairro`, `cep`
2. Copiar dados existentes de `endereco` para `rua`
3. Atualizar formulário para campos separados
4. Manter `endereco` por compatibilidade (deprecated)

**Migration sugerida:**
```sql
-- Adicionar campos separados
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS endereco_rua TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT,
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS endereco_cep TEXT;

-- Copiar dados existentes
UPDATE public.orcamentos 
SET endereco_rua = endereco
WHERE endereco IS NOT NULL AND endereco_rua IS NULL;
```

#### 7. "Esqueci minha Senha"
**Arquivos:**
- `src/pages/Auth.tsx`

**Ações:**
1. Adicionar link "Esqueci minha senha"
2. Criar dialog/modal para email
3. Implementar `supabase.auth.resetPasswordForEmail()`

**Código sugerido:**
```typescript
// src/pages/Auth.tsx
const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
const [resetEmail, setResetEmail] = useState('');

const handleForgotPassword = async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: `${window.location.origin}/auth?reset=true`
  });
  if (error) {
    toast.error(error.message);
  } else {
    toast.success('Email de recuperação enviado!');
    setForgotPasswordOpen(false);
  }
};
```

#### 8. Paginação Visível
**Arquivos:**
- `src/components/orcamento/ListaOrcamentos.tsx`
- `src/hooks/useOrcamentosPaginados.ts` (criar se não existir)

**Ações:**
1. Implementar paginação com `.range()`
2. Adicionar controles de paginação na UI
3. Mostrar "Página X de Y"

**Código sugerido:**
```typescript
// src/components/orcamento/ListaOrcamentos.tsx
const [page, setPage] = useState(1);
const itemsPerPage = 20;

const { data: orcamentos } = await supabase
  .from('orcamentos')
  .select('...')
  .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
  .limit(itemsPerPage);
```

---

### 🟢 BAIXOS (Backlog)

#### 9-12. Filtros, Ordenação e Histórico

**Ações:**
1. Adicionar filtro por data (date picker)
2. Adicionar filtro por vendedor (select com vendedores)
3. Adicionar ordenação clicável nas colunas
4. Criar componente de histórico usando `log_alteracoes_status`

**Código sugerido:**
```typescript
// Filtro por data
const [dataInicio, setDataInicio] = useState<Date>();
const [dataFim, setDataFim] = useState<Date>();

// Filtro por vendedor
const [vendedorId, setVendedorId] = useState<string>();

// Ordenação
const [sortBy, setSortBy] = useState<string>('created_at');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

// Query com filtros e ordenação
const { data: orcamentos } = await supabase
  .from('orcamentos')
  .select('...')
  .gte('created_at', dataInicio?.toISOString())
  .lte('created_at', dataFim?.toISOString())
  .eq('vendedor_id', vendedorId)
  .order(sortBy, { ascending: sortOrder === 'asc' });
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Críticos
- [ ] Corrigir dashboard com dados zerados
- [ ] Remover botão duplicado "Novo Orçamento"

### Altos
- [ ] Adicionar legendas nos gráficos
- [ ] Adicionar tooltips nos ícones
- [ ] Corrigir status "atrasado" após pagamento
- [ ] Implementar apagar/desativar usuário
- [ ] Melhorar edição de contas a receber
- [ ] Sincronizar orçamento ↔ contas a receber

### Médios
- [ ] Separar campo de endereço
- [ ] Implementar "Esqueci minha senha"
- [ ] Adicionar paginação visível

### Baixos
- [ ] Adicionar filtros (data, vendedor)
- [ ] Adicionar ordenação de colunas
- [ ] Adicionar histórico de atividades

---

**Este documento será atualizado conforme as correções forem implementadas.**
