# 🚀 GUIA DE EXECUÇÃO - MIGRAÇÃO PARA NOVO SUPABASE

## Projeto Destino
- **URL:** `https://tjwpqrlfhngibuwqodcn.supabase.co`
- **Project Ref:** `tjwpqrlfhngibuwqodcn`

---

## 🛠️ BACKUP VIA SUPABASE CLI (Recomendado)

### Pré-requisitos
```bash
npm install -g supabase
supabase login
```

### Exportar do Projeto ORIGEM (emmogpqoqfmwtipxwcit)
```bash
# 1. Vincular ao projeto origem
supabase link --project-ref emmogpqoqfmwtipxwcit

# 2. Exportar schema completo (estrutura)
supabase db dump --schema public -f docs/backup/SCHEMA_COMPLETO.sql

# 3. Exportar todos os dados
supabase db dump --data-only -f docs/backup/DATA_COMPLETO.sql

# 4. Exportar apenas RLS policies (opcional)
supabase db dump --role-only -f docs/backup/RLS_POLICIES.sql
```

### Importar no Projeto DESTINO (tjwpqrlfhngibuwqodcn)
```bash
# 1. Vincular ao novo projeto
supabase link --project-ref tjwpqrlfhngibuwqodcn

# 2. Importar via psql (senha será solicitada)
psql "postgresql://postgres:[SUA_SENHA]@db.tjwpqrlfhngibuwqodcn.supabase.co:5432/postgres" -f docs/backup/SCHEMA_COMPLETO.sql
psql "postgresql://postgres:[SUA_SENHA]@db.tjwpqrlfhngibuwqodcn.supabase.co:5432/postgres" -f docs/backup/DATA_COMPLETO.sql
```

### Alternativa: Via Dashboard
Acesse Settings → Database → Connection string para obter a string de conexão.

---

## 📋 ORDEM DE EXECUÇÃO

Acesse o **SQL Editor** do novo projeto Supabase:
`https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql`

Execute os arquivos **na ordem abaixo**:

### PASSO 1: Tipos e Estrutura
```
1. 02_SCHEMA_TYPES.sql      → Tipos enum
2. 03_SCHEMA_TABLES.sql     → Tabelas + índices + RLS habilitado
3. 04_SCHEMA_FUNCTIONS_1.sql → Funções auxiliares
```

### PASSO 2: Triggers (execute manualmente)
```sql
-- Trigger para gerar código de orçamento
CREATE TRIGGER trigger_gerar_codigo_orcamento_auto
  BEFORE INSERT ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_gerar_codigo_orcamento();

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_orcamentos
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_contatos
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_materiais
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para recalcular totais
CREATE TRIGGER trigger_recalcular_totais
  AFTER INSERT OR UPDATE OR DELETE ON public.cortina_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalcular_totais_orcamento();

-- Trigger para atualizar status
CREATE TRIGGER trigger_update_status
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_status_updated_at();

-- Trigger para atualizar última interação
CREATE TRIGGER trigger_atualizar_interacao_atividade
  AFTER INSERT ON public.atividades_crm
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_ultima_interacao_contato();

-- Trigger para sync CRM
CREATE TRIGGER trigger_sync_contato_orcamento
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_contato_from_orcamento_changes();

-- Trigger para limite de usuários
CREATE TRIGGER trigger_check_user_limit
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_limit();
```

### PASSO 3: Dados Base
```
4. 07_DATA_BASE.sql         → Organizations, Plans, Formas Pagamento, Configs
```

### PASSO 4: Dados de Cadastros
```
5. 08_DATA_CADASTROS.sql    → Materiais, Serviços, Categorias, Contatos
```

### PASSO 5: Dados Operacionais
```
6. 09_DATA_CRM.sql          → Orçamentos, Cortinas, Oportunidades, Atividades
7. 10_DATA_OPERACIONAL.sql  → Pedidos, Itens, Lançamentos, Contas
```

---

## 🔐 RLS POLICIES

Após importar os dados, execute as policies de RLS:

