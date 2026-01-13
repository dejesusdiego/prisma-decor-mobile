# 🧪 Guia de Ambiente de Staging

## Criando Ambiente de Staging

### Passo 1: Criar Novo Projeto Supabase (Gratuito)

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Nomeie: `prisma-erp-staging`
4. Anote as credenciais

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env.staging`:

```env
VITE_SUPABASE_PROJECT_ID="staging-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="staging-anon-key"
VITE_SUPABASE_URL="https://staging-project.supabase.co"
```

### Passo 3: Executar Migrations no Staging

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto staging
supabase link --project-ref staging-project-id

# Executar migrations
supabase db push
```

### Passo 4: Copiar Schema (sem dados)

```sql
-- No Dashboard do Supabase de Produção
-- Database > Backups > Download schema only
-- Depois importar no staging
```

### Passo 5: Criar Dados de Teste

```sql
-- Inserir organização de teste
INSERT INTO organizations (id, name, slug, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Teste', 'teste', true);

-- Criar usuário de teste (via Dashboard > Authentication)
```

### Passo 6: Rodar Frontend Localmente com Staging

```bash
# Copiar .env.staging para .env
cp .env.staging .env

# Rodar
npm run dev
```

## Fluxo de Trabalho

```
1. Desenvolver feature localmente (conectado ao staging)
2. Testar exaustivamente
3. Criar PR / Merge
4. Deploy para produção (Lovable/Vercel)
5. Executar migration em produção
```

## Comandos Úteis

```bash
# Rodar com staging
npm run dev -- --mode staging

# Build para staging  
npm run build -- --mode staging

# Verificar a qual banco está conectado
echo $VITE_SUPABASE_URL
```
