# 🔧 Aplicar Migration: user_onboarding

**Problema:** A coluna `completed_tours` não existe no banco de produção, causando erro `PGRST204`.

**Solução:** Aplicar a migration `20260116000000_fix_user_onboarding_schema.sql` no Supabase.

---

## 📋 Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `supabase/migrations/20260116000000_fix_user_onboarding_schema.sql`
5. Clique em **Run** (ou `Ctrl+Enter`)
6. Verifique se a execução foi bem-sucedida

---

## 📋 Opção 2: Via Supabase CLI

```bash
# 1. Fazer login no Supabase
npx supabase login

# 2. Linkar o projeto
npx supabase link --project-ref tjwpqrlfhngibuwqodcn

# 3. Aplicar a migration
npx supabase db push
```

---

## 📋 Opção 3: SQL Direto (Mais Rápido)

1. Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/sql/new
2. Cole o SQL abaixo e execute:

```sql
-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  completed_tours TEXT[] DEFAULT '{}',
  skipped BOOLEAN DEFAULT FALSE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'completed_tours'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN completed_tours TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'skipped'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN skipped BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'first_seen_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN first_seen_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN last_seen_at TIMESTAMPTZ;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.user_onboarding;

-- Criar RLS Policies
CREATE POLICY "Users can view own onboarding"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON public.user_onboarding;

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

---

## ✅ Verificar se funcionou

Após aplicar a migration, verifique:

1. Acesse: https://supabase.com/dashboard/project/tjwpqrlfhngibuwqodcn/editor
2. Procure pela tabela `user_onboarding`
3. Verifique se as colunas existem:
   - `completed_tours` (TEXT[])
   - `skipped` (BOOLEAN)
   - `first_seen_at` (TIMESTAMPTZ)
   - `last_seen_at` (TIMESTAMPTZ)

---

## 🧪 Testar

Após aplicar a migration:

1. Recarregue a página do app
2. Faça login
3. O erro `PGRST204` não deve mais aparecer no console
4. O popup de tour deve funcionar corretamente

---

**Arquivo da migration:** `supabase/migrations/20260116000000_fix_user_onboarding_schema.sql`