```sql
-- =====================================================
-- POLICIES PARA ORGANIZATIONS
-- =====================================================

CREATE POLICY "Membros veem sua org" ON public.organizations
  FOR SELECT USING (
    id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- =====================================================
-- POLICIES PARA PLANS
-- =====================================================

CREATE POLICY "Todos podem ver planos" ON public.plans
  FOR SELECT USING (true);

-- =====================================================
-- POLICIES PARA MATERIAIS
-- =====================================================

CREATE POLICY "materiais_select_org" ON public.materiais
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "materiais_insert_org" ON public.materiais
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_update_org" ON public.materiais
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_delete_org" ON public.materiais
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA ORÇAMENTOS
-- =====================================================

CREATE POLICY "orcamentos_select_org" ON public.orcamentos
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "orcamentos_insert_org" ON public.orcamentos
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "orcamentos_update_org" ON public.orcamentos
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "orcamentos_delete_org" ON public.orcamentos
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA CONTATOS
-- =====================================================

CREATE POLICY "contatos_select_org" ON public.contatos
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contatos_insert_org" ON public.contatos
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contatos_update_org" ON public.contatos
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contatos_delete_org" ON public.contatos
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA PEDIDOS
-- =====================================================

CREATE POLICY "pedidos_select_org" ON public.pedidos
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "pedidos_insert_org" ON public.pedidos
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "pedidos_update_org" ON public.pedidos
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA LANÇAMENTOS FINANCEIROS
-- =====================================================

CREATE POLICY "lancamentos_select_org" ON public.lancamentos_financeiros
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "lancamentos_insert_org" ON public.lancamentos_financeiros
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "lancamentos_update_org" ON public.lancamentos_financeiros
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA CATEGORIAS FINANCEIRAS
-- =====================================================

CREATE POLICY "categorias_select_org" ON public.categorias_financeiras
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "categorias_insert_org" ON public.categorias_financeiras
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "categorias_update_org" ON public.categorias_financeiras
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA FORMAS DE PAGAMENTO
-- =====================================================

CREATE POLICY "formas_pagamento_select_org" ON public.formas_pagamento
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "formas_pagamento_insert_org" ON public.formas_pagamento
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA SERVICOS
-- =====================================================

CREATE POLICY "servicos_confeccao_select_org" ON public.servicos_confeccao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_confeccao_insert_org" ON public.servicos_confeccao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_confeccao_update_org" ON public.servicos_confeccao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_select_org" ON public.servicos_instalacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_instalacao_insert_org" ON public.servicos_instalacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_update_org" ON public.servicos_instalacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA ORGANIZATION MEMBERS
-- =====================================================

CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR user_id = auth.uid()
  );

-- =====================================================
-- POLICIES PARA SOLICITAÇÕES DE VISITA
-- =====================================================

-- Permite INSERT anônimo (landing page)
CREATE POLICY "sv_insert_anon" ON public.solicitacoes_visita
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sv_select_org" ON public.solicitacoes_visita
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "sv_update_org" ON public.solicitacoes_visita
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

-- =====================================================
-- POLICIES PARA CONTAS A PAGAR/RECEBER
-- =====================================================

CREATE POLICY "contas_pagar_select_org" ON public.contas_pagar
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contas_pagar_insert_org" ON public.contas_pagar
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contas_pagar_update_org" ON public.contas_pagar
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contas_receber_select_org" ON public.contas_receber
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contas_receber_insert_org" ON public.contas_receber
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "contas_receber_update_org" ON public.contas_receber
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA OPORTUNIDADES
-- =====================================================

CREATE POLICY "oportunidades_select_org" ON public.oportunidades
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "oportunidades_insert_org" ON public.oportunidades
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "oportunidades_update_org" ON public.oportunidades
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA ATIVIDADES CRM
-- =====================================================

CREATE POLICY "atividades_select_org" ON public.atividades_crm
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "atividades_insert_org" ON public.atividades_crm
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "atividades_update_org" ON public.atividades_crm
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA NOTIFICACOES
-- =====================================================

CREATE POLICY "notificacoes_select" ON public.notificacoes
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id = get_user_organization_id()
  );

CREATE POLICY "notificacoes_insert" ON public.notificacoes
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "notificacoes_update" ON public.notificacoes
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- =====================================================
-- POLICIES PARA CONFIGURAÇÕES
-- =====================================================

CREATE POLICY "config_select_org" ON public.configuracoes_sistema
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "config_insert_org" ON public.configuracoes_sistema
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "config_update_org" ON public.configuracoes_sistema
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

-- =====================================================
-- POLICIES PARA SUBSCRIPTIONS
-- =====================================================

CREATE POLICY "subscriptions_select_org" ON public.subscriptions
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- =====================================================
-- POLICIES PARA CORTINA ITEMS (sem organization_id, usa orcamento)
-- =====================================================

CREATE POLICY "cortina_items_select" ON public.cortina_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orcamentos o 
      WHERE o.id = cortina_items.orcamento_id 
      AND o.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "cortina_items_insert" ON public.cortina_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orcamentos o 
      WHERE o.id = orcamento_id 
      AND o.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "cortina_items_update" ON public.cortina_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orcamentos o 
      WHERE o.id = cortina_items.orcamento_id 
      AND o.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "cortina_items_delete" ON public.cortina_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM orcamentos o 
      WHERE o.id = cortina_items.orcamento_id 
      AND o.organization_id = get_user_organization_id()
    )
  );
```

---

## 👤 CRIAR PRIMEIRO USUÁRIO

Após tudo estar configurado, crie um usuário:

1. Acesse: `https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/auth/users`
2. Clique em "Add user" → "Create new user"
3. Insira email e senha
4. Após criar, copie o `User UID`
5. Execute no SQL Editor:

```sql
-- Substitua SEU_USER_ID pelo UUID do usuário criado
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'SEU_USER_ID', 'owner');

INSERT INTO user_roles (user_id, role)
VALUES ('SEU_USER_ID', 'admin');
```

---

## ✅ VALIDAÇÃO FINAL

Execute estas queries para validar:

```sql
-- Contar tabelas
SELECT COUNT(*) as total_tabelas FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Verificar organizações
SELECT id, name FROM organizations;

-- Verificar planos
SELECT codigo, nome, preco_mensal FROM plans ORDER BY ordem;

-- Verificar materiais
SELECT COUNT(*) as total_materiais FROM materiais;
```

---

**Após completar todos os passos, seu novo Supabase estará pronto!** 🎉
