-- Criar tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- 'follow_up', 'conta_vencer', 'pedido_pronto', 'visita_nova', 'orcamento_vencendo', 'pagamento_atrasado'
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  data_lembrete TIMESTAMP WITH TIME ZONE,
  link_acao TEXT, -- ex: '/orcamento/123' ou '/crm/contato/456'
  referencia_tipo TEXT, -- 'orcamento', 'contato', 'conta_receber', 'pedido', 'visita'
  referencia_id UUID,
  prioridade TEXT DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- notificação expira após essa data
);

-- Enable Row Level Security
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas notificações" 
ON public.notificacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas notificações" 
ON public.notificacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar notificações para usuários" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem deletar suas notificações" 
ON public.notificacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(user_id, lida);
CREATE INDEX idx_notificacoes_data ON public.notificacoes(data_lembrete);

-- Trigger para criar notificação quando visita é criada
CREATE OR REPLACE FUNCTION public.criar_notificacao_visita()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Buscar todos os admins e criar notificação para cada um
  FOR v_admin_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notificacoes (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      referencia_tipo,
      referencia_id,
      data_lembrete
    ) VALUES (
      v_admin_id,
      'visita_nova',
      'Nova solicitação de visita',
      'Cliente ' || NEW.nome || ' solicitou visita para ' || to_char(NEW.data_agendada, 'DD/MM/YYYY') || ' às ' || NEW.horario_agendado,
      'alta',
      'visita',
      NEW.id,
      NOW()
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notificacao_nova_visita
AFTER INSERT ON public.solicitacoes_visita
FOR EACH ROW
EXECUTE FUNCTION public.criar_notificacao_visita();

-- Trigger para notificar quando conta está para vencer (3 dias)
CREATE OR REPLACE FUNCTION public.criar_notificacao_conta_vencer()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação se a conta vence em 3 dias ou menos e não tem notificação ainda
  IF NEW.status = 'pendente' AND NEW.data_vencimento <= CURRENT_DATE + INTERVAL '3 days' AND NEW.data_vencimento >= CURRENT_DATE THEN
    INSERT INTO public.notificacoes (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      referencia_tipo,
      referencia_id,
      data_lembrete
    ) VALUES (
      NEW.created_by_user_id,
      'conta_vencer',
      'Conta a pagar próxima do vencimento',
      'A conta "' || NEW.descricao || '" vence em ' || to_char(NEW.data_vencimento, 'DD/MM/YYYY'),
      CASE 
        WHEN NEW.data_vencimento = CURRENT_DATE THEN 'urgente'
        WHEN NEW.data_vencimento <= CURRENT_DATE + INTERVAL '1 day' THEN 'alta'
        ELSE 'normal'
      END,
      'conta_pagar',
      NEW.id,
      NEW.data_vencimento::timestamp with time zone
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notificacao_conta_vencer
AFTER INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.criar_notificacao_conta_vencer();

-- Trigger para notificar quando pedido está pronto
CREATE OR REPLACE FUNCTION public.criar_notificacao_pedido_pronto()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_nome TEXT;
BEGIN
  -- Só notificar se status mudou para 'pronto_instalacao' ou 'pronto_entrega'
  IF (NEW.status_producao IN ('pronto_instalacao', 'pronto_entrega')) AND 
     (OLD.status_producao IS DISTINCT FROM NEW.status_producao) THEN
    
    -- Buscar nome do cliente
    SELECT cliente_nome INTO v_cliente_nome
    FROM public.orcamentos
    WHERE id = NEW.orcamento_id;
    
    INSERT INTO public.notificacoes (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      referencia_tipo,
      referencia_id,
      data_lembrete
    ) VALUES (
      NEW.created_by_user_id,
      'pedido_pronto',
      'Pedido pronto para ' || CASE WHEN NEW.status_producao = 'pronto_instalacao' THEN 'instalação' ELSE 'entrega' END,
      'O pedido ' || NEW.numero_pedido || ' de ' || COALESCE(v_cliente_nome, 'Cliente') || ' está pronto',
      'alta',
      'pedido',
      NEW.id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notificacao_pedido_pronto
AFTER UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.criar_notificacao_pedido_pronto();