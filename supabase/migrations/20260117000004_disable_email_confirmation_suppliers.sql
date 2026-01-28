-- ============================================================
-- DESABILITAR CONFIRMAÇÃO DE EMAIL PARA FORNECEDORES
-- ============================================================
-- Como temos aprovação manual de fornecedores, não precisamos
-- de confirmação de email. Esta migration garante que todos os
-- fornecedores tenham email confirmado automaticamente.
-- Data: 2026-01-17
-- ============================================================

-- Confirmar email de todos os fornecedores pendentes/novos
-- Isso permite login imediato após cadastro
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id IN (
  SELECT DISTINCT su.user_id
  FROM public.supplier_users su
  INNER JOIN public.suppliers s ON s.id = su.supplier_id
  WHERE su.user_id IS NOT NULL
    AND (email_confirmed_at IS NULL OR email_confirmed_at < s.created_at)
);

-- Comentário explicativo
COMMENT ON FUNCTION public.register_supplier IS 
'Função RPC para cadastro público de fornecedores. 
- Status sempre "pending" (não aceita input)
- Normaliza CNPJ (apenas dígitos) e email (lowercase/trim)
- Bloqueia duplicidade por CNPJ e email
- Gera slug único com sufixo incremental
- Confirma email automaticamente (não requer confirmação manual)
- Requer aprovação manual via approve_supplier (service_role)';
