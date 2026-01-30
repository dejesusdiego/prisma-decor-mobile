-- =====================================================
-- CORREÇÃO #1: Remover trigger duplicado
-- =====================================================
DROP TRIGGER IF EXISTS trigger_ensure_conta_receber ON public.orcamentos;
DROP FUNCTION IF EXISTS public.ensure_conta_receber_on_payment_status();

-- =====================================================
-- CORREÇÃO #2: Atualizar função auto_criar_conta_receber
-- para cobrir TODOS os status anteriores (não apenas alguns)
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_valor_total numeric;
  v_conta_receber_id uuid;
  v_status_pagamento text[] := ARRAY['pago_40', 'pago_parcial', 'pago_60', 'pago'];
BEGIN
  -- Processar se status mudou para pagamento de QUALQUER status anterior que NÃO seja de pagamento
  IF NEW.status = ANY(v_status_pagamento) 
     AND (OLD.status IS NULL OR NOT (OLD.status = ANY(v_status_pagamento)))
  THEN
    -- Só criar conta se não existir
    IF NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE orcamento_id = NEW.id) THEN
      v_valor_total := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      INSERT INTO public.contas_receber (
        orcamento_id, cliente_nome, cliente_telefone, descricao,
        valor_total, valor_pago, numero_parcelas, data_vencimento,
        status, organization_id, created_by_user_id
      ) VALUES (
        NEW.id, NEW.cliente_nome, NEW.cliente_telefone, 
        'Orçamento ' || NEW.codigo,
        v_valor_total, 0, 1, CURRENT_DATE + INTERVAL '30 days',
        'pendente', NEW.organization_id, NEW.created_by_user_id
      )
      RETURNING id INTO v_conta_receber_id;
      
      -- Criar parcela única inicial
      INSERT INTO public.parcelas_receber (
        conta_receber_id, numero_parcela, valor, data_vencimento, status
      ) VALUES (
        v_conta_receber_id, 1, v_valor_total, CURRENT_DATE + INTERVAL '30 days', 'pendente'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- CORREÇÃO #3: Criar tabela de log de auditoria de status
-- =====================================================
CREATE TABLE IF NOT EXISTS public.log_alteracoes_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'trigger', 'conciliacao', 'pipeline'
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_log_status_orcamento ON public.log_alteracoes_status(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_log_status_created_at ON public.log_alteracoes_status(created_at DESC);

-- RLS para log de auditoria
ALTER TABLE public.log_alteracoes_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver logs da sua organização"
ON public.log_alteracoes_status
FOR SELECT
USING (
  orcamento_id IN (
    SELECT id FROM public.orcamentos 
    WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Sistema pode inserir logs"
ON public.log_alteracoes_status
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- CORREÇÃO #4: Trigger para registrar alterações de status
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_orcamento_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Registrar mudança apenas se status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.log_alteracoes_status (
      orcamento_id, 
      status_anterior, 
      status_novo, 
      origem,
      user_id
    ) VALUES (
      NEW.id, 
      OLD.status, 
      NEW.status, 
      'trigger', -- será sobrescrito pelo frontend quando possível
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger de log (AFTER para não interferir em outras operações)
DROP TRIGGER IF EXISTS trigger_log_status_change ON public.orcamentos;
CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.log_orcamento_status_change();