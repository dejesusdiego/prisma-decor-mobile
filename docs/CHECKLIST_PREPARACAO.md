# ✅ CHECKLIST DE PREPARAÇÃO - Prisma ERP

## 📋 Visão Geral

Este documento contém TODOS os passos necessários antes de iniciar o desenvolvimento do ERP replicável.

**Tempo estimado:** 1-2 horas  
**Pré-requisitos:** Projeto funcionando no Lovable + GitHub conectado

---

## 🔐 ETAPA 1: Acessar o Supabase Dashboard (15 min)

### Passo 1.1: Descobrir como acessar

O Lovable cria um projeto Supabase para você. Existem 3 formas de acessar:

**Opção A: Via Lovable (mais fácil)**
1. Acesse seu projeto no Lovable (https://lovable.dev)
2. Clique no menu **"Settings"** (⚙️)
3. Vá em **"Supabase"** ou **"Integrations"**
4. Procure por um botão **"Open Supabase Dashboard"** ou **"Manage Database"**

**Opção B: Via URL direta**
1. Acesse: https://supabase.com/dashboard
2. Faça login com a **mesma conta** usada no Lovable (Google/GitHub)
3. Seu projeto `emmogpqoqfmwtipxwcit` deve aparecer na lista

**Opção C: Se não aparecer**
1. No Lovable, vá em Settings > Supabase
2. Procure por **"Transfer to Supabase"** ou **"Link to Supabase Account"**
3. Siga as instruções para vincular

### Passo 1.2: Verificar acesso

✅ Conseguiu acessar? Você deve ver:
- Dashboard com métricas
- Menu lateral com: Table Editor, SQL Editor, Authentication, etc.
- Nome do projeto: `emmogpqoqfmwtipxwcit`

❌ Não conseguiu? 
- Tente fazer login no Supabase com a mesma conta do Lovable
- Verifique se está na organização correta (dropdown no topo)

---

## 💾 ETAPA 2: Fazer Backup (10 min) ⚠️ CRÍTICO

**NUNCA pule esta etapa!** Antes de qualquer alteração, faça backup.

### Passo 2.1: Backup via Dashboard

1. No Supabase Dashboard, vá em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"Database"**
3. Role até **"Database Backups"**
4. Clique em **"Create a backup"** (se disponível no seu plano)

### Passo 2.2: Backup manual (alternativa)

Se não tiver opção de backup automático:

1. Vá em **"SQL Editor"**
2. Execute este comando para ver suas tabelas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

3. Para cada tabela importante, exporte os dados:
   - Vá em **"Table Editor"**
   - Selecione a tabela (ex: `orcamentos`)
   - Clique nos **"..."** no canto superior direito
   - **"Export to CSV"**

### Passo 2.3: Guardar backup

- Salve os CSVs em uma pasta segura
- Nomeie com a data: `backup_2026-01-13/`
- Considere subir para Google Drive/OneDrive

---

## 📊 ETAPA 3: Verificar Estado Atual do Banco (10 min)

### Passo 3.1: Verificar tabelas existentes

No **SQL Editor**, execute:

```sql
-- Ver todas as tabelas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Passo 3.2: Verificar se já existe organization_id em materiais

```sql
-- Verificar se coluna já existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'materiais' 
  AND column_name = 'organization_id';
```

Se retornar vazio = coluna não existe (normal, vamos criar)
Se retornar `organization_id` = já existe (pular parte da migration)

### Passo 3.3: Contar registros importantes

```sql
-- Contagem de registros
SELECT 'orcamentos' as tabela, COUNT(*) as total FROM orcamentos
UNION ALL SELECT 'materiais', COUNT(*) FROM materiais
UNION ALL SELECT 'contatos', COUNT(*) FROM contatos
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'organizations', COUNT(*) FROM organizations;
```

**Anote esses números!** Usaremos para validar após as migrations.

---

## 🔧 ETAPA 4: Executar Migrations (30 min)

### ⚠️ IMPORTANTE: Execute na ordem correta!

### Passo 4.1: Verificar/Criar organização Prisma

No **SQL Editor**, execute:

```sql
-- Verificar se organização Prisma existe
SELECT * FROM organizations WHERE slug = 'prisma';
```

Se não existir ou se o ID for diferente de `11111111-1111-1111-1111-111111111111`:

```sql
-- Criar ou atualizar organização Prisma com ID fixo
INSERT INTO organizations (id, name, slug, active)
VALUES ('11111111-1111-1111-1111-111111111111', 'Prisma Interiores', 'prisma', true)
ON CONFLICT (slug) DO UPDATE SET 
  id = '11111111-1111-1111-1111-111111111111',
  name = 'Prisma Interiores',
  active = true;
```

### Passo 4.2: Executar Migration 1 - Multi-tenant Materiais

1. Abra o arquivo `supabase/migrations/20260113_multi_tenant_materiais_servicos.sql`
2. Copie **TODO** o conteúdo
3. Cole no **SQL Editor** do Supabase
4. Clique em **"Run"**
5. Verifique se não há erros (verde = sucesso)

**Se der erro:**
- Leia a mensagem de erro
- Erros comuns:
  - "column already exists" = OK, coluna já existe
  - "policy already exists" = Execute `DROP POLICY IF EXISTS "nome_policy" ON tabela;`

### Passo 4.3: Validar Migration 1

```sql
-- Verificar se coluna foi criada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'materiais' 
  AND column_name = 'organization_id';

-- Verificar se dados foram atualizados
SELECT COUNT(*) as total,
       COUNT(organization_id) as com_org,
       COUNT(*) - COUNT(organization_id) as sem_org
FROM materiais;
```

✅ Todos devem ter `organization_id` preenchido

### Passo 4.4: Executar Migration 2 - Planos e Assinaturas

1. Abra o arquivo `supabase/migrations/20260113_planos_assinaturas.sql`
2. Copie **TODO** o conteúdo
3. Cole no **SQL Editor** do Supabase
4. Clique em **"Run"**
5. Verifique se não há erros

### Passo 4.5: Validar Migration 2

```sql
-- Verificar planos criados
SELECT codigo, nome, preco_mensal, max_usuarios, preco_usuario_adicional 
FROM plans 
ORDER BY ordem;

-- Deve retornar 4 planos: starter_3, pro_10, business_25, enterprise_50
```

---

## ✅ ETAPA 5: Validação Final (10 min)

### Passo 5.1: Verificar contagem de registros

```sql
-- Reexecutar contagem (deve ser igual ao início)
SELECT 'orcamentos' as tabela, COUNT(*) as total FROM orcamentos
UNION ALL SELECT 'materiais', COUNT(*) FROM materiais
UNION ALL SELECT 'contatos', COUNT(*) FROM contatos
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL SELECT 'plans', COUNT(*) FROM plans;
```

### Passo 5.2: Testar o sistema no Lovable

1. Acesse seu sistema pelo Lovable
2. Faça login
3. Teste:
   - [ ] Listar orçamentos
   - [ ] Listar materiais (Gestão de Materiais)
   - [ ] Criar um orçamento teste
   - [ ] Ver dashboard

### Passo 5.3: Verificar logs de erro

No Supabase Dashboard:
1. Vá em **"Logs"** (menu lateral)
2. Selecione **"Postgres"**
3. Verifique se há erros recentes (vermelho)

---

## 🚀 ETAPA 6: Commit das Alterações (5 min)

### Passo 6.1: Verificar alterações no código

No VS Code / Cursor, as alterações que fizemos:

```
📁 prisma-decor-mobile/
├── 📁 docs/
│   ├── CHECKLIST_PREPARACAO.md (este arquivo)
│   ├── GUIA_STAGING.md
│   ├── MIGRACAO_LOVABLE_SUPABASE.md
│   └── MODELO_NEGOCIO.md
├── 📁 supabase/migrations/
│   ├── 20260113_multi_tenant_materiais_servicos.sql
│   └── 20260113_planos_assinaturas.sql
├── 📁 src/components/orcamento/gestao/
│   ├── DialogMaterial.tsx (+ organization_id)
│   ├── DialogServicoConfeccao.tsx (+ organization_id)
│   └── DialogServicoInstalacao.tsx (+ organization_id)
├── 📁 src/lib/
│   └── fetchMateriaisPaginados.ts (comentário atualizado)
├── .env.example
├── netlify.toml
└── vercel.json
```

### Passo 6.2: Commit e Push

```bash
cd "C:\Users\Gabri\Documents\JBD\Oferta Correios (1)\prisma-decor-mobile"

# Ver alterações
git status

# Adicionar tudo
git add .

# Commit
git commit -m "feat: preparação para ERP replicável

- Multi-tenancy para materiais e serviços
- Estrutura de planos e assinaturas
- Documentação do modelo de negócio
- Configuração para deploy Vercel/Netlify"

# Push
git push
```

### Passo 6.3: Aguardar deploy no Lovable

- O Lovable detectará o push automaticamente
- Aguarde o deploy terminar
- Teste novamente o sistema

---

## 📝 RESUMO DE COMANDOS SQL

Cole estes no SQL Editor na ordem:

```sql
-- 1. BACKUP: Verificar estado atual
SELECT 'orcamentos' as tabela, COUNT(*) as total FROM orcamentos
UNION ALL SELECT 'materiais', COUNT(*) FROM materiais
UNION ALL SELECT 'contatos', COUNT(*) FROM contatos;

-- 2. Garantir organização Prisma
INSERT INTO organizations (id, name, slug, active)
VALUES ('11111111-1111-1111-1111-111111111111', 'Prisma Interiores', 'prisma', true)
ON CONFLICT (id) DO NOTHING;

-- 3. EXECUTAR: 20260113_multi_tenant_materiais_servicos.sql
-- (colar todo o conteúdo do arquivo)

-- 4. EXECUTAR: 20260113_planos_assinaturas.sql
-- (colar todo o conteúdo do arquivo)

-- 5. VALIDAR: Verificar planos
SELECT codigo, nome, preco_mensal FROM plans ORDER BY ordem;
```

---

## ❓ Troubleshooting

### "permission denied"
- Você pode não ter permissão de admin
- Verifique se está logado com a conta correta

### "column already exists"
- Normal! A coluna já foi criada
- Pode ignorar e continuar

### "policy already exists"
- Execute: `DROP POLICY IF EXISTS "nome_da_policy" ON nome_tabela;`
- Depois re-execute a migration

### Sistema parou de funcionar
1. Verifique os logs no Supabase
2. Restaure o backup se necessário
3. Entre em contato para suporte

---

## ✅ Checklist Final

Antes de prosseguir, confirme:

- [ ] Consegui acessar o Supabase Dashboard
- [ ] Fiz backup dos dados importantes
- [ ] Executei migration 1 (multi-tenant) sem erros
- [ ] Executei migration 2 (planos) sem erros
- [ ] Planos aparecem na tabela `plans`
- [ ] Sistema continua funcionando no Lovable
- [ ] Commit e push realizados
- [ ] Deploy no Lovable concluído

**Quando todos os itens estiverem ✅, estamos prontos para começar!**
