-- Função para criar notificação de empréstimo vencendo
CREATE OR REPLACE FUNCTION public.criar_notificacao_emprestimo_vencer()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_dias_para_vencer INTEGER;
BEGIN
  -- Só processar contas pendentes vinculadas a empréstimos
  IF NEW.status NOT IN ('pendente', 'parcial') THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se é empréstimo (tem lancamento_origem_id)
  IF NEW.lancamento_origem_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_dias_para_vencer := NEW.data_vencimento - CURRENT_DATE;
  
  -- Notificar se vence em até 7 dias
  IF v_dias_para_vencer > 7 OR v_dias_para_vencer < 0 THEN
    RETURN NEW;
  END IF;
  
  v_user_id := NEW.created_by_user_id;
  
  INSERT INTO public.notificacoes (
    user_id, tipo, titulo, mensagem, prioridade,
    referencia_tipo, referencia_id, data_lembrete
  ) VALUES (
    v_user_id,
    'emprestimo_vencendo',
    'Empréstimo próximo do vencimento',
    'Empréstimo "' || NEW.cliente_nome || '" (R$ ' || NEW.valor_total || ') vence em ' || 
    v_dias_para_vencer || ' dia(s) - ' || to_char(NEW.data_vencimento, 'DD/MM/YYYY'),
    CASE 
      WHEN v_dias_para_vencer <= 1 THEN 'urgente'
      WHEN v_dias_para_vencer <= 3 THEN 'alta'
      ELSE 'normal'
    END,
    'emprestimo',
    NEW.id,
    NEW.data_vencimento::timestamp with time zone
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para contas a receber de empréstimos
DROP TRIGGER IF EXISTS trigger_notificacao_emprestimo_vencer ON public.contas_receber;
CREATE TRIGGER trigger_notificacao_emprestimo_vencer
AFTER INSERT OR UPDATE ON public.contas_receber
FOR EACH ROW
EXECUTE FUNCTION public.criar_notificacao_emprestimo_vencer();

-- Tabela para armazenar extratos bancários importados
CREATE TABLE public.extratos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  banco TEXT,
  conta TEXT,
  status TEXT DEFAULT 'processando'
);

-- Habilitar RLS
ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para extratos
CREATE POLICY "Usuários podem ver seus extratos"
ON public.extratos_bancarios FOR SELECT
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar extratos"
ON public.extratos_bancarios FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus extratos"
ON public.extratos_bancarios FOR UPDATE
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar extratos"
ON public.extratos_bancarios FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela para movimentações do extrato
CREATE TABLE public.movimentacoes_extrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extrato_id UUID REFERENCES public.extratos_bancarios(id) ON DELETE CASCADE,
  data_movimentacao DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT,
  numero_documento TEXT,
  conciliado BOOLEAN DEFAULT false,
  ignorado BOOLEAN DEFAULT false,
  lancamento_id UUID REFERENCES public.lancamentos_financeiros(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.movimentacoes_extrato ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para movimentações
CREATE POLICY "Usuários podem ver movimentações de seus extratos"
ON public.movimentacoes_extrato FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.extratos_bancarios e
  WHERE e.id = movimentacoes_extrato.extrato_id
  AND (e.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Usuários podem criar movimentações em seus extratos"
ON public.movimentacoes_extrato FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.extratos_bancarios e
  WHERE e.id = movimentacoes_extrato.extrato_id
  AND e.created_by_user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar movimentações de seus extratos"
ON public.movimentacoes_extrato FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.extratos_bancarios e
  WHERE e.id = movimentacoes_extrato.extrato_id
  AND (e.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Apenas admins podem deletar movimentações"
ON public.movimentacoes_extrato FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX idx_movimentacoes_extrato_id ON public.movimentacoes_extrato(extrato_id);
CREATE INDEX idx_movimentacoes_data ON public.movimentacoes_extrato(data_movimentacao);
CREATE INDEX idx_movimentacoes_lancamento ON public.movimentacoes_extrato(lancamento_id);