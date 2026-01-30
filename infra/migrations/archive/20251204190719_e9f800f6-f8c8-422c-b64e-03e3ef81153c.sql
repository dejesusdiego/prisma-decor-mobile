-- Criar tabela de solicitações de visita
CREATE TABLE public.solicitacoes_visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    cidade TEXT NOT NULL,
    endereco TEXT,
    complemento TEXT,
    mensagem TEXT,
    data_agendada DATE NOT NULL,
    horario_agendado TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'realizada', 'cancelada')),
    visualizada BOOLEAN NOT NULL DEFAULT false,
    visualizada_em TIMESTAMPTZ,
    visualizada_por UUID REFERENCES auth.users(id),
    observacoes_internas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.solicitacoes_visita ENABLE ROW LEVEL SECURITY;

-- Policy: Público pode criar (para o formulário do site)
CREATE POLICY "Anyone can create visit requests"
ON public.solicitacoes_visita
FOR INSERT
WITH CHECK (true);

-- Policy: Usuários autenticados podem ver todas
CREATE POLICY "Authenticated users can view visit requests"
ON public.solicitacoes_visita
FOR SELECT
TO authenticated
USING (true);

-- Policy: Usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update visit requests"
ON public.solicitacoes_visita
FOR UPDATE
TO authenticated
USING (true);

-- Policy: Apenas admins podem deletar
CREATE POLICY "Only admins can delete visit requests"
ON public.solicitacoes_visita
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_solicitacoes_visita_updated_at
BEFORE UPDATE ON public.solicitacoes_visita
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();