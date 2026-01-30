-- Adicionar coluna status_updated_at à tabela solicitacoes_visita
ALTER TABLE public.solicitacoes_visita 
ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now();

-- Trigger para atualizar automaticamente quando status muda
CREATE OR REPLACE FUNCTION public.update_visita_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_visita_status_updated_at ON public.solicitacoes_visita;
CREATE TRIGGER trigger_visita_status_updated_at
  BEFORE UPDATE ON public.solicitacoes_visita
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visita_status_updated_at();

-- Atualizar registros existentes com a data de updated_at
UPDATE public.solicitacoes_visita 
SET status_updated_at = updated_at 
WHERE status_updated_at IS NULL;

-- Adicionar configuração para dias sem resposta de visitas (3 dias por padrão)
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES ('dias_sem_resposta_visitas', '3', 'Dias até marcar solicitação de visita como sem resposta')
ON CONFLICT (chave) DO NOTHING;