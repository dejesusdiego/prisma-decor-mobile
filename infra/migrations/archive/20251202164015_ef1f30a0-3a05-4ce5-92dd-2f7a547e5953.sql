-- Criar tabela de configurações do sistema
CREATE TABLE public.configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem visualizar
CREATE POLICY "Authenticated users can view configs"
ON public.configuracoes_sistema
FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Only admins can modify configs"
ON public.configuracoes_sistema
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_sistema_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações iniciais
INSERT INTO public.configuracoes_sistema (chave, valor, descricao) VALUES
('coeficientes_tecido', '{"wave": 3.5, "prega": 3.5, "painel": 2.5, "rolo": 3.5, "horizontal": 1.0, "vertical": 1.0, "romana": 1.0, "celular": 1.0, "madeira": 1.0, "outro": 1.0}', 'Coeficientes de consumo de tecido por tipo de cortina'),
('coeficientes_forro', '{"wave": 2.5, "prega": 2.5, "painel": 2.5, "rolo": 2.5, "horizontal": 1.0, "vertical": 1.0, "romana": 1.0, "celular": 1.0, "madeira": 1.0, "outro": 1.0}', 'Coeficientes de consumo de forro por tipo de cortina'),
('servicos_por_tipo_cortina', '{"wave": null, "prega": null, "painel": null, "rolo": null}', 'Mapeamento de serviço de confecção por tipo de cortina (UUID do serviço)'),
('servico_forro_padrao', 'null', 'UUID do serviço de forro padrão (Forro Costurado Junto ou Forro Com Botões)'),
('opcoes_margem', '[{"label": "Baixa (40%)", "valor": 40}, {"label": "Padrão (61.5%)", "valor": 61.5}, {"label": "Premium (80%)", "valor": 80}]', 'Opções de margem disponíveis'),
('opcoes_ambiente', '["Sala de Estar", "Sala de Jantar", "Quarto", "Cozinha", "Escritório", "Varanda", "Banheiro", "Lavanderia", "Área Externa", "Outros"]', 'Opções de ambiente disponíveis');