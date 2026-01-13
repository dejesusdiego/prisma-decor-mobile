-- =====================================================
-- PRISMA ERP - SCHEMA BACKUP - TIPOS CUSTOMIZADOS
-- Gerado em: 2026-01-13
-- Projeto: emmogpqoqfmwtipxwcit
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TIPOS ENUM
-- =====================================================

-- Tipo para roles de usuário
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
