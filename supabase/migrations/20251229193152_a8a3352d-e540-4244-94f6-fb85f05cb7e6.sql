-- Adicionar campo ultima_interacao_em na tabela contatos
ALTER TABLE public.contatos
ADD COLUMN IF NOT EXISTS ultima_interacao_em timestamp with time zone DEFAULT now();

-- Atualizar registros existentes baseado na data de updated_at
UPDATE public.contatos
SET ultima_interacao_em = GREATEST(
  created_at,
  updated_at,
  COALESCE((
    SELECT MAX(o.updated_at)
    FROM orcamentos o
    WHERE o.contato_id = contatos.id
  ), created_at),
  COALESCE((
    SELECT MAX(a.data_atividade)
    FROM atividades_crm a
    WHERE a.contato_id = contatos.id
  ), created_at)
);

-- Função para atualizar ultima_interacao_em quando orçamento é criado/atualizado
CREATE OR REPLACE FUNCTION public.atualizar_ultima_interacao_contato()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.contato_id IS NOT NULL THEN
    UPDATE contatos
    SET ultima_interacao_em = NOW()
    WHERE id = NEW.contato_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para orçamentos
DROP TRIGGER IF EXISTS trigger_atualizar_interacao_orcamento ON orcamentos;
CREATE TRIGGER trigger_atualizar_interacao_orcamento
  AFTER INSERT OR UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_ultima_interacao_contato();

-- Trigger para atividades
DROP TRIGGER IF EXISTS trigger_atualizar_interacao_atividade ON atividades_crm;
CREATE TRIGGER trigger_atualizar_interacao_atividade
  AFTER INSERT ON atividades_crm
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_ultima_interacao_contato();