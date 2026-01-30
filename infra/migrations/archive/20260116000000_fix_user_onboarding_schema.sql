-- =====================================================
-- CORREÇÃO: Garantir que a tabela user_onboarding existe
-- com todas as colunas necessárias
-- =====================================================

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

-- Adicionar colunas se não existirem (para casos onde a tabela existe mas faltam colunas)
DO $$ 
BEGIN
  -- Adicionar completed_tours se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'completed_tours'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN completed_tours TEXT[] DEFAULT '{}';
  END IF;

  -- Adicionar skipped se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'skipped'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN skipped BOOLEAN DEFAULT FALSE;
  END IF;

  -- Adicionar first_seen_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'first_seen_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN first_seen_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Adicionar last_seen_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN last_seen_at TIMESTAMPTZ;
  END IF;

  -- Adicionar created_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Adicionar updated_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable RLS se não estiver habilitado
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem (para evitar duplicação)
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

-- Criar trigger para updated_at se não existir
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON public.user_onboarding;

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário explicativo
COMMENT ON TABLE public.user_onboarding IS 
'Tabela para persistir estado de onboarding por usuário. Armazena quais tours foram completados, se o usuário pulou o onboarding, e quando foi visto pela primeira/última vez.';
