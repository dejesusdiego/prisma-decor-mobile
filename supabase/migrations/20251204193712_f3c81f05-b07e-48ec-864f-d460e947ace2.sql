-- Adicionar campo status_updated_at na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Atualizar registros existentes com a data de updated_at como status_updated_at
UPDATE public.orcamentos 
SET status_updated_at = updated_at 
WHERE status_updated_at IS NULL;

-- Criar função para atualizar status_updated_at quando o status mudar
CREATE OR REPLACE FUNCTION public.update_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualização automática
DROP TRIGGER IF EXISTS trigger_update_status_updated_at ON public.orcamentos;
CREATE TRIGGER trigger_update_status_updated_at
BEFORE UPDATE ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_status_updated_at();

-- Adicionar configuração de dias para sem_resposta (se não existir)
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES (
  'dias_sem_resposta',
  '7',
  'Número de dias após envio para considerar orçamento sem resposta'
)
ON CONFLICT (chave) DO NOTHING;