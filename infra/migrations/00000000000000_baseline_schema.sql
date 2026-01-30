-- StudioOS V5 - Schema Baseline
-- Gerado em: 2026-01-29T20:42:53.827Z
-- Total de migrations: 140
-- 
-- ATENÇÃO: Este é o schema completo consolidado.
-- Para recriar o banco do zero, execute este arquivo.

-- Desabilitar RLS temporariamente durante o setup
SET session_replication_role = 'replica';


-- ============================================
-- Migration: 20251120121509_f01f729b-3232-4f5b-a63d-ec52668d45d6.sql
-- ============================================

-- Fix orcamentos SELECT policy to restrict access to user's own quotations
DROP POLICY "Usuários podem ver seus orçamentos" ON public.orcamentos;

CREATE POLICY "Usuários podem ver seus orçamentos" ON public.orcamentos
  FOR SELECT
  USING (auth.uid() = created_by_user_id);


-- ============================================
-- Migration: 20251120122020_26d944aa-7747-4397-81f1-f5da30074bae.sql
-- ============================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: All users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on materiais
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar materiais" ON public.materiais;
DROP POLICY IF EXISTS "Usuários autenticados podem ver materiais" ON public.materiais;

-- Create new restrictive policies for materiais
CREATE POLICY "All authenticated users can view materials"
ON public.materiais
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify materials"
ON public.materiais
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on servicos_confeccao
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar serviços confecção" ON public.servicos_confeccao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver serviços confecção" ON public.servicos_confeccao;

-- Create new restrictive policies for servicos_confeccao
CREATE POLICY "All authenticated users can view sewing services"
ON public.servicos_confeccao
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify sewing services"
ON public.servicos_confeccao
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on servicos_instalacao
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar serviços instalação" ON public.servicos_instalacao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver serviços instalação" ON public.servicos_instalacao;

-- Create new restrictive policies for servicos_instalacao
CREATE POLICY "All authenticated users can view installation services"
ON public.servicos_instalacao
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify installation services"
ON public.servicos_instalacao
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- ============================================
-- Migration: 20251120122731_ebd1188c-13d9-407e-8107-766910fea008.sql
-- ============================================

-- Fix search_path for trigger function to prevent potential SQL injection
CREATE OR REPLACE FUNCTION public.trigger_gerar_codigo_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.gerar_codigo_orcamento();
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================
-- Migration: 20251120153616_0f25400b-a496-48e3-8eed-3e30338ec42b.sql
-- ============================================

-- Adicionar campo codigo_item às tabelas para suportar importação e upsert
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS codigo_item TEXT UNIQUE;

ALTER TABLE public.servicos_confeccao 
ADD COLUMN IF NOT EXISTS codigo_item TEXT UNIQUE;

ALTER TABLE public.servicos_instalacao 
ADD COLUMN IF NOT EXISTS codigo_item TEXT UNIQUE;

-- Criar índices para melhorar performance de busca por codigo_item
CREATE INDEX IF NOT EXISTS idx_materiais_codigo_item ON public.materiais(codigo_item);
CREATE INDEX IF NOT EXISTS idx_servicos_confeccao_codigo_item ON public.servicos_confeccao(codigo_item);
CREATE INDEX IF NOT EXISTS idx_servicos_instalacao_codigo_item ON public.servicos_instalacao(codigo_item);


-- ============================================
-- Migration: 20251120154349_c292c412-d8e1-4e6f-966a-50ffdd584a02.sql
-- ============================================

-- Expandir tipos de produtos para incluir persianas
-- Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.cortina_items IS 'Armazena itens de orçamento (cortinas e persianas)';

-- Adicionar campo para diferenciar cortinas de persianas
ALTER TABLE public.cortina_items 
ADD COLUMN IF NOT EXISTS tipo_produto TEXT DEFAULT 'cortina';

-- Adicionar comentário no campo tipo_cortina
COMMENT ON COLUMN public.cortina_items.tipo_cortina IS 'Subtipo do produto: wave, prega, painel, rolo (cortinas) ou horizontal, vertical, romana, celular, madeira (persianas)';

-- Adicionar campo para material principal de persianas (quando não for tecido)
ALTER TABLE public.cortina_items
ADD COLUMN IF NOT EXISTS material_principal_id UUID REFERENCES public.materiais(id);

COMMENT ON COLUMN public.cortina_items.material_principal_id IS 'Material principal para persianas (quando não usa tecido)';


-- ============================================
-- Migration: 20251120161337_31f87bc2-d7da-4336-90c3-12a07950fcd9.sql
-- ============================================

-- Tornar tecido_id e trilho_id opcionais para suportar persianas
-- Persianas usam material_principal_id ao invés de tecido_id
ALTER TABLE public.cortina_items 
  ALTER COLUMN tecido_id DROP NOT NULL,
  ALTER COLUMN trilho_id DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.cortina_items.tecido_id IS 'Obrigatório para cortinas, opcional para persianas';
COMMENT ON COLUMN public.cortina_items.trilho_id IS 'Obrigatório para cortinas, opcional para persianas';
COMMENT ON COLUMN public.cortina_items.material_principal_id IS 'Usado para persianas (tecido, papel, etc.)';

-- Adicionar constraint de validação
ALTER TABLE public.cortina_items 
  ADD CONSTRAINT check_produto_materiais 
  CHECK (
    (tipo_produto = 'cortina' AND tecido_id IS NOT NULL AND trilho_id IS NOT NULL) OR
    (tipo_produto = 'persiana' AND material_principal_id IS NOT NULL)
  );


-- ============================================
-- Migration: 20251121230850_995e504c-f0b3-48ae-80e2-f70b32566bcb.sql
-- ============================================

-- Remover as foreign keys e alterar colunas de UUID para TEXT
ALTER TABLE public.cortina_items 
  DROP CONSTRAINT IF EXISTS cortina_items_tecido_id_fkey,
  DROP CONSTRAINT IF EXISTS cortina_items_forro_id_fkey,
  DROP CONSTRAINT IF EXISTS cortina_items_trilho_id_fkey,
  DROP CONSTRAINT IF EXISTS cortina_items_material_principal_id_fkey;

-- Alterar tipos das colunas para TEXT
ALTER TABLE public.cortina_items 
  ALTER COLUMN tecido_id TYPE TEXT USING tecido_id::TEXT,
  ALTER COLUMN forro_id TYPE TEXT USING forro_id::TEXT,
  ALTER COLUMN trilho_id TYPE TEXT USING trilho_id::TEXT,
  ALTER COLUMN material_principal_id TYPE TEXT USING material_principal_id::TEXT;


-- ============================================
-- Migration: 20251122170652_c2dc379a-2e1d-442d-bf83-b07d17414b86.sql
-- ============================================

-- Adicionar coluna barra_cm para armazenar o tamanho da barra em centímetros
ALTER TABLE public.cortina_items 
ADD COLUMN barra_cm integer DEFAULT 0;


-- ============================================
-- Migration: 20251124190112_cca634a2-3565-4494-af87-21914a5d7edf.sql
-- ============================================

-- Adicionar coluna de ambiente em cortina_items
ALTER TABLE public.cortina_items ADD COLUMN ambiente TEXT;

-- Remover coluna de ambiente de orcamentos e adicionar endereco
ALTER TABLE public.orcamentos DROP COLUMN ambiente;
ALTER TABLE public.orcamentos ADD COLUMN endereco TEXT NOT NULL DEFAULT '';

-- Adicionar campos para produtos "Outros"
ALTER TABLE public.cortina_items ADD COLUMN preco_unitario NUMERIC;
ALTER TABLE public.cortina_items ADD COLUMN is_outro BOOLEAN DEFAULT false;


-- ============================================
-- Migration: 20251124191743_52f38c5c-763e-4d95-b4a5-44b8ae519af3.sql
-- ============================================

-- Add fields for persianas (blinds) that depend on factory quotes
ALTER TABLE public.cortina_items
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS fabrica TEXT,
ADD COLUMN IF NOT EXISTS motorizada BOOLEAN DEFAULT false;


-- ============================================
-- Migration: 20251124192327_882b2f54-ca68-4cd8-b640-eff3ea6e4b60.sql
-- ============================================

-- Remover a constraint antiga
ALTER TABLE public.cortina_items 
  DROP CONSTRAINT IF EXISTS check_produto_materiais;

-- Adicionar nova constraint que suporta persianas com orçamento de fábrica
ALTER TABLE public.cortina_items 
  ADD CONSTRAINT check_produto_materiais 
  CHECK (
    (tipo_produto = 'cortina' AND tecido_id IS NOT NULL AND trilho_id IS NOT NULL) OR
    (tipo_produto = 'persiana' AND (material_principal_id IS NOT NULL OR preco_unitario IS NOT NULL)) OR
    (tipo_produto = 'outro' AND preco_unitario IS NOT NULL)
  );


-- ============================================
-- Migration: 20251124192722_0bfb1dec-8ee3-47dc-8134-e168b9d0e976.sql
-- ============================================

-- Remover constraint antiga de tipo_cortina se existir
ALTER TABLE public.cortina_items 
  DROP CONSTRAINT IF EXISTS cortina_items_tipo_cortina_check;

-- Adicionar nova constraint que aceita todos os tipos de cortina e persiana
ALTER TABLE public.cortina_items 
  ADD CONSTRAINT cortina_items_tipo_cortina_check 
  CHECK (
    tipo_cortina IN (
      'wave', 'prega', 'painel', 'rolo', 
      'horizontal', 'vertical', 'romana', 'celular', 'madeira', 
      'outro'
    )
  );


-- ============================================
-- Migration: 20251124203905_4d6b6298-2c7e-4899-85d0-c24540cf68c9.sql
-- ============================================

-- Adicionar campo validadeDias na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS validade_dias integer DEFAULT 7;


-- ============================================
-- Migration: 20251124211726_3ab9506f-196d-47a8-8be5-09d0bb64d60d.sql
-- ============================================

-- Adicionar campo cidade na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN cidade text DEFAULT 'Balneário Camboriú';


-- ============================================
-- Migration: 20251124215108_c9355d38-02f7-4b1a-915e-775010631099.sql
-- ============================================

-- Adicionar 'finalizado' aos valores permitidos do status de orçamento
ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;

ALTER TABLE public.orcamentos 
ADD CONSTRAINT orcamentos_status_check 
CHECK (status IN ('rascunho', 'enviado', 'finalizado', 'aprovado', 'perdido'));


-- ============================================
-- Migration: 20251124222030_767e848f-6e16-4f34-9aa3-3c84982d582c.sql
-- ============================================

-- Remover constraint antiga
ALTER TABLE cortina_items DROP CONSTRAINT IF EXISTS check_produto_materiais;

-- Criar nova constraint que permite:
-- - Cortinas: pelo menos tecido OU forro (trilho opcional)
-- - Persianas: material_principal OU preco_unitario
-- - Outros: preco_unitario obrigatório
ALTER TABLE cortina_items ADD CONSTRAINT check_produto_materiais CHECK (
  (
    tipo_produto = 'cortina' AND 
    (tecido_id IS NOT NULL OR forro_id IS NOT NULL)
  ) OR (
    tipo_produto = 'persiana' AND 
    (material_principal_id IS NOT NULL OR preco_unitario IS NOT NULL)
  ) OR (
    tipo_produto = 'outro' AND 
    preco_unitario IS NOT NULL
  )
);


-- ============================================
-- Migration: 20251125161707_8a86c933-5fc6-4211-9e95-f4d802d7e01a.sql
-- ============================================

-- Assign admin role to the default admin user
-- This ensures the admin can manage materials through the interface
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin.prismadecor@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;


-- ============================================
-- Migration: 20251125162301_d085d7cf-f43f-4b48-922f-3080d9ce7c6b.sql
-- ============================================

-- Create a function to clean all material and service data
-- This function uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.truncate_materials_and_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Truncate all tables (cascade to handle foreign keys if any)
  TRUNCATE TABLE public.materiais RESTART IDENTITY CASCADE;
  TRUNCATE TABLE public.servicos_confeccao RESTART IDENTITY CASCADE;
  TRUNCATE TABLE public.servicos_instalacao RESTART IDENTITY CASCADE;
  
  RAISE NOTICE 'All materials and services data cleared successfully';
END;
$$;


-- ============================================
-- Migration: 20251125163122_6dfcd1e2-f5cc-49bf-b768-6c50b107e08a.sql
-- ============================================

-- Drop and recreate the truncate function to ensure it works correctly
DROP FUNCTION IF EXISTS public.truncate_materials_and_services();

CREATE OR REPLACE FUNCTION public.truncate_materials_and_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all data explicitly (TRUNCATE might have transaction issues)
  DELETE FROM public.materiais;
  DELETE FROM public.servicos_confeccao;
  DELETE FROM public.servicos_instalacao;
  
  -- Reset sequences
  ALTER SEQUENCE IF EXISTS materiais_id_seq RESTART WITH 1;
  ALTER SEQUENCE IF EXISTS servicos_confeccao_id_seq RESTART WITH 1;
  ALTER SEQUENCE IF EXISTS servicos_instalacao_id_seq RESTART WITH 1;
  
  RAISE NOTICE 'All materials and services data cleared successfully';
END;
$$;


-- ============================================
-- Migration: 20251125163317_aaa5e067-8369-4b36-a5cb-196a2b7187a8.sql
-- ============================================

-- Fix the truncate function to include WHERE clauses
CREATE OR REPLACE FUNCTION public.truncate_materials_and_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all data explicitly with WHERE clauses (required by PostgreSQL)
  DELETE FROM public.materiais WHERE TRUE;
  DELETE FROM public.servicos_confeccao WHERE TRUE;
  DELETE FROM public.servicos_instalacao WHERE TRUE;
  
  RAISE NOTICE 'All materials and services data cleared successfully';
END;
$$;


-- ============================================
-- Migration: 20251125165640_8a3c76d5-aa26-4788-a51c-098fff4fbd3c.sql
-- ============================================

-- Add fornecedor column to materiais table for supplier tracking
ALTER TABLE public.materiais ADD COLUMN fornecedor text;

-- Create index for better filtering performance
CREATE INDEX idx_materiais_fornecedor ON public.materiais(fornecedor);


-- ============================================
-- Migration: 20251125233138_6467f8c6-fd79-4910-b4af-b4e558234172.sql
-- ============================================

-- Adicionar novos campos opcionais à tabela materiais para suportar categorias específicas

-- Campos comuns para tecidos, forros, trilhos
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS linha TEXT,
ADD COLUMN IF NOT EXISTS cor TEXT,
ADD COLUMN IF NOT EXISTS tipo TEXT;

-- Campos específicos para acessórios
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS aplicacao TEXT;

-- Campos específicos para motorizados
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS potencia TEXT;

-- Campos específicos para persianas
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS area_min_fat NUMERIC;

-- Criar índices para melhorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_materiais_tipo ON public.materiais(tipo);
CREATE INDEX IF NOT EXISTS idx_materiais_linha ON public.materiais(linha);

COMMENT ON COLUMN public.materiais.linha IS 'Linha do produto (ex: BLACKOUT 100%, MAX UMA VIA, TMT 250)';
COMMENT ON COLUMN public.materiais.cor IS 'Cor do material (ex: BRANCO, PRETO, ESCOVADO)';
COMMENT ON COLUMN public.materiais.tipo IS 'Tipo específico do produto (ex: FORRO, TRILHO MAX, MOTOR ELETRONICO, ROMANA)';
COMMENT ON COLUMN public.materiais.aplicacao IS 'Aplicação do acessório (ex: PERSIANA PESADA, ACRILICO)';
COMMENT ON COLUMN public.materiais.potencia IS 'Potência do motor (ex: UD 1,2N)';
COMMENT ON COLUMN public.materiais.area_min_fat IS 'Área mínima de faturamento para persianas (m²)';


-- ============================================
-- Migration: 20251126003305_befd6a43-0e7f-41a9-a219-da868bf5fec5.sql
-- ============================================

-- Adicionar categorias 'motorizado' e 'persiana' à constraint de materiais
ALTER TABLE public.materiais 
DROP CONSTRAINT materiais_categoria_check;

ALTER TABLE public.materiais 
ADD CONSTRAINT materiais_categoria_check 
CHECK (categoria = ANY (ARRAY['tecido'::text, 'forro'::text, 'trilho'::text, 'acessorio'::text, 'papel'::text, 'motorizado'::text, 'persiana'::text]));


-- ============================================
-- Migration: 20251126130101_ed1a5287-a828-4b98-8980-6744c2b713a0.sql
-- ============================================

-- Adicionar coluna para observações internas nas cortinas
ALTER TABLE cortina_items 
ADD COLUMN observacoes_internas text;


-- ============================================
-- Migration: 20251202164015_ef1f30a0-3a05-4ce5-92dd-2f7a547e5953.sql
-- ============================================

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


-- ============================================
-- Migration: 20251202164853_973cc5af-7d02-4bd9-837e-519f95ddf24d.sql
-- ============================================

-- Adicionar coluna para serviços adicionais no cortina_items
ALTER TABLE public.cortina_items 
ADD COLUMN servicos_adicionais_ids TEXT[] DEFAULT '{}';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.cortina_items.servicos_adicionais_ids IS 'IDs dos serviços de confecção adicionais aplicados a este item';

-- Atualizar configuração para suportar múltiplos serviços por tipo
UPDATE public.configuracoes_sistema 
SET valor = '{"wave": [], "prega": [], "painel": [], "rolo": []}'::jsonb,
    descricao = 'Mapeamento de serviços de confecção por tipo de cortina (array de UUIDs de serviços)'
WHERE chave = 'servicos_por_tipo_cortina';


-- ============================================
-- Migration: 20251202175205_1f256f52-4e83-4c66-9715-48fd7d4e674d.sql
-- ============================================

-- Remove o check constraint antigo
ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;

-- Adiciona novo check constraint com todos os status válidos
ALTER TABLE public.orcamentos ADD CONSTRAINT orcamentos_status_check 
CHECK (status IN ('rascunho', 'finalizado', 'enviado', 'aceito', 'recusado', 'pago_parcial', 'pago'));


-- ============================================
-- Migration: 20251204190719_e9f800f6-f8c8-422c-b64e-03e3ef81153c.sql
-- ============================================

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


-- ============================================
-- Migration: 20251204191333_050049e5-2ae9-468e-bdd2-dd629cb5cc77.sql
-- ============================================

-- Habilitar REPLICA IDENTITY FULL para capturar dados completos nas atualizações
ALTER TABLE public.solicitacoes_visita REPLICA IDENTITY FULL;

-- Adicionar tabela ao publication de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_visita;


-- ============================================
-- Migration: 20251204193712_f3c81f05-b07e-48ec-864f-d460e947ace2.sql
-- ============================================

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


-- ============================================
-- Migration: 20251204194825_8c0705e2-973b-4602-99ad-878d477d9736.sql
-- ============================================

-- Drop overly permissive policies on solicitacoes_visita
DROP POLICY IF EXISTS "Authenticated users can view visit requests" ON public.solicitacoes_visita;
DROP POLICY IF EXISTS "Authenticated users can update visit requests" ON public.solicitacoes_visita;

-- Create admin-only SELECT policy
CREATE POLICY "Admins can view visit requests" 
ON public.solicitacoes_visita 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only UPDATE policy
CREATE POLICY "Admins can update visit requests" 
ON public.solicitacoes_visita 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));


-- ============================================
-- Migration: 20251205163812_35003ea0-0dc5-497b-9194-2134c5b96a44.sql
-- ============================================

-- Adicionar coluna para barra do forro separada da barra do tecido
ALTER TABLE public.cortina_items 
ADD COLUMN barra_forro_cm numeric DEFAULT 0;


-- ============================================
-- Migration: 20251211203108_70bf8c15-460d-42cc-b39b-20967f8f636c.sql
-- ============================================

-- Drop the existing check constraint and recreate with all valid statuses
ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;

ALTER TABLE public.orcamentos ADD CONSTRAINT orcamentos_status_check 
CHECK (status IN ('rascunho', 'finalizado', 'enviado', 'sem_resposta', 'recusado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'));


-- ============================================
-- Migration: 20251223194222_0f38d303-8fd7-4ca7-aecf-901d24ce5e00.sql
-- ============================================

-- =============================================
-- SISTEMA FINANCEIRO - ESTRUTURA DO BANCO DE DADOS
-- =============================================

-- 1. CATEGORIAS FINANCEIRAS
-- Categorias para organizar receitas e despesas
CREATE TABLE public.categorias_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor TEXT DEFAULT '#6B7280',
  icone TEXT DEFAULT 'circle',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias
CREATE POLICY "Usuários autenticados podem ver categorias" 
ON public.categorias_financeiras 
FOR SELECT 
USING (true);

CREATE POLICY "Apenas admins podem gerenciar categorias" 
ON public.categorias_financeiras 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_categorias_financeiras_updated_at
BEFORE UPDATE ON public.categorias_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.categorias_financeiras (nome, tipo, cor, icone) VALUES
-- Receitas
('Vendas de Cortinas', 'receita', '#10B981', 'shopping-bag'),
('Vendas de Persianas', 'receita', '#10B981', 'blinds'),
('Serviços de Instalação', 'receita', '#3B82F6', 'wrench'),
('Serviços de Manutenção', 'receita', '#3B82F6', 'tool'),
('Outras Receitas', 'receita', '#6366F1', 'plus-circle'),
-- Despesas
('Materiais e Tecidos', 'despesa', '#EF4444', 'package'),
('Mão de Obra - Costura', 'despesa', '#F59E0B', 'scissors'),
('Mão de Obra - Instalação', 'despesa', '#F59E0B', 'hard-hat'),
('Fornecedores', 'despesa', '#8B5CF6', 'truck'),
('Aluguel', 'despesa', '#EC4899', 'home'),
('Energia Elétrica', 'despesa', '#F97316', 'zap'),
('Água', 'despesa', '#06B6D4', 'droplet'),
('Internet/Telefone', 'despesa', '#6366F1', 'wifi'),
('Combustível', 'despesa', '#84CC16', 'fuel'),
('Manutenção de Veículos', 'despesa', '#64748B', 'car'),
('Marketing', 'despesa', '#A855F7', 'megaphone'),
('Impostos', 'despesa', '#DC2626', 'file-text'),
('Salários', 'despesa', '#0EA5E9', 'users'),
('Comissões', 'despesa', '#14B8A6', 'percent'),
('Outras Despesas', 'despesa', '#6B7280', 'minus-circle');

-- 2. FORMAS DE PAGAMENTO
CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'cheque', 'outro')),
  permite_parcelamento BOOLEAN NOT NULL DEFAULT false,
  max_parcelas INTEGER DEFAULT 1,
  taxa_percentual NUMERIC DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver formas de pagamento" 
ON public.formas_pagamento 
FOR SELECT 
USING (true);

CREATE POLICY "Apenas admins podem gerenciar formas de pagamento" 
ON public.formas_pagamento 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_formas_pagamento_updated_at
BEFORE UPDATE ON public.formas_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir formas de pagamento padrão
INSERT INTO public.formas_pagamento (nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual) VALUES
('Dinheiro', 'dinheiro', false, 1, 0),
('PIX', 'pix', false, 1, 0),
('Cartão de Crédito', 'cartao_credito', true, 12, 0),
('Cartão de Débito', 'cartao_debito', false, 1, 0),
('Boleto Bancário', 'boleto', true, 6, 0),
('Transferência Bancária', 'transferencia', false, 1, 0),
('Cheque', 'cheque', true, 3, 0);

-- 3. CONTAS A PAGAR
CREATE TABLE public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  fornecedor TEXT,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  observacoes TEXT,
  numero_documento TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  frequencia_recorrencia TEXT CHECK (frequencia_recorrencia IN ('mensal', 'quinzenal', 'semanal', 'anual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas contas a pagar" 
ON public.contas_pagar 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar contas a pagar" 
ON public.contas_pagar 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas contas a pagar" 
ON public.contas_pagar 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar contas a pagar" 
ON public.contas_pagar 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_contas_pagar_updated_at
BEFORE UPDATE ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. CONTAS A RECEBER
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  descricao TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  numero_parcelas INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado')),
  data_vencimento DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas contas a receber" 
ON public.contas_receber 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar contas a receber" 
ON public.contas_receber 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas contas a receber" 
ON public.contas_receber 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar contas a receber" 
ON public.contas_receber 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_contas_receber_updated_at
BEFORE UPDATE ON public.contas_receber
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. PARCELAS DE CONTAS A RECEBER
CREATE TABLE public.parcelas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.parcelas_receber ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (herda do conta_receber)
CREATE POLICY "Usuários podem ver parcelas de suas contas" 
ON public.parcelas_receber 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contas_receber cr 
  WHERE cr.id = parcelas_receber.conta_receber_id 
  AND (cr.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Usuários podem criar parcelas em suas contas" 
ON public.parcelas_receber 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contas_receber cr 
  WHERE cr.id = parcelas_receber.conta_receber_id 
  AND cr.created_by_user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar parcelas de suas contas" 
ON public.parcelas_receber 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contas_receber cr 
  WHERE cr.id = parcelas_receber.conta_receber_id 
  AND (cr.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Apenas admins podem deletar parcelas" 
ON public.parcelas_receber 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_parcelas_receber_updated_at
BEFORE UPDATE ON public.parcelas_receber
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. LANÇAMENTOS FINANCEIROS (Fluxo de Caixa)
CREATE TABLE public.lancamentos_financeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  parcela_receber_id UUID REFERENCES public.parcelas_receber(id) ON DELETE SET NULL,
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus lançamentos" 
ON public.lancamentos_financeiros 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar lançamentos" 
ON public.lancamentos_financeiros 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus lançamentos" 
ON public.lancamentos_financeiros 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar lançamentos" 
ON public.lancamentos_financeiros 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_lancamentos_financeiros_updated_at
BEFORE UPDATE ON public.lancamentos_financeiros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. COMISSÕES
CREATE TABLE public.comissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  vendedor_nome TEXT NOT NULL,
  vendedor_user_id UUID,
  percentual NUMERIC NOT NULL DEFAULT 0,
  valor_base NUMERIC NOT NULL,
  valor_comissao NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'pago', 'cancelado')),
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver comissões relacionadas a eles" 
ON public.comissoes 
FOR SELECT 
USING (
  auth.uid() = created_by_user_id 
  OR auth.uid() = vendedor_user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Usuários podem criar comissões" 
ON public.comissoes 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Apenas admins podem atualizar comissões" 
ON public.comissoes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar comissões" 
ON public.comissoes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_comissoes_updated_at
BEFORE UPDATE ON public.comissoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. COMPROVANTES DE PAGAMENTO (referência aos arquivos no storage)
CREATE TABLE public.comprovantes_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID REFERENCES public.lancamentos_financeiros(id) ON DELETE SET NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  parcela_receber_id UUID REFERENCES public.parcelas_receber(id) ON DELETE SET NULL,
  arquivo_url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by_user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.comprovantes_pagamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver comprovantes que enviaram" 
ON public.comprovantes_pagamento 
FOR SELECT 
USING (auth.uid() = uploaded_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem enviar comprovantes" 
ON public.comprovantes_pagamento 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by_user_id);

CREATE POLICY "Apenas admins podem deletar comprovantes" 
ON public.comprovantes_pagamento 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. CRIAR BUCKET PARA COMPROVANTES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', false);

-- Políticas de storage para comprovantes
CREATE POLICY "Usuários podem fazer upload de comprovantes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem ver seus comprovantes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'comprovantes' AND (
  auth.uid()::text = (storage.foldername(name))[1] 
  OR has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Usuários podem deletar seus comprovantes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'comprovantes' AND (
  auth.uid()::text = (storage.foldername(name))[1] 
  OR has_role(auth.uid(), 'admin'::app_role)
));

-- 10. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX idx_contas_pagar_categoria ON public.contas_pagar(categoria_id);

CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_contas_receber_orcamento ON public.contas_receber(orcamento_id);

CREATE INDEX idx_parcelas_vencimento ON public.parcelas_receber(data_vencimento);
CREATE INDEX idx_parcelas_status ON public.parcelas_receber(status);

CREATE INDEX idx_lancamentos_data ON public.lancamentos_financeiros(data_lancamento);
CREATE INDEX idx_lancamentos_tipo ON public.lancamentos_financeiros(tipo);
CREATE INDEX idx_lancamentos_categoria ON public.lancamentos_financeiros(categoria_id);

CREATE INDEX idx_comissoes_status ON public.comissoes(status);
CREATE INDEX idx_comissoes_orcamento ON public.comissoes(orcamento_id);

-- 11. FUNÇÃO PARA ATUALIZAR STATUS DE CONTAS ATRASADAS
CREATE OR REPLACE FUNCTION public.atualizar_contas_atrasadas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar contas a pagar atrasadas
  UPDATE public.contas_pagar
  SET status = 'atrasado'
  WHERE status = 'pendente' 
  AND data_vencimento < CURRENT_DATE;

  -- Atualizar contas a receber atrasadas
  UPDATE public.contas_receber
  SET status = 'atrasado'
  WHERE status IN ('pendente', 'parcial') 
  AND data_vencimento < CURRENT_DATE;

  -- Atualizar parcelas atrasadas
  UPDATE public.parcelas_receber
  SET status = 'atrasado'
  WHERE status = 'pendente' 
  AND data_vencimento < CURRENT_DATE;
END;
$$;


-- ============================================
-- Migration: 20251223200921_de23d4c0-0178-425e-8af6-5936d42ba6b7.sql
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar função para sincronizar status do orçamento com pagamentos
CREATE OR REPLACE FUNCTION public.sincronizar_status_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento_id uuid;
  v_valor_total numeric;
  v_valor_pago numeric;
  v_percentual numeric;
  v_novo_status text;
BEGIN
  -- Buscar orcamento_id da conta receber
  SELECT orcamento_id, valor_total, valor_pago 
  INTO v_orcamento_id, v_valor_total, v_valor_pago
  FROM contas_receber
  WHERE id = NEW.id;
  
  -- Se não tem orçamento vinculado, não faz nada
  IF v_orcamento_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calcular percentual pago
  IF v_valor_total > 0 THEN
    v_percentual := (v_valor_pago / v_valor_total) * 100;
  ELSE
    v_percentual := 0;
  END IF;
  
  -- Determinar novo status baseado no percentual
  IF NEW.status = 'pago' OR v_percentual >= 100 THEN
    v_novo_status := 'pago';
  ELSIF v_percentual >= 60 THEN
    v_novo_status := 'pago_60';
  ELSIF v_percentual >= 50 THEN
    v_novo_status := 'pago_parcial';
  ELSIF v_percentual >= 40 THEN
    v_novo_status := 'pago_40';
  ELSE
    -- Mantém o status atual se menos de 40%
    RETURN NEW;
  END IF;
  
  -- Atualizar status do orçamento
  UPDATE orcamentos
  SET status = v_novo_status
  WHERE id = v_orcamento_id
  AND status NOT IN ('cancelado', 'pago'); -- Não sobrescrever se já está cancelado ou pago
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar quando conta_receber é atualizada
DROP TRIGGER IF EXISTS trigger_sincronizar_status_orcamento ON contas_receber;
CREATE TRIGGER trigger_sincronizar_status_orcamento
  AFTER UPDATE OF status, valor_pago ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_status_orcamento();


-- ============================================
-- Migration: 20251223201307_69559c7f-88b8-4663-80f0-a03ed2a480a2.sql
-- ============================================

-- Criar políticas para o bucket de comprovantes

-- Permitir que usuários autenticados visualizem seus próprios comprovantes
CREATE POLICY "Usuários podem ver comprovantes que enviaram"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários autenticados façam upload de comprovantes na própria pasta
CREATE POLICY "Usuários podem enviar comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que admins visualizem todos os comprovantes
CREATE POLICY "Admins podem ver todos comprovantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' AND 
  public.has_role(auth.uid(), 'admin')
);


-- ============================================
-- Migration: 20251223201815_c54d8f22-3cdc-4125-975c-bfe384f0b218.sql
-- ============================================

-- Add column to track original recurring bill
ALTER TABLE public.contas_pagar 
ADD COLUMN conta_origem_id uuid REFERENCES public.contas_pagar(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_contas_pagar_conta_origem ON public.contas_pagar(conta_origem_id);

-- Add comment for documentation
COMMENT ON COLUMN public.contas_pagar.conta_origem_id IS 'ID da conta recorrente original que gerou esta conta';


-- ============================================
-- Migration: 20251223205407_30172f80-a963-4dd8-9e89-a19f691d2899.sql
-- ============================================

-- Adicionar coluna orcamento_id na tabela contas_pagar
ALTER TABLE public.contas_pagar
ADD COLUMN orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de buscas
CREATE INDEX idx_contas_pagar_orcamento_id ON public.contas_pagar(orcamento_id);


-- ============================================
-- Migration: 20251223211240_80c98925-7c42-4f6d-ae47-1af5af9348b3.sql
-- ============================================

-- Adicionar colunas de desconto na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS desconto_tipo text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desconto_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_com_desconto numeric DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.orcamentos.desconto_tipo IS 'Tipo de desconto: percentual ou valor_fixo';
COMMENT ON COLUMN public.orcamentos.desconto_valor IS 'Valor do desconto (percentual ou valor absoluto em R$)';
COMMENT ON COLUMN public.orcamentos.total_com_desconto IS 'Valor final do orçamento após aplicar o desconto';


-- ============================================
-- Migration: 20251223211901_bcd60b53-ac82-4101-bfd2-9b7b92cc7ad2.sql
-- ============================================

-- Criar tabela de histórico de descontos
CREATE TABLE public.historico_descontos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  desconto_tipo_anterior TEXT,
  desconto_valor_anterior NUMERIC DEFAULT 0,
  desconto_tipo_novo TEXT,
  desconto_valor_novo NUMERIC DEFAULT 0,
  motivo TEXT,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_descontos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver histórico de seus orçamentos"
ON public.historico_descontos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos o 
    WHERE o.id = historico_descontos.orcamento_id 
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Usuários podem criar histórico em seus orçamentos"
ON public.historico_descontos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orcamentos o 
    WHERE o.id = historico_descontos.orcamento_id 
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Índice para consultas por orçamento
CREATE INDEX idx_historico_descontos_orcamento_id ON public.historico_descontos(orcamento_id);

-- Comentários
COMMENT ON TABLE public.historico_descontos IS 'Histórico de alterações de desconto em orçamentos';
COMMENT ON COLUMN public.historico_descontos.motivo IS 'Motivo opcional da alteração do desconto';


-- ============================================
-- Migration: 20251223222301_4a9daaee-d437-46c4-86ec-dab725f291a3.sql
-- ============================================


-- =============================================
-- TABELA: contatos
-- Armazena todos os contatos/leads do CRM
-- =============================================
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  telefone_secundario TEXT,
  cidade TEXT,
  endereco TEXT,
  tipo TEXT NOT NULL DEFAULT 'lead', -- 'lead', 'cliente', 'inativo'
  origem TEXT, -- 'site', 'indicacao', 'instagram', 'whatsapp', 'outro'
  observacoes TEXT,
  tags TEXT[] DEFAULT '{}',
  valor_total_gasto NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para buscas frequentes
CREATE INDEX idx_contatos_telefone ON public.contatos(telefone);
CREATE INDEX idx_contatos_email ON public.contatos(email);
CREATE INDEX idx_contatos_tipo ON public.contatos(tipo);
CREATE INDEX idx_contatos_created_by ON public.contatos(created_by_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contatos_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- Policies para contatos
CREATE POLICY "Usuários podem ver contatos que criaram"
  ON public.contatos FOR SELECT
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar contatos"
  ON public.contatos FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus contatos"
  ON public.contatos FOR UPDATE
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar contatos"
  ON public.contatos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- TABELA: oportunidades
-- Pipeline de vendas do CRM
-- =============================================
CREATE TABLE public.oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID REFERENCES public.contatos(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  valor_estimado NUMERIC DEFAULT 0,
  etapa TEXT NOT NULL DEFAULT 'prospeccao', -- 'prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'
  temperatura TEXT DEFAULT 'morno', -- 'frio', 'morno', 'quente'
  motivo_perda TEXT,
  data_previsao_fechamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_oportunidades_contato ON public.oportunidades(contato_id);
CREATE INDEX idx_oportunidades_orcamento ON public.oportunidades(orcamento_id);
CREATE INDEX idx_oportunidades_etapa ON public.oportunidades(etapa);
CREATE INDEX idx_oportunidades_created_by ON public.oportunidades(created_by_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_oportunidades_updated_at
  BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

-- Policies para oportunidades
CREATE POLICY "Usuários podem ver oportunidades que criaram"
  ON public.oportunidades FOR SELECT
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar oportunidades"
  ON public.oportunidades FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas oportunidades"
  ON public.oportunidades FOR UPDATE
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar oportunidades"
  ON public.oportunidades FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- TABELA: atividades_crm
-- Registro de interações e follow-ups
-- =============================================
CREATE TABLE public.atividades_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID REFERENCES public.contatos(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL, -- 'ligacao', 'email', 'reuniao', 'visita', 'whatsapp', 'nota', 'outro'
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_atividade TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_lembrete TIMESTAMPTZ,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_atividades_contato ON public.atividades_crm(contato_id);
CREATE INDEX idx_atividades_oportunidade ON public.atividades_crm(oportunidade_id);
CREATE INDEX idx_atividades_orcamento ON public.atividades_crm(orcamento_id);
CREATE INDEX idx_atividades_data ON public.atividades_crm(data_atividade);
CREATE INDEX idx_atividades_lembrete ON public.atividades_crm(data_lembrete) WHERE data_lembrete IS NOT NULL AND concluida = false;
CREATE INDEX idx_atividades_created_by ON public.atividades_crm(created_by_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_atividades_crm_updated_at
  BEFORE UPDATE ON public.atividades_crm
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.atividades_crm ENABLE ROW LEVEL SECURITY;

-- Policies para atividades_crm
CREATE POLICY "Usuários podem ver atividades que criaram"
  ON public.atividades_crm FOR SELECT
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar atividades"
  ON public.atividades_crm FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas atividades"
  ON public.atividades_crm FOR UPDATE
  USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar atividades"
  ON public.atividades_crm FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- Adicionar campo contato_id na tabela orcamentos
-- para vincular orçamentos a contatos do CRM
-- =============================================
ALTER TABLE public.orcamentos 
ADD COLUMN contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL;

CREATE INDEX idx_orcamentos_contato ON public.orcamentos(contato_id);



-- ============================================
-- Migration: 20251223224536_44b28f81-60ef-4067-86bd-46bcfcbfff93.sql
-- ============================================

-- Adicionar campo origem na tabela oportunidades
ALTER TABLE public.oportunidades 
ADD COLUMN IF NOT EXISTS origem text DEFAULT NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.oportunidades.origem IS 'Origem da oportunidade: site, indicacao, instagram, whatsapp, facebook, outro';


-- ============================================
-- Migration: 20251223230117_8366cd16-9f45-46d0-9044-f787ec7cd685.sql
-- ============================================

-- Função para sincronizar status do orçamento com etapa da oportunidade
CREATE OR REPLACE FUNCTION public.sync_orcamento_to_oportunidade()
RETURNS TRIGGER AS $$
DECLARE
  nova_etapa TEXT;
  nova_temperatura TEXT;
BEGIN
  -- Só processar se o status mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Mapear status para etapa
  CASE NEW.status
    WHEN 'rascunho' THEN nova_etapa := 'qualificacao'; nova_temperatura := 'morno';
    WHEN 'finalizado' THEN nova_etapa := 'proposta'; nova_temperatura := 'morno';
    WHEN 'enviado' THEN nova_etapa := 'proposta'; nova_temperatura := 'morno';
    WHEN 'sem_resposta' THEN nova_etapa := 'negociacao'; nova_temperatura := 'frio';
    WHEN 'pago_40' THEN nova_etapa := 'negociacao'; nova_temperatura := 'quente';
    WHEN 'pago_parcial' THEN nova_etapa := 'negociacao'; nova_temperatura := 'quente';
    WHEN 'pago_60' THEN nova_etapa := 'negociacao'; nova_temperatura := 'quente';
    WHEN 'pago' THEN nova_etapa := 'fechado_ganho'; nova_temperatura := 'quente';
    WHEN 'recusado' THEN nova_etapa := 'fechado_perdido'; nova_temperatura := 'frio';
    WHEN 'cancelado' THEN nova_etapa := 'fechado_perdido'; nova_temperatura := 'frio';
    ELSE nova_etapa := 'qualificacao'; nova_temperatura := 'morno';
  END CASE;

  -- Atualizar oportunidade vinculada
  UPDATE oportunidades 
  SET 
    etapa = nova_etapa,
    temperatura = nova_temperatura,
    valor_estimado = COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
    updated_at = NOW()
  WHERE orcamento_id = NEW.id
  AND etapa NOT IN ('fechado_ganho', 'fechado_perdido');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para sincronizar quando status do orçamento mudar
DROP TRIGGER IF EXISTS trg_sync_orcamento_to_oportunidade ON orcamentos;
CREATE TRIGGER trg_sync_orcamento_to_oportunidade
AFTER UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.sync_orcamento_to_oportunidade();

-- Função para criar oportunidade automaticamente ao criar orçamento
CREATE OR REPLACE FUNCTION public.auto_create_oportunidade_from_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Só criar se não existir oportunidade vinculada
  IF NOT EXISTS (SELECT 1 FROM oportunidades WHERE orcamento_id = NEW.id) THEN
    INSERT INTO oportunidades (
      titulo,
      contato_id,
      orcamento_id,
      valor_estimado,
      etapa,
      temperatura,
      origem,
      created_by_user_id
    ) VALUES (
      NEW.codigo || ' - ' || NEW.cliente_nome,
      NEW.contato_id,
      NEW.id,
      COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      'qualificacao',
      'morno',
      'orcamento',
      NEW.created_by_user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar oportunidade ao criar orçamento
DROP TRIGGER IF EXISTS trg_auto_create_oportunidade ON orcamentos;
CREATE TRIGGER trg_auto_create_oportunidade
AFTER INSERT ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_oportunidade_from_orcamento();

-- Função para criar contato e oportunidade a partir de solicitação de visita
CREATE OR REPLACE FUNCTION public.process_visit_request_to_crm()
RETURNS TRIGGER AS $$
DECLARE
  v_contato_id uuid;
  v_user_id uuid;
BEGIN
  -- Só processar quando status mudar para 'confirmada'
  IF NEW.status != 'confirmada' OR OLD.status = 'confirmada' THEN
    RETURN NEW;
  END IF;

  -- Usar o usuário que visualizou a solicitação como created_by
  v_user_id := COALESCE(NEW.visualizada_por, (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1));
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar se já existe contato com mesmo telefone
  SELECT id INTO v_contato_id
  FROM contatos
  WHERE telefone = NEW.telefone
  LIMIT 1;

  -- Se não existe, criar contato
  IF v_contato_id IS NULL THEN
    INSERT INTO contatos (
      nome,
      email,
      telefone,
      cidade,
      endereco,
      tipo,
      origem,
      observacoes,
      created_by_user_id
    ) VALUES (
      NEW.nome,
      NEW.email,
      NEW.telefone,
      NEW.cidade,
      COALESCE(NEW.endereco, '') || COALESCE(' - ' || NEW.complemento, ''),
      'lead',
      'visita_site',
      NEW.mensagem,
      v_user_id
    )
    RETURNING id INTO v_contato_id;
  END IF;

  -- Criar oportunidade a partir da visita
  INSERT INTO oportunidades (
    titulo,
    contato_id,
    etapa,
    temperatura,
    origem,
    observacoes,
    created_by_user_id
  ) VALUES (
    'Visita - ' || NEW.nome,
    v_contato_id,
    'prospeccao',
    'morno',
    'visita_site',
    'Solicitação de visita para ' || to_char(NEW.data_agendada, 'DD/MM/YYYY') || ' às ' || NEW.horario_agendado,
    v_user_id
  );

  -- Criar atividade de visita
  INSERT INTO atividades_crm (
    titulo,
    tipo,
    contato_id,
    data_atividade,
    data_lembrete,
    descricao,
    created_by_user_id
  ) VALUES (
    'Visita agendada - ' || NEW.nome,
    'visita',
    v_contato_id,
    (NEW.data_agendada || ' ' || NEW.horario_agendado || ':00')::timestamp with time zone,
    (NEW.data_agendada || ' ' || NEW.horario_agendado || ':00')::timestamp with time zone - interval '1 hour',
    'Endereço: ' || COALESCE(NEW.endereco, 'Não informado') || E'\n' || 
    'Cidade: ' || NEW.cidade || E'\n' ||
    'Mensagem: ' || COALESCE(NEW.mensagem, 'Sem mensagem'),
    v_user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para processar solicitação de visita
DROP TRIGGER IF EXISTS trg_process_visit_to_crm ON solicitacoes_visita;
CREATE TRIGGER trg_process_visit_to_crm
AFTER UPDATE ON solicitacoes_visita
FOR EACH ROW
EXECUTE FUNCTION public.process_visit_request_to_crm();


-- ============================================
-- Migration: 20251223230933_074b5037-4ff0-4487-a0d1-4b48361201ed.sql
-- ============================================

-- Criar trigger para sincronizar status do orçamento com oportunidade
DROP TRIGGER IF EXISTS trg_sync_orcamento_to_oportunidade ON orcamentos;
CREATE TRIGGER trg_sync_orcamento_to_oportunidade
AFTER UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION sync_orcamento_to_oportunidade();

-- Criar trigger para criar oportunidade automaticamente ao inserir orçamento
DROP TRIGGER IF EXISTS trg_auto_create_oportunidade ON orcamentos;
CREATE TRIGGER trg_auto_create_oportunidade
AFTER INSERT ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION auto_create_oportunidade_from_orcamento();

-- Criar trigger para processar solicitação de visita no CRM
DROP TRIGGER IF EXISTS trg_process_visit_to_crm ON solicitacoes_visita;
CREATE TRIGGER trg_process_visit_to_crm
AFTER UPDATE ON solicitacoes_visita
FOR EACH ROW
EXECUTE FUNCTION process_visit_request_to_crm();


-- ============================================
-- Migration: 20251223232005_7367d77c-5b69-402a-9f5d-f84df4894512.sql
-- ============================================

-- Trigger para sincronizar contato quando orçamento é criado/atualizado
CREATE OR REPLACE FUNCTION public.sync_contato_from_orcamento_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contato_id uuid;
  v_valor_orcamento numeric;
BEGIN
  -- Se o status mudou para 'pago'
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
    -- Buscar contato_id do orçamento
    v_contato_id := NEW.contato_id;
    
    -- Se não tem contato vinculado, tentar encontrar pelo telefone
    IF v_contato_id IS NULL THEN
      SELECT id INTO v_contato_id
      FROM contatos
      WHERE telefone = NEW.cliente_telefone
      LIMIT 1;
      
      -- Se encontrou, vincular ao orçamento
      IF v_contato_id IS NOT NULL THEN
        NEW.contato_id := v_contato_id;
      END IF;
    END IF;
    
    -- Se temos contato_id, atualizar o contato
    IF v_contato_id IS NOT NULL THEN
      v_valor_orcamento := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      -- Atualizar tipo para 'cliente' e somar valor_total_gasto
      UPDATE contatos
      SET 
        tipo = 'cliente',
        valor_total_gasto = COALESCE(valor_total_gasto, 0) + v_valor_orcamento,
        updated_at = NOW()
      WHERE id = v_contato_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar contato
DROP TRIGGER IF EXISTS trg_sync_contato_from_orcamento ON orcamentos;
CREATE TRIGGER trg_sync_contato_from_orcamento
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION sync_contato_from_orcamento_changes();

-- Trigger para criar atividades automaticamente quando status do orçamento muda
CREATE OR REPLACE FUNCTION public.create_atividade_from_orcamento_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contato_id uuid;
BEGIN
  -- Só processar se o status mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  v_contato_id := NEW.contato_id;
  
  -- Se status mudou para 'enviado', criar atividade de proposta enviada
  IF NEW.status = 'enviado' AND OLD.status != 'enviado' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Proposta enviada - ' || NEW.codigo,
      'email',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' enviado para ' || NEW.cliente_nome || '. Valor: R$ ' || COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'sem_resposta', criar atividade de follow-up pendente
  IF NEW.status = 'sem_resposta' AND OLD.status != 'sem_resposta' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      data_lembrete,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Follow-up: ' || NEW.codigo,
      'ligacao',
      v_contato_id,
      NEW.id,
      NOW() + INTERVAL '3 days',
      NOW() + INTERVAL '3 days',
      'Ligar para cliente sobre orçamento ' || NEW.codigo || ' que está sem resposta.',
      false,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago', criar atividade de fechamento
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Venda fechada - ' || NEW.codigo,
      'outro',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' foi pago. Valor: R$ ' || COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para criar atividades
DROP TRIGGER IF EXISTS trg_create_atividade_from_orcamento ON orcamentos;
CREATE TRIGGER trg_create_atividade_from_orcamento
  AFTER UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION create_atividade_from_orcamento_status();


-- ============================================
-- Migration: 20251223232608_8ea12d3c-9ac4-476c-8df1-4e8c96d1eeb0.sql
-- ============================================

-- 1. Criar Oportunidades para Orçamentos Existentes que não têm oportunidade vinculada
INSERT INTO oportunidades (titulo, contato_id, orcamento_id, valor_estimado, etapa, temperatura, origem, created_by_user_id)
SELECT 
  codigo || ' - ' || cliente_nome,
  contato_id,
  id,
  COALESCE(total_com_desconto, total_geral, 0),
  CASE status
    WHEN 'rascunho' THEN 'qualificacao'
    WHEN 'finalizado' THEN 'proposta'
    WHEN 'enviado' THEN 'proposta'
    WHEN 'sem_resposta' THEN 'negociacao'
    WHEN 'pago_40' THEN 'negociacao'
    WHEN 'pago_parcial' THEN 'negociacao'
    WHEN 'pago_60' THEN 'negociacao'
    WHEN 'pago' THEN 'fechado_ganho'
    WHEN 'recusado' THEN 'fechado_perdido'
    WHEN 'cancelado' THEN 'fechado_perdido'
    ELSE 'qualificacao'
  END,
  CASE status
    WHEN 'pago' THEN 'quente'
    WHEN 'pago_40' THEN 'quente'
    WHEN 'pago_parcial' THEN 'quente'
    WHEN 'pago_60' THEN 'quente'
    WHEN 'recusado' THEN 'frio'
    WHEN 'cancelado' THEN 'frio'
    WHEN 'sem_resposta' THEN 'frio'
    ELSE 'morno'
  END,
  'orcamento',
  created_by_user_id
FROM orcamentos
WHERE NOT EXISTS (SELECT 1 FROM oportunidades WHERE orcamento_id = orcamentos.id);

-- 2. Promover Contatos com Orçamentos Pagos para "Cliente"
UPDATE contatos
SET tipo = 'cliente', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT contato_id FROM orcamentos WHERE status = 'pago' AND contato_id IS NOT NULL
)
AND tipo != 'cliente';

-- 3. Recalcular valor_total_gasto dos Contatos baseado em orçamentos pagos
UPDATE contatos
SET valor_total_gasto = subquery.total, updated_at = NOW()
FROM (
  SELECT contato_id, COALESCE(SUM(COALESCE(total_com_desconto, total_geral, 0)), 0) as total
  FROM orcamentos
  WHERE status = 'pago' AND contato_id IS NOT NULL
  GROUP BY contato_id
) as subquery
WHERE contatos.id = subquery.contato_id;

-- 4. Criar Atividades Históricas para orçamentos enviados
INSERT INTO atividades_crm (titulo, tipo, contato_id, orcamento_id, data_atividade, descricao, concluida, created_by_user_id)
SELECT 
  'Proposta enviada - ' || codigo,
  'email',
  contato_id,
  id,
  COALESCE(status_updated_at, updated_at),
  'Orçamento ' || codigo || ' enviado para ' || cliente_nome || '. Valor: R$ ' || COALESCE(total_com_desconto, total_geral, 0),
  true,
  created_by_user_id
FROM orcamentos
WHERE status IN ('enviado', 'sem_resposta', 'pago_40', 'pago_parcial', 'pago_60', 'pago', 'recusado')
AND contato_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM atividades_crm WHERE orcamento_id = orcamentos.id AND tipo = 'email'
);

-- 5. Criar Atividades de Venda Fechada para orçamentos pagos
INSERT INTO atividades_crm (titulo, tipo, contato_id, orcamento_id, data_atividade, descricao, concluida, created_by_user_id)
SELECT 
  'Venda fechada - ' || codigo,
  'outro',
  contato_id,
  id,
  COALESCE(status_updated_at, updated_at),
  'Orçamento ' || codigo || ' foi pago. Valor: R$ ' || COALESCE(total_com_desconto, total_geral, 0),
  true,
  created_by_user_id
FROM orcamentos
WHERE status = 'pago'
AND contato_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM atividades_crm WHERE orcamento_id = orcamentos.id AND tipo = 'outro' AND titulo LIKE 'Venda fechada%'
);


-- ============================================
-- Migration: 20251224195604_dcd205ae-368e-449c-a539-d6fc5d796de0.sql
-- ============================================

-- =============================================
-- MÓDULO DE PRODUÇÃO - ESTRUTURA DE DADOS
-- =============================================

-- 1. Tabela principal de pedidos (gerados a partir de orçamentos pagos)
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  numero_pedido TEXT NOT NULL UNIQUE,
  status_producao TEXT NOT NULL DEFAULT 'aguardando_materiais',
  prioridade TEXT NOT NULL DEFAULT 'normal',
  data_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  previsao_entrega DATE,
  data_pronto TIMESTAMP WITH TIME ZONE,
  observacoes_producao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  CONSTRAINT pedidos_status_check CHECK (status_producao IN ('aguardando_materiais', 'em_producao', 'qualidade', 'pronto', 'entregue', 'cancelado')),
  CONSTRAINT pedidos_prioridade_check CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente'))
);

-- 2. Tabela de itens do pedido (cada cortina/persiana)
CREATE TABLE public.itens_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cortina_item_id UUID NOT NULL REFERENCES public.cortina_items(id) ON DELETE CASCADE,
  status_item TEXT NOT NULL DEFAULT 'fila',
  responsavel TEXT,
  data_inicio_corte TIMESTAMP WITH TIME ZONE,
  data_fim_corte TIMESTAMP WITH TIME ZONE,
  data_inicio_costura TIMESTAMP WITH TIME ZONE,
  data_fim_costura TIMESTAMP WITH TIME ZONE,
  data_finalizacao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT itens_pedido_status_check CHECK (status_item IN ('fila', 'corte', 'costura', 'acabamento', 'qualidade', 'pronto'))
);

-- 3. Tabela de histórico/timeline de produção
CREATE TABLE public.historico_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  item_pedido_id UUID REFERENCES public.itens_pedido(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  descricao TEXT NOT NULL,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL
);

-- 4. Tabela de instalações
CREATE TABLE public.instalacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  data_agendada DATE NOT NULL,
  turno TEXT NOT NULL DEFAULT 'manha',
  instalador TEXT,
  status TEXT NOT NULL DEFAULT 'agendada',
  endereco TEXT NOT NULL,
  cidade TEXT,
  observacoes TEXT,
  data_realizada TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  CONSTRAINT instalacoes_turno_check CHECK (turno IN ('manha', 'tarde', 'dia_todo')),
  CONSTRAINT instalacoes_status_check CHECK (status IN ('agendada', 'confirmada', 'em_andamento', 'concluida', 'reagendada', 'cancelada'))
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_pedidos_orcamento ON public.pedidos(orcamento_id);
CREATE INDEX idx_pedidos_status ON public.pedidos(status_producao);
CREATE INDEX idx_pedidos_data_entrada ON public.pedidos(data_entrada);
CREATE INDEX idx_itens_pedido_pedido ON public.itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_status ON public.itens_pedido(status_item);
CREATE INDEX idx_historico_pedido ON public.historico_producao(pedido_id);
CREATE INDEX idx_instalacoes_pedido ON public.instalacoes(pedido_id);
CREATE INDEX idx_instalacoes_data ON public.instalacoes(data_agendada);

-- =============================================
-- HABILITAR RLS
-- =============================================
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - PEDIDOS
-- =============================================
CREATE POLICY "Usuários podem ver pedidos de seus orçamentos"
  ON public.pedidos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = pedidos.orcamento_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar pedidos de seus orçamentos"
  ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar pedidos de seus orçamentos"
  ON public.pedidos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = pedidos.orcamento_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Apenas admins podem deletar pedidos"
  ON public.pedidos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- POLÍTICAS RLS - ITENS PEDIDO
-- =============================================
CREATE POLICY "Usuários podem ver itens de seus pedidos"
  ON public.itens_pedido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = itens_pedido.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar itens em seus pedidos"
  ON public.itens_pedido FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = itens_pedido.pedido_id
      AND o.created_by_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens de seus pedidos"
  ON public.itens_pedido FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = itens_pedido.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Apenas admins podem deletar itens"
  ON public.itens_pedido FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- POLÍTICAS RLS - HISTÓRICO PRODUÇÃO
-- =============================================
CREATE POLICY "Usuários podem ver histórico de seus pedidos"
  ON public.historico_producao FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = historico_producao.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar histórico em seus pedidos"
  ON public.historico_producao FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = historico_producao.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- =============================================
-- POLÍTICAS RLS - INSTALAÇÕES
-- =============================================
CREATE POLICY "Usuários podem ver instalações de seus pedidos"
  ON public.instalacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = instalacoes.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Usuários podem criar instalações"
  ON public.instalacoes FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar instalações de seus pedidos"
  ON public.instalacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      JOIN public.orcamentos o ON o.id = p.orcamento_id
      WHERE p.id = instalacoes.pedido_id
      AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Apenas admins podem deletar instalações"
  ON public.instalacoes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para gerar número do pedido sequencial
CREATE OR REPLACE FUNCTION public.gerar_numero_pedido()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  novo_numero TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN numero_pedido ~ ('^PED-' || ano || '-[0-9]+$')
      THEN CAST(SUBSTRING(numero_pedido FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequencia
  FROM public.pedidos
  WHERE numero_pedido LIKE 'PED-' || ano || '-%';
  
  novo_numero := 'PED-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN novo_numero;
END;
$$;

-- Função para criar pedido automaticamente quando orçamento atinge 40%+
CREATE OR REPLACE FUNCTION public.auto_create_pedido_from_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id UUID;
  v_numero_pedido TEXT;
  v_item RECORD;
BEGIN
  -- Só processar se o status mudou para um dos status de pagamento
  IF NEW.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe pedido para este orçamento
  IF EXISTS (SELECT 1 FROM public.pedidos WHERE orcamento_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Gerar número do pedido
  v_numero_pedido := public.gerar_numero_pedido();
  
  -- Criar o pedido
  INSERT INTO public.pedidos (
    orcamento_id,
    numero_pedido,
    status_producao,
    prioridade,
    previsao_entrega,
    observacoes_producao,
    created_by_user_id
  ) VALUES (
    NEW.id,
    v_numero_pedido,
    'aguardando_materiais',
    CASE 
      WHEN NEW.status = 'pago' THEN 'alta'
      WHEN NEW.status = 'pago_60' THEN 'normal'
      ELSE 'normal'
    END,
    CURRENT_DATE + INTERVAL '15 days',
    'Pedido gerado automaticamente a partir do orçamento ' || NEW.codigo,
    NEW.created_by_user_id
  )
  RETURNING id INTO v_pedido_id;
  
  -- Criar itens do pedido a partir das cortinas do orçamento
  FOR v_item IN 
    SELECT id FROM public.cortina_items WHERE orcamento_id = NEW.id
  LOOP
    INSERT INTO public.itens_pedido (
      pedido_id,
      cortina_item_id,
      status_item
    ) VALUES (
      v_pedido_id,
      v_item.id,
      'fila'
    );
  END LOOP;
  
  -- Registrar no histórico
  INSERT INTO public.historico_producao (
    pedido_id,
    tipo_evento,
    status_novo,
    descricao,
    usuario_id,
    usuario_nome
  ) VALUES (
    v_pedido_id,
    'criacao',
    'aguardando_materiais',
    'Pedido criado automaticamente a partir do orçamento ' || NEW.codigo || ' (status: ' || NEW.status || ')',
    NEW.created_by_user_id,
    (SELECT COALESCE(email, 'Sistema') FROM auth.users WHERE id = NEW.created_by_user_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para criar pedido automaticamente
CREATE TRIGGER trigger_auto_create_pedido
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.auto_create_pedido_from_orcamento();

-- Função para registrar mudanças de status no histórico
CREATE OR REPLACE FUNCTION public.registrar_historico_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status_item IS DISTINCT FROM NEW.status_item THEN
    INSERT INTO public.historico_producao (
      pedido_id,
      item_pedido_id,
      tipo_evento,
      status_anterior,
      status_novo,
      descricao,
      usuario_id,
      usuario_nome
    ) VALUES (
      NEW.pedido_id,
      NEW.id,
      'mudanca_status',
      OLD.status_item,
      NEW.status_item,
      'Item movido de "' || OLD.status_item || '" para "' || NEW.status_item || '"',
      auth.uid(),
      (SELECT COALESCE(email, 'Sistema') FROM auth.users WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar histórico de itens
CREATE TRIGGER trigger_registrar_historico_item
  AFTER UPDATE ON public.itens_pedido
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_item();

-- Triggers para updated_at
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_pedido_updated_at
  BEFORE UPDATE ON public.itens_pedido
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instalacoes_updated_at
  BEFORE UPDATE ON public.instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- Migration: 20251224200753_7c079dc6-6432-4d85-84a6-353ca4755b7a.sql
-- ============================================

-- Enable realtime for itens_pedido table to track status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_pedido;


-- ============================================
-- Migration: 20251224202313_d20bc8d8-59f3-4ee0-97f3-8b74089c590d.sql
-- ============================================

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


-- ============================================
-- Migration: 20251229192101_d96811fb-27cb-4cc6-8829-b29ea1b7d8bc.sql
-- ============================================

CREATE OR REPLACE FUNCTION public.process_visit_request_to_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contato_id uuid;
  v_user_id uuid;
  v_horario_inicial text;
BEGIN
  -- Só processar quando status mudar para 'confirmada'
  IF NEW.status != 'confirmada' OR OLD.status = 'confirmada' THEN
    RETURN NEW;
  END IF;

  -- Usar o usuário que visualizou a solicitação como created_by
  v_user_id := COALESCE(NEW.visualizada_por, (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1));
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extrair apenas o horário inicial do intervalo (ex: "16:00" de "16:00 - 17:00")
  v_horario_inicial := split_part(NEW.horario_agendado, ' - ', 1);

  -- Verificar se já existe contato com mesmo telefone
  SELECT id INTO v_contato_id
  FROM contatos
  WHERE telefone = NEW.telefone
  LIMIT 1;

  -- Se não existe, criar contato
  IF v_contato_id IS NULL THEN
    INSERT INTO contatos (
      nome,
      email,
      telefone,
      cidade,
      endereco,
      tipo,
      origem,
      observacoes,
      created_by_user_id
    ) VALUES (
      NEW.nome,
      CASE WHEN NEW.email LIKE '%@whatsapp.manual' THEN NULL ELSE NEW.email END,
      NEW.telefone,
      NEW.cidade,
      COALESCE(NEW.endereco, '') || COALESCE(' - ' || NEW.complemento, ''),
      'lead',
      'visita_site',
      NEW.mensagem,
      v_user_id
    )
    RETURNING id INTO v_contato_id;
  END IF;

  -- Criar oportunidade a partir da visita
  INSERT INTO oportunidades (
    titulo,
    contato_id,
    etapa,
    temperatura,
    origem,
    observacoes,
    created_by_user_id
  ) VALUES (
    'Visita - ' || NEW.nome,
    v_contato_id,
    'prospeccao',
    'morno',
    'visita_site',
    'Solicitação de visita para ' || to_char(NEW.data_agendada, 'DD/MM/YYYY') || ' às ' || NEW.horario_agendado,
    v_user_id
  );

  -- Criar atividade de visita com horário corrigido
  INSERT INTO atividades_crm (
    titulo,
    tipo,
    contato_id,
    data_atividade,
    data_lembrete,
    descricao,
    created_by_user_id
  ) VALUES (
    'Visita agendada - ' || NEW.nome,
    'visita',
    v_contato_id,
    (NEW.data_agendada || ' ' || v_horario_inicial || ':00')::timestamp with time zone,
    (NEW.data_agendada || ' ' || v_horario_inicial || ':00')::timestamp with time zone - interval '1 hour',
    'Endereço: ' || COALESCE(NEW.endereco, 'Não informado') || E'\n' || 
    'Cidade: ' || NEW.cidade || E'\n' ||
    'Mensagem: ' || COALESCE(NEW.mensagem, 'Sem mensagem'),
    v_user_id
  );

  RETURN NEW;
END;
$function$;


-- ============================================
-- Migration: 20251229192351_dd2d71c9-29c0-46e2-aacd-91919b37707f.sql
-- ============================================

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


-- ============================================
-- Migration: 20251229193152_a8a3352d-e540-4244-94f6-fb85f05cb7e6.sql
-- ============================================

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


-- ============================================
-- Migration: 20251229194157_51e30733-9c2a-4a23-a822-e3b1baae7a6f.sql
-- ============================================

-- Função para criar conta a receber automaticamente quando orçamento muda para status de pagamento
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_valor_total numeric;
  v_conta_receber_id uuid;
BEGIN
  -- Só processar se status mudou para um status de pagamento
  IF NEW.status IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago'))
  THEN
    -- Verificar se já existe conta para este orçamento
    IF NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE orcamento_id = NEW.id) THEN
      -- Usar valor com desconto ou valor geral
      v_valor_total := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      -- Criar conta a receber com parcela única
      INSERT INTO public.contas_receber (
        orcamento_id,
        cliente_nome,
        cliente_telefone,
        descricao,
        valor_total,
        valor_pago,
        numero_parcelas,
        data_vencimento,
        status,
        created_by_user_id
      ) VALUES (
        NEW.id,
        NEW.cliente_nome,
        NEW.cliente_telefone,
        'Orçamento ' || NEW.codigo,
        v_valor_total,
        0,
        1,
        CURRENT_DATE + INTERVAL '30 days',
        'pendente',
        NEW.created_by_user_id
      )
      RETURNING id INTO v_conta_receber_id;
      
      -- Criar a parcela única
      INSERT INTO public.parcelas_receber (
        conta_receber_id,
        numero_parcela,
        valor,
        data_vencimento,
        status
      ) VALUES (
        v_conta_receber_id,
        1,
        v_valor_total,
        CURRENT_DATE + INTERVAL '30 days',
        'pendente'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para execução automática (se não existir)
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber ON public.orcamentos;
CREATE TRIGGER trigger_auto_criar_conta_receber
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_criar_conta_receber();


-- ============================================
-- Migration: 20251229194905_9f6e6f2f-38ad-4ec7-9263-0d4b978bff09.sql
-- ============================================

-- Função para notificar parcelas a receber vencendo (3 dias antes)
CREATE OR REPLACE FUNCTION public.criar_notificacao_parcela_receber_vencer()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_nome TEXT;
  v_user_id UUID;
BEGIN
  -- Só processar parcelas pendentes que vencem em até 3 dias
  IF NEW.status = 'pendente' 
     AND NEW.data_vencimento <= CURRENT_DATE + INTERVAL '3 days' 
     AND NEW.data_vencimento >= CURRENT_DATE 
  THEN
    -- Buscar nome do cliente e usuário criador
    SELECT cr.cliente_nome, cr.created_by_user_id 
    INTO v_cliente_nome, v_user_id
    FROM contas_receber cr
    WHERE cr.id = NEW.conta_receber_id;
    
    IF v_user_id IS NOT NULL THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_user_id,
        'parcela_vencer',
        'Parcela a receber vencendo',
        'Parcela ' || NEW.numero_parcela || ' de ' || COALESCE(v_cliente_nome, 'Cliente') || 
        ' (R$ ' || NEW.valor || ') vence em ' || to_char(NEW.data_vencimento, 'DD/MM/YYYY'),
        CASE 
          WHEN NEW.data_vencimento = CURRENT_DATE THEN 'urgente'
          WHEN NEW.data_vencimento <= CURRENT_DATE + INTERVAL '1 day' THEN 'alta'
          ELSE 'normal'
        END,
        'parcela_receber',
        NEW.id,
        NEW.data_vencimento::timestamp with time zone
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger na tabela parcelas_receber
CREATE TRIGGER trigger_notificacao_parcela_receber_vencer
AFTER INSERT OR UPDATE ON public.parcelas_receber
FOR EACH ROW
EXECUTE FUNCTION public.criar_notificacao_parcela_receber_vencer();


-- ============================================
-- Migration: 20251229201848_320e2d04-0d1f-4ddf-891d-00ef9fb33c05.sql
-- ============================================

-- Fase 4: Sistema de Empréstimo com Automação

-- 1. Verificar se categoria de empréstimo existe, se não, criar
INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo)
SELECT 'Empréstimo Sócio', 'despesa', '#8B5CF6', 'wallet', true
WHERE NOT EXISTS (
  SELECT 1 FROM categorias_financeiras 
  WHERE nome ILIKE '%empréstimo%' OR nome ILIKE '%emprestimo%'
);

-- 2. Criar função para auto-criar conta a receber quando empréstimo é lançado
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber_emprestimo()
RETURNS TRIGGER AS $$
DECLARE
  v_categoria_emprestimo_id UUID;
  v_conta_receber_id UUID;
BEGIN
  -- Verificar se a categoria é de empréstimo
  SELECT id INTO v_categoria_emprestimo_id
  FROM categorias_financeiras
  WHERE (nome ILIKE '%empréstimo%' OR nome ILIKE '%emprestimo%')
  AND id = NEW.categoria_id;
  
  IF v_categoria_emprestimo_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Criar conta a receber para 30 dias
  INSERT INTO contas_receber (
    cliente_nome,
    descricao,
    valor_total,
    valor_pago,
    numero_parcelas,
    status,
    data_vencimento,
    created_by_user_id
  ) VALUES (
    'Empréstimo - ' || NEW.descricao,
    'Devolução: ' || NEW.descricao,
    NEW.valor,
    0,
    1,
    'pendente',
    NEW.data_lancamento + INTERVAL '30 days',
    NEW.created_by_user_id
  )
  RETURNING id INTO v_conta_receber_id;
  
  -- Criar parcela única
  INSERT INTO parcelas_receber (
    conta_receber_id,
    numero_parcela,
    valor,
    data_vencimento,
    status
  ) VALUES (
    v_conta_receber_id,
    1,
    NEW.valor,
    NEW.data_lancamento + INTERVAL '30 days',
    'pendente'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger para auto-criar conta a receber
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber_emprestimo ON lancamentos_financeiros;
CREATE TRIGGER trigger_auto_criar_conta_receber_emprestimo
AFTER INSERT ON lancamentos_financeiros
FOR EACH ROW
EXECUTE FUNCTION public.auto_criar_conta_receber_emprestimo();


-- ============================================
-- Migration: 20251229202944_ed03a3aa-8210-43d2-b9af-549e7eba54c5.sql
-- ============================================

-- Remover constraint de categorias e lançamentos
ALTER TABLE categorias_financeiras DROP CONSTRAINT IF EXISTS categorias_financeiras_tipo_check;
ALTER TABLE lancamentos_financeiros DROP CONSTRAINT IF EXISTS lancamentos_financeiros_tipo_check;

-- Adicionar novas constraints que permitem 'emprestimo'
ALTER TABLE categorias_financeiras ADD CONSTRAINT categorias_financeiras_tipo_check 
  CHECK (tipo IN ('receita', 'despesa', 'emprestimo'));

ALTER TABLE lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_tipo_check 
  CHECK (tipo IN ('entrada', 'saida', 'emprestimo'));

-- Atualizar categorias de empréstimo para o novo tipo 'emprestimo'
UPDATE categorias_financeiras 
SET tipo = 'emprestimo' 
WHERE nome ILIKE '%empréstimo%' OR nome ILIKE '%emprestimo%';

-- Atualizar lançamentos vinculados a categorias de empréstimo para o novo tipo
UPDATE lancamentos_financeiros lf
SET tipo = 'emprestimo'
FROM categorias_financeiras cf
WHERE lf.categoria_id = cf.id
AND cf.tipo = 'emprestimo';

-- Criar contas a receber retroativas para empréstimos existentes que não possuem
INSERT INTO contas_receber (cliente_nome, descricao, valor_total, valor_pago, numero_parcelas, status, data_vencimento, created_by_user_id)
SELECT 
  'Empréstimo - ' || lf.descricao,
  'Devolução: ' || lf.descricao,
  lf.valor,
  0,
  1,
  CASE 
    WHEN lf.data_lancamento + INTERVAL '30 days' < CURRENT_DATE THEN 'atrasado'
    ELSE 'pendente'
  END,
  lf.data_lancamento + INTERVAL '30 days',
  lf.created_by_user_id
FROM lancamentos_financeiros lf
INNER JOIN categorias_financeiras cf ON cf.id = lf.categoria_id
WHERE cf.tipo = 'emprestimo'
AND NOT EXISTS (
  SELECT 1 FROM contas_receber cr 
  WHERE cr.descricao = 'Devolução: ' || lf.descricao
  AND cr.valor_total = lf.valor
);

-- Criar parcelas para as contas a receber de empréstimo que não possuem
INSERT INTO parcelas_receber (conta_receber_id, numero_parcela, valor, data_vencimento, status)
SELECT 
  cr.id,
  1,
  cr.valor_total,
  cr.data_vencimento,
  cr.status
FROM contas_receber cr
WHERE cr.cliente_nome LIKE 'Empréstimo -%'
AND NOT EXISTS (
  SELECT 1 FROM parcelas_receber pr WHERE pr.conta_receber_id = cr.id
);


-- ============================================
-- Migration: 20251229203613_5512a4e4-98b5-43d3-91c8-8500b69157bb.sql
-- ============================================

-- Adicionar campo lancamento_origem_id na tabela contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN lancamento_origem_id uuid REFERENCES public.lancamentos_financeiros(id);

-- Criar índice para melhorar performance
CREATE INDEX idx_contas_receber_lancamento_origem ON public.contas_receber(lancamento_origem_id);

-- Atualizar a função auto_criar_conta_receber_emprestimo para vincular o lançamento
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber_emprestimo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_categoria_emprestimo_id UUID;
  v_conta_receber_id UUID;
BEGIN
  -- Verificar se a categoria é de empréstimo
  SELECT id INTO v_categoria_emprestimo_id
  FROM categorias_financeiras
  WHERE (nome ILIKE '%empréstimo%' OR nome ILIKE '%emprestimo%')
  AND id = NEW.categoria_id;
  
  IF v_categoria_emprestimo_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Criar conta a receber para 30 dias vinculada ao lançamento
  INSERT INTO contas_receber (
    cliente_nome,
    descricao,
    valor_total,
    valor_pago,
    numero_parcelas,
    status,
    data_vencimento,
    created_by_user_id,
    lancamento_origem_id
  ) VALUES (
    'Empréstimo - ' || NEW.descricao,
    'Devolução: ' || NEW.descricao,
    NEW.valor,
    0,
    1,
    'pendente',
    NEW.data_lancamento + INTERVAL '30 days',
    NEW.created_by_user_id,
    NEW.id
  )
  RETURNING id INTO v_conta_receber_id;
  
  -- Criar parcela única
  INSERT INTO parcelas_receber (
    conta_receber_id,
    numero_parcela,
    valor,
    data_vencimento,
    status
  ) VALUES (
    v_conta_receber_id,
    1,
    NEW.valor,
    NEW.data_lancamento + INTERVAL '30 days',
    'pendente'
  );
  
  RETURN NEW;
END;
$function$;

-- Migrar dados existentes: vincular lançamentos de empréstimo às contas a receber criadas
-- Encontrar lançamentos de empréstimo e suas contas correspondentes por descrição e valor
UPDATE contas_receber cr
SET lancamento_origem_id = lf.id
FROM lancamentos_financeiros lf
JOIN categorias_financeiras cf ON cf.id = lf.categoria_id
WHERE cf.nome ILIKE '%empréstimo%' OR cf.nome ILIKE '%emprestimo%'
AND cr.descricao = 'Devolução: ' || lf.descricao
AND cr.valor_total = lf.valor
AND cr.lancamento_origem_id IS NULL;


-- ============================================
-- Migration: 20251229204527_5d594f1b-970e-45b1-af29-e3807c79ecd2.sql
-- ============================================

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


-- ============================================
-- Migration: 20251229212116_6215b1d9-254d-4b2e-ac93-364a0a50127e.sql
-- ============================================

-- Tabela de regras de conciliação automática
CREATE TABLE public.regras_conciliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao_contem TEXT NOT NULL,
  acao TEXT NOT NULL DEFAULT 'ignorar',
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  tipo_lancamento TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coluna para rastrear regra aplicada nas movimentações
ALTER TABLE public.movimentacoes_extrato 
ADD COLUMN regra_aplicada_id UUID REFERENCES public.regras_conciliacao(id);

-- Enable RLS
ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regras_conciliacao
CREATE POLICY "Usuários podem ver suas regras"
ON public.regras_conciliacao
FOR SELECT
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar regras"
ON public.regras_conciliacao
FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar suas regras"
ON public.regras_conciliacao
FOR UPDATE
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar regras"
ON public.regras_conciliacao
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_regras_conciliacao_updated_at
BEFORE UPDATE ON public.regras_conciliacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas regras padrão (serão criadas pelo primeiro admin)
-- Não inserimos aqui pois precisa de user_id


-- ============================================
-- Migration: 20251229214634_591bed01-c85d-4eb1-810a-f4f92a5ce0c0.sql
-- ============================================

-- Trigger para criar notificações de cobrança para pagamentos parciais e atrasados
CREATE OR REPLACE FUNCTION public.criar_notificacao_cobranca_parcial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_nome TEXT;
  v_user_id UUID;
  v_tipo_notificacao TEXT;
  v_titulo TEXT;
  v_mensagem TEXT;
  v_prioridade TEXT;
BEGIN
  -- Só processar parcelas que mudaram para status 'parcial' ou 'atrasado'
  IF NEW.status NOT IN ('parcial', 'atrasado') THEN
    RETURN NEW;
  END IF;
  
  -- Não notificar se status não mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buscar info do cliente
  SELECT cr.cliente_nome, cr.created_by_user_id 
  INTO v_cliente_nome, v_user_id
  FROM contas_receber cr
  WHERE cr.id = NEW.conta_receber_id;
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Definir tipo e mensagem baseado no status
  IF NEW.status = 'parcial' THEN
    v_tipo_notificacao := 'pagamento_parcial';
    v_titulo := 'Pagamento Parcial Recebido';
    v_mensagem := 'Cliente ' || v_cliente_nome || ' pagou parcialmente a parcela ' || NEW.numero_parcela || 
                  '. Valor pendente a cobrar.';
    v_prioridade := 'normal';
  ELSE -- atrasado
    v_tipo_notificacao := 'pagamento_atrasado';
    v_titulo := 'Parcela em Atraso - Cobrar';
    v_mensagem := 'Parcela ' || NEW.numero_parcela || ' de ' || v_cliente_nome || 
                  ' (R$ ' || NEW.valor || ') está em atraso desde ' || to_char(NEW.data_vencimento, 'DD/MM/YYYY');
    v_prioridade := CASE 
      WHEN NEW.data_vencimento < CURRENT_DATE - INTERVAL '7 days' THEN 'urgente'
      WHEN NEW.data_vencimento < CURRENT_DATE - INTERVAL '3 days' THEN 'alta'
      ELSE 'normal'
    END;
  END IF;
  
  -- Criar notificação (evitar duplicatas)
  INSERT INTO notificacoes (
    user_id, tipo, titulo, mensagem, prioridade,
    referencia_tipo, referencia_id, data_lembrete
  ) VALUES (
    v_user_id,
    v_tipo_notificacao,
    v_titulo,
    v_mensagem,
    v_prioridade,
    'parcela_receber',
    NEW.id,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_notificacao_cobranca_parcial ON parcelas_receber;
CREATE TRIGGER trigger_notificacao_cobranca_parcial
  AFTER UPDATE ON parcelas_receber
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_cobranca_parcial();

-- Trigger para contas_receber também (quando status muda para parcial/atrasado)
CREATE OR REPLACE FUNCTION public.criar_notificacao_conta_atrasada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só processar se status mudou para atrasado
  IF NEW.status != 'atrasado' OR OLD.status = 'atrasado' THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO notificacoes (
    user_id, tipo, titulo, mensagem, prioridade,
    referencia_tipo, referencia_id, data_lembrete
  ) VALUES (
    NEW.created_by_user_id,
    'pagamento_atrasado',
    'Conta a Receber em Atraso',
    'Conta de ' || NEW.cliente_nome || ' (R$ ' || (NEW.valor_total - NEW.valor_pago) || ' pendente) está em atraso',
    CASE 
      WHEN NEW.data_vencimento < CURRENT_DATE - INTERVAL '7 days' THEN 'urgente'
      ELSE 'alta'
    END,
    'conta_receber',
    NEW.id,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificacao_conta_atrasada ON contas_receber;
CREATE TRIGGER trigger_notificacao_conta_atrasada
  AFTER UPDATE ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_conta_atrasada();


-- ============================================
-- Migration: 20251229224419_bf68bc22-d281-4ddd-9b02-d7f62cea7467.sql
-- ============================================

-- Tabela para armazenar padrões de conciliação aprendidos
CREATE TABLE public.padroes_conciliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  
  -- Padrão identificado na descrição do extrato
  padrao_descricao TEXT NOT NULL,
  
  -- Tipo de conciliação: 'lancamento', 'conta_pagar', 'parcela_receber'
  tipo_conciliacao TEXT NOT NULL,
  
  -- Referência para onde conciliar (categoria, conta, etc)
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  tipo_lancamento TEXT, -- 'entrada' ou 'saida'
  
  -- Estatísticas de uso
  vezes_usado INTEGER NOT NULL DEFAULT 1,
  ultima_utilizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Confiança do padrão (aumenta com uso)
  confianca INTEGER NOT NULL DEFAULT 50, -- 0-100
  
  -- Status
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Índices para busca eficiente
CREATE INDEX idx_padroes_conciliacao_padrao ON public.padroes_conciliacao USING gin (to_tsvector('portuguese', padrao_descricao));
CREATE INDEX idx_padroes_conciliacao_user ON public.padroes_conciliacao (created_by_user_id, ativo);

-- Enable RLS
ALTER TABLE public.padroes_conciliacao ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver seus padrões" 
ON public.padroes_conciliacao 
FOR SELECT 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem criar padrões" 
ON public.padroes_conciliacao 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Usuários podem atualizar seus padrões" 
ON public.padroes_conciliacao 
FOR UPDATE 
USING (auth.uid() = created_by_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar padrões" 
ON public.padroes_conciliacao 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));


-- ============================================
-- Migration: 20251229230538_2e98f810-4382-4a84-b645-72ee749328e5.sql
-- ============================================

-- Função para auto-criar conta a receber quando orçamento for enviado
CREATE OR REPLACE FUNCTION public.auto_criar_conta_receber_enviado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_valor_total numeric;
  v_conta_receber_id uuid;
BEGIN
  -- Só processar se status mudou para 'enviado' e não tinha conta ainda
  IF NEW.status = 'enviado' AND (OLD.status IS NULL OR OLD.status != 'enviado') THEN
    -- Verificar se já existe conta para este orçamento
    IF NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE orcamento_id = NEW.id) THEN
      -- Usar valor com desconto ou valor geral
      v_valor_total := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      -- Só criar se tiver valor
      IF v_valor_total > 0 THEN
        -- Criar conta a receber com status 'aguardando' (diferente de pendente)
        INSERT INTO public.contas_receber (
          orcamento_id,
          cliente_nome,
          cliente_telefone,
          descricao,
          valor_total,
          valor_pago,
          numero_parcelas,
          data_vencimento,
          status,
          observacoes,
          created_by_user_id
        ) VALUES (
          NEW.id,
          NEW.cliente_nome,
          NEW.cliente_telefone,
          'Orçamento ' || NEW.codigo,
          v_valor_total,
          0,
          1,
          CURRENT_DATE + INTERVAL '30 days',
          'pendente',
          'Conta criada automaticamente ao enviar orçamento. Aguardando confirmação do cliente.',
          NEW.created_by_user_id
        )
        RETURNING id INTO v_conta_receber_id;
        
        -- Criar parcela única inicial
        INSERT INTO public.parcelas_receber (
          conta_receber_id,
          numero_parcela,
          valor,
          data_vencimento,
          status
        ) VALUES (
          v_conta_receber_id,
          1,
          v_valor_total,
          CURRENT_DATE + INTERVAL '30 days',
          'pendente'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para auto-criar conta a receber no status enviado
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber_enviado ON public.orcamentos;
CREATE TRIGGER trigger_auto_criar_conta_receber_enviado
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_criar_conta_receber_enviado();


-- ============================================
-- Migration: 20251231194451_d308fa25-6935-46a1-b46d-89f79707f929.sql
-- ============================================

-- Adicionar coluna para controlar se custos já foram gerados
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS custos_gerados boolean DEFAULT false;

-- Função para gerar contas a pagar automaticamente baseado nos custos do orçamento
CREATE OR REPLACE FUNCTION public.auto_criar_contas_pagar_custos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_custo_materiais numeric;
  v_custo_mao_obra numeric;
  v_custo_instalacao numeric;
  v_categoria_materiais_id uuid;
  v_categoria_mao_obra_id uuid;
  v_categoria_instalacao_id uuid;
BEGIN
  -- Só processar se status mudou para um status de pagamento e custos ainda não foram gerados
  IF NEW.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já gerou custos
  IF NEW.custos_gerados = true OR OLD.custos_gerados = true THEN
    RETURN NEW;
  END IF;
  
  -- Só gerar se tinha status diferente antes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buscar categorias financeiras
  SELECT id INTO v_categoria_materiais_id 
  FROM categorias_financeiras 
  WHERE nome ILIKE '%material%' OR nome ILIKE '%materia%' 
  AND tipo = 'saida' AND ativo = true
  LIMIT 1;
  
  SELECT id INTO v_categoria_mao_obra_id 
  FROM categorias_financeiras 
  WHERE nome ILIKE '%mão de obra%' OR nome ILIKE '%costura%' OR nome ILIKE '%confeccao%'
  AND tipo = 'saida' AND ativo = true
  LIMIT 1;
  
  SELECT id INTO v_categoria_instalacao_id 
  FROM categorias_financeiras 
  WHERE nome ILIKE '%instalacao%' OR nome ILIKE '%servico%'
  AND tipo = 'saida' AND ativo = true
  LIMIT 1;

  -- Calcular custos a partir dos subtotais do orçamento
  v_custo_materiais := COALESCE(NEW.subtotal_materiais, 0) * 0.6; -- Estimar custo como 60% do preço
  v_custo_mao_obra := COALESCE(NEW.subtotal_mao_obra_costura, 0) * 0.7;
  v_custo_instalacao := COALESCE(NEW.subtotal_instalacao, 0) * 0.7;

  -- Criar conta a pagar para materiais (se houver valor)
  IF v_custo_materiais > 0 THEN
    INSERT INTO contas_pagar (
      descricao,
      valor,
      data_vencimento,
      status,
      categoria_id,
      orcamento_id,
      fornecedor,
      observacoes,
      created_by_user_id
    ) VALUES (
      'Materiais - ' || NEW.codigo || ' (' || NEW.cliente_nome || ')',
      v_custo_materiais,
      CURRENT_DATE + INTERVAL '30 days',
      'pendente',
      v_categoria_materiais_id,
      NEW.id,
      'Fornecedor de Materiais',
      'Custo gerado automaticamente do orçamento',
      NEW.created_by_user_id
    );
  END IF;

  -- Criar conta a pagar para mão de obra (se houver valor)
  IF v_custo_mao_obra > 0 THEN
    INSERT INTO contas_pagar (
      descricao,
      valor,
      data_vencimento,
      status,
      categoria_id,
      orcamento_id,
      fornecedor,
      observacoes,
      created_by_user_id
    ) VALUES (
      'Mão de Obra - ' || NEW.codigo || ' (' || NEW.cliente_nome || ')',
      v_custo_mao_obra,
      CURRENT_DATE + INTERVAL '15 days',
      'pendente',
      v_categoria_mao_obra_id,
      NEW.id,
      'Confecção',
      'Custo gerado automaticamente do orçamento',
      NEW.created_by_user_id
    );
  END IF;

  -- Criar conta a pagar para instalação (se houver valor)
  IF v_custo_instalacao > 0 THEN
    INSERT INTO contas_pagar (
      descricao,
      valor,
      data_vencimento,
      status,
      categoria_id,
      orcamento_id,
      fornecedor,
      observacoes,
      created_by_user_id
    ) VALUES (
      'Instalação - ' || NEW.codigo || ' (' || NEW.cliente_nome || ')',
      v_custo_instalacao,
      CURRENT_DATE + INTERVAL '45 days',
      'pendente',
      v_categoria_instalacao_id,
      NEW.id,
      'Instalador',
      'Custo gerado automaticamente do orçamento',
      NEW.created_by_user_id
    );
  END IF;

  -- Marcar que custos foram gerados
  NEW.custos_gerados := true;

  RETURN NEW;
END;
$function$;

-- Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_auto_criar_custos ON orcamentos;
CREATE TRIGGER trigger_auto_criar_custos
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION auto_criar_contas_pagar_custos();

-- Adicionar comentário explicativo
COMMENT ON FUNCTION auto_criar_contas_pagar_custos() IS 'Gera contas a pagar automaticamente quando orçamento muda para status de pagamento';


-- ============================================
-- Migration: 20260102142358_8b5c2d3e-b82a-4fb0-8d8c-77ec1f24f1fd.sql
-- ============================================

-- Adicionar campo vendedor_id na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN vendedor_id uuid REFERENCES auth.users(id);

-- Criar índice para performance
CREATE INDEX idx_orcamentos_vendedor_id ON public.orcamentos(vendedor_id);

-- Criar tabela de configurações de comissão por vendedor
CREATE TABLE public.configuracoes_comissao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_user_id uuid NOT NULL UNIQUE,
  vendedor_nome text NOT NULL,
  percentual_padrao numeric NOT NULL DEFAULT 5,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_comissao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver configurações de comissão"
ON public.configuracoes_comissao
FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem gerenciar configurações de comissão"
ON public.configuracoes_comissao
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_comissao_updated_at
BEFORE UPDATE ON public.configuracoes_comissao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- Migration: 20260102155021_108231fc-986c-4606-afd3-f33a8ec6acd3.sql
-- ============================================

-- Adicionar campos para ignorar lançamentos que não precisam conciliação
ALTER TABLE lancamentos_financeiros 
ADD COLUMN IF NOT EXISTS ignorado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_ignorado text DEFAULT NULL;

-- Índice para filtrar ignorados rapidamente
CREATE INDEX IF NOT EXISTS idx_lancamentos_ignorado ON lancamentos_financeiros(ignorado) WHERE ignorado = false;


-- ============================================
-- Migration: 20260102201915_5a14acf8-4248-4d6b-8cdd-b54462d7c2ec.sql
-- ============================================

-- Atualizar contas a receber onde a diferença é pequena (até R$ 5,00 E até 0.5% do total)
-- Isso corrige contas que deveriam estar marcadas como "pagas" mas ficaram como "parcial"

UPDATE contas_receber
SET status = 'pago'
WHERE status = 'parcial'
  AND valor_total > 0
  AND (valor_total - valor_pago) <= 5.00
  AND ((valor_total - valor_pago) / valor_total * 100) <= 0.5;


-- ============================================
-- Migration: 20260102203239_efa6b9a3-a832-4aa4-9ba2-26d80b44aab3.sql
-- ============================================

-- Cancelar contas a receber de orçamentos recusados/cancelados sem pagamentos
UPDATE contas_receber
SET 
  status = 'cancelado',
  observacoes = COALESCE(observacoes || E'\n', '') || '[Auto] Cancelado pois orçamento foi recusado/cancelado - ' || to_char(now(), 'DD/MM/YYYY HH24:MI')
WHERE orcamento_id IN (
  SELECT id FROM orcamentos 
  WHERE status IN ('recusado', 'cancelado')
)
AND valor_pago = 0
AND status NOT IN ('cancelado', 'pago');

-- Também cancelar as parcelas dessas contas
UPDATE parcelas_receber
SET 
  status = 'cancelado',
  observacoes = COALESCE(observacoes || E'\n', '') || '[Auto] Cancelado pois orçamento foi recusado/cancelado'
WHERE conta_receber_id IN (
  SELECT cr.id FROM contas_receber cr
  JOIN orcamentos o ON o.id = cr.orcamento_id
  WHERE o.status IN ('recusado', 'cancelado')
  AND cr.valor_pago = 0
)
AND status NOT IN ('cancelado', 'pago');


-- ============================================
-- Migration: 20260102203738_8b9955e7-24e7-479a-b599-a8bfc13c1cfe.sql
-- ============================================

-- Remover trigger que cria conta a receber no status "enviado"
DROP TRIGGER IF EXISTS trigger_auto_criar_conta_receber_enviado ON public.orcamentos;

-- Remover a função associada
DROP FUNCTION IF EXISTS public.auto_criar_conta_receber_enviado();

-- Adicionar comentário explicativo na função que deve permanecer
COMMENT ON FUNCTION public.auto_criar_conta_receber() IS 
  'Cria conta a receber automaticamente apenas quando orçamento atinge status de pagamento confirmado (pago_40, pago_parcial, pago_60, pago)';


-- ============================================
-- Migration: 20260102211659_e060dcf6-9c13-4f85-9535-047e482aa33f.sql
-- ============================================

-- Criar função para verificar e notificar pedidos atrasados ou próximos do vencimento
CREATE OR REPLACE FUNCTION public.verificar_atrasos_producao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido RECORD;
  v_dias_restantes INTEGER;
BEGIN
  -- Processar pedidos ativos (não entregues/cancelados)
  FOR v_pedido IN 
    SELECT 
      p.id,
      p.numero_pedido,
      p.previsao_entrega,
      p.created_by_user_id,
      o.cliente_nome
    FROM pedidos p
    JOIN orcamentos o ON p.orcamento_id = o.id
    WHERE p.status_producao NOT IN ('entregue', 'cancelado', 'pronto_instalacao', 'pronto_entrega')
    AND p.previsao_entrega IS NOT NULL
  LOOP
    v_dias_restantes := v_pedido.previsao_entrega - CURRENT_DATE;
    
    -- Pedido atrasado (passou da previsão)
    IF v_dias_restantes < 0 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_pedido.created_by_user_id,
        'pedido_atrasado',
        'Pedido em ATRASO',
        'O pedido ' || v_pedido.numero_pedido || ' de ' || v_pedido.cliente_nome || 
        ' está ' || ABS(v_dias_restantes) || ' dia(s) atrasado!',
        'urgente',
        'pedido',
        v_pedido.id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
      
    -- Pedido vence hoje
    ELSIF v_dias_restantes = 0 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_pedido.created_by_user_id,
        'pedido_vence_hoje',
        'Pedido vence HOJE',
        'O pedido ' || v_pedido.numero_pedido || ' de ' || v_pedido.cliente_nome || 
        ' tem previsão de entrega para hoje!',
        'urgente',
        'pedido',
        v_pedido.id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
      
    -- Pedido vence em 2 dias
    ELSIF v_dias_restantes <= 2 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_pedido.created_by_user_id,
        'pedido_prazo_curto',
        'Pedido com prazo curto',
        'O pedido ' || v_pedido.numero_pedido || ' de ' || v_pedido.cliente_nome || 
        ' vence em ' || v_dias_restantes || ' dia(s).',
        'alta',
        'pedido',
        v_pedido.id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Criar trigger que verifica itens parados na mesma etapa por muito tempo
CREATE OR REPLACE FUNCTION public.verificar_itens_parados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_dias_parado INTEGER;
BEGIN
  -- Buscar itens que não estão prontos e verificar última movimentação
  FOR v_item IN 
    SELECT 
      ip.id,
      ip.status_item,
      ip.updated_at,
      p.id as pedido_id,
      p.numero_pedido,
      p.created_by_user_id,
      ci.nome_identificacao,
      o.cliente_nome
    FROM itens_pedido ip
    JOIN pedidos p ON ip.pedido_id = p.id
    JOIN cortina_items ci ON ip.cortina_item_id = ci.id
    JOIN orcamentos o ON p.orcamento_id = o.id
    WHERE ip.status_item NOT IN ('pronto', 'fila')
    AND p.status_producao NOT IN ('entregue', 'cancelado')
  LOOP
    v_dias_parado := CURRENT_DATE - ip.updated_at::date;
    
    -- Item parado há mais de 3 dias úteis (considerando 5 dias para margem)
    IF v_dias_parado >= 5 THEN
      INSERT INTO notificacoes (
        user_id, tipo, titulo, mensagem, prioridade,
        referencia_tipo, referencia_id, data_lembrete
      ) VALUES (
        v_item.created_by_user_id,
        'item_parado',
        'Item parado há ' || v_dias_parado || ' dias',
        'O item "' || COALESCE(v_item.nome_identificacao, 'Sem nome') || '" do pedido ' || 
        v_item.numero_pedido || ' está na etapa "' || v_item.status_item || '" há ' || 
        v_dias_parado || ' dias. Possível gargalo!',
        CASE WHEN v_dias_parado >= 7 THEN 'urgente' ELSE 'alta' END,
        'pedido',
        v_item.pedido_id,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION public.verificar_atrasos_producao() IS 
  'Verifica pedidos atrasados ou próximos do vencimento e cria notificações. Deve ser chamada periodicamente via cron.';

COMMENT ON FUNCTION public.verificar_itens_parados() IS 
  'Verifica itens parados na mesma etapa por mais de 5 dias e cria notificações de possível gargalo.';


-- ============================================
-- Migration: 20260102212520_a25161da-7c38-4668-aaa0-2ceea532f0d7.sql
-- ============================================

-- ============================================
-- 1. Função para calcular previsão de entrega inteligente
-- ============================================
CREATE OR REPLACE FUNCTION public.calcular_previsao_entrega(p_orcamento_id uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_days INTEGER := 5;
  v_total_items INTEGER;
  v_motorizados INTEGER;
  v_fabricas INTEGER;
  v_carga_etapas INTEGER;
  v_dias_totais INTEGER;
BEGIN
  -- Contar itens do orçamento
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE motorizada = true),
    COUNT(*) FILTER (WHERE fabrica IS NOT NULL AND fabrica != '')
  INTO v_total_items, v_motorizados, v_fabricas
  FROM cortina_items
  WHERE orcamento_id = p_orcamento_id;

  -- Verificar carga atual nas etapas (itens não prontos em produção)
  SELECT COUNT(*)
  INTO v_carga_etapas
  FROM itens_pedido ip
  JOIN pedidos p ON ip.pedido_id = p.id
  WHERE ip.status_item NOT IN ('pronto', 'fila')
  AND p.status_producao NOT IN ('entregue', 'cancelado');

  -- Calcular dias totais
  v_dias_totais := v_base_days;
  v_dias_totais := v_dias_totais + (GREATEST(v_total_items - 1, 0) * 2); -- +2 por item adicional
  v_dias_totais := v_dias_totais + (v_motorizados * 3); -- +3 por motorizado
  v_dias_totais := v_dias_totais + (v_fabricas * 5); -- +5 por fábrica externa
  
  IF v_carga_etapas > 10 THEN
    v_dias_totais := v_dias_totais + 2; -- Carga alta nas etapas
  END IF;

  RETURN CURRENT_DATE + v_dias_totais;
END;
$$;

-- ============================================
-- 2. Atualizar trigger para usar previsão inteligente
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_create_pedido_from_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id UUID;
  v_numero_pedido TEXT;
  v_item RECORD;
  v_previsao_entrega DATE;
BEGIN
  -- Só processar se o status mudou para um dos status de pagamento
  IF NEW.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe pedido para este orçamento
  IF EXISTS (SELECT 1 FROM public.pedidos WHERE orcamento_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Gerar número do pedido
  v_numero_pedido := public.gerar_numero_pedido();
  
  -- Calcular previsão de entrega inteligente
  v_previsao_entrega := public.calcular_previsao_entrega(NEW.id);
  
  -- Criar o pedido
  INSERT INTO public.pedidos (
    orcamento_id,
    numero_pedido,
    status_producao,
    prioridade,
    previsao_entrega,
    observacoes_producao,
    created_by_user_id
  ) VALUES (
    NEW.id,
    v_numero_pedido,
    'aguardando_materiais',
    CASE 
      WHEN NEW.status = 'pago' THEN 'alta'
      WHEN NEW.status = 'pago_60' THEN 'normal'
      ELSE 'normal'
    END,
    v_previsao_entrega,
    'Pedido gerado automaticamente a partir do orçamento ' || NEW.codigo || '. Previsão calculada baseada em: itens, motorizados, fábrica externa e carga de produção.',
    NEW.created_by_user_id
  )
  RETURNING id INTO v_pedido_id;
  
  -- Criar itens do pedido a partir das cortinas do orçamento
  FOR v_item IN 
    SELECT id FROM public.cortina_items WHERE orcamento_id = NEW.id
  LOOP
    INSERT INTO public.itens_pedido (
      pedido_id,
      cortina_item_id,
      status_item
    ) VALUES (
      v_pedido_id,
      v_item.id,
      'fila'
    );
  END LOOP;
  
  -- Registrar no histórico
  INSERT INTO public.historico_producao (
    pedido_id,
    tipo_evento,
    status_novo,
    descricao,
    usuario_id,
    usuario_nome
  ) VALUES (
    v_pedido_id,
    'criacao',
    'aguardando_materiais',
    'Pedido criado automaticamente a partir do orçamento ' || NEW.codigo || ' (status: ' || NEW.status || '). Previsão: ' || v_previsao_entrega,
    NEW.created_by_user_id,
    (SELECT COALESCE(email, 'Sistema') FROM auth.users WHERE id = NEW.created_by_user_id)
  );
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 3. Tabela de materiais por pedido
-- ============================================
CREATE TABLE IF NOT EXISTS public.materiais_pedido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  material_id text NOT NULL,
  nome_material text NOT NULL,
  categoria text NOT NULL,
  quantidade_necessaria numeric NOT NULL DEFAULT 1,
  unidade text DEFAULT 'm',
  recebido boolean DEFAULT false,
  data_recebimento timestamp with time zone,
  recebido_por uuid,
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_materiais_pedido_pedido ON public.materiais_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_materiais_pedido_recebido ON public.materiais_pedido(recebido);

-- Habilitar RLS
ALTER TABLE public.materiais_pedido ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso para usuários autenticados via pedidos)
CREATE POLICY "Usuarios podem ver materiais de seus pedidos"
  ON public.materiais_pedido FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pedidos p
    JOIN orcamentos o ON o.id = p.orcamento_id
    WHERE p.id = materiais_pedido.pedido_id
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Usuarios podem inserir materiais em seus pedidos"
  ON public.materiais_pedido FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pedidos p
    JOIN orcamentos o ON o.id = p.orcamento_id
    WHERE p.id = materiais_pedido.pedido_id
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Usuarios podem atualizar materiais de seus pedidos"
  ON public.materiais_pedido FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM pedidos p
    JOIN orcamentos o ON o.id = p.orcamento_id
    WHERE p.id = materiais_pedido.pedido_id
    AND (o.created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Admins podem deletar materiais"
  ON public.materiais_pedido FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 4. Trigger para popular materiais automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.popular_materiais_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_material_nome TEXT;
BEGIN
  -- Para cada item da cortina do orçamento
  FOR v_item IN 
    SELECT ci.* 
    FROM cortina_items ci
    WHERE ci.orcamento_id = NEW.orcamento_id
  LOOP
    -- Tecido
    IF v_item.tecido_id IS NOT NULL AND v_item.tecido_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.tecido_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.tecido_id, COALESCE(v_material_nome, 'Tecido'), 'Tecido', 
              ROUND((v_item.largura * v_item.altura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm²')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Forro
    IF v_item.forro_id IS NOT NULL AND v_item.forro_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.forro_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.forro_id, COALESCE(v_material_nome, 'Forro'), 'Forro',
              ROUND((v_item.largura * v_item.altura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm²')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Trilho
    IF v_item.trilho_id IS NOT NULL AND v_item.trilho_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.trilho_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.trilho_id, COALESCE(v_material_nome, 'Trilho'), 'Trilho',
              ROUND((v_item.largura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Material principal (para persianas)
    IF v_item.material_principal_id IS NOT NULL AND v_item.material_principal_id != '' THEN
      SELECT nome INTO v_material_nome FROM materiais WHERE id::text = v_item.material_principal_id;
      INSERT INTO materiais_pedido (pedido_id, material_id, nome_material, categoria, quantidade_necessaria, unidade)
      VALUES (NEW.id, v_item.material_principal_id, COALESCE(v_material_nome, 'Persiana'), 'Persiana',
              ROUND((v_item.largura * v_item.altura * COALESCE(v_item.quantidade, 1))::numeric, 2), 'm²')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_popular_materiais_pedido ON public.pedidos;
CREATE TRIGGER trigger_popular_materiais_pedido
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.popular_materiais_pedido();

-- ============================================
-- 5. Trigger para verificar materiais completos e avançar status
-- ============================================
CREATE OR REPLACE FUNCTION public.verificar_materiais_completos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_todos_recebidos boolean;
  v_pedido_status text;
BEGIN
  -- Verificar status atual do pedido
  SELECT status_producao INTO v_pedido_status
  FROM pedidos WHERE id = NEW.pedido_id;
  
  -- Só processar se pedido está aguardando materiais
  IF v_pedido_status != 'aguardando_materiais' THEN
    RETURN NEW;
  END IF;

  -- Verificar se todos os materiais foram recebidos
  SELECT NOT EXISTS (
    SELECT 1 FROM materiais_pedido 
    WHERE pedido_id = NEW.pedido_id AND recebido = false
  ) INTO v_todos_recebidos;
  
  -- Se todos recebidos, mudar status para em_producao
  IF v_todos_recebidos THEN
    UPDATE pedidos
    SET status_producao = 'em_producao',
        updated_at = NOW()
    WHERE id = NEW.pedido_id;
    
    -- Registrar no histórico
    INSERT INTO historico_producao (
      pedido_id,
      tipo_evento,
      status_anterior,
      status_novo,
      descricao,
      usuario_id,
      usuario_nome
    ) VALUES (
      NEW.pedido_id,
      'mudanca_status',
      'aguardando_materiais',
      'em_producao',
      'Status alterado automaticamente: todos os materiais foram recebidos',
      COALESCE(NEW.recebido_por, auth.uid()),
      COALESCE((SELECT email FROM auth.users WHERE id = COALESCE(NEW.recebido_por, auth.uid())), 'Sistema')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_verificar_materiais_completos ON public.materiais_pedido;
CREATE TRIGGER trigger_verificar_materiais_completos
  AFTER UPDATE OF recebido ON public.materiais_pedido
  FOR EACH ROW
  WHEN (NEW.recebido = true AND OLD.recebido = false)
  EXECUTE FUNCTION public.verificar_materiais_completos();


-- ============================================
-- Migration: 20260105174653_b1c524c5-a072-446c-92f2-1f706e870da0.sql
-- ============================================

-- Tabela para persistir estado de onboarding por usuário
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  completed_tours TEXT[] DEFAULT '{}',
  skipped BOOLEAN DEFAULT FALSE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own onboarding"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- Migration: 20260107152141_47337395-e4d5-42c5-b9d7-c11461fd40f0.sql
-- ============================================

-- Função para cancelar pedido automaticamente quando orçamento é recusado/cancelado
CREATE OR REPLACE FUNCTION public.auto_cancel_pedido_on_orcamento_recusado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('recusado', 'cancelado') 
     AND OLD.status NOT IN ('recusado', 'cancelado') THEN
    
    -- Cancelar pedidos ativos
    UPDATE public.pedidos
    SET status_producao = 'cancelado',
        observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
          '[Auto] Cancelado - Orçamento ' || NEW.status || ' em ' || to_char(now(), 'DD/MM/YYYY'),
        updated_at = now()
    WHERE orcamento_id = NEW.id
    AND status_producao NOT IN ('entregue', 'cancelado');
    
    -- Cancelar instalações agendadas
    UPDATE public.instalacoes
    SET status = 'cancelada',
        updated_at = now()
    WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE orcamento_id = NEW.id)
    AND status NOT IN ('concluida', 'cancelada');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
CREATE TRIGGER trigger_cancel_pedido_on_orcamento_recusado
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.auto_cancel_pedido_on_orcamento_recusado();

-- Corrigir pedidos existentes de orçamentos já recusados/cancelados
UPDATE public.pedidos
SET status_producao = 'cancelado',
    observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
      '[Correção] Cancelado - Orçamento já estava recusado/cancelado - ' || to_char(now(), 'DD/MM/YYYY'),
    updated_at = now()
WHERE orcamento_id IN (
  SELECT id FROM public.orcamentos WHERE status IN ('recusado', 'cancelado')
)
AND status_producao NOT IN ('entregue', 'cancelado');


-- ============================================
-- Migration: 20260107152500_b9b93a6e-e068-4869-b851-1cc1c0de2e42.sql
-- ============================================

-- Atualizar função para cancelar pedido quando orçamento sai de status de pagamento
CREATE OR REPLACE FUNCTION public.auto_cancel_pedido_on_orcamento_recusado()
RETURNS TRIGGER AS $$
DECLARE
  v_status_com_pagamento text[] := ARRAY['pago_40', 'pago_parcial', 'pago_60', 'pago'];
  v_status_sem_producao text[] := ARRAY['rascunho', 'finalizado', 'enviado', 'sem_resposta', 'recusado', 'cancelado'];
BEGIN
  -- Cancelar se status novo indica que não deve ter produção E status anterior era de pagamento
  IF NEW.status = ANY(v_status_sem_producao) 
     AND OLD.status = ANY(v_status_com_pagamento) THEN
    
    -- Cancelar pedidos ativos (não entregues ou já cancelados)
    UPDATE public.pedidos
    SET status_producao = 'cancelado',
        observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
          '[Auto] Cancelado - Orçamento alterado para ' || NEW.status || ' em ' || to_char(now(), 'DD/MM/YYYY'),
        updated_at = now()
    WHERE orcamento_id = NEW.id
    AND status_producao NOT IN ('entregue', 'cancelado');
    
    -- Cancelar instalações pendentes
    UPDATE public.instalacoes
    SET status = 'cancelada',
        updated_at = now()
    WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE orcamento_id = NEW.id)
    AND status NOT IN ('concluida', 'cancelada');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corrigir pedidos de orçamentos que não estão em status de pagamento
UPDATE public.pedidos
SET status_producao = 'cancelado',
    observacoes_producao = COALESCE(observacoes_producao || E'\n', '') || 
      '[Correção] Cancelado - Status do orçamento incompatível - ' || to_char(now(), 'DD/MM/YYYY'),
    updated_at = now()
WHERE orcamento_id IN (
  SELECT id FROM public.orcamentos 
  WHERE status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago')
)
AND status_producao NOT IN ('entregue', 'cancelado');


-- ============================================
-- Migration: 20260107153526_af5059c4-c421-4dab-889d-5aceb4413ec6.sql
-- ============================================

-- 1. Atualizar trigger create_atividade_from_orcamento_status para:
--    - Evitar duplicatas (verificar se já existe atividade recente)
--    - Adicionar tratamento para status pago_40, pago_60, pago_parcial

CREATE OR REPLACE FUNCTION public.create_atividade_from_orcamento_status()
RETURNS TRIGGER AS $$
DECLARE
  v_contato_id uuid;
  v_atividade_existente uuid;
  v_titulo text;
  v_descricao text;
  v_tipo text;
BEGIN
  -- Só processar se o status mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  v_contato_id := NEW.contato_id;
  
  -- Verificar se já existe atividade similar nos últimos 5 minutos para evitar duplicatas
  SELECT id INTO v_atividade_existente
  FROM atividades_crm
  WHERE orcamento_id = NEW.id
  AND data_atividade > NOW() - INTERVAL '5 minutes'
  AND titulo LIKE '%' || NEW.status || '%'
  LIMIT 1;
  
  IF v_atividade_existente IS NOT NULL THEN
    RETURN NEW; -- Evitar duplicata
  END IF;
  
  -- Se status mudou para 'enviado', criar atividade de proposta enviada
  IF NEW.status = 'enviado' AND OLD.status != 'enviado' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Proposta enviada - ' || NEW.codigo,
      'email',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' enviado para ' || NEW.cliente_nome || '. Valor: R$ ' || COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'sem_resposta', criar atividade de follow-up pendente
  IF NEW.status = 'sem_resposta' AND OLD.status != 'sem_resposta' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      data_lembrete,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Follow-up: ' || NEW.codigo,
      'ligacao',
      v_contato_id,
      NEW.id,
      NOW() + INTERVAL '3 days',
      NOW() + INTERVAL '3 days',
      'Ligar para cliente sobre orçamento ' || NEW.codigo || ' que está sem resposta.',
      false,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago_40', criar atividade de marco
  IF NEW.status = 'pago_40' AND OLD.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Marco 40% - ' || NEW.codigo,
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' atingiu 40% de pagamento. Cliente: ' || NEW.cliente_nome || '. Produção pode ser iniciada.',
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago_parcial', criar atividade
  IF NEW.status = 'pago_parcial' AND OLD.status NOT IN ('pago_parcial', 'pago_60', 'pago') THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Pagamento parcial - ' || NEW.codigo,
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' recebeu pagamento parcial. Cliente: ' || NEW.cliente_nome,
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago_60', criar atividade de marco
  IF NEW.status = 'pago_60' AND OLD.status NOT IN ('pago_60', 'pago') THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Marco 60% - ' || NEW.codigo,
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' atingiu 60% de pagamento. Cliente: ' || NEW.cliente_nome || '. Instalação liberada.',
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'pago', criar atividade de fechamento
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Venda fechada - ' || NEW.codigo,
      'pagamento',
      v_contato_id,
      NEW.id,
      NOW(),
      'Orçamento ' || NEW.codigo || ' foi TOTALMENTE PAGO. Valor: R$ ' || COALESCE(NEW.total_com_desconto, NEW.total_geral, 0) || '. Cliente: ' || NEW.cliente_nome,
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  -- Se status mudou para 'recusado', criar atividade
  IF NEW.status = 'recusado' AND OLD.status != 'recusado' THEN
    INSERT INTO atividades_crm (
      titulo,
      tipo,
      contato_id,
      orcamento_id,
      data_atividade,
      descricao,
      concluida,
      created_by_user_id
    ) VALUES (
      'Proposta recusada - ' || NEW.codigo,
      'outro',
      v_contato_id,
      NEW.id,
      NOW(),
      'O cliente ' || NEW.cliente_nome || ' recusou o orçamento ' || NEW.codigo || '.',
      true,
      NEW.created_by_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================
-- Migration: 20260107190857_4b993496-ee9d-46de-8b23-3b8469c39b65.sql
-- ============================================

-- =====================================================
-- FASE 1: ESTRUTURA DE ORGANIZAÇÕES
-- =====================================================

-- 1.1 Criar tabela organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Criar tabela organization_members
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 1.3 Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 1.4 Criar função helper para obter organização do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 1.5 RLS para organizations (usuários veem apenas sua org)
CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = public.get_user_organization_id());

CREATE POLICY "Owners can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (id = public.get_user_organization_id())
WITH CHECK (id = public.get_user_organization_id());

-- 1.6 RLS para organization_members
CREATE POLICY "Users can view members of their organization"
ON public.organization_members
FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Owners can manage members"
ON public.organization_members
FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);

-- 1.7 Trigger para updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- Migration: 20260107191015_b3f2e555-a9e8-40b4-88c0-9aaeff8911fb.sql
-- ============================================

-- =====================================================
-- FASE 2: ADICIONAR organization_id ÀS TABELAS TRANSACIONAIS
-- =====================================================

-- 2.1 Adicionar coluna organization_id às tabelas principais
ALTER TABLE public.orcamentos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contatos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.pedidos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.oportunidades ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.atividades_crm ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contas_receber ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contas_pagar ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.lancamentos_financeiros ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.comissoes ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.solicitacoes_visita ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.notificacoes ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 2.2 Criar índices para performance
CREATE INDEX idx_orcamentos_org ON public.orcamentos(organization_id);
CREATE INDEX idx_contatos_org ON public.contatos(organization_id);
CREATE INDEX idx_pedidos_org ON public.pedidos(organization_id);
CREATE INDEX idx_oportunidades_org ON public.oportunidades(organization_id);
CREATE INDEX idx_atividades_crm_org ON public.atividades_crm(organization_id);
CREATE INDEX idx_contas_receber_org ON public.contas_receber(organization_id);
CREATE INDEX idx_contas_pagar_org ON public.contas_pagar(organization_id);
CREATE INDEX idx_lancamentos_org ON public.lancamentos_financeiros(organization_id);

-- =====================================================
-- FASE 2.3: ATUALIZAR RLS POLICIES PARA MULTI-TENANT
-- =====================================================

-- ORCAMENTOS: Drop existing policies and create new ones
DROP POLICY IF EXISTS "Users can view own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can create orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can update own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can delete own orcamentos" ON public.orcamentos;

CREATE POLICY "Org users can view orcamentos" ON public.orcamentos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create orcamentos" ON public.orcamentos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update orcamentos" ON public.orcamentos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete orcamentos" ON public.orcamentos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- CONTATOS: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can create contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can update own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can delete own contatos" ON public.contatos;

CREATE POLICY "Org users can view contatos" ON public.contatos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create contatos" ON public.contatos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update contatos" ON public.contatos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete contatos" ON public.contatos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- PEDIDOS: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can create pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can update own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can delete own pedidos" ON public.pedidos;

CREATE POLICY "Org users can view pedidos" ON public.pedidos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create pedidos" ON public.pedidos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update pedidos" ON public.pedidos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete pedidos" ON public.pedidos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- OPORTUNIDADES: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can create oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can update own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can delete own oportunidades" ON public.oportunidades;

CREATE POLICY "Org users can view oportunidades" ON public.oportunidades
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create oportunidades" ON public.oportunidades
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update oportunidades" ON public.oportunidades
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete oportunidades" ON public.oportunidades
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- ATIVIDADES_CRM: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own atividades" ON public.atividades_crm;
DROP POLICY IF EXISTS "Users can create atividades" ON public.atividades_crm;
DROP POLICY IF EXISTS "Users can update own atividades" ON public.atividades_crm;
DROP POLICY IF EXISTS "Users can delete own atividades" ON public.atividades_crm;

CREATE POLICY "Org users can view atividades_crm" ON public.atividades_crm
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create atividades_crm" ON public.atividades_crm
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update atividades_crm" ON public.atividades_crm
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete atividades_crm" ON public.atividades_crm
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- CONTAS_RECEBER: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can create contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can update own contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can delete own contas_receber" ON public.contas_receber;

CREATE POLICY "Org users can view contas_receber" ON public.contas_receber
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create contas_receber" ON public.contas_receber
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update contas_receber" ON public.contas_receber
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete contas_receber" ON public.contas_receber
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- CONTAS_PAGAR: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can create contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can update own contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can delete own contas_pagar" ON public.contas_pagar;

CREATE POLICY "Org users can view contas_pagar" ON public.contas_pagar
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create contas_pagar" ON public.contas_pagar
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update contas_pagar" ON public.contas_pagar
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete contas_pagar" ON public.contas_pagar
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- LANCAMENTOS_FINANCEIROS: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Users can create lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Users can update own lancamentos" ON public.lancamentos_financeiros;
DROP POLICY IF EXISTS "Users can delete own lancamentos" ON public.lancamentos_financeiros;

CREATE POLICY "Org users can view lancamentos" ON public.lancamentos_financeiros
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create lancamentos" ON public.lancamentos_financeiros
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update lancamentos" ON public.lancamentos_financeiros
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can delete lancamentos" ON public.lancamentos_financeiros
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- COMISSOES: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view own comissoes" ON public.comissoes;
DROP POLICY IF EXISTS "Users can create comissoes" ON public.comissoes;
DROP POLICY IF EXISTS "Users can update own comissoes" ON public.comissoes;

CREATE POLICY "Org users can view comissoes" ON public.comissoes
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can create comissoes" ON public.comissoes
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update comissoes" ON public.comissoes
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

-- SOLICITACOES_VISITA: Multi-tenant policies
DROP POLICY IF EXISTS "Users can view solicitacoes" ON public.solicitacoes_visita;
DROP POLICY IF EXISTS "Users can update solicitacoes" ON public.solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacao" ON public.solicitacoes_visita;

CREATE POLICY "Org users can view solicitacoes_visita" ON public.solicitacoes_visita
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org users can update solicitacoes_visita" ON public.solicitacoes_visita
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Anyone can create solicitacao_visita" ON public.solicitacoes_visita
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- NOTIFICACOES: Multi-tenant policies (user-specific + org)
DROP POLICY IF EXISTS "Users can view own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can update own notificacoes" ON public.notificacoes;

CREATE POLICY "Users can view own notificacoes" ON public.notificacoes
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (organization_id = public.get_user_organization_id() OR organization_id IS NULL));

CREATE POLICY "Users can update own notificacoes" ON public.notificacoes
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (organization_id = public.get_user_organization_id() OR organization_id IS NULL));


-- ============================================
-- Migration: 20260107191415_30e5606b-81eb-426d-a0e8-aa20a9a2bff1.sql
-- ============================================

-- =====================================================
-- FASE 3: TRIGGER PARA AUTO-PREENCHER organization_id
-- =====================================================

-- Função para auto-preencher organization_id baseado no created_by_user_id
CREATE OR REPLACE FUNCTION public.auto_set_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se organization_id já está preenchido, manter
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Tentar obter organization_id do usuário
  SELECT organization_id INTO NEW.organization_id
  FROM organization_members
  WHERE user_id = COALESCE(NEW.created_by_user_id, auth.uid())
  LIMIT 1;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger em todas as tabelas transacionais
CREATE TRIGGER auto_set_org_orcamentos BEFORE INSERT ON public.orcamentos
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_contatos BEFORE INSERT ON public.contatos
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_pedidos BEFORE INSERT ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_oportunidades BEFORE INSERT ON public.oportunidades
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_atividades BEFORE INSERT ON public.atividades_crm
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_contas_receber BEFORE INSERT ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_contas_pagar BEFORE INSERT ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_lancamentos BEFORE INSERT ON public.lancamentos_financeiros
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_comissoes BEFORE INSERT ON public.comissoes
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER auto_set_org_notificacoes BEFORE INSERT ON public.notificacoes
FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();


-- ============================================
-- Migration: 20260107191719_63b6113b-4b68-4e7e-934a-d95d408db834.sql
-- ============================================

-- =====================================================
-- FASE 1: ADICIONAR CAMPOS COMERCIAIS NA TABELA ORGANIZATIONS
-- =====================================================

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Preencher dados iniciais da Prisma
UPDATE public.organizations SET
  email = 'prisma@prismadecor.com.br',
  phone = '(47) 99262-4706',
  whatsapp = '(47) 99262-4706',
  website = 'www.prismadecor.com.br',
  tagline = 'Transformando ambientes em experiências únicas'
WHERE slug = 'prisma';

-- =====================================================
-- FASE 2: CRIAR BUCKET PARA LOGOS DAS ORGANIZAÇÕES
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Qualquer um pode ver assets públicos
CREATE POLICY "Anyone can view organization assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-assets');

-- Política: Membros podem fazer upload para sua organização
CREATE POLICY "Members can upload organization assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = (
    SELECT om.organization_id::text
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    LIMIT 1
  )
);

-- Política: Membros podem atualizar assets da sua organização
CREATE POLICY "Members can update organization assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = (
    SELECT om.organization_id::text
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    LIMIT 1
  )
);

-- Política: Admins podem deletar assets da organização
CREATE POLICY "Admins can delete organization assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);


-- ============================================
-- Migration: 20260107192547_967fa728-acd9-45d0-bbda-c32703ee534e.sql
-- ============================================

-- =============================================
-- FASE 1: Remover políticas RLS duplicadas (antigas baseadas em created_by_user_id)
-- =============================================

-- Orçamentos - manter apenas políticas baseadas em organization_id
DROP POLICY IF EXISTS "Usuários podem ver seus orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Usuários podem deletar seus orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Usuários podem criar orçamentos" ON orcamentos;

-- Contatos - manter apenas políticas baseadas em organization_id
DROP POLICY IF EXISTS "Usuários podem ver seus contatos" ON contatos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus contatos" ON contatos;
DROP POLICY IF EXISTS "Usuários podem deletar seus contatos" ON contatos;
DROP POLICY IF EXISTS "Usuários podem criar contatos" ON contatos;

-- Contas a Receber
DROP POLICY IF EXISTS "Usuários podem ver suas contas a receber" ON contas_receber;
DROP POLICY IF EXISTS "Usuários podem atualizar suas contas a receber" ON contas_receber;
DROP POLICY IF EXISTS "Usuários podem criar contas a receber" ON contas_receber;

-- Contas a Pagar
DROP POLICY IF EXISTS "Usuários podem ver suas contas a pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Usuários podem atualizar suas contas a pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Usuários podem criar contas a pagar" ON contas_pagar;

-- Lançamentos Financeiros
DROP POLICY IF EXISTS "Usuários podem ver seus lançamentos" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Usuários podem atualizar seus lançamentos" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Usuários podem criar lançamentos" ON lancamentos_financeiros;

-- Oportunidades
DROP POLICY IF EXISTS "Usuários podem ver oportunidades que criaram" ON oportunidades;
DROP POLICY IF EXISTS "Usuários podem atualizar suas oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuários podem criar oportunidades" ON oportunidades;

-- Atividades CRM
DROP POLICY IF EXISTS "Usuários podem ver atividades que criaram" ON atividades_crm;
DROP POLICY IF EXISTS "Usuários podem atualizar suas atividades" ON atividades_crm;
DROP POLICY IF EXISTS "Usuários podem criar atividades" ON atividades_crm;

-- Comissões
DROP POLICY IF EXISTS "Usuários podem ver comissões relacionadas a eles" ON comissoes;
DROP POLICY IF EXISTS "Usuários podem criar comissões" ON comissoes;

-- Pedidos
DROP POLICY IF EXISTS "Usuários podem ver pedidos de seus orçamentos" ON pedidos;
DROP POLICY IF EXISTS "Usuários podem atualizar pedidos de seus orçamentos" ON pedidos;
DROP POLICY IF EXISTS "Usuários podem criar pedidos de seus orçamentos" ON pedidos;

-- Notificações
DROP POLICY IF EXISTS "Users can view their own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can create notifications" ON notificacoes;

-- =============================================
-- FASE 2: Adicionar organization_id nas tabelas de configuração
-- =============================================

-- 2.1 Adicionar coluna organization_id em configuracoes_sistema
ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2.2 Adicionar coluna organization_id em categorias_financeiras
ALTER TABLE categorias_financeiras 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2.3 Adicionar coluna organization_id em formas_pagamento
ALTER TABLE formas_pagamento 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- =============================================
-- FASE 2.4: Atualizar RLS para tabelas de configuração
-- =============================================

-- Configurações Sistema - políticas por organização
DROP POLICY IF EXISTS "Authenticated users can view configs" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Only admins can modify configs" ON configuracoes_sistema;

CREATE POLICY "Org users can view their configs" 
ON configuracoes_sistema FOR SELECT 
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org admins can manage their configs" 
ON configuracoes_sistema FOR ALL 
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- Categorias Financeiras - políticas por organização
DROP POLICY IF EXISTS "Usuários autenticados podem ver categorias" ON categorias_financeiras;
DROP POLICY IF EXISTS "Apenas admins podem gerenciar categorias" ON categorias_financeiras;

CREATE POLICY "Org users can view their categories" 
ON categorias_financeiras FOR SELECT 
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org admins can manage their categories" 
ON categorias_financeiras FOR ALL 
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- Formas de Pagamento - políticas por organização
DROP POLICY IF EXISTS "Usuários autenticados podem ver formas" ON formas_pagamento;
DROP POLICY IF EXISTS "Apenas admins podem gerenciar formas" ON formas_pagamento;

CREATE POLICY "Org users can view their payment methods" 
ON formas_pagamento FOR SELECT 
USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Org admins can manage their payment methods" 
ON formas_pagamento FOR ALL 
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- =============================================
-- FASE 2.5: Migrar dados existentes para Prisma
-- =============================================

-- Atribuir configurações existentes à organização Prisma
UPDATE configuracoes_sistema 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
WHERE organization_id IS NULL;

-- Atribuir categorias existentes à organização Prisma
UPDATE categorias_financeiras 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
WHERE organization_id IS NULL;

-- Atribuir formas de pagamento existentes à organização Prisma
UPDATE formas_pagamento 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
WHERE organization_id IS NULL;

-- =============================================
-- FASE 2.6: Criar configurações padrão para Andreia Weber
-- =============================================

-- Clonar configurações do sistema
INSERT INTO configuracoes_sistema (chave, valor, descricao, organization_id)
SELECT chave, valor, descricao, (SELECT id FROM organizations WHERE slug = 'andreia-weber' LIMIT 1)
FROM configuracoes_sistema
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Clonar categorias financeiras
INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo, organization_id)
SELECT nome, tipo, cor, icone, ativo, (SELECT id FROM organizations WHERE slug = 'andreia-weber' LIMIT 1)
FROM categorias_financeiras
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Clonar formas de pagamento
INSERT INTO formas_pagamento (nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, organization_id)
SELECT nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, (SELECT id FROM organizations WHERE slug = 'andreia-weber' LIMIT 1)
FROM formas_pagamento
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'prisma' LIMIT 1)
ON CONFLICT DO NOTHING;

-- =============================================
-- FASE 2.7: Preencher dados comerciais da Andreia
-- =============================================

UPDATE organizations SET
  email = 'andreiawebermartins@outlook.com',
  tagline = 'Decoração com Estilo e Elegância',
  primary_color = '#D4AF37'
WHERE slug = 'andreia-weber';


-- ============================================
-- Migration: 20260107193508_2559f4a6-5cfa-48bd-8cdd-948e0d623076.sql
-- ============================================

-- Trigger preventivo: cria conta a receber automaticamente quando o status do orçamento muda para pagamento
-- e ainda não existe conta a receber vinculada

CREATE OR REPLACE FUNCTION public.ensure_conta_receber_on_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_status_com_pagamento text[] := ARRAY['pago_40', 'pago_parcial', 'pago_60', 'pago'];
  v_status_anteriores_sem_pagamento text[] := ARRAY['rascunho', 'enviado', 'vencido'];
BEGIN
  -- Só executa se:
  -- 1. O status mudou para um status de pagamento
  -- 2. O status anterior NÃO era um status de pagamento
  -- 3. Não existe conta a receber para este orçamento
  IF NEW.status = ANY(v_status_com_pagamento) 
     AND (OLD.status IS NULL OR OLD.status = ANY(v_status_anteriores_sem_pagamento))
     AND NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE orcamento_id = NEW.id) THEN
    
    -- Criar conta a receber automaticamente com 1 parcela
    INSERT INTO public.contas_receber (
      orcamento_id, 
      cliente_nome, 
      cliente_telefone,
      valor_total, 
      valor_pago, 
      numero_parcelas,
      status, 
      data_vencimento, 
      descricao, 
      organization_id,
      created_by_user_id
    ) VALUES (
      NEW.id, 
      NEW.cliente_nome,
      NEW.cliente_telefone,
      COALESCE(NEW.total_com_desconto, NEW.total_geral, 0),
      0,
      1,
      'pendente',
      (CURRENT_DATE + INTERVAL '30 days'),
      'Conta criada automaticamente - ' || NEW.codigo,
      NEW.organization_id,
      NEW.created_by_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_ensure_conta_receber ON public.orcamentos;

-- Criar trigger
CREATE TRIGGER trigger_ensure_conta_receber
AFTER UPDATE OF status ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_conta_receber_on_payment_status();

-- Comentário explicativo
COMMENT ON FUNCTION public.ensure_conta_receber_on_payment_status() IS 
'Garante que todo orçamento com status de pagamento tenha uma conta a receber associada. Previne inconsistências entre módulos.';


-- ============================================
-- Migration: 20260107230014_853a631f-5242-404d-bca2-043d6f29e1fd.sql
-- ============================================

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


-- ============================================
-- Migration: 20260107232229_a825e4cc-125b-4542-b411-c185a749534c.sql
-- ============================================

-- 1. Remover policy RLS duplicada em solicitacoes_visita
DROP POLICY IF EXISTS "Anyone can create solicitacao_visita" ON public.solicitacoes_visita;

-- 2. Criar trigger para atualizar valor_total_gasto em contatos quando orçamentos são pagos
CREATE OR REPLACE FUNCTION public.atualizar_valor_total_gasto_contato()
RETURNS TRIGGER AS $$
DECLARE
  v_contato_id UUID;
  v_total NUMERIC;
BEGIN
  -- Buscar o contato_id do orçamento relacionado à conta receber
  SELECT o.contato_id INTO v_contato_id
  FROM contas_receber cr
  JOIN orcamentos o ON o.id = cr.orcamento_id
  WHERE cr.id = COALESCE(NEW.id, OLD.id);
  
  -- Se não encontrou contato, retorna
  IF v_contato_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calcular total pago de todos os orçamentos do contato
  SELECT COALESCE(SUM(cr.valor_pago), 0) INTO v_total
  FROM contas_receber cr
  JOIN orcamentos o ON o.id = cr.orcamento_id
  WHERE o.contato_id = v_contato_id;
  
  -- Atualizar o campo valor_total_gasto no contato
  UPDATE contatos
  SET valor_total_gasto = v_total,
      updated_at = NOW()
  WHERE id = v_contato_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_atualizar_valor_total_gasto ON public.contas_receber;
CREATE TRIGGER trg_atualizar_valor_total_gasto
  AFTER INSERT OR UPDATE OF valor_pago OR DELETE
  ON public.contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_valor_total_gasto_contato();

-- 3. Corrigir itens com preco_venda = 0 aplicando margem correta
UPDATE cortina_items
SET preco_venda = ROUND(custo_total * 1.5, 2), -- Aplica margem de 50%
    updated_at = NOW()
WHERE (preco_venda = 0 OR preco_venda IS NULL)
  AND custo_total > 0;


-- ============================================
-- Migration: 20260108043644_be410ae7-9351-4178-9a62-6564f569f660.sql
-- ============================================

-- 1. Atualizar solicitações existentes para Prisma
UPDATE solicitacoes_visita 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

-- 2. Remover políticas com brecha de segurança
DROP POLICY IF EXISTS "Org users can view solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can update solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create visit requests" ON solicitacoes_visita;

-- 3. Criar políticas mais restritivas (sem OR organization_id IS NULL)
CREATE POLICY "Org members view own solicitacoes" ON solicitacoes_visita
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org members update own solicitacoes" ON solicitacoes_visita
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- 4. Política para inserção pública (edge function usa service role, mas manter para segurança)
CREATE POLICY "Public can create visit requests" ON solicitacoes_visita
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);


-- ============================================
-- Migration: 20260108044011_b785f233-5e6a-454e-98e5-f1c21217b942.sql
-- ============================================

-- 1. Corrigir função get_user_organization_id com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 2. Remover políticas problemáticas de organization_members
DROP POLICY IF EXISTS "Users can view members of their organization" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;

-- 3. Criar políticas que não causam recursão (usando auth.uid() diretamente)
CREATE POLICY "Users can view own membership" 
ON organization_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view org members same org" 
ON organization_members FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om 
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can manage members" 
ON organization_members FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);


-- ============================================
-- Migration: 20260108044250_857f3ab7-fbc5-4ce3-bb92-5ef35782df4e.sql
-- ============================================

-- =====================================================
-- FASE 1: MIGRAR REGISTROS ÓRFÃOS PARA PRISMA
-- =====================================================

-- Atualizar todos os registros sem organization_id para Prisma (ID fixo)
UPDATE atividades_crm SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE categorias_financeiras SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE comissoes SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE configuracoes_sistema SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE contas_pagar SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE contas_receber SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE contatos SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE formas_pagamento SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE lancamentos_financeiros SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE notificacoes SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE oportunidades SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE orcamentos SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE pedidos SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;
UPDATE solicitacoes_visita SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;

-- =====================================================
-- FASE 2: RECRIAR POLÍTICAS RLS SEM CLÁUSULA NULL
-- =====================================================

-- ATIVIDADES_CRM
DROP POLICY IF EXISTS "Org users can view atividades_crm" ON atividades_crm;
DROP POLICY IF EXISTS "Org users can create atividades_crm" ON atividades_crm;
DROP POLICY IF EXISTS "Org users can update atividades_crm" ON atividades_crm;
DROP POLICY IF EXISTS "Org users can delete atividades_crm" ON atividades_crm;

CREATE POLICY "Org users can view atividades_crm" ON atividades_crm
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create atividades_crm" ON atividades_crm
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update atividades_crm" ON atividades_crm
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete atividades_crm" ON atividades_crm
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CATEGORIAS_FINANCEIRAS
DROP POLICY IF EXISTS "Org users can view categorias_financeiras" ON categorias_financeiras;
DROP POLICY IF EXISTS "Org users can manage categorias_financeiras" ON categorias_financeiras;

CREATE POLICY "Org users can view categorias_financeiras" ON categorias_financeiras
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can manage categorias_financeiras" ON categorias_financeiras
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- COMISSOES
DROP POLICY IF EXISTS "Org users can view comissoes" ON comissoes;
DROP POLICY IF EXISTS "Org users can create comissoes" ON comissoes;
DROP POLICY IF EXISTS "Org users can update comissoes" ON comissoes;

CREATE POLICY "Org users can view comissoes" ON comissoes
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create comissoes" ON comissoes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update comissoes" ON comissoes
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CONFIGURACOES_SISTEMA
DROP POLICY IF EXISTS "Org users can view configuracoes_sistema" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Org users can manage configuracoes_sistema" ON configuracoes_sistema;

CREATE POLICY "Org users can view configuracoes_sistema" ON configuracoes_sistema
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can manage configuracoes_sistema" ON configuracoes_sistema
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- CONTAS_PAGAR
DROP POLICY IF EXISTS "Org users can view contas_pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Org users can create contas_pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Org users can update contas_pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Org users can delete contas_pagar" ON contas_pagar;

CREATE POLICY "Org users can view contas_pagar" ON contas_pagar
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create contas_pagar" ON contas_pagar
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update contas_pagar" ON contas_pagar
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete contas_pagar" ON contas_pagar
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CONTAS_RECEBER
DROP POLICY IF EXISTS "Org users can view contas_receber" ON contas_receber;
DROP POLICY IF EXISTS "Org users can create contas_receber" ON contas_receber;
DROP POLICY IF EXISTS "Org users can update contas_receber" ON contas_receber;
DROP POLICY IF EXISTS "Org users can delete contas_receber" ON contas_receber;

CREATE POLICY "Org users can view contas_receber" ON contas_receber
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create contas_receber" ON contas_receber
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update contas_receber" ON contas_receber
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete contas_receber" ON contas_receber
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- CONTATOS
DROP POLICY IF EXISTS "Org users can view contatos" ON contatos;
DROP POLICY IF EXISTS "Org users can create contatos" ON contatos;
DROP POLICY IF EXISTS "Org users can update contatos" ON contatos;
DROP POLICY IF EXISTS "Org users can delete contatos" ON contatos;

CREATE POLICY "Org users can view contatos" ON contatos
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create contatos" ON contatos
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update contatos" ON contatos
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete contatos" ON contatos
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- FORMAS_PAGAMENTO
DROP POLICY IF EXISTS "Org users can view formas_pagamento" ON formas_pagamento;
DROP POLICY IF EXISTS "Org users can manage formas_pagamento" ON formas_pagamento;

CREATE POLICY "Org users can view formas_pagamento" ON formas_pagamento
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can manage formas_pagamento" ON formas_pagamento
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- LANCAMENTOS_FINANCEIROS
DROP POLICY IF EXISTS "Org users can view lancamentos_financeiros" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Org users can create lancamentos_financeiros" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Org users can update lancamentos_financeiros" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "Org users can delete lancamentos_financeiros" ON lancamentos_financeiros;

CREATE POLICY "Org users can view lancamentos_financeiros" ON lancamentos_financeiros
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create lancamentos_financeiros" ON lancamentos_financeiros
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update lancamentos_financeiros" ON lancamentos_financeiros
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete lancamentos_financeiros" ON lancamentos_financeiros
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- NOTIFICACOES
DROP POLICY IF EXISTS "Org users can view notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Org users can create notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Org users can update notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Org users can delete notificacoes" ON notificacoes;

CREATE POLICY "Org users can view notificacoes" ON notificacoes
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create notificacoes" ON notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update notificacoes" ON notificacoes
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete notificacoes" ON notificacoes
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- OPORTUNIDADES
DROP POLICY IF EXISTS "Org users can view oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Org users can create oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Org users can update oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Org users can delete oportunidades" ON oportunidades;

CREATE POLICY "Org users can view oportunidades" ON oportunidades
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create oportunidades" ON oportunidades
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update oportunidades" ON oportunidades
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete oportunidades" ON oportunidades
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- ORCAMENTOS
DROP POLICY IF EXISTS "Org users can view orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Org users can create orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Org users can update orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Org users can delete orcamentos" ON orcamentos;

CREATE POLICY "Org users can view orcamentos" ON orcamentos
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create orcamentos" ON orcamentos
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update orcamentos" ON orcamentos
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete orcamentos" ON orcamentos
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- PEDIDOS
DROP POLICY IF EXISTS "Org users can view pedidos" ON pedidos;
DROP POLICY IF EXISTS "Org users can create pedidos" ON pedidos;
DROP POLICY IF EXISTS "Org users can update pedidos" ON pedidos;
DROP POLICY IF EXISTS "Org users can delete pedidos" ON pedidos;

CREATE POLICY "Org users can view pedidos" ON pedidos
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can create pedidos" ON pedidos
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org users can update pedidos" ON pedidos
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete pedidos" ON pedidos
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- SOLICITACOES_VISITA
DROP POLICY IF EXISTS "Org users can view solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can update solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can delete solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacoes_visita" ON solicitacoes_visita;

CREATE POLICY "Org users can view solicitacoes_visita" ON solicitacoes_visita
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Anyone can create solicitacoes_visita" ON solicitacoes_visita
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Org users can update solicitacoes_visita" ON solicitacoes_visita
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can delete solicitacoes_visita" ON solicitacoes_visita
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());


-- ============================================
-- Migration: 20260108044622_2afeccbf-ef2f-4b22-9f07-e4571e8e189f.sql
-- ============================================

-- Recalcular custo_total e subtotais dos orçamentos baseado na soma real dos itens
UPDATE orcamentos o
SET 
  custo_total = COALESCE(sub.soma_custos, 0),
  subtotal_materiais = COALESCE(sub.soma_materiais, 0),
  subtotal_mao_obra_costura = COALESCE(sub.soma_costura, 0),
  subtotal_instalacao = COALESCE(sub.soma_instalacao, 0)
FROM (
  SELECT 
    ci.orcamento_id,
    SUM(COALESCE(ci.custo_total, 0)) as soma_custos,
    SUM(
      CASE 
        WHEN ci.tipo_produto = 'cortina' THEN 
          COALESCE(ci.custo_tecido, 0) + COALESCE(ci.custo_forro, 0) + COALESCE(ci.custo_trilho, 0)
        ELSE 
          COALESCE(ci.preco_unitario, 0) * COALESCE(ci.quantidade, 1)
      END
    ) as soma_materiais,
    SUM(COALESCE(ci.custo_costura, 0)) as soma_costura,
    SUM(COALESCE(ci.custo_instalacao, 0)) as soma_instalacao
  FROM cortina_items ci
  GROUP BY ci.orcamento_id
) sub
WHERE o.id = sub.orcamento_id;


-- ============================================
-- Migration: 20260108050659_b890cb2c-4fa4-4bce-b2ce-82953189cc31.sql
-- ============================================

-- ============================================
-- FASE A: Função e triggers para consistência de totais
-- ============================================

-- Função para recalcular totais do orçamento
CREATE OR REPLACE FUNCTION public.recalcular_totais_orcamento(p_orcamento_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_soma_custo numeric;
  v_soma_preco_venda numeric;
  v_desconto_tipo text;
  v_desconto_valor numeric;
  v_margem_percent numeric;
  v_total_com_desconto numeric;
BEGIN
  -- Buscar soma dos itens
  SELECT 
    COALESCE(SUM(custo_total), 0),
    COALESCE(SUM(preco_venda), 0)
  INTO v_soma_custo, v_soma_preco_venda
  FROM cortina_items
  WHERE orcamento_id = p_orcamento_id;

  -- Buscar dados de desconto do orçamento
  SELECT desconto_tipo, COALESCE(desconto_valor, 0), margem_percent
  INTO v_desconto_tipo, v_desconto_valor, v_margem_percent
  FROM orcamentos
  WHERE id = p_orcamento_id;

  -- Calcular total com desconto
  IF v_desconto_tipo = 'percentual' THEN
    v_total_com_desconto := v_soma_preco_venda * (1 - v_desconto_valor / 100);
  ELSIF v_desconto_tipo = 'valor' THEN
    v_total_com_desconto := v_soma_preco_venda - v_desconto_valor;
  ELSE
    v_total_com_desconto := v_soma_preco_venda;
  END IF;

  -- Garantir que não fique negativo
  IF v_total_com_desconto < 0 THEN
    v_total_com_desconto := 0;
  END IF;

  -- Atualizar orçamento
  UPDATE orcamentos
  SET 
    custo_total = v_soma_custo,
    total_geral = v_soma_preco_venda,
    total_com_desconto = v_total_com_desconto,
    updated_at = now()
  WHERE id = p_orcamento_id;
END;
$$;

-- Trigger function para chamar recálculo
CREATE OR REPLACE FUNCTION public.trigger_recalcular_totais_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalcular_totais_orcamento(OLD.orcamento_id);
    RETURN OLD;
  ELSE
    PERFORM recalcular_totais_orcamento(NEW.orcamento_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger em cortina_items
DROP TRIGGER IF EXISTS trg_recalcular_totais_orcamento ON cortina_items;
CREATE TRIGGER trg_recalcular_totais_orcamento
AFTER INSERT OR UPDATE OR DELETE ON cortina_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalcular_totais_orcamento();

-- Trigger para recalcular quando desconto/margem mudar no orçamento
CREATE OR REPLACE FUNCTION public.trigger_recalcular_desconto_orcamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só recalcula se desconto mudou
  IF OLD.desconto_tipo IS DISTINCT FROM NEW.desconto_tipo 
     OR OLD.desconto_valor IS DISTINCT FROM NEW.desconto_valor THEN
    PERFORM recalcular_totais_orcamento(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalcular_desconto_orcamento ON orcamentos;
CREATE TRIGGER trg_recalcular_desconto_orcamento
AFTER UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION trigger_recalcular_desconto_orcamento();

-- ============================================
-- DATA REPAIR: Corrigir orçamentos existentes
-- ============================================

-- Atualizar preco_venda dos itens que têm custo mas não têm preço
UPDATE cortina_items ci
SET preco_venda = ci.custo_total * (1 + o.margem_percent / 100)
FROM orcamentos o
WHERE ci.orcamento_id = o.id
  AND (ci.preco_venda IS NULL OR ci.preco_venda = 0)
  AND ci.custo_total > 0;

-- Recalcular todos os orçamentos existentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM orcamentos LOOP
    PERFORM recalcular_totais_orcamento(r.id);
  END LOOP;
END;
$$;


-- ============================================
-- Migration: 20260108051234_a7adb250-0ada-4111-b95e-ad0c524133de.sql
-- ============================================

-- Criar índice único para prevenir contatos duplicados por telefone dentro da mesma organização
CREATE UNIQUE INDEX idx_contatos_telefone_org_unique 
ON contatos (telefone, organization_id) 
WHERE telefone IS NOT NULL AND telefone <> '';


-- ============================================
-- Migration: 20260108055245_8cf2db4b-1edb-44b6-828d-4d56458d8934.sql
-- ============================================


-- Criar função security definer para obter organization_id sem recursão
CREATE OR REPLACE FUNCTION public.get_user_organization_id_direct()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Remover política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Users can view org members same org" ON public.organization_members;

-- Criar nova política sem recursão
CREATE POLICY "Users can view org members same org" 
ON public.organization_members
FOR SELECT
USING (
  user_id = auth.uid() 
  OR organization_id = get_user_organization_id_direct()
);

-- Remover política de owners que também pode causar recursão
DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members;

-- Criar nova política de owners sem recursão
CREATE POLICY "Owners can manage members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role = 'owner'
  )
);



-- ============================================
-- Migration: 20260108060034_618fa0bb-2e04-4694-8df9-5180a978b416.sql
-- ============================================

-- Criar função security definer para verificar se usuário atual é owner
CREATE OR REPLACE FUNCTION public.is_current_user_org_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  );
$$;

-- Remover política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members;

-- Recriar política usando funções security definer (sem recursão)
CREATE POLICY "Owners can manage members"
ON public.organization_members
FOR ALL
USING (
  organization_id = get_user_organization_id_direct()
  AND is_current_user_org_owner()
)
WITH CHECK (
  organization_id = get_user_organization_id_direct()
  AND is_current_user_org_owner()
);


-- ============================================
-- Migration: 20260109134742_44e0a386-e1e8-43ba-a9ba-270d619eeb34.sql
-- ============================================

-- FASE 1A: Corrigir auto_set_organization_id para não quebrar em tabelas sem created_by_user_id
CREATE OR REPLACE FUNCTION public.auto_set_organization_id()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_record_json JSONB;
BEGIN
  -- Se já tem organization_id, não fazer nada
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Converter NEW para JSONB para verificar campos dinamicamente
  v_record_json := to_jsonb(NEW);
  
  -- Tentar obter user_id de diferentes formas
  IF v_record_json ? 'created_by_user_id' AND (v_record_json->>'created_by_user_id') IS NOT NULL THEN
    v_user_id := (v_record_json->>'created_by_user_id')::UUID;
  ELSIF v_record_json ? 'user_id' AND (v_record_json->>'user_id') IS NOT NULL THEN
    v_user_id := (v_record_json->>'user_id')::UUID;
  ELSE
    -- Fallback para auth.uid() se existir sessão
    v_user_id := auth.uid();
  END IF;
  
  -- Se não conseguiu user_id, retornar sem modificar
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar organization_id do usuário
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    NEW.organization_id := v_org_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FASE 1B: Corrigir criar_notificacao_visita para passar organization_id explicitamente
-- e filtrar admins pela organização correta
CREATE OR REPLACE FUNCTION public.criar_notificacao_visita()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_org_id UUID;
BEGIN
  -- Usar organization_id da visita
  v_org_id := NEW.organization_id;
  
  -- Buscar admins da mesma organização
  FOR v_admin_id IN 
    SELECT om.user_id 
    FROM public.organization_members om
    INNER JOIN public.user_roles ur ON ur.user_id = om.user_id
    WHERE ur.role = 'admin'
    AND (v_org_id IS NULL OR om.organization_id = v_org_id)
  LOOP
    INSERT INTO public.notificacoes (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      referencia_tipo,
      referencia_id,
      data_lembrete,
      organization_id
    ) VALUES (
      v_admin_id,
      'visita_nova',
      'Nova solicitação de visita',
      'Cliente ' || NEW.nome || ' solicitou visita para ' || to_char(NEW.data_agendada, 'DD/MM/YYYY'),
      'alta',
      'visita',
      NEW.id,
      NOW(),
      v_org_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FASE 2: Atualizar constraint de status para incluir 'sem_resposta'
ALTER TABLE public.solicitacoes_visita 
DROP CONSTRAINT IF EXISTS solicitacoes_visita_status_check;

ALTER TABLE public.solicitacoes_visita 
ADD CONSTRAINT solicitacoes_visita_status_check 
CHECK (status IN ('pendente', 'confirmada', 'sem_resposta', 'realizada', 'cancelada'));


-- ============================================
-- Migration: 20260109135649_b92ccd37-6383-4c33-8076-6f5d5f6770e9.sql
-- ============================================

-- FASE 1: Adicionar organization_id às tabelas de extrato bancário para isolamento multi-tenant

-- 1.1 Adicionar coluna organization_id a extratos_bancarios
ALTER TABLE public.extratos_bancarios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 1.2 Adicionar coluna organization_id a movimentacoes_extrato
ALTER TABLE public.movimentacoes_extrato 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 1.3 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_org ON public.extratos_bancarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_extrato_org ON public.movimentacoes_extrato(organization_id);

-- 1.4 Backfill: Associar registros existentes à organização do usuário que criou
UPDATE public.extratos_bancarios eb
SET organization_id = om.organization_id
FROM public.organization_members om
WHERE eb.created_by_user_id = om.user_id
AND eb.organization_id IS NULL;

-- 1.5 Propagar org_id para movimentações via extrato
UPDATE public.movimentacoes_extrato me
SET organization_id = eb.organization_id
FROM public.extratos_bancarios eb
WHERE me.extrato_id = eb.id
AND me.organization_id IS NULL
AND eb.organization_id IS NOT NULL;

-- 1.6 Criar triggers para auto-set organization_id
DROP TRIGGER IF EXISTS auto_set_org_extratos_bancarios ON public.extratos_bancarios;
CREATE TRIGGER auto_set_org_extratos_bancarios
  BEFORE INSERT ON public.extratos_bancarios
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_id();

DROP TRIGGER IF EXISTS auto_set_org_movimentacoes_extrato ON public.movimentacoes_extrato;
CREATE TRIGGER auto_set_org_movimentacoes_extrato
  BEFORE INSERT ON public.movimentacoes_extrato
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_id();

-- 1.7 Habilitar RLS
ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_extrato ENABLE ROW LEVEL SECURITY;

-- 1.8 Políticas RLS para extratos_bancarios
DROP POLICY IF EXISTS "org_select_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_select_extratos" ON public.extratos_bancarios 
FOR SELECT USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_insert_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_insert_extratos" ON public.extratos_bancarios 
FOR INSERT WITH CHECK (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_update_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_update_extratos" ON public.extratos_bancarios 
FOR UPDATE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_delete_extratos" ON public.extratos_bancarios;
CREATE POLICY "org_delete_extratos" ON public.extratos_bancarios 
FOR DELETE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

-- 1.9 Políticas RLS para movimentacoes_extrato
DROP POLICY IF EXISTS "org_select_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_select_movimentacoes" ON public.movimentacoes_extrato 
FOR SELECT USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_insert_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_insert_movimentacoes" ON public.movimentacoes_extrato 
FOR INSERT WITH CHECK (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_update_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_update_movimentacoes" ON public.movimentacoes_extrato 
FOR UPDATE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);

DROP POLICY IF EXISTS "org_delete_movimentacoes" ON public.movimentacoes_extrato;
CREATE POLICY "org_delete_movimentacoes" ON public.movimentacoes_extrato 
FOR DELETE USING (
  organization_id = public.get_user_organization_id_direct() 
  OR organization_id IS NULL
);


-- ============================================
-- Migration: 20260109_fix_solicitacoes_visita_complete.sql
-- ============================================

-- =====================================================
-- FIX COMPLETO: SOLICITACOES_VISITA
-- Resolve problemas de INSERT tanto da LP quanto do sistema interno
-- =====================================================

-- =====================================================
-- 1. GARANTIR QUE A ORGANIZAÇÃO PRISMA EXISTE
-- =====================================================
INSERT INTO public.organizations (id, name, slug)
VALUES ('11111111-1111-1111-1111-111111111111', 'Prisma Interiores', 'prisma')
ON CONFLICT (id) DO UPDATE SET slug = 'prisma', name = 'Prisma Interiores';

-- =====================================================
-- 2. ATUALIZAR CONSTRAINT CHECK DO STATUS
-- =====================================================
-- Primeiro remover a constraint antiga
ALTER TABLE public.solicitacoes_visita 
DROP CONSTRAINT IF EXISTS solicitacoes_visita_status_check;

-- Criar nova constraint com todos os status válidos incluindo 'sem_resposta'
ALTER TABLE public.solicitacoes_visita 
ADD CONSTRAINT solicitacoes_visita_status_check 
CHECK (status IN ('pendente', 'confirmada', 'sem_resposta', 'realizada', 'cancelada'));

-- =====================================================
-- 3. REMOVER TODAS AS POLÍTICAS EXISTENTES DE SOLICITACOES_VISITA
-- =====================================================
DROP POLICY IF EXISTS "Anyone can create visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Anyone can create solicitacao_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Public and authenticated can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Authenticated users can view visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Authenticated users can update visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Only admins can delete visit requests" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can view solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can create solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can update solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Org users can delete solicitacoes_visita" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Users can view solicitacoes" ON solicitacoes_visita;
DROP POLICY IF EXISTS "Users can update solicitacoes" ON solicitacoes_visita;

-- =====================================================
-- 4. CRIAR POLÍTICAS NOVAS E SIMPLES
-- =====================================================

-- 4.1 INSERT: Qualquer um pode criar (LP pública e sistema interno)
CREATE POLICY "insert_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 4.2 SELECT: Usuários autenticados podem ver da sua organização
CREATE POLICY "select_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR SELECT 
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
  OR organization_id IS NULL
);

-- 4.3 UPDATE: Usuários autenticados podem atualizar da sua organização
CREATE POLICY "update_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
  OR organization_id IS NULL
);

-- 4.4 DELETE: Usuários autenticados podem deletar da sua organização
CREATE POLICY "delete_solicitacoes_visita" 
ON public.solicitacoes_visita
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_user_organization_id()
  OR organization_id IS NULL
);

-- =====================================================
-- 5. GARANTIR QUE RLS ESTÁ HABILITADO
-- =====================================================
ALTER TABLE public.solicitacoes_visita ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CRIAR FUNÇÃO PARA AUTO-PREENCHER organization_id 
-- (caso o frontend não passe, usa Prisma como default)
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_default_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se organization_id não foi passado, usar Prisma como default
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := '11111111-1111-1111-1111-111111111111';
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para auto-preencher
DROP TRIGGER IF EXISTS set_solicitacoes_visita_org_id ON solicitacoes_visita;
CREATE TRIGGER set_solicitacoes_visita_org_id
  BEFORE INSERT ON solicitacoes_visita
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_organization_id();

-- =====================================================
-- 7. ATUALIZAR REGISTROS EXISTENTES SEM organization_id
-- =====================================================
UPDATE public.solicitacoes_visita 
SET organization_id = '11111111-1111-1111-1111-111111111111' 
WHERE organization_id IS NULL;

-- =====================================================
-- 8. GARANTIR QUE TODOS OS USUÁRIOS EXISTENTES ESTÃO NA ORGANIZAÇÃO PRISMA
-- (Resolve problema de usuários sem membership que não conseguem fazer INSERT)
-- =====================================================
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  id,
  'member'
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM public.organization_members
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. CRIAR FUNÇÃO get_user_organization_id COM FALLBACK PARA PRISMA
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT organization_id 
     FROM public.organization_members 
     WHERE user_id = auth.uid()
     LIMIT 1),
    '11111111-1111-1111-1111-111111111111'::uuid -- Fallback para Prisma
  );
$$;



-- ============================================
-- Migration: 20260110000000_fix_status_contas_receber_trigger.sql
-- ============================================

-- =====================================================
-- CORREÇÃO: Trigger para atualizar status de contas_receber
-- quando parcelas_receber são atualizadas
-- =====================================================

-- Função para atualizar contas_receber quando parcela é atualizada
CREATE OR REPLACE FUNCTION public.atualizar_conta_receber_por_parcela()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conta_receber_id UUID;
  v_valor_total NUMERIC;
  v_valor_pago NUMERIC;
  v_novo_status TEXT;
  v_todas_pagas BOOLEAN;
  v_tolerancia_valor NUMERIC := 5.00; -- R$ 5,00
  v_tolerancia_percent NUMERIC := 0.5; -- 0,5%
  v_diferenca NUMERIC;
  v_percentual_diferenca NUMERIC;
BEGIN
  -- Usar NEW.conta_receber_id (após UPDATE) ou OLD.conta_receber_id (após DELETE)
  v_conta_receber_id := COALESCE(NEW.conta_receber_id, OLD.conta_receber_id);
  
  IF v_conta_receber_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Buscar valor_total da conta
  SELECT valor_total INTO v_valor_total
  FROM contas_receber
  WHERE id = v_conta_receber_id;

  IF v_valor_total IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recalcular valor_pago somando todas as parcelas pagas
  SELECT 
    COALESCE(SUM(valor), 0),
    COUNT(*) FILTER (WHERE status = 'pago') = COUNT(*)
  INTO v_valor_pago, v_todas_pagas
  FROM parcelas_receber
  WHERE conta_receber_id = v_conta_receber_id
    AND status = 'pago';

  -- Se não há parcelas pagas, valor_pago = 0
  IF v_valor_pago IS NULL THEN
    v_valor_pago := 0;
  END IF;

  -- Calcular diferença e percentual para tolerância
  v_diferenca := v_valor_total - v_valor_pago;
  IF v_valor_total > 0 THEN
    v_percentual_diferenca := (v_diferenca / v_valor_total) * 100;
  ELSE
    v_percentual_diferenca := 0;
  END IF;

  -- Determinar novo status
  -- Considera pago se:
  -- 1. Todas as parcelas estão pagas, OU
  -- 2. A diferença está dentro da tolerância (R$ 5 ou 0,5%)
  IF v_todas_pagas OR (v_diferenca <= v_tolerancia_valor AND v_percentual_diferenca <= v_tolerancia_percent) THEN
    v_novo_status := 'pago';
  ELSIF v_valor_pago > 0 THEN
    v_novo_status := 'parcial';
  ELSE
    -- Se não está pago e não está parcial, verificar se está atrasado
    -- (isso será feito pelo trigger de atualização de contas atrasadas)
    v_novo_status := 'pendente';
  END IF;

  -- Atualizar conta_receber
  UPDATE contas_receber
  SET 
    valor_pago = v_valor_pago,
    status = v_novo_status,
    updated_at = NOW()
  WHERE id = v_conta_receber_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_atualizar_conta_receber_por_parcela ON public.parcelas_receber;

-- Criar trigger que executa após INSERT, UPDATE ou DELETE de parcelas
CREATE TRIGGER trigger_atualizar_conta_receber_por_parcela
AFTER INSERT OR UPDATE OF status, valor OR DELETE ON public.parcelas_receber
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_conta_receber_por_parcela();

-- Comentário explicativo
COMMENT ON FUNCTION public.atualizar_conta_receber_por_parcela() IS 
'Atualiza automaticamente o valor_pago e status de contas_receber quando parcelas_receber são criadas, atualizadas ou deletadas. Considera tolerância de R$ 5 ou 0,5% para considerar pagamento completo.';



-- ============================================
-- Migration: 20260110000001_improve_sync_orcamento_contas_receber.sql
-- ============================================

-- =====================================================
-- MELHORIA: Sincronização bidirecional Orçamento ↔ Contas Receber
-- =====================================================

-- Melhorar função de sincronização para considerar tolerância e ser mais robusta
CREATE OR REPLACE FUNCTION public.sincronizar_status_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento_id uuid;
  v_valor_total numeric;
  v_valor_pago numeric;
  v_percentual numeric;
  v_novo_status text;
  v_status_atual text;
  v_tolerancia_valor numeric := 5.00; -- R$ 5,00
  v_tolerancia_percent numeric := 0.5; -- 0,5%
  v_diferenca numeric;
  v_percentual_diferenca numeric;
BEGIN
  -- Buscar orcamento_id e dados da conta receber
  SELECT orcamento_id, valor_total, valor_pago 
  INTO v_orcamento_id, v_valor_total, v_valor_pago
  FROM contas_receber
  WHERE id = NEW.id;
  
  -- Se não tem orçamento vinculado, não faz nada
  IF v_orcamento_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar status atual do orçamento para evitar atualizações desnecessárias
  SELECT status INTO v_status_atual
  FROM orcamentos
  WHERE id = v_orcamento_id;

  -- Se já está cancelado, não atualizar
  IF v_status_atual = 'cancelado' THEN
    RETURN NEW;
  END IF;

  -- Calcular percentual pago
  IF v_valor_total > 0 THEN
    v_percentual := (v_valor_pago / v_valor_total) * 100;
  ELSE
    v_percentual := 0;
  END IF;

  -- Calcular diferença e percentual para tolerância
  v_diferenca := v_valor_total - v_valor_pago;
  IF v_valor_total > 0 THEN
    v_percentual_diferenca := (v_diferenca / v_valor_total) * 100;
  ELSE
    v_percentual_diferenca := 0;
  END IF;

  -- Determinar novo status baseado no percentual E tolerância
  -- Considera pago se:
  -- 1. Status da conta é 'pago', OU
  -- 2. Percentual >= 100%, OU
  -- 3. Diferença está dentro da tolerância (R$ 5 ou 0,5%)
  IF NEW.status = 'pago' OR v_percentual >= 100 OR 
     (v_diferenca <= v_tolerancia_valor AND v_percentual_diferenca <= v_tolerancia_percent) THEN
    v_novo_status := 'pago';
  ELSIF v_percentual >= 60 THEN
    v_novo_status := 'pago_60';
  ELSIF v_percentual >= 50 THEN
    v_novo_status := 'pago_parcial';
  ELSIF v_percentual >= 40 THEN
    v_novo_status := 'pago_40';
  ELSE
    -- Se menos de 40%, não atualizar status do orçamento
    -- (mantém status atual, pode ser 'enviado', 'finalizado', etc.)
    RETURN NEW;
  END IF;

  -- Só atualizar se o status mudou (evitar loops infinitos e atualizações desnecessárias)
  IF v_status_atual = v_novo_status THEN
    RETURN NEW;
  END IF;

  -- Atualizar status do orçamento
  -- Não sobrescrever se já está cancelado ou se já está pago e o novo status não é pago
  UPDATE orcamentos
  SET 
    status = v_novo_status,
    status_updated_at = NOW()
  WHERE id = v_orcamento_id
    AND status NOT IN ('cancelado')
    AND (status != 'pago' OR v_novo_status = 'pago'); -- Só atualizar se não está pago OU se novo status é pago

  RETURN NEW;
END;
$$;

-- Garantir que o trigger está configurado corretamente
DROP TRIGGER IF EXISTS trigger_sincronizar_status_orcamento ON contas_receber;

-- Criar trigger que executa após UPDATE de status ou valor_pago
-- IMPORTANTE: Este trigger será chamado automaticamente quando o trigger
-- 'atualizar_conta_receber_por_parcela' atualizar contas_receber
CREATE TRIGGER trigger_sincronizar_status_orcamento
  AFTER UPDATE OF status, valor_pago ON contas_receber
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.valor_pago IS DISTINCT FROM NEW.valor_pago)
  EXECUTE FUNCTION sincronizar_status_orcamento();

-- Comentário explicativo
COMMENT ON FUNCTION public.sincronizar_status_orcamento() IS 
'Sincroniza automaticamente o status do orçamento quando contas_receber é atualizado. Considera tolerância de R$ 5 ou 0,5% para considerar pagamento completo. Evita loops infinitos verificando se o status mudou antes de atualizar.';

-- =====================================================
-- MELHORIA: Garantir que contas_receber seja criada quando orçamento muda para status de pagamento
-- =====================================================

-- Melhorar função que cria conta a receber quando orçamento muda para status de pagamento
CREATE OR REPLACE FUNCTION public.ensure_conta_receber_on_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_status_com_pagamento text[] := ARRAY['pago_40', 'pago_parcial', 'pago_60', 'pago'];
  v_status_anteriores_sem_pagamento text[] := ARRAY['rascunho', 'enviado', 'vencido', 'finalizado', 'sem_resposta'];
  v_conta_existente_id uuid;
  v_valor_total numeric;
BEGIN
  -- Só executa se:
  -- 1. O status mudou para um status de pagamento
  -- 2. O status anterior NÃO era um status de pagamento
  IF NEW.status = ANY(v_status_com_pagamento) 
     AND (OLD.status IS NULL OR OLD.status = ANY(v_status_anteriores_sem_pagamento))
  THEN
    -- Verificar se já existe conta a receber para este orçamento
    SELECT id INTO v_conta_existente_id
    FROM public.contas_receber 
    WHERE orcamento_id = NEW.id
    LIMIT 1;
    
    -- Se não existe, criar
    IF v_conta_existente_id IS NULL THEN
      v_valor_total := COALESCE(NEW.total_com_desconto, NEW.total_geral, 0);
      
      -- Criar conta a receber automaticamente com 1 parcela
      INSERT INTO public.contas_receber (
        orcamento_id, 
        cliente_nome, 
        cliente_telefone,
        valor_total, 
        valor_pago, 
        numero_parcelas,
        status, 
        data_vencimento, 
        descricao, 
        organization_id,
        created_by_user_id
      ) VALUES (
        NEW.id, 
        NEW.cliente_nome,
        NEW.cliente_telefone,
        v_valor_total,
        0,
        1,
        'pendente',
        (CURRENT_DATE + INTERVAL '30 days'),
        'Conta criada automaticamente - ' || NEW.codigo,
        NEW.organization_id,
        NEW.created_by_user_id
      )
      RETURNING id INTO v_conta_existente_id;
      
      -- Criar a parcela única
      INSERT INTO public.parcelas_receber (
        conta_receber_id,
        numero_parcela,
        valor,
        data_vencimento,
        status
      ) VALUES (
        v_conta_existente_id,
        1,
        v_valor_total,
        CURRENT_DATE + INTERVAL '30 days',
        'pendente'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garantir que o trigger está configurado
DROP TRIGGER IF EXISTS trigger_ensure_conta_receber ON public.orcamentos;

CREATE TRIGGER trigger_ensure_conta_receber
AFTER UPDATE OF status ON public.orcamentos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.ensure_conta_receber_on_payment_status();

-- Comentário explicativo
COMMENT ON FUNCTION public.ensure_conta_receber_on_payment_status() IS 
'Cria automaticamente uma conta a receber quando o status do orçamento muda para um status de pagamento (pago_40, pago_parcial, pago_60, pago) e ainda não existe conta a receber vinculada.';



-- ============================================
-- Migration: 20260113012330_3be46718-27ef-471c-9a6c-7c049556b020.sql
-- ============================================

-- Add motor columns to cortina_items for motorized curtains
ALTER TABLE public.cortina_items 
ADD COLUMN IF NOT EXISTS motor_id UUID REFERENCES public.materiais(id),
ADD COLUMN IF NOT EXISTS custo_motor NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.cortina_items.motor_id IS 'ID do motor/sistema de motorização selecionado';
COMMENT ON COLUMN public.cortina_items.custo_motor IS 'Custo do motor/sistema de motorização';


-- ============================================
-- Migration: 20260113194833_9953e913-77c0-4afd-bdbc-7f22d4f195f6.sql
-- ============================================

-- ============================================================
-- FASE 1: MULTI-TENANCY PARA MATERIAIS E SERVIÇOS
-- Prisma ERP - Correções para replicabilidade
-- ============================================================

-- IMPORTANTE: Esta migration converte tabelas globais para multi-tenant
-- Todos os registros existentes serão associados à organização Prisma

-- ID fixo da organização Prisma (padrão)
-- Você pode ajustar este ID conforme necessário
DO $$
DECLARE
  v_prisma_org_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Garantir que a organização Prisma existe
  INSERT INTO organizations (id, name, slug, active)
  VALUES (v_prisma_org_id, 'Prisma Interiores', 'prisma', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- 1. MATERIAIS
-- ============================================================

-- Adicionar coluna organization_id
ALTER TABLE materiais 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Atualizar registros existentes para a organização Prisma
UPDATE materiais 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_materiais_org ON materiais(organization_id);

-- Habilitar RLS
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "materiais_select_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_insert_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_update_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_delete_policy" ON materiais;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver materiais" ON materiais;
DROP POLICY IF EXISTS "Admins podem gerenciar materiais" ON materiais;

-- Criar novas policies
CREATE POLICY "materiais_select_org" ON materiais
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL -- Compatibilidade temporária
  );

CREATE POLICY "materiais_insert_org" ON materiais
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_update_org" ON materiais
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_delete_org" ON materiais
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 2. SERVIÇOS DE CONFECÇÃO
-- ============================================================

ALTER TABLE servicos_confeccao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE servicos_confeccao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_confeccao_org ON servicos_confeccao(organization_id);

ALTER TABLE servicos_confeccao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos_confeccao_select" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_insert" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_update" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_delete" ON servicos_confeccao;

CREATE POLICY "servicos_confeccao_select_org" ON servicos_confeccao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_confeccao_insert_org" ON servicos_confeccao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_confeccao_update_org" ON servicos_confeccao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_confeccao_delete_org" ON servicos_confeccao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 3. SERVIÇOS DE INSTALAÇÃO
-- ============================================================

ALTER TABLE servicos_instalacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE servicos_instalacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_instalacao_org ON servicos_instalacao(organization_id);

ALTER TABLE servicos_instalacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos_instalacao_select" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_insert" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_update" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_delete" ON servicos_instalacao;

CREATE POLICY "servicos_instalacao_select_org" ON servicos_instalacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_instalacao_insert_org" ON servicos_instalacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_update_org" ON servicos_instalacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_delete_org" ON servicos_instalacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 4. CONFIGURAÇÕES DE COMISSÃO
-- ============================================================

ALTER TABLE configuracoes_comissao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE configuracoes_comissao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_configuracoes_comissao_org ON configuracoes_comissao(organization_id);

ALTER TABLE configuracoes_comissao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracoes_comissao_select" ON configuracoes_comissao;
DROP POLICY IF EXISTS "configuracoes_comissao_all" ON configuracoes_comissao;

CREATE POLICY "configuracoes_comissao_select_org" ON configuracoes_comissao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "configuracoes_comissao_insert_org" ON configuracoes_comissao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "configuracoes_comissao_update_org" ON configuracoes_comissao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "configuracoes_comissao_delete_org" ON configuracoes_comissao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 5. PADRÕES DE CONCILIAÇÃO
-- ============================================================

ALTER TABLE padroes_conciliacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE padroes_conciliacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_padroes_conciliacao_org ON padroes_conciliacao(organization_id);

ALTER TABLE padroes_conciliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "padroes_conciliacao_select" ON padroes_conciliacao;
DROP POLICY IF EXISTS "padroes_conciliacao_all" ON padroes_conciliacao;

CREATE POLICY "padroes_conciliacao_select_org" ON padroes_conciliacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "padroes_conciliacao_insert_org" ON padroes_conciliacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "padroes_conciliacao_update_org" ON padroes_conciliacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "padroes_conciliacao_delete_org" ON padroes_conciliacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 6. REGRAS DE CONCILIAÇÃO
-- ============================================================

ALTER TABLE regras_conciliacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE regras_conciliacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_regras_conciliacao_org ON regras_conciliacao(organization_id);

ALTER TABLE regras_conciliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regras_conciliacao_select" ON regras_conciliacao;
DROP POLICY IF EXISTS "regras_conciliacao_all" ON regras_conciliacao;

CREATE POLICY "regras_conciliacao_select_org" ON regras_conciliacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "regras_conciliacao_insert_org" ON regras_conciliacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "regras_conciliacao_update_org" ON regras_conciliacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "regras_conciliacao_delete_org" ON regras_conciliacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 7. EXTRATOS BANCÁRIOS
-- ============================================================

ALTER TABLE extratos_bancarios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE extratos_bancarios 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_org ON extratos_bancarios(organization_id);

ALTER TABLE extratos_bancarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extratos_bancarios_select" ON extratos_bancarios;

CREATE POLICY "extratos_bancarios_select_org" ON extratos_bancarios
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "extratos_bancarios_insert_org" ON extratos_bancarios
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "extratos_bancarios_update_org" ON extratos_bancarios
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "extratos_bancarios_delete_org" ON extratos_bancarios
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 8. MOVIMENTAÇÕES EXTRATO
-- ============================================================

ALTER TABLE movimentacoes_extrato 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Atualizar baseado no extrato
UPDATE movimentacoes_extrato me
SET organization_id = e.organization_id
FROM extratos_bancarios e
WHERE me.extrato_id = e.id AND me.organization_id IS NULL;

-- Fallback para Prisma
UPDATE movimentacoes_extrato 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_movimentacoes_extrato_org ON movimentacoes_extrato(organization_id);

ALTER TABLE movimentacoes_extrato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movimentacoes_extrato_select" ON movimentacoes_extrato;

CREATE POLICY "movimentacoes_extrato_select_org" ON movimentacoes_extrato
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "movimentacoes_extrato_insert_org" ON movimentacoes_extrato
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "movimentacoes_extrato_update_org" ON movimentacoes_extrato
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "movimentacoes_extrato_delete_org" ON movimentacoes_extrato
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- FUNÇÃO AUXILIAR PARA ONBOARDING DE NOVA ORGANIZAÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION setup_new_organization(
  p_org_id UUID,
  p_template_org_id UUID DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Copiar materiais template para nova organização
  INSERT INTO materiais (
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, ativo,
    organization_id
  )
  SELECT 
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, true,
    p_org_id
  FROM materiais
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de confecção
  INSERT INTO servicos_confeccao (
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, ativo, organization_id
  )
  SELECT 
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, true, p_org_id
  FROM servicos_confeccao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de instalação
  INSERT INTO servicos_instalacao (
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, ativo, organization_id
  )
  SELECT 
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, true, p_org_id
  FROM servicos_instalacao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar categorias financeiras padrão
  INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo, organization_id)
  SELECT nome, tipo, cor, icone, true, p_org_id
  FROM categorias_financeiras
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar formas de pagamento padrão
  INSERT INTO formas_pagamento (
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, organization_id
  )
  SELECT 
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, true, p_org_id
  FROM formas_pagamento
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar configurações do sistema
  INSERT INTO configuracoes_sistema (chave, valor, descricao, organization_id)
  SELECT chave, valor, descricao, p_org_id
  FROM configuracoes_sistema
  WHERE organization_id = p_template_org_id;
  
END;
$$;

-- Comentário de documentação
COMMENT ON FUNCTION setup_new_organization IS 
'Configura uma nova organização copiando materiais, serviços e configurações de um template (padrão: Prisma).
Uso: SELECT setup_new_organization(''uuid-da-nova-org'');';


-- ============================================
-- Migration: 20260113195446_08c7b443-34ea-4410-a112-bd828c4b7ad6.sql
-- ============================================

-- ============================================================
-- MODELO DE NEGÓCIO: PLANOS E ASSINATURAS
-- Prisma ERP - Sistema Multi-Tenant para Decoração
-- ============================================================

-- Tabela de Super Admins (donos do ERP)
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL, -- 'starter_3', 'pro_10', 'business_25', 'enterprise_50'
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Preços
  preco_mensal DECIMAL(10,2) NOT NULL,
  preco_implementacao DECIMAL(10,2) DEFAULT 0,
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90, -- Preço por usuário extra
  
  -- Limites
  max_usuarios INT NOT NULL, -- Usuários inclusos no plano
  max_usuarios_expansivel BOOLEAN DEFAULT true, -- Permite adicionar mais usuários?
  max_orcamentos_mes INT, -- NULL = ilimitado
  max_storage_gb INT DEFAULT 5,
  
  -- Features (JSON)
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false, -- Plano mais popular
  ordem INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  
  -- Status
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  
  -- Período
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Usuários Adicionais
  usuarios_adicionais INT DEFAULT 0,
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90,
  
  -- Pagamento
  payment_method TEXT, -- 'pix', 'boleto', 'cartao'
  stripe_subscription_id TEXT,
  
  -- Customizações (overrides do plano)
  custom_max_usuarios INT,
  custom_preco_mensal DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Histórico de Pagamentos
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  
  metodo_pagamento TEXT,
  comprovante_url TEXT,
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uso mensal por organização (para limites)
CREATE TABLE IF NOT EXISTS organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  mes_referencia DATE NOT NULL, -- Primeiro dia do mês
  
  -- Contadores
  orcamentos_criados INT DEFAULT 0,
  usuarios_ativos INT DEFAULT 0,
  storage_usado_mb DECIMAL(10,2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, mes_referencia)
);

-- ============================================================
-- INSERIR PLANOS PADRÃO
-- ============================================================

INSERT INTO plans (codigo, nome, descricao, preco_mensal, preco_implementacao, preco_usuario_adicional, max_usuarios, max_usuarios_expansivel, max_orcamentos_mes, features, ordem, destaque) VALUES

-- Plano Starter (3 usuários)
('starter_3', 'Starter', 'Ideal para pequenas empresas começando a organizar seus processos', 
 499.00, 3000.00, 69.90, 3, true, 100,
 '["orcamentos", "crm_basico", "producao", "calendario"]'::jsonb,
 1, false),

-- Plano Profissional (10 usuários) - DESTAQUE
('pro_10', 'Profissional', 'Para empresas em crescimento que precisam de mais controle',
 899.00, 4500.00, 69.90, 10, true, 500,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "calendario"]'::jsonb,
 2, true),

-- Plano Business (25 usuários)
('business_25', 'Business', 'Solução completa para operações de médio porte',
 1499.00, 7000.00, 69.90, 25, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "calendario", "suporte_prioritario"]'::jsonb,
 3, false),

-- Plano Enterprise (50+ usuários)
('enterprise_50', 'Enterprise', 'Máxima performance para grandes operações',
 2499.00, 12000.00, 59.90, 50, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "integracao_whatsapp", "api_acesso", "calendario", "suporte_prioritario", "customizacoes"]'::jsonb,
 4, false)

ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  preco_mensal = EXCLUDED.preco_mensal,
  preco_implementacao = EXCLUDED.preco_implementacao,
  preco_usuario_adicional = EXCLUDED.preco_usuario_adicional,
  max_usuarios = EXCLUDED.max_usuarios,
  max_usuarios_expansivel = EXCLUDED.max_usuarios_expansivel,
  max_orcamentos_mes = EXCLUDED.max_orcamentos_mes,
  features = EXCLUDED.features,
  ordem = EXCLUDED.ordem,
  destaque = EXCLUDED.destaque,
  updated_at = now();

-- ============================================================
-- POLICIES RLS
-- ============================================================

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;

-- Super admins: apenas super admins veem
CREATE POLICY "Super admins podem ver super_admins" ON super_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Planos: todos podem ver planos ativos
CREATE POLICY "Todos podem ver planos ativos" ON plans
  FOR SELECT USING (ativo = true);

CREATE POLICY "Super admins gerenciam planos" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Assinaturas: organização vê sua própria, super admins veem todas
CREATE POLICY "Org vê sua assinatura" ON subscriptions
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "Super admins gerenciam assinaturas" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Pagamentos: mesma lógica
CREATE POLICY "Org vê seus pagamentos" ON subscription_payments
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE organization_id = get_user_organization_id()
    )
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Uso: organização vê seu próprio uso
CREATE POLICY "Org vê seu uso" ON organization_usage
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Verificar se organização tem feature
CREATE OR REPLACE FUNCTION org_has_feature(p_org_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_features JSONB;
BEGIN
  SELECT p.features INTO v_features
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  RETURN v_features ? p_feature;
END;
$$;

-- Verificar limite de usuários (considerando usuários adicionais)
CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_max_usuarios_base INT;
  v_usuarios_adicionais INT;
  v_max_usuarios_total INT;
  v_usuarios_atuais INT;
  v_expansivel BOOLEAN;
BEGIN
  -- Buscar limite do plano + usuários adicionais
  SELECT 
    COALESCE(s.custom_max_usuarios, p.max_usuarios),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(p.max_usuarios_expansivel, true)
  INTO v_max_usuarios_base, v_usuarios_adicionais, v_expansivel
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = NEW.organization_id
    AND s.status IN ('trial', 'active');
  
  -- Total = base + adicionais
  v_max_usuarios_total := v_max_usuarios_base + v_usuarios_adicionais;
  
  -- Contar usuários atuais
  SELECT COUNT(*) INTO v_usuarios_atuais
  FROM organization_members
  WHERE organization_id = NEW.organization_id;
  
  -- Verificar limite (NULL = ilimitado)
  IF v_max_usuarios_total IS NOT NULL AND v_usuarios_atuais >= v_max_usuarios_total THEN
    IF v_expansivel THEN
      RAISE EXCEPTION 'Limite de usuários atingido (% de %). Adicione mais usuários ao seu plano por R$ 69,90/mês cada.', v_usuarios_atuais, v_max_usuarios_total;
    ELSE
      RAISE EXCEPTION 'Limite de usuários atingido para este plano (% de %)', v_usuarios_atuais, v_max_usuarios_total;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para verificar limite ao adicionar membro
DROP TRIGGER IF EXISTS check_user_limit_trigger ON organization_members;
CREATE TRIGGER check_user_limit_trigger
  BEFORE INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION check_user_limit();

-- ============================================================
-- FUNÇÕES DE CÁLCULO DE PREÇO
-- ============================================================

-- Calcular preço total mensal da assinatura (plano + usuários adicionais)
CREATE OR REPLACE FUNCTION calcular_preco_mensal_assinatura(p_org_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_preco_base DECIMAL(10,2);
  v_usuarios_adicionais INT;
  v_preco_usuario_adicional DECIMAL(10,2);
  v_preco_total DECIMAL(10,2);
BEGIN
  SELECT 
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)
  INTO v_preco_base, v_usuarios_adicionais, v_preco_usuario_adicional
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  -- Preço total = base + (usuários adicionais × preço por usuário)
  v_preco_total := COALESCE(v_preco_base, 0) + (COALESCE(v_usuarios_adicionais, 0) * COALESCE(v_preco_usuario_adicional, 69.90));
  
  RETURN v_preco_total;
END;
$$;

-- Obter detalhes da assinatura com cálculos
CREATE OR REPLACE FUNCTION get_subscription_details(p_org_id UUID)
RETURNS TABLE (
  plano_nome TEXT,
  plano_codigo TEXT,
  preco_base DECIMAL(10,2),
  usuarios_inclusos INT,
  usuarios_adicionais INT,
  usuarios_total INT,
  preco_usuario_adicional DECIMAL(10,2),
  valor_usuarios_adicionais DECIMAL(10,2),
  preco_total_mensal DECIMAL(10,2),
  status TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.nome,
    p.codigo,
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    p.max_usuarios,
    COALESCE(s.usuarios_adicionais, 0),
    p.max_usuarios + COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90),
    (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    COALESCE(s.custom_preco_mensal, p.preco_mensal) + (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    s.status,
    s.trial_ends_at,
    s.current_period_end
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id;
END;
$$;

-- Adicionar usuários extras à assinatura
CREATE OR REPLACE FUNCTION adicionar_usuarios_assinatura(
  p_org_id UUID,
  p_quantidade INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE subscriptions
  SET 
    usuarios_adicionais = COALESCE(usuarios_adicionais, 0) + p_quantidade,
    updated_at = now()
  WHERE organization_id = p_org_id
    AND status IN ('trial', 'active');
END;
$$;

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_sub ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_organization_usage_org_mes ON organization_usage(organization_id, mes_referencia);


-- ============================================
-- Migration: 20260113_multi_tenant_materiais_servicos.sql
-- ============================================

-- ============================================================
-- FASE 1: MULTI-TENANCY PARA MATERIAIS E SERVIÇOS
-- Prisma ERP - Correções para replicabilidade
-- ============================================================

-- IMPORTANTE: Esta migration converte tabelas globais para multi-tenant
-- Todos os registros existentes serão associados à organização Prisma

-- ID fixo da organização Prisma (padrão)
-- Você pode ajustar este ID conforme necessário
DO $$
DECLARE
  v_prisma_org_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Garantir que a organização Prisma existe
  INSERT INTO organizations (id, name, slug, active)
  VALUES (v_prisma_org_id, 'Prisma Interiores', 'prisma', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- 1. MATERIAIS
-- ============================================================

-- Adicionar coluna organization_id
ALTER TABLE materiais 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Atualizar registros existentes para a organização Prisma
UPDATE materiais 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_materiais_org ON materiais(organization_id);

-- Habilitar RLS
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "materiais_select_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_insert_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_update_policy" ON materiais;
DROP POLICY IF EXISTS "materiais_delete_policy" ON materiais;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver materiais" ON materiais;
DROP POLICY IF EXISTS "Admins podem gerenciar materiais" ON materiais;

-- Criar novas policies
CREATE POLICY "materiais_select_org" ON materiais
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL -- Compatibilidade temporária
  );

CREATE POLICY "materiais_insert_org" ON materiais
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_update_org" ON materiais
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "materiais_delete_org" ON materiais
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 2. SERVIÇOS DE CONFECÇÃO
-- ============================================================

ALTER TABLE servicos_confeccao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE servicos_confeccao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_confeccao_org ON servicos_confeccao(organization_id);

ALTER TABLE servicos_confeccao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos_confeccao_select" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_insert" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_update" ON servicos_confeccao;
DROP POLICY IF EXISTS "servicos_confeccao_delete" ON servicos_confeccao;

CREATE POLICY "servicos_confeccao_select_org" ON servicos_confeccao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_confeccao_insert_org" ON servicos_confeccao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_confeccao_update_org" ON servicos_confeccao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_confeccao_delete_org" ON servicos_confeccao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 3. SERVIÇOS DE INSTALAÇÃO
-- ============================================================

ALTER TABLE servicos_instalacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE servicos_instalacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_instalacao_org ON servicos_instalacao(organization_id);

ALTER TABLE servicos_instalacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos_instalacao_select" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_insert" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_update" ON servicos_instalacao;
DROP POLICY IF EXISTS "servicos_instalacao_delete" ON servicos_instalacao;

CREATE POLICY "servicos_instalacao_select_org" ON servicos_instalacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "servicos_instalacao_insert_org" ON servicos_instalacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_update_org" ON servicos_instalacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "servicos_instalacao_delete_org" ON servicos_instalacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 4. CONFIGURAÇÕES DE COMISSÃO
-- ============================================================

ALTER TABLE configuracoes_comissao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE configuracoes_comissao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_configuracoes_comissao_org ON configuracoes_comissao(organization_id);

ALTER TABLE configuracoes_comissao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracoes_comissao_select" ON configuracoes_comissao;
DROP POLICY IF EXISTS "configuracoes_comissao_all" ON configuracoes_comissao;

CREATE POLICY "configuracoes_comissao_select_org" ON configuracoes_comissao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "configuracoes_comissao_insert_org" ON configuracoes_comissao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "configuracoes_comissao_update_org" ON configuracoes_comissao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "configuracoes_comissao_delete_org" ON configuracoes_comissao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 5. PADRÕES DE CONCILIAÇÃO
-- ============================================================

ALTER TABLE padroes_conciliacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE padroes_conciliacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_padroes_conciliacao_org ON padroes_conciliacao(organization_id);

ALTER TABLE padroes_conciliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "padroes_conciliacao_select" ON padroes_conciliacao;
DROP POLICY IF EXISTS "padroes_conciliacao_all" ON padroes_conciliacao;

CREATE POLICY "padroes_conciliacao_select_org" ON padroes_conciliacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "padroes_conciliacao_insert_org" ON padroes_conciliacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "padroes_conciliacao_update_org" ON padroes_conciliacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "padroes_conciliacao_delete_org" ON padroes_conciliacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 6. REGRAS DE CONCILIAÇÃO
-- ============================================================

ALTER TABLE regras_conciliacao 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE regras_conciliacao 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_regras_conciliacao_org ON regras_conciliacao(organization_id);

ALTER TABLE regras_conciliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regras_conciliacao_select" ON regras_conciliacao;
DROP POLICY IF EXISTS "regras_conciliacao_all" ON regras_conciliacao;

CREATE POLICY "regras_conciliacao_select_org" ON regras_conciliacao
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "regras_conciliacao_insert_org" ON regras_conciliacao
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "regras_conciliacao_update_org" ON regras_conciliacao
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "regras_conciliacao_delete_org" ON regras_conciliacao
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 7. EXTRATOS BANCÁRIOS
-- ============================================================

ALTER TABLE extratos_bancarios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE extratos_bancarios 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_org ON extratos_bancarios(organization_id);

ALTER TABLE extratos_bancarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extratos_bancarios_select" ON extratos_bancarios;

CREATE POLICY "extratos_bancarios_select_org" ON extratos_bancarios
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "extratos_bancarios_insert_org" ON extratos_bancarios
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "extratos_bancarios_update_org" ON extratos_bancarios
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "extratos_bancarios_delete_org" ON extratos_bancarios
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- 8. MOVIMENTAÇÕES EXTRATO
-- ============================================================

ALTER TABLE movimentacoes_extrato 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Atualizar baseado no extrato
UPDATE movimentacoes_extrato me
SET organization_id = e.organization_id
FROM extratos_bancarios e
WHERE me.extrato_id = e.id AND me.organization_id IS NULL;

-- Fallback para Prisma
UPDATE movimentacoes_extrato 
SET organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_movimentacoes_extrato_org ON movimentacoes_extrato(organization_id);

ALTER TABLE movimentacoes_extrato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movimentacoes_extrato_select" ON movimentacoes_extrato;

CREATE POLICY "movimentacoes_extrato_select_org" ON movimentacoes_extrato
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR organization_id IS NULL
  );

CREATE POLICY "movimentacoes_extrato_insert_org" ON movimentacoes_extrato
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "movimentacoes_extrato_update_org" ON movimentacoes_extrato
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "movimentacoes_extrato_delete_org" ON movimentacoes_extrato
  FOR DELETE USING (
    organization_id = get_user_organization_id()
  );

-- ============================================================
-- FUNÇÃO AUXILIAR PARA ONBOARDING DE NOVA ORGANIZAÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION setup_new_organization(
  p_org_id UUID,
  p_template_org_id UUID DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copiar materiais template para nova organização
  INSERT INTO materiais (
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, ativo,
    organization_id
  )
  SELECT 
    nome, categoria, tipo, cor, fornecedor, linha, codigo_item,
    preco_custo, preco_tabela, margem_tabela_percent, unidade,
    largura_metro, perda_percent, area_min_fat, potencia, aplicacao, true,
    p_org_id
  FROM materiais
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de confecção
  INSERT INTO servicos_confeccao (
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, ativo, organization_id
  )
  SELECT 
    nome_modelo, preco_custo, preco_tabela, margem_tabela_percent,
    unidade, codigo_item, true, p_org_id
  FROM servicos_confeccao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar serviços de instalação
  INSERT INTO servicos_instalacao (
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, ativo, organization_id
  )
  SELECT 
    nome, preco_custo_por_ponto, preco_tabela_por_ponto, margem_tabela_percent,
    codigo_item, true, p_org_id
  FROM servicos_instalacao
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar categorias financeiras padrão
  INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ativo, organization_id)
  SELECT nome, tipo, cor, icone, true, p_org_id
  FROM categorias_financeiras
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar formas de pagamento padrão
  INSERT INTO formas_pagamento (
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, ativo, organization_id
  )
  SELECT 
    nome, tipo, permite_parcelamento, max_parcelas, taxa_percentual, true, p_org_id
  FROM formas_pagamento
  WHERE organization_id = p_template_org_id AND ativo = true;
  
  -- Copiar configurações do sistema
  INSERT INTO configuracoes_sistema (chave, valor, descricao, organization_id)
  SELECT chave, valor, descricao, p_org_id
  FROM configuracoes_sistema
  WHERE organization_id = p_template_org_id;
  
END;
$$;

-- Comentário de documentação
COMMENT ON FUNCTION setup_new_organization IS 
'Configura uma nova organização copiando materiais, serviços e configurações de um template (padrão: Prisma).
Uso: SELECT setup_new_organization(''uuid-da-nova-org'');';



-- ============================================
-- Migration: 20260113_planos_assinaturas.sql
-- ============================================

-- ============================================================
-- MODELO DE NEGÓCIO: PLANOS E ASSINATURAS
-- Prisma ERP - Sistema Multi-Tenant para Decoração
-- ============================================================

-- Tabela de Super Admins (donos do ERP)
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL, -- 'starter_3', 'pro_10', 'business_25', 'enterprise_50'
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Preços
  preco_mensal DECIMAL(10,2) NOT NULL,
  preco_implementacao DECIMAL(10,2) DEFAULT 0,
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90, -- Preço por usuário extra
  
  -- Limites
  max_usuarios INT NOT NULL, -- Usuários inclusos no plano
  max_usuarios_expansivel BOOLEAN DEFAULT true, -- Permite adicionar mais usuários?
  max_orcamentos_mes INT, -- NULL = ilimitado
  max_storage_gb INT DEFAULT 5,
  
  -- Features (JSON)
  features JSONB DEFAULT '[]'::jsonb,
  /*
    Exemplo de features:
    [
      "orcamentos",
      "crm_basico",
      "crm_avancado", 
      "producao",
      "financeiro",
      "relatorios_bi",
      "nfe",
      "integracao_whatsapp",
      "api_acesso",
      "suporte_prioritario"
    ]
  */
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false, -- Plano mais popular
  ordem INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  
  -- Status
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  
  -- Período
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Usuários Adicionais
  usuarios_adicionais INT DEFAULT 0, -- Quantidade de usuários além do plano base
  preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90, -- Preço por usuário adicional
  
  -- Pagamento
  payment_method TEXT, -- 'pix', 'boleto', 'cartao'
  stripe_subscription_id TEXT,
  
  -- Customizações (overrides do plano)
  custom_max_usuarios INT,
  custom_preco_mensal DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Histórico de Pagamentos
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  
  metodo_pagamento TEXT,
  comprovante_url TEXT,
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uso mensal por organização (para limites)
CREATE TABLE IF NOT EXISTS organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  mes_referencia DATE NOT NULL, -- Primeiro dia do mês
  
  -- Contadores
  orcamentos_criados INT DEFAULT 0,
  usuarios_ativos INT DEFAULT 0,
  storage_usado_mb DECIMAL(10,2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, mes_referencia)
);

-- ============================================================
-- INSERIR PLANOS PADRÃO
-- ============================================================

INSERT INTO plans (codigo, nome, descricao, preco_mensal, preco_implementacao, preco_usuario_adicional, max_usuarios, max_usuarios_expansivel, max_orcamentos_mes, features, ordem, destaque) VALUES

-- Plano Starter (3 usuários)
('starter_3', 'Starter', 'Ideal para pequenas empresas começando a organizar seus processos', 
 499.00, 3000.00, 69.90, 3, true, 100,
 '["orcamentos", "crm_basico", "producao", "calendario"]'::jsonb,
 1, false),

-- Plano Profissional (10 usuários) - DESTAQUE
('pro_10', 'Profissional', 'Para empresas em crescimento que precisam de mais controle',
 899.00, 4500.00, 69.90, 10, true, 500,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "calendario"]'::jsonb,
 2, true),

-- Plano Business (25 usuários)
('business_25', 'Business', 'Solução completa para operações de médio porte',
 1499.00, 7000.00, 69.90, 25, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "calendario", "suporte_prioritario"]'::jsonb,
 3, false),

-- Plano Enterprise (50+ usuários)
('enterprise_50', 'Enterprise', 'Máxima performance para grandes operações',
 2499.00, 12000.00, 59.90, 50, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "integracao_whatsapp", "api_acesso", "calendario", "suporte_prioritario", "customizacoes"]'::jsonb,
 4, false)

ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  preco_mensal = EXCLUDED.preco_mensal,
  preco_implementacao = EXCLUDED.preco_implementacao,
  preco_usuario_adicional = EXCLUDED.preco_usuario_adicional,
  max_usuarios = EXCLUDED.max_usuarios,
  max_usuarios_expansivel = EXCLUDED.max_usuarios_expansivel,
  max_orcamentos_mes = EXCLUDED.max_orcamentos_mes,
  features = EXCLUDED.features,
  ordem = EXCLUDED.ordem,
  destaque = EXCLUDED.destaque,
  updated_at = now();

-- ============================================================
-- POLICIES RLS
-- ============================================================

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;

-- Super admins: apenas super admins veem
CREATE POLICY "Super admins podem ver super_admins" ON super_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Planos: todos podem ver planos ativos
CREATE POLICY "Todos podem ver planos ativos" ON plans
  FOR SELECT USING (ativo = true);

CREATE POLICY "Super admins gerenciam planos" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Assinaturas: organização vê sua própria, super admins veem todas
CREATE POLICY "Org vê sua assinatura" ON subscriptions
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "Super admins gerenciam assinaturas" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Pagamentos: mesma lógica
CREATE POLICY "Org vê seus pagamentos" ON subscription_payments
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE organization_id = get_user_organization_id()
    )
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Uso: organização vê seu próprio uso
CREATE POLICY "Org vê seu uso" ON organization_usage
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Verificar se organização tem feature
CREATE OR REPLACE FUNCTION org_has_feature(p_org_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_features JSONB;
BEGIN
  SELECT p.features INTO v_features
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  RETURN v_features ? p_feature;
END;
$$;

-- Verificar limite de usuários (considerando usuários adicionais)
CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_usuarios_base INT;
  v_usuarios_adicionais INT;
  v_max_usuarios_total INT;
  v_usuarios_atuais INT;
  v_expansivel BOOLEAN;
BEGIN
  -- Buscar limite do plano + usuários adicionais
  SELECT 
    COALESCE(s.custom_max_usuarios, p.max_usuarios),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(p.max_usuarios_expansivel, true)
  INTO v_max_usuarios_base, v_usuarios_adicionais, v_expansivel
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = NEW.organization_id
    AND s.status IN ('trial', 'active');
  
  -- Total = base + adicionais
  v_max_usuarios_total := v_max_usuarios_base + v_usuarios_adicionais;
  
  -- Contar usuários atuais
  SELECT COUNT(*) INTO v_usuarios_atuais
  FROM organization_members
  WHERE organization_id = NEW.organization_id;
  
  -- Verificar limite (NULL = ilimitado)
  IF v_max_usuarios_total IS NOT NULL AND v_usuarios_atuais >= v_max_usuarios_total THEN
    IF v_expansivel THEN
      RAISE EXCEPTION 'Limite de usuários atingido (% de %). Adicione mais usuários ao seu plano por R$ 69,90/mês cada.', v_usuarios_atuais, v_max_usuarios_total;
    ELSE
      RAISE EXCEPTION 'Limite de usuários atingido para este plano (% de %)', v_usuarios_atuais, v_max_usuarios_total;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para verificar limite ao adicionar membro
CREATE TRIGGER check_user_limit_trigger
  BEFORE INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION check_user_limit();

-- ============================================================
-- FUNÇÕES DE CÁLCULO DE PREÇO
-- ============================================================

-- Calcular preço total mensal da assinatura (plano + usuários adicionais)
CREATE OR REPLACE FUNCTION calcular_preco_mensal_assinatura(p_org_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preco_base DECIMAL(10,2);
  v_usuarios_adicionais INT;
  v_preco_usuario_adicional DECIMAL(10,2);
  v_preco_total DECIMAL(10,2);
BEGIN
  SELECT 
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)
  INTO v_preco_base, v_usuarios_adicionais, v_preco_usuario_adicional
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('trial', 'active');
  
  -- Preço total = base + (usuários adicionais × preço por usuário)
  v_preco_total := COALESCE(v_preco_base, 0) + (COALESCE(v_usuarios_adicionais, 0) * COALESCE(v_preco_usuario_adicional, 69.90));
  
  RETURN v_preco_total;
END;
$$;

-- Obter detalhes da assinatura com cálculos
CREATE OR REPLACE FUNCTION get_subscription_details(p_org_id UUID)
RETURNS TABLE (
  plano_nome TEXT,
  plano_codigo TEXT,
  preco_base DECIMAL(10,2),
  usuarios_inclusos INT,
  usuarios_adicionais INT,
  usuarios_total INT,
  preco_usuario_adicional DECIMAL(10,2),
  valor_usuarios_adicionais DECIMAL(10,2),
  preco_total_mensal DECIMAL(10,2),
  status TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.nome,
    p.codigo,
    COALESCE(s.custom_preco_mensal, p.preco_mensal),
    p.max_usuarios,
    COALESCE(s.usuarios_adicionais, 0),
    p.max_usuarios + COALESCE(s.usuarios_adicionais, 0),
    COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90),
    (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    COALESCE(s.custom_preco_mensal, p.preco_mensal) + (COALESCE(s.usuarios_adicionais, 0) * COALESCE(s.preco_usuario_adicional, p.preco_usuario_adicional, 69.90)),
    s.status,
    s.trial_ends_at,
    s.current_period_end
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id;
END;
$$;

-- Adicionar usuários extras à assinatura
CREATE OR REPLACE FUNCTION adicionar_usuarios_assinatura(
  p_org_id UUID,
  p_quantidade INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE subscriptions
  SET 
    usuarios_adicionais = COALESCE(usuarios_adicionais, 0) + p_quantidade,
    updated_at = now()
  WHERE organization_id = p_org_id
    AND status IN ('trial', 'active');
END;
$$;

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_sub ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_organization_usage_org_mes ON organization_usage(organization_id, mes_referencia);



-- ============================================
-- Migration: 20260114_feature_flags.sql
-- ============================================

-- =============================================
-- FEATURE FLAGS - Sistema de Controle por Plano
-- =============================================

-- 1. Criar enum para os planos
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('starter', 'profissional', 'business', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de configuração de planos
CREATE TABLE IF NOT EXISTS planos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome subscription_plan NOT NULL UNIQUE,
  nome_exibicao TEXT NOT NULL,
  preco_mensal DECIMAL(10,2) NOT NULL,
  usuarios_base INTEGER NOT NULL,
  limite_orcamentos INTEGER, -- NULL = ilimitado
  -- Features booleanas
  crm_basico BOOLEAN DEFAULT true,
  crm_avancado BOOLEAN DEFAULT false,
  producao_kanban BOOLEAN DEFAULT true,
  financeiro_completo BOOLEAN DEFAULT false,
  relatorios_bi BOOLEAN DEFAULT false,
  nfe_integracao BOOLEAN DEFAULT true,
  suporte_prioritario BOOLEAN DEFAULT false,
  whatsapp_integrado BOOLEAN DEFAULT false,
  api_acesso BOOLEAN DEFAULT false,
  customizacoes BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Inserir dados dos planos
INSERT INTO planos_config (nome, nome_exibicao, preco_mensal, usuarios_base, limite_orcamentos, crm_avancado, financeiro_completo, relatorios_bi, suporte_prioritario, whatsapp_integrado, api_acesso, customizacoes)
VALUES 
  ('starter', 'Starter', 499.00, 3, 100, false, false, false, false, false, false, false),
  ('profissional', 'Profissional', 899.00, 10, 500, true, true, true, false, false, false, false),
  ('business', 'Business', 1499.00, 25, NULL, true, true, true, true, false, false, false),
  ('enterprise', 'Enterprise', 2499.00, 50, NULL, true, true, true, true, true, true, true)
ON CONFLICT (nome) DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  preco_mensal = EXCLUDED.preco_mensal,
  usuarios_base = EXCLUDED.usuarios_base,
  limite_orcamentos = EXCLUDED.limite_orcamentos,
  crm_avancado = EXCLUDED.crm_avancado,
  financeiro_completo = EXCLUDED.financeiro_completo,
  relatorios_bi = EXCLUDED.relatorios_bi,
  suporte_prioritario = EXCLUDED.suporte_prioritario,
  whatsapp_integrado = EXCLUDED.whatsapp_integrado,
  api_acesso = EXCLUDED.api_acesso,
  customizacoes = EXCLUDED.customizacoes,
  updated_at = now();

-- 4. Adicionar coluna de plano na tabela organizations (se não existir)
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN plano subscription_plan DEFAULT 'starter';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN plano_valido_ate TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN usuarios_adicionais INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 5. Criar função para verificar se organização tem acesso a uma feature
CREATE OR REPLACE FUNCTION org_has_feature(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_plano subscription_plan;
  has_feature BOOLEAN;
BEGIN
  -- Buscar plano da organização
  SELECT plano INTO org_plano FROM organizations WHERE id = org_id;
  
  IF org_plano IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se o plano tem a feature
  EXECUTE format('SELECT %I FROM planos_config WHERE nome = $1', feature_name)
  INTO has_feature
  USING org_plano;
  
  RETURN COALESCE(has_feature, false);
END;
$$;

-- 6. Criar função para obter limite de orçamentos
CREATE OR REPLACE FUNCTION org_get_orcamento_limit(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_plano subscription_plan;
  limite INTEGER;
BEGIN
  SELECT plano INTO org_plano FROM organizations WHERE id = org_id;
  
  IF org_plano IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT limite_orcamentos INTO limite FROM planos_config WHERE nome = org_plano;
  
  RETURN limite; -- NULL = ilimitado
END;
$$;

-- 7. Criar função para contar orçamentos do mês atual
CREATE OR REPLACE FUNCTION org_count_orcamentos_mes(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COUNT(*) INTO total
  FROM orcamentos
  WHERE organization_id = org_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
  
  RETURN total;
END;
$$;

-- 8. Criar função para verificar se pode criar mais orçamentos
CREATE OR REPLACE FUNCTION org_can_create_orcamento(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  limite INTEGER;
  atual INTEGER;
BEGIN
  limite := org_get_orcamento_limit(org_id);
  
  -- NULL = ilimitado
  IF limite IS NULL THEN
    RETURN true;
  END IF;
  
  atual := org_count_orcamentos_mes(org_id);
  
  RETURN atual < limite;
END;
$$;

-- 9. Criar função para obter limite de usuários
CREATE OR REPLACE FUNCTION org_get_user_limit(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_record RECORD;
  base_limit INTEGER;
BEGIN
  SELECT o.plano, o.usuarios_adicionais, p.usuarios_base
  INTO org_record
  FROM organizations o
  JOIN planos_config p ON p.nome = o.plano
  WHERE o.id = org_id;
  
  IF org_record IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN org_record.usuarios_base + COALESCE(org_record.usuarios_adicionais, 0);
END;
$$;

-- 10. Criar função para obter todas as features do plano da organização
CREATE OR REPLACE FUNCTION org_get_features(org_id UUID)
RETURNS TABLE (
  plano TEXT,
  plano_nome TEXT,
  limite_orcamentos INTEGER,
  limite_usuarios INTEGER,
  orcamentos_mes INTEGER,
  crm_basico BOOLEAN,
  crm_avancado BOOLEAN,
  producao_kanban BOOLEAN,
  financeiro_completo BOOLEAN,
  relatorios_bi BOOLEAN,
  nfe_integracao BOOLEAN,
  suporte_prioritario BOOLEAN,
  whatsapp_integrado BOOLEAN,
  api_acesso BOOLEAN,
  customizacoes BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.plano::TEXT,
    p.nome_exibicao,
    p.limite_orcamentos,
    (p.usuarios_base + COALESCE(o.usuarios_adicionais, 0))::INTEGER,
    org_count_orcamentos_mes(org_id),
    p.crm_basico,
    p.crm_avancado,
    p.producao_kanban,
    p.financeiro_completo,
    p.relatorios_bi,
    p.nfe_integracao,
    p.suporte_prioritario,
    p.whatsapp_integrado,
    p.api_acesso,
    p.customizacoes
  FROM organizations o
  JOIN planos_config p ON p.nome = o.plano
  WHERE o.id = org_id;
END;
$$;

-- 11. RLS para planos_config (leitura pública para usuários autenticados)
ALTER TABLE planos_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planos_config_select" ON planos_config;
CREATE POLICY "planos_config_select" ON planos_config
  FOR SELECT TO authenticated
  USING (true);

-- 12. Atualizar organizações existentes para ter plano starter
UPDATE organizations SET plano = 'starter' WHERE plano IS NULL;

-- Comentário final
COMMENT ON TABLE planos_config IS 'Configuração de planos e features disponíveis por plano';
COMMENT ON FUNCTION org_has_feature IS 'Verifica se uma organização tem acesso a determinada feature baseado no seu plano';
COMMENT ON FUNCTION org_get_features IS 'Retorna todas as features e limites da organização';



-- ============================================
-- Migration: 20260114_fix_delete_orcamentos.sql
-- ============================================

-- =============================================
-- FIX: Corrigir política de DELETE para orcamentos
-- =============================================

-- A política atual pode estar falhando se get_user_organization_id() retornar NULL
-- Vamos criar uma política mais robusta que também permite deletar se o usuário criou o orçamento

DROP POLICY IF EXISTS "Org users can delete orcamentos" ON orcamentos;

-- Nova política: permite deletar se:
-- 1. O orçamento pertence à organização do usuário, OU
-- 2. O usuário criou o orçamento (created_by_user_id)
CREATE POLICY "Org users can delete orcamentos" ON orcamentos
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_organization_id() 
    OR created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = orcamentos.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Comentário
COMMENT ON POLICY "Org users can delete orcamentos" ON orcamentos IS 
  'Permite deletar orçamentos da própria organização, criados pelo usuário, ou se for owner/admin';



-- ============================================
-- Migration: 20260114_fix_delete_orcamentos_v2.sql
-- ============================================

-- =============================================
-- FIX V2: Política de DELETE mais robusta para orcamentos
-- =============================================

-- A política anterior depende de get_user_organization_id() que pode retornar NULL
-- Vamos criar uma política que verifica diretamente sem depender da função

DROP POLICY IF EXISTS "Org users can delete orcamentos" ON orcamentos;

-- Nova política: permite deletar se:
-- 1. O usuário criou o orçamento (created_by_user_id = auth.uid()), OU
-- 2. O usuário está na mesma organização do orçamento (verificação direta)
CREATE POLICY "Org users can delete orcamentos" ON orcamentos
  FOR DELETE TO authenticated
  USING (
    -- Opção 1: Usuário criou o orçamento
    created_by_user_id = auth.uid()
    OR
    -- Opção 2: Usuário está na mesma organização (verificação direta sem função)
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = orcamentos.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Comentário
COMMENT ON POLICY "Org users can delete orcamentos" ON orcamentos IS 
  'Permite deletar orçamentos criados pelo usuário ou se o usuário está na mesma organização do orçamento.';



-- ============================================
-- Migration: 20260114_fix_get_user_org_id.sql
-- ============================================

-- =============================================
-- FIX: Corrigir get_user_organization_id() que está retornando NULL
-- =============================================

-- A função atual pode estar falhando por problemas de RLS ou busca
-- Vamos criar uma versão mais robusta

DROP FUNCTION IF EXISTS public.get_user_organization_id();

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Buscar organization_id do usuário atual
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Se não encontrou, retornar NULL (não fallback para evitar problemas)
  RETURN v_org_id;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.get_user_organization_id() IS 
  'Retorna o organization_id do usuário autenticado. Retorna NULL se o usuário não estiver em nenhuma organização.';



-- ============================================
-- Migration: 20260114_fix_no_action_simples.sql
-- ============================================

-- =============================================
-- FIX: Corrigir TODAS as constraints com NO ACTION para CASCADE
-- =============================================

-- 1. Atividades CRM
ALTER TABLE public.atividades_crm 
  DROP CONSTRAINT IF EXISTS atividades_crm_orcamento_id_fkey;

ALTER TABLE public.atividades_crm
  ADD CONSTRAINT atividades_crm_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 2. Comissões
ALTER TABLE public.comissoes 
  DROP CONSTRAINT IF EXISTS comissoes_orcamento_id_fkey;

ALTER TABLE public.comissoes
  ADD CONSTRAINT comissoes_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Histórico de Descontos
ALTER TABLE public.historico_descontos 
  DROP CONSTRAINT IF EXISTS historico_descontos_orcamento_id_fkey;

ALTER TABLE public.historico_descontos
  ADD CONSTRAINT historico_descontos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Log de Alterações de Status
ALTER TABLE public.log_alteracoes_status 
  DROP CONSTRAINT IF EXISTS log_alteracoes_status_orcamento_id_fkey;

ALTER TABLE public.log_alteracoes_status
  ADD CONSTRAINT log_alteracoes_status_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 5. Pedidos
ALTER TABLE public.pedidos 
  DROP CONSTRAINT IF EXISTS pedidos_orcamento_id_fkey;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;



-- ============================================
-- Migration: 20260114_fix_oportunidades_fk.sql
-- ============================================

-- =============================================
-- FIX: Alterar constraints para ON DELETE CASCADE
-- =============================================

-- O problema: As constraints atuais usam ON DELETE SET NULL, mas a RLS pode bloquear
-- a atualização automática. Vamos mudar para CASCADE para deletar os registros
-- vinculados quando o orçamento for deletado.

-- 1. Oportunidades
ALTER TABLE public.oportunidades 
  DROP CONSTRAINT IF EXISTS oportunidades_orcamento_id_fkey;

ALTER TABLE public.oportunidades
  ADD CONSTRAINT oportunidades_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 2. Contas a Pagar
ALTER TABLE public.contas_pagar 
  DROP CONSTRAINT IF EXISTS contas_pagar_orcamento_id_fkey;

ALTER TABLE public.contas_pagar
  ADD CONSTRAINT contas_pagar_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Contas a Receber (também precisa ser CASCADE para manter consistência)
ALTER TABLE public.contas_receber 
  DROP CONSTRAINT IF EXISTS contas_receber_orcamento_id_fkey;

ALTER TABLE public.contas_receber
  ADD CONSTRAINT contas_receber_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Atividades CRM
ALTER TABLE public.atividades_crm 
  DROP CONSTRAINT IF EXISTS atividades_crm_orcamento_id_fkey;

ALTER TABLE public.atividades_crm
  ADD CONSTRAINT atividades_crm_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- Comentários
COMMENT ON CONSTRAINT oportunidades_orcamento_id_fkey ON public.oportunidades IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as oportunidades vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_pagar_orcamento_id_fkey ON public.contas_pagar IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a pagar vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_receber_orcamento_id_fkey ON public.contas_receber IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a receber vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT atividades_crm_orcamento_id_fkey ON public.atividades_crm IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as atividades CRM vinculadas são deletadas automaticamente.';



-- ============================================
-- Migration: 20260114_fix_todas_constraints_no_action.sql
-- ============================================

-- =============================================
-- FIX COMPLETO: Corrigir TODAS as constraints com NO ACTION
-- para ON DELETE CASCADE
-- =============================================

-- Este script corrige TODOS os orçamentos, não apenas um específico
-- Ao alterar as constraints da tabela, todos os registros são afetados

-- 1. Atividades CRM
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'atividades_crm_orcamento_id_fkey'
    AND table_name = 'atividades_crm'
  ) THEN
    ALTER TABLE public.atividades_crm 
      DROP CONSTRAINT atividades_crm_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.atividades_crm
  ADD CONSTRAINT atividades_crm_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 2. Comissões
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comissoes_orcamento_id_fkey'
    AND table_name = 'comissoes'
  ) THEN
    ALTER TABLE public.comissoes 
      DROP CONSTRAINT comissoes_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.comissoes
  ADD CONSTRAINT comissoes_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Histórico de Descontos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'historico_descontos_orcamento_id_fkey'
    AND table_name = 'historico_descontos'
  ) THEN
    ALTER TABLE public.historico_descontos 
      DROP CONSTRAINT historico_descontos_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.historico_descontos
  ADD CONSTRAINT historico_descontos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Log de Alterações de Status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'log_alteracoes_status_orcamento_id_fkey'
    AND table_name = 'log_alteracoes_status'
  ) THEN
    ALTER TABLE public.log_alteracoes_status 
      DROP CONSTRAINT log_alteracoes_status_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.log_alteracoes_status
  ADD CONSTRAINT log_alteracoes_status_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 5. Pedidos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pedidos_orcamento_id_fkey'
    AND table_name = 'pedidos'
  ) THEN
    ALTER TABLE public.pedidos 
      DROP CONSTRAINT pedidos_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- Comentários
COMMENT ON CONSTRAINT atividades_crm_orcamento_id_fkey ON public.atividades_crm IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as atividades CRM vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT comissoes_orcamento_id_fkey ON public.comissoes IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as comissões vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT historico_descontos_orcamento_id_fkey ON public.historico_descontos IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, o histórico de descontos vinculado é deletado automaticamente.';

COMMENT ON CONSTRAINT log_alteracoes_status_orcamento_id_fkey ON public.log_alteracoes_status IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, o log de alterações de status vinculado é deletado automaticamente.';

COMMENT ON CONSTRAINT pedidos_orcamento_id_fkey ON public.pedidos IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, os pedidos de produção vinculados são deletados automaticamente.';



-- ============================================
-- Migration: 20260114_fix_todas_constraints_orcamentos.sql
-- ============================================

-- =============================================
-- FIX COMPLETO: Verificar e corrigir TODAS as constraints
-- que referenciam orcamentos para ON DELETE CASCADE
-- =============================================

-- Este script corrige TODOS os orçamentos, não apenas um específico
-- Ao alterar as constraints da tabela, todos os registros são afetados

-- 1. Oportunidades
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'oportunidades_orcamento_id_fkey'
    AND table_name = 'oportunidades'
  ) THEN
    ALTER TABLE public.oportunidades 
      DROP CONSTRAINT oportunidades_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.oportunidades
  ADD CONSTRAINT oportunidades_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 2. Contas a Pagar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contas_pagar_orcamento_id_fkey'
    AND table_name = 'contas_pagar'
  ) THEN
    ALTER TABLE public.contas_pagar 
      DROP CONSTRAINT contas_pagar_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.contas_pagar
  ADD CONSTRAINT contas_pagar_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 3. Contas a Receber
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contas_receber_orcamento_id_fkey'
    AND table_name = 'contas_receber'
  ) THEN
    ALTER TABLE public.contas_receber 
      DROP CONSTRAINT contas_receber_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.contas_receber
  ADD CONSTRAINT contas_receber_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- 4. Atividades CRM
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'atividades_crm_orcamento_id_fkey'
    AND table_name = 'atividades_crm'
  ) THEN
    ALTER TABLE public.atividades_crm 
      DROP CONSTRAINT atividades_crm_orcamento_id_fkey;
  END IF;
END $$;

ALTER TABLE public.atividades_crm
  ADD CONSTRAINT atividades_crm_orcamento_id_fkey 
  FOREIGN KEY (orcamento_id) 
  REFERENCES public.orcamentos(id) 
  ON DELETE CASCADE;

-- =============================================
-- VERIFICAÇÃO: Listar todas as constraints após a correção
-- =============================================

-- Execute esta query para verificar se todas estão corretas:
/*
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'orcamentos'
  AND ccu.column_name = 'id'
ORDER BY tc.table_name, kcu.column_name;
*/

-- Comentários
COMMENT ON CONSTRAINT oportunidades_orcamento_id_fkey ON public.oportunidades IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as oportunidades vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_pagar_orcamento_id_fkey ON public.contas_pagar IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a pagar vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT contas_receber_orcamento_id_fkey ON public.contas_receber IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as contas a receber vinculadas são deletadas automaticamente.';

COMMENT ON CONSTRAINT atividades_crm_orcamento_id_fkey ON public.atividades_crm IS 
  'Foreign key para orcamentos. Quando um orçamento é deletado, as atividades CRM vinculadas são deletadas automaticamente.';



-- ============================================
-- Migration: 20260114_verificar_constraints.sql
-- ============================================

-- =============================================
-- VERIFICAÇÃO: Listar todas as constraints que referenciam orcamentos
-- Execute este SQL ANTES e DEPOIS do fix para comparar
-- =============================================

SELECT 
  tc.table_name AS "Tabela",
  kcu.column_name AS "Coluna",
  ccu.table_name AS "Tabela Referenciada",
  ccu.column_name AS "Coluna Referenciada",
  rc.delete_rule AS "Regra de Delete",
  CASE 
    WHEN rc.delete_rule = 'CASCADE' THEN '✅ CORRETO'
    WHEN rc.delete_rule = 'SET NULL' THEN '❌ PRECISA CORRIGIR'
    WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOQUEIA DELETE'
    ELSE '⚠️  ' || rc.delete_rule
  END AS "Status",
  tc.constraint_name AS "Nome da Constraint"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'orcamentos'
  AND ccu.column_name = 'id'
ORDER BY tc.table_name, kcu.column_name;



-- ============================================
-- Migration: 20260115_add_theme_support.sql
-- ============================================

-- =====================================================
-- Adicionar suporte a temas na tabela organizations
-- =====================================================

-- Adicionar coluna theme_name para armazenar o tema escolhido
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS theme_name TEXT DEFAULT 'default' CHECK (theme_name IN ('default', 'blue', 'green', 'purple', 'red', 'orange', 'teal', 'indigo'));

-- Adicionar comentário
COMMENT ON COLUMN public.organizations.theme_name IS 'Nome do tema de cores escolhido pela organização';

-- Atualizar organizações existentes para usar tema padrão
UPDATE public.organizations 
SET theme_name = 'default' 
WHERE theme_name IS NULL;



-- ============================================
-- Migration: 20260116000000_fix_user_onboarding_schema.sql
-- ============================================

-- =====================================================
-- CORREÇÃO: Garantir que a tabela user_onboarding existe
-- com todas as colunas necessárias
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  completed_tours TEXT[] DEFAULT '{}',
  skipped BOOLEAN DEFAULT FALSE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se não existirem (para casos onde a tabela existe mas faltam colunas)
DO $$ 
BEGIN
  -- Adicionar completed_tours se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'completed_tours'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN completed_tours TEXT[] DEFAULT '{}';
  END IF;

  -- Adicionar skipped se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'skipped'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN skipped BOOLEAN DEFAULT FALSE;
  END IF;

  -- Adicionar first_seen_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'first_seen_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN first_seen_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Adicionar last_seen_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN last_seen_at TIMESTAMPTZ;
  END IF;

  -- Adicionar created_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Adicionar updated_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_onboarding' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_onboarding 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable RLS se não estiver habilitado
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem (para evitar duplicação)
DROP POLICY IF EXISTS "Users can view own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.user_onboarding;

-- Criar RLS Policies
CREATE POLICY "Users can view own onboarding"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar trigger para updated_at se não existir
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON public.user_onboarding;

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário explicativo
COMMENT ON TABLE public.user_onboarding IS 
'Tabela para persistir estado de onboarding por usuário. Armazena quais tours foram completados, se o usuário pulou o onboarding, e quando foi visto pela primeira/última vez.';



-- ============================================
-- Migration: 20260116000001_domains_structure.sql
-- ============================================

-- =====================================================
-- ESTRUTURA DE DOMÍNIOS CORRIGIDA
-- Separa domínio de tipo de organização
-- Baseado em padrões de mercado (Shopify, Salesforce)
-- =====================================================

-- 1. Adicionar type à organizations (se não existir)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client' 
  CHECK (type IN ('client', 'internal'));

-- Comentário explicativo
COMMENT ON COLUMN public.organizations.type IS 
'client: cliente normal (Prisma, outros). internal: organização interna (ex: StudioOS para testes)';

-- Atualizar Prisma para type = 'client' (não é tipo especial)
UPDATE public.organizations 
SET type = 'client' 
WHERE slug = 'prisma' AND (type IS NULL OR type != 'client');

-- 2. Criar tabela domains
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
  -- 'marketing': Landing page / marketing
  -- 'app': Sistema logado (ERP)
  -- 'admin': Painel administrativo StudioOS
  -- 'supplier': Portal de fornecedores
  
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- NULL se role = 'admin' ou 'supplier' (não pertence a organização)
  
  app_path TEXT DEFAULT '/app', -- Caminho para sistema (ex: '/app', '/sistema')
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT domain_role_org_check CHECK (
    (role IN ('admin', 'supplier') AND organization_id IS NULL) OR
    (role IN ('marketing', 'app') AND organization_id IS NOT NULL)
  )
);

-- Comentários
COMMENT ON TABLE public.domains IS 
'Tabela de domínios e subdomínios. Separa responsabilidade de domínio do tipo de organização.';

COMMENT ON COLUMN public.domains.hostname IS 'Domínio completo (ex: prismadecor.com.br, studioos.pro)';
COMMENT ON COLUMN public.domains.role IS 'Papel do domínio: marketing, app, admin ou supplier';
COMMENT ON COLUMN public.domains.organization_id IS 'ID da organização (NULL para admin/supplier)';
COMMENT ON COLUMN public.domains.app_path IS 'Caminho para sistema logado (padrão: /app)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_domains_hostname ON public.domains(hostname) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_domains_organization ON public.domains(organization_id) WHERE organization_id IS NOT NULL;

-- 3. Criar tabela suppliers (portal de fornecedores)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  cnpj TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.suppliers IS 
'Fornecedores do sistema. Entidade separada de organizations (não são tenants do ERP).';

-- 4. Relacionamento supplier ↔ organization
CREATE TABLE IF NOT EXISTS public.supplier_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);

COMMENT ON TABLE public.supplier_organizations IS 
'Relacionamento muitos-para-muitos: fornecedor pode trabalhar com múltiplas organizações.';

-- 5. RLS para domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains"
  ON public.domains FOR SELECT
  USING (active = true);

-- 6. RLS para suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Suppliers podem ver seus próprios dados
CREATE POLICY "Suppliers can view own data"
  ON public.suppliers FOR SELECT
  USING (
    -- Futuro: vincular com auth.users quando implementar login de fornecedores
    active = true
  );

-- Organizations podem ver fornecedores vinculados
CREATE POLICY "Organizations can view linked suppliers"
  ON public.suppliers FOR SELECT
  USING (
    id IN (
      SELECT supplier_id 
      FROM public.supplier_organizations 
      WHERE organization_id = (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
        LIMIT 1
      )
      AND active = true
    )
  );

-- 7. RLS para supplier_organizations
ALTER TABLE public.supplier_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their suppliers"
  ON public.supplier_organizations FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- 8. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Dados iniciais (exemplos)
-- StudioOS marketing
INSERT INTO public.domains (hostname, role, app_path)
VALUES ('studioos.pro', 'marketing', '/app')
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS admin (mesmo domínio, role diferente)
INSERT INTO public.domains (hostname, role)
VALUES ('studioos.pro', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Portal fornecedores
INSERT INTO public.domains (hostname, role)
VALUES ('fornecedores.studioos.pro', 'supplier')
ON CONFLICT (hostname) DO NOTHING;

-- Prisma (se existir)
INSERT INTO public.domains (hostname, role, organization_id, app_path)
SELECT 
  'prismadecor.com.br',
  'marketing',
  id,
  '/app'
FROM public.organizations
WHERE slug = 'prisma'
ON CONFLICT (hostname) DO NOTHING;

-- Comentário final
COMMENT ON SCHEMA public IS 
'Estrutura de domínios corrigida: separa responsabilidade de domínio do tipo de organização. 
Baseado em padrões de mercado (Shopify, Salesforce, GoHighLevel).';



-- ============================================
-- Migration: 20260116000002_domains_subdomains.sql
-- ============================================

-- =====================================================
-- ESTRUTURA DE DOMÍNIOS - SUBDOMÍNIOS (PADRÃO MERCADO)
-- Baseado em Shopify, Salesforce, GoHighLevel
-- =====================================================

-- 1. Adicionar type à organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client' 
  CHECK (type IN ('client', 'internal'));

COMMENT ON COLUMN public.organizations.type IS 
'client: cliente normal (Prisma, outros). internal: organização interna (ex: StudioOS para testes)';

-- Atualizar Prisma para type = 'client'
UPDATE public.organizations 
SET type = 'client' 
WHERE slug = 'prisma' AND (type IS NULL OR type != 'client');

-- 2. Criar tabela domains (hostname único por subdomínio)
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT UNIQUE NOT NULL, -- Cada subdomínio é único
  role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
  -- 'marketing': Landing page / marketing
  -- 'app': Sistema logado (ERP) - sempre com organization_id
  -- 'admin': Painel administrativo StudioOS - organization_id NULL
  -- 'supplier': Portal de fornecedores - organization_id NULL
  
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- NULL para role='admin' ou 'supplier' (plataforma)
  -- NOT NULL para role='marketing' ou 'app' (cliente)
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT domain_role_org_check CHECK (
    (role IN ('admin', 'supplier') AND organization_id IS NULL) OR
    (role IN ('marketing', 'app') AND organization_id IS NOT NULL)
  )
);

COMMENT ON TABLE public.domains IS 
'Tabela de domínios e subdomínios. Cada subdomínio é único (ex: app.prismadecorlab.com).';

COMMENT ON COLUMN public.domains.hostname IS 'Domínio completo (ex: prismadecorlab.com, app.prismadecorlab.com, panel.studioos.pro)';
COMMENT ON COLUMN public.domains.role IS 'Papel do domínio: marketing, app, admin ou supplier';
COMMENT ON COLUMN public.domains.organization_id IS 'ID da organização (NULL para admin/supplier, NOT NULL para marketing/app)';

-- Índices
-- ⚠️ NOTA: hostname já tem UNIQUE constraint na coluna, não precisamos de índice único adicional
-- O UNIQUE na coluna garante unicidade global (mesmo para active = false)
CREATE INDEX idx_domains_organization ON public.domains(organization_id) WHERE organization_id IS NOT NULL;

-- 3. Criar tabela suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  cnpj TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.suppliers IS 
'Fornecedores do sistema. Entidade separada de organizations (não são tenants do ERP).';

-- 4. Criar tabela supplier_users (AUTH CORRETA)
CREATE TABLE IF NOT EXISTS public.supplier_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'supplier' CHECK (role IN ('supplier', 'admin')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, user_id)
);

COMMENT ON TABLE public.supplier_users IS 
'Relacionamento fornecedor ↔ usuário. Auth baseada em auth.uid() (padrão Supabase).';

-- 5. Relacionamento supplier ↔ organization
CREATE TABLE IF NOT EXISTS public.supplier_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);

COMMENT ON TABLE public.supplier_organizations IS 
'Relacionamento muitos-para-muitos: fornecedor pode trabalhar com múltiplas organizações.';

-- 6. RLS para domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains"
  ON public.domains FOR SELECT
  USING (active = true);

-- 7. RLS para suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own data"
  ON public.suppliers FOR SELECT
  USING (
    id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid()
    )
  );

-- Organizations podem ver fornecedores vinculados
CREATE POLICY "Organizations can view linked suppliers"
  ON public.suppliers FOR SELECT
  USING (
    id IN (
      SELECT supplier_id 
      FROM public.supplier_organizations 
      WHERE organization_id = (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
        LIMIT 1
      )
      AND active = true
    )
  );

-- 8. RLS para supplier_users
ALTER TABLE public.supplier_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own users"
  ON public.supplier_users FOR SELECT
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid()
    )
  );

-- 9. RLS para supplier_organizations
ALTER TABLE public.supplier_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their suppliers"
  ON public.supplier_organizations FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- 10. Triggers para updated_at
DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Criar organização interna StudioOS (para vincular marketing)
-- 
-- ⚠️ IMPORTANTE: slug 'studioos' é RESERVADO para a plataforma.
-- Nenhuma organização cliente pode usar este slug.
-- 
-- Esta organização é usada para:
-- - Vincular domínio marketing StudioOS (studioos.pro)
-- - Manter constraint válida (marketing sempre tem organization_id)
-- - Não poluir lista de clientes (type='internal')
--
-- Validação futura: Criar constraint ou validação no admin para prevenir uso deste slug.
INSERT INTO public.organizations (id, name, slug, type, active)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- ID fixo para StudioOS
  'StudioOS',
  'studioos', -- ⚠️ SLUG RESERVADO - não pode ser usado por clientes
  'internal',
  true
)
ON CONFLICT (id) DO UPDATE SET type = 'internal';

-- Garantir que o slug 'studioos' não seja usado por outras organizações
-- (Validação futura: criar constraint ou trigger)

-- 12. Dados iniciais (exemplos)
-- StudioOS marketing (vinculado à org interna)
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'studioos.pro', 
  'marketing',
  '00000000-0000-0000-0000-000000000001' -- Org interna StudioOS
)
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS admin
INSERT INTO public.domains (hostname, role)
VALUES ('panel.studioos.pro', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Portal fornecedores
INSERT INTO public.domains (hostname, role)
VALUES ('fornecedores.studioos.pro', 'supplier')
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS app fallback (app.studioos.pro)
-- ⚠️ FALLBACK COMERCIAL: Permite onboarding de clientes antes de configurar DNS
-- Cliente pode usar app.studioos.pro enquanto não configura app.cliente.com.br
-- Vinculado à org interna StudioOS para permitir acesso ao sistema
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'app.studioos.pro',
  'app',
  '00000000-0000-0000-0000-000000000001' -- Org interna StudioOS
)
ON CONFLICT (hostname) DO NOTHING;

-- Prisma marketing (exemplo - ajustar hostname real quando configurado)
-- INSERT INTO public.domains (hostname, role, organization_id)
-- SELECT 
--   'prismadecorlab.com',
--   'marketing',
--   id
-- FROM public.organizations
-- WHERE slug = 'prisma'
-- ON CONFLICT (hostname) DO NOTHING;

-- Prisma app (exemplo - ajustar hostname real quando configurado)
-- INSERT INTO public.domains (hostname, role, organization_id)
-- SELECT 
--   'app.prismadecorlab.com',
--   'app',
--   id
-- FROM public.organizations
-- WHERE slug = 'prisma'
-- ON CONFLICT (hostname) DO NOTHING;

-- Comentário final
COMMENT ON SCHEMA public IS 
'Estrutura de domínios com subdomínios (padrão mercado). 
Cada subdomínio é único: seudominio.com (marketing) + app.seudominio.com (app).';



-- ============================================
-- Migration: 20260116_add_landing_page_fields.sql
-- ============================================

-- =====================================================
-- ADICIONAR CAMPOS DE PERSONALIZAÇÃO DA LANDING PAGE
-- =====================================================
-- 
-- Permite que cada organização personalize sua landing page
-- com textos, imagens e configurações específicas
-- =====================================================

-- Campos de conteúdo da LP
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS lp_hero_title TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_description TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS lp_hero_button_text TEXT DEFAULT 'Agendar Visita Gratuita',
ADD COLUMN IF NOT EXISTS lp_about_title TEXT,
ADD COLUMN IF NOT EXISTS lp_about_description TEXT,
ADD COLUMN IF NOT EXISTS lp_about_image_url TEXT,
ADD COLUMN IF NOT EXISTS lp_benefits_title TEXT,
ADD COLUMN IF NOT EXISTS lp_benefits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lp_testimonials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lp_faq JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lp_instagram_url TEXT,
ADD COLUMN IF NOT EXISTS lp_facebook_url TEXT,
ADD COLUMN IF NOT EXISTS lp_custom_domain TEXT,
ADD COLUMN IF NOT EXISTS lp_enabled BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN public.organizations.lp_hero_title IS 'Título principal da hero section da landing page';
COMMENT ON COLUMN public.organizations.lp_hero_subtitle IS 'Subtítulo da hero section';
COMMENT ON COLUMN public.organizations.lp_hero_description IS 'Descrição da hero section';
COMMENT ON COLUMN public.organizations.lp_hero_image_url IS 'URL da imagem de fundo da hero section';
COMMENT ON COLUMN public.organizations.lp_hero_button_text IS 'Texto do botão principal da hero';
COMMENT ON COLUMN public.organizations.lp_about_title IS 'Título da seção sobre';
COMMENT ON COLUMN public.organizations.lp_about_description IS 'Descrição da seção sobre';
COMMENT ON COLUMN public.organizations.lp_about_image_url IS 'URL da imagem da seção sobre';
COMMENT ON COLUMN public.organizations.lp_benefits_title IS 'Título da seção de benefícios';
COMMENT ON COLUMN public.organizations.lp_benefits IS 'Array JSON com benefícios [{title, description, icon}]';
COMMENT ON COLUMN public.organizations.lp_testimonials IS 'Array JSON com depoimentos [{name, text, rating}]';
COMMENT ON COLUMN public.organizations.lp_faq IS 'Array JSON com perguntas frequentes [{question, answer}]';
COMMENT ON COLUMN public.organizations.lp_instagram_url IS 'URL do Instagram';
COMMENT ON COLUMN public.organizations.lp_facebook_url IS 'URL do Facebook';
COMMENT ON COLUMN public.organizations.lp_custom_domain IS 'Domínio personalizado para a landing page (ex: empresa.com.br)';
COMMENT ON COLUMN public.organizations.lp_enabled IS 'Se a landing page está habilitada para esta organização';

-- Preencher dados padrão para a Prisma (exemplo)
UPDATE public.organizations SET
  lp_hero_title = 'Cortinas e Persianas',
  lp_hero_subtitle = 'Sob Medida',
  lp_hero_description = 'Transforme seus ambientes com elegância e funcionalidade. Soluções personalizadas em cortinas e persianas que combinam design sofisticado com qualidade superior.',
  lp_hero_button_text = 'Agendar Visita Gratuita',
  lp_about_title = 'Sobre a Prisma',
  lp_about_description = 'Transformando ambientes com elegância, qualidade e sofisticação desde 2020.',
  lp_benefits_title = 'Por que escolher a Prisma?',
  lp_benefits = '[
    {"title": "Orçamento Gratuito", "description": "Sem compromisso, avaliação completa do seu espaço", "icon": "FileText"},
    {"title": "Visita Flexível", "description": "Agendamos no horário que melhor se adequa à sua rotina", "icon": "Calendar"},
    {"title": "Instalação Inclusa", "description": "Profissionais especializados cuidam de tudo para você", "icon": "Wrench"}
  ]'::jsonb,
  lp_instagram_url = 'https://www.instagram.com/prismainter/',
  lp_enabled = true
WHERE slug = 'prisma';

-- Criar índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain ON public.organizations(lp_custom_domain) WHERE lp_custom_domain IS NOT NULL;



-- ============================================
-- Migration: 20260116_add_missing_pedidos_columns.sql
-- ============================================

-- =============================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA PEDIDOS
-- =============================================
-- 
-- Problema identificado:
-- - Código está tentando usar 'data_prevista' mas schema tem 'previsao_entrega'
-- - Código está tentando usar 'observacoes' mas schema tem 'observacoes_producao'
--
-- Solução: Adicionar colunas faltantes para manter compatibilidade
-- =============================================

-- Adicionar coluna data_prevista (alias para previsao_entrega ou campo separado)
-- Vamos adicionar como TIMESTAMP para ser mais flexível que DATE
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS data_prevista TIMESTAMP WITH TIME ZONE;

-- Se previsao_entrega já tiver dados, copiar para data_prevista
UPDATE public.pedidos 
SET data_prevista = previsao_entrega::TIMESTAMP WITH TIME ZONE
WHERE previsao_entrega IS NOT NULL AND data_prevista IS NULL;

-- Adicionar coluna observacoes (alias para observacoes_producao)
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Se observacoes_producao já tiver dados, copiar para observacoes
UPDATE public.pedidos 
SET observacoes = observacoes_producao
WHERE observacoes_producao IS NOT NULL AND observacoes IS NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pedidos_data_prevista ON public.pedidos(data_prevista);

-- Comentários para documentação
COMMENT ON COLUMN public.pedidos.data_prevista IS 'Data prevista de entrega (alias para previsao_entrega, mantida para compatibilidade)';
COMMENT ON COLUMN public.pedidos.observacoes IS 'Observações do pedido (alias para observacoes_producao, mantida para compatibilidade)';



-- ============================================
-- Migration: 20260117000000_supplier_catalog_v1.sql
-- ============================================

-- ============================================================
-- SUPPLIER CATALOG V1
-- ============================================================
-- Migration para implementar catálogo de materiais por fornecedor
-- Data: 2026-01-17
-- ============================================================

-- 1. Atualizar tabela suppliers: adicionar service_states
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS service_states TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.suppliers.service_states IS 
'Lista de UFs (estados) atendidas pelo fornecedor. Ex: ["SC", "PR", "RS", "SP", "RJ"].';

-- Validação simples: apenas 2 letras maiúsculas (opcional, via trigger ou app)
-- No V1, validação será feita no frontend

-- 2. Criar tabela supplier_materials (catálogo do fornecedor)
CREATE TABLE IF NOT EXISTS public.supplier_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT, -- ex: "m", "un", "rolo"
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Evitar duplicatas: sku único por fornecedor (se sku não for null)
  CONSTRAINT supplier_materials_supplier_sku_unique 
    UNIQUE NULLS NOT DISTINCT (supplier_id, sku)
);

COMMENT ON TABLE public.supplier_materials IS 
'Catálogo de materiais de cada fornecedor. Fonte única de verdade controlada pelo fornecedor.';

COMMENT ON COLUMN public.supplier_materials.sku IS 
'Código SKU do fornecedor. Opcional, mas se fornecido deve ser único por fornecedor.';

COMMENT ON COLUMN public.supplier_materials.price IS 
'Preço global do material (mesmo preço para todos os clientes no V1).';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier_active 
  ON public.supplier_materials(supplier_id, active) 
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier_name 
  ON public.supplier_materials(supplier_id, name);

CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier_sku 
  ON public.supplier_materials(supplier_id, sku) 
  WHERE sku IS NOT NULL;

-- 3. Criar tabela supplier_material_imports (histórico de import CSV)
CREATE TABLE IF NOT EXISTS public.supplier_material_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' 
    CHECK (status IN ('uploaded', 'validated', 'applied', 'failed')),
  total_rows INT DEFAULT 0,
  inserted INT DEFAULT 0,
  updated INT DEFAULT 0,
  deactivated INT DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.supplier_material_imports IS 
'Histórico de importações CSV de materiais por fornecedor.';

COMMENT ON COLUMN public.supplier_material_imports.errors IS 
'Array JSON com erros encontrados durante a importação. Ex: [{"row": 5, "field": "price", "error": "Preço inválido"}]';

-- Índice para histórico
CREATE INDEX IF NOT EXISTS idx_supplier_material_imports_supplier 
  ON public.supplier_material_imports(supplier_id, created_at DESC);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supplier_materials_updated_at ON public.supplier_materials;
CREATE TRIGGER update_supplier_materials_updated_at
  BEFORE UPDATE ON public.supplier_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_material_imports_updated_at ON public.supplier_material_imports;
CREATE TRIGGER update_supplier_material_imports_updated_at
  BEFORE UPDATE ON public.supplier_material_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS para supplier_materials
ALTER TABLE public.supplier_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Fornecedor pode gerenciar apenas seus próprios materiais
CREATE POLICY "Suppliers can manage own materials"
  ON public.supplier_materials
  FOR ALL
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  )
  WITH CHECK (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  );

-- Policy: Organização cliente pode APENAS LER materiais de fornecedores vinculados e ativos
-- IMPORTANTE: NUNCA pode INSERT/UPDATE/DELETE
CREATE POLICY "Organizations can view linked supplier materials"
  ON public.supplier_materials
  FOR SELECT
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND so.active = true
    )
    AND active = true
  );

-- 6. RLS para supplier_material_imports
ALTER TABLE public.supplier_material_imports ENABLE ROW LEVEL SECURITY;

-- Policy: Fornecedor pode ver apenas seus próprios imports
CREATE POLICY "Suppliers can view own imports"
  ON public.supplier_material_imports
  FOR SELECT
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  );

-- Policy: Fornecedor pode criar/atualizar apenas seus próprios imports
CREATE POLICY "Suppliers can manage own imports"
  ON public.supplier_material_imports
  FOR ALL
  USING (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  )
  WITH CHECK (
    supplier_id IN (
      SELECT supplier_id 
      FROM public.supplier_users 
      WHERE user_id = auth.uid() 
        AND active = true
    )
  );

-- 7. Função auxiliar para buscar materiais de fornecedores ativos de uma organização
-- (útil para queries no frontend)
CREATE OR REPLACE FUNCTION public.get_organization_supplier_materials(
  p_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  supplier_id UUID,
  supplier_name TEXT,
  sku TEXT,
  name TEXT,
  description TEXT,
  unit TEXT,
  price NUMERIC,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sm.id,
    sm.supplier_id,
    s.name AS supplier_name,
    sm.sku,
    sm.name,
    sm.description,
    sm.unit,
    sm.price,
    sm.active,
    sm.created_at,
    sm.updated_at
  FROM public.supplier_materials sm
  INNER JOIN public.suppliers s ON sm.supplier_id = s.id
  INNER JOIN public.supplier_organizations so 
    ON sm.supplier_id = so.supplier_id
  WHERE so.organization_id = p_organization_id
    AND so.active = true
    AND sm.active = true
    AND s.active = true
  ORDER BY s.name, sm.name;
$$;

COMMENT ON FUNCTION public.get_organization_supplier_materials IS 
'Retorna materiais de fornecedores ativos vinculados à organização. Função auxiliar para queries.';



-- ============================================
-- Migration: 20260117000001_supplier_self_service_registration.sql
-- ============================================

-- ============================================================
-- SUPPLIER SELF-SERVICE REGISTRATION + APPROVAL
-- ============================================================
-- Migration para permitir cadastro público de fornecedores
-- com sistema de aprovação manual
-- Data: 2026-01-17
-- ============================================================

-- 1. Adicionar coluna status em suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL;

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL;

-- Adicionar campo de categorias de produtos
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS product_categories TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.suppliers.status IS 
'Status de aprovação do fornecedor: pending (aguardando), approved (aprovado), rejected (rejeitado)';

COMMENT ON COLUMN public.suppliers.approved_at IS 
'Data/hora da aprovação do cadastro';

COMMENT ON COLUMN public.suppliers.rejected_at IS 
'Data/hora da rejeição do cadastro';

COMMENT ON COLUMN public.suppliers.product_categories IS 
'Categorias de produtos que o fornecedor trabalha: tecidos, papel-de-parede, trilho, moveis-soltos, motorizacao';

-- 2. Atualizar suppliers existentes para 'approved' (compatibilidade)
UPDATE public.suppliers 
SET status = 'approved', approved_at = created_at
WHERE status = 'pending' AND created_at < now();

-- 3. Remover função antiga se existir (com assinatura diferente)
-- Remove todas as possíveis versões da função (com e sem product_categories)
DO $$ 
BEGIN
  -- Tenta remover todas as versões possíveis
  DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], UUID);
  DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID);
EXCEPTION 
  WHEN OTHERS THEN
    -- Se der erro, continua (função pode não existir)
    NULL;
END $$;

-- 4. Criar função RPC para cadastro público seguro (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.register_supplier(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_service_states TEXT[] DEFAULT '{}',
  p_product_categories TEXT[] DEFAULT '{}',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_supplier_id UUID;
  v_user_id_final UUID;
BEGIN
  -- Validar inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Nome da empresa é obrigatório';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'E-mail é obrigatório';
  END IF;

  -- Gerar slug do nome
  v_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi'));
  v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
  
  -- Garantir unicidade do slug
  WHILE EXISTS (SELECT 1 FROM public.suppliers WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || floor(random() * 1000)::text;
  END LOOP;

  -- Usar user_id fornecido ou auth.uid() se disponível
  v_user_id_final := COALESCE(p_user_id, auth.uid());

  -- Criar ou atualizar supplier (upsert por email ou CNPJ se fornecido)
  INSERT INTO public.suppliers (
    name,
    slug,
    email,
    phone,
    cnpj,
    service_states,
    product_categories,
    status,
    active
  ) VALUES (
    trim(p_name),
    v_slug,
    trim(lower(p_email)),
    CASE WHEN p_phone IS NOT NULL THEN trim(p_phone) ELSE NULL END,
    CASE WHEN p_cnpj IS NOT NULL THEN trim(p_cnpj) ELSE NULL END,
    COALESCE(p_service_states, '{}'),
    COALESCE(p_product_categories, '{}'),
    'pending',
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    cnpj = EXCLUDED.cnpj,
    service_states = EXCLUDED.service_states,
    product_categories = EXCLUDED.product_categories,
    status = CASE 
      WHEN suppliers.status = 'approved' THEN 'approved' -- Manter aprovado se já estava
      ELSE 'pending' 
    END
  RETURNING id INTO v_supplier_id;

  -- Criar vínculo supplier_users automaticamente (mesmo com status='pending')
  -- Isso permite acesso limitado ao portal enquanto aguarda aprovação
  IF v_user_id_final IS NOT NULL THEN
    INSERT INTO public.supplier_users (
      supplier_id,
      user_id,
      role,
      active
    ) VALUES (
      v_supplier_id,
      v_user_id_final,
      'supplier',
      true
    )
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET
      active = true,
      role = 'supplier';
  END IF;

  -- Confirmar email automaticamente (MVP - não exigir confirmação manual)
  -- Isso permite login imediato após cadastro
  IF v_user_id_final IS NOT NULL THEN
    -- Atualizar email_confirmed_at via admin API (SECURITY DEFINER permite)
    -- Nota: Isso só funciona se a política do Supabase permitir
    -- Se não funcionar, o usuário precisará confirmar via email ou admin precisa confirmar manualmente
    UPDATE auth.users
    SET email_confirmed_at = now()
    WHERE id = v_user_id_final
      AND email_confirmed_at IS NULL;
  END IF;

  RETURN v_supplier_id;
END;
$$;

COMMENT ON FUNCTION public.register_supplier IS 
'Função RPC para cadastro público de fornecedores. Cria supplier com status=pending. Requer aprovação manual.';

-- 5. Permitir execução pública da função (apenas para cadastro)
-- Especificar assinatura completa para evitar ambiguidade
GRANT EXECUTE ON FUNCTION public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) TO anon, authenticated;

-- 5. Ajustar RLS para permitir INSERT via função (já é SECURITY DEFINER, então bypassa RLS)
-- Mas manter RLS nas policies existentes para SELECT/UPDATE

-- 6. Atualizar policy de suppliers para considerar status
-- (Manter policies existentes, apenas adicionar verificação de status onde necessário)

-- 7. Criar função auxiliar para aprovar fornecedor (para uso manual no Supabase)
CREATE OR REPLACE FUNCTION public.approve_supplier(
  p_supplier_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar status do supplier
  UPDATE public.suppliers
  SET 
    status = 'approved',
    approved_at = now()
  WHERE id = p_supplier_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fornecedor não encontrado ou já aprovado/rejeitado';
  END IF;

  -- Criar vínculo supplier_users se não existir
  INSERT INTO public.supplier_users (
    supplier_id,
    user_id,
    role,
    active
  ) VALUES (
    p_supplier_id,
    p_user_id,
    'supplier',
    true
  )
  ON CONFLICT (supplier_id, user_id) DO UPDATE SET
    active = true,
    role = 'supplier';

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função auxiliar para aprovar fornecedor manualmente. Atualiza status e cria vínculo supplier_users.';

-- 9. Ajustar SupplierPortal: verificar status na policy de supplier_users
-- (Isso será feito no código frontend, mas podemos adicionar uma view auxiliar)

-- 10. Remover view antiga e recriar com product_categories
DROP VIEW IF EXISTS public.supplier_pending_registrations CASCADE;

-- 11. Criar view auxiliar para ver fornecedores pendentes (útil para admin)
CREATE OR REPLACE VIEW public.supplier_pending_registrations AS
SELECT 
  s.id,
  s.name,
  s.slug,
  s.email,
  s.phone,
  s.cnpj,
  s.service_states,
  s.product_categories,
  s.status,
  s.created_at,
  s.updated_at,
  -- Tentar encontrar user_id pelo email
  (
    SELECT id 
    FROM auth.users 
    WHERE email = s.email 
    LIMIT 1
  ) AS user_id
FROM public.suppliers s
WHERE s.status = 'pending'
ORDER BY s.created_at DESC;

COMMENT ON VIEW public.supplier_pending_registrations IS 
'View auxiliar para listar fornecedores pendentes de aprovação. Útil para aprovação manual via Supabase Dashboard.';

-- 12. RLS para a view (apenas admins podem ver, mas no MVP será público para facilitar aprovação manual)
-- No futuro, quando houver painel admin, criar policy adequada
-- Por enquanto, deixar sem RLS específico (acesso via Supabase Dashboard com service_role)



-- ============================================
-- Migration: 20260117000002_supplier_hardening.sql
-- ============================================

-- ============================================================
-- SUPPLIER SELF-SERVICE HARDENING
-- ============================================================
-- Migration incremental para hardening do fluxo de cadastro
-- e aprovação de fornecedores
-- Data: 2026-01-17
-- ============================================================

-- ============================================================
-- 1. TRAVAR approve_supplier (service role / platform admin)
-- ============================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.approve_supplier(UUID, UUID) CASCADE;

-- Recriar função com verificação de autorização
CREATE OR REPLACE FUNCTION public.approve_supplier(
  p_supplier_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_jwt_role TEXT;
  v_is_platform_admin BOOLEAN := false;
BEGIN
  -- Verificar role do JWT (service_role ou authenticated)
  -- Nota: Em ambiente de produção, isso pode retornar NULL se não houver JWT
  -- Nesse caso, verificar via service_role diretamente
  BEGIN
    v_jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION
    WHEN OTHERS THEN
      v_jwt_role := NULL;
  END;
  
  -- Se não conseguir ler do JWT, verificar se é service_role via outra forma
  IF v_jwt_role IS NULL THEN
    -- Tentar verificar se está executando como service_role
    -- (service_role tem privilégios elevados)
    -- Se não conseguir determinar, negar por segurança
    v_jwt_role := 'authenticated'; -- Default para negar
  END IF;
  
  -- Verificar se é service_role (service key)
  IF v_jwt_role = 'service_role' THEN
    -- Autorizado - continuar
  ELSE
    -- Verificar se é platform admin (opcional - se existir mecanismo)
    -- Por enquanto, apenas service_role é permitido
    -- Se no futuro houver tabela de platform_admins, adicionar verificação aqui
    
    -- Se não for service_role, negar acesso
    RAISE EXCEPTION 'not_authorized: Apenas service_role pode aprovar fornecedores';
  END IF;

  -- Validar inputs
  IF p_supplier_id IS NULL THEN
    RAISE EXCEPTION 'supplier_id_required: ID do fornecedor é obrigatório';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório';
  END IF;

  -- Verificar se supplier existe
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RAISE EXCEPTION 'supplier_not_found: Fornecedor não encontrado';
  END IF;

  -- Atualizar status do supplier
  UPDATE public.suppliers
  SET 
    status = 'approved',
    approved_at = now(),
    updated_at = now()
  WHERE id = p_supplier_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'supplier_already_processed: Fornecedor não encontrado ou já aprovado/rejeitado';
  END IF;

  -- Criar vínculo supplier_users se não existir
  INSERT INTO public.supplier_users (
    supplier_id,
    user_id,
    role,
    active
  ) VALUES (
    p_supplier_id,
    p_user_id,
    'supplier',
    true
  )
  ON CONFLICT (supplier_id, user_id) DO UPDATE SET
    active = true,
    role = 'supplier';

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função para aprovar fornecedor. Apenas service_role pode executar. Requer supplier_id e user_id válidos.';

-- Remover permissões públicas (se existirem)
REVOKE EXECUTE ON FUNCTION public.approve_supplier(UUID, UUID) FROM anon, authenticated;

-- Garantir que apenas service_role pode executar
-- (service_role já tem acesso por padrão via SECURITY DEFINER)

-- ============================================================
-- 2. REMOVER/FECHAR acesso público à view supplier_pending_registrations
-- ============================================================

-- Revogar acesso público
REVOKE SELECT ON public.supplier_pending_registrations FROM anon, authenticated;

-- Garantir que apenas service_role pode acessar
-- (service_role já tem acesso por padrão)

COMMENT ON VIEW public.supplier_pending_registrations IS 
'View auxiliar para listar fornecedores pendentes de aprovação. Acesso restrito a service_role (admin manual via Supabase Dashboard).';

-- ============================================================
-- 3. SANITY-CHECK no register_supplier
-- ============================================================

-- Criar índices únicos para CNPJ e email (normalizados)
-- Primeiro, criar coluna auxiliar para CNPJ normalizado (apenas dígitos)
DO $$
BEGIN
  -- Adicionar coluna para CNPJ normalizado se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'suppliers' 
    AND column_name = 'cnpj_normalized'
  ) THEN
    ALTER TABLE public.suppliers 
    ADD COLUMN cnpj_normalized TEXT;
    
    -- Normalizar CNPJs existentes
    UPDATE public.suppliers
    SET cnpj_normalized = regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g')
    WHERE cnpj IS NOT NULL;
    
    -- Criar índice único para CNPJ normalizado
    CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_cnpj_normalized_unique 
    ON public.suppliers(cnpj_normalized) 
    WHERE cnpj_normalized IS NOT NULL AND cnpj_normalized != '';
    
    COMMENT ON COLUMN public.suppliers.cnpj_normalized IS 
    'CNPJ normalizado (apenas dígitos) para validação de unicidade';
  END IF;
END $$;

-- Criar índice único para email (já normalizado na função)
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_email_unique 
ON public.suppliers(lower(trim(email))) 
WHERE email IS NOT NULL AND email != '';

-- Remover função antiga
DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) CASCADE;

-- Recriar função com sanity-checks
CREATE OR REPLACE FUNCTION public.register_supplier(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_service_states TEXT[] DEFAULT '{}',
  p_product_categories TEXT[] DEFAULT '{}',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_slug TEXT;
  v_supplier_id UUID;
  v_user_id_final UUID;
  v_cnpj_normalized TEXT;
  v_email_normalized TEXT;
  v_slug_counter INT := 0;
  v_max_slug_attempts INT := 100;
BEGIN
  -- ============================================================
  -- VALIDAÇÃO DE INPUTS
  -- ============================================================
  
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'name_required: Nome da empresa é obrigatório';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'email_required: E-mail é obrigatório';
  END IF;

  -- Normalizar email (lowercase + trim)
  v_email_normalized := lower(trim(p_email));
  
  -- Validar formato básico de email
  IF v_email_normalized !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'email_invalid: Formato de e-mail inválido';
  END IF;

  -- Normalizar CNPJ (apenas dígitos)
  IF p_cnpj IS NOT NULL AND trim(p_cnpj) != '' THEN
    v_cnpj_normalized := regexp_replace(trim(p_cnpj), '[^0-9]', '', 'g');
    
    -- Validar tamanho do CNPJ (14 dígitos)
    IF length(v_cnpj_normalized) != 14 AND length(v_cnpj_normalized) != 0 THEN
      RAISE EXCEPTION 'cnpj_invalid: CNPJ deve ter 14 dígitos';
    END IF;
  ELSE
    v_cnpj_normalized := NULL;
  END IF;

  -- ============================================================
  -- ANTI-DUPLICIDADE: Verificar CNPJ
  -- ============================================================
  
  IF v_cnpj_normalized IS NOT NULL AND v_cnpj_normalized != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.suppliers 
      WHERE cnpj_normalized = v_cnpj_normalized
    ) THEN
      RAISE EXCEPTION 'cnpj_already_registered: CNPJ já cadastrado';
    END IF;
  END IF;

  -- ============================================================
  -- ANTI-DUPLICIDADE: Verificar Email
  -- ============================================================
  
  IF EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE lower(trim(email)) = v_email_normalized
  ) THEN
    RAISE EXCEPTION 'email_already_registered: E-mail já cadastrado';
  END IF;

  -- ============================================================
  -- GERAR SLUG ÚNICO
  -- ============================================================
  
  v_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi'));
  v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
  
  -- Garantir unicidade do slug com sufixo incremental
  WHILE EXISTS (SELECT 1 FROM public.suppliers WHERE slug = v_slug) AND v_slug_counter < v_max_slug_attempts LOOP
    v_slug_counter := v_slug_counter + 1;
    v_slug := regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi') || '-' || v_slug_counter::text;
    v_slug := lower(regexp_replace(v_slug, '^-|-$', '', 'g'));
  END LOOP;

  IF v_slug_counter >= v_max_slug_attempts THEN
    RAISE EXCEPTION 'slug_generation_failed: Não foi possível gerar slug único após múltiplas tentativas';
  END IF;

  -- ============================================================
  -- OBTER USER_ID
  -- ============================================================
  
  v_user_id_final := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id_final IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório (fornecido ou via auth)';
  END IF;

  -- ============================================================
  -- INSERIR SUPPLIER (STATUS SEMPRE 'pending')
  -- ============================================================
  
  INSERT INTO public.suppliers (
    name,
    slug,
    email,
    phone,
    cnpj,
    cnpj_normalized,
    service_states,
    product_categories,
    status,  -- SEMPRE 'pending' (não aceitar input)
    active
  ) VALUES (
    trim(p_name),
    v_slug,
    v_email_normalized,
    CASE WHEN p_phone IS NOT NULL AND trim(p_phone) != '' THEN trim(p_phone) ELSE NULL END,
    CASE WHEN p_cnpj IS NOT NULL AND trim(p_cnpj) != '' THEN trim(p_cnpj) ELSE NULL END,
    v_cnpj_normalized,
    COALESCE(p_service_states, '{}'),
    COALESCE(p_product_categories, '{}'),
    'pending',  -- FORÇAR status 'pending' (ignorar qualquer input)
    true
  )
  RETURNING id INTO v_supplier_id;

  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'insert_failed: Erro ao inserir fornecedor';
  END IF;

  -- ============================================================
  -- CRIAR VÍNCULO supplier_users
  -- ============================================================
  
  IF v_user_id_final IS NOT NULL THEN
    INSERT INTO public.supplier_users (
      supplier_id,
      user_id,
      role,
      active
    ) VALUES (
      v_supplier_id,
      v_user_id_final,
      'supplier',
      true
    )
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET
      active = true,
      role = 'supplier';
  END IF;

  -- ============================================================
  -- CONFIRMAR EMAIL AUTOMATICAMENTE (SEM CONFIRMAÇÃO POR EMAIL)
  -- ============================================================
  -- Como temos aprovação manual de fornecedores, não precisamos
  -- de confirmação de email. Confirmamos automaticamente aqui.
  
  IF v_user_id_final IS NOT NULL THEN
    BEGIN
      -- Confirmar email imediatamente (não requer confirmação por email)
      UPDATE auth.users
      SET email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE id = v_user_id_final
        AND email_confirmed_at IS NULL;
        
      -- Se a atualização não funcionar (por questões de segurança do Supabase),
      -- o usuário ainda poderá fazer login se a confirmação de email estiver
      -- desabilitada no Dashboard do Supabase
    EXCEPTION
      WHEN OTHERS THEN
        -- Se falhar, apenas logar (não quebrar o cadastro)
        -- Nota: Se isso falhar, o usuário precisará que a confirmação de email
        -- esteja desabilitada no Supabase Dashboard
        RAISE WARNING 'Não foi possível confirmar email automaticamente: %. Certifique-se de que a confirmação de email está desabilitada no Supabase Dashboard.', SQLERRM;
    END;
  END IF;

  RETURN v_supplier_id;
END;
$$;

COMMENT ON FUNCTION public.register_supplier IS 
'Função RPC para cadastro público de fornecedores. 
- Status sempre "pending" (não aceita input)
- Normaliza CNPJ (apenas dígitos) e email (lowercase/trim)
- Bloqueia duplicidade por CNPJ e email
- Gera slug único com sufixo incremental
- Requer aprovação manual via approve_supplier (service_role)';

-- Manter permissão pública para cadastro (anon/authenticated)
GRANT EXECUTE ON FUNCTION public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) TO anon, authenticated;

-- ============================================================
-- TRIGGER PARA MANTER cnpj_normalized ATUALIZADO
-- ============================================================

-- Criar função para atualizar cnpj_normalized automaticamente
CREATE OR REPLACE FUNCTION public.update_supplier_cnpj_normalized()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.cnpj IS NOT NULL AND trim(NEW.cnpj) != '' THEN
    NEW.cnpj_normalized := regexp_replace(trim(NEW.cnpj), '[^0-9]', '', 'g');
  ELSE
    NEW.cnpj_normalized := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_supplier_cnpj_normalized ON public.suppliers;
CREATE TRIGGER trigger_update_supplier_cnpj_normalized
  BEFORE INSERT OR UPDATE OF cnpj ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_cnpj_normalized();

COMMENT ON FUNCTION public.update_supplier_cnpj_normalized IS 
'Trigger para manter cnpj_normalized atualizado automaticamente quando cnpj é inserido ou atualizado.';



-- ============================================
-- Migration: 20260117000003_fix_supplier_users_updated_at.sql
-- ============================================

-- ============================================================
-- FIX: Remover referência a updated_at em supplier_users
-- ============================================================
-- A tabela supplier_users não possui coluna updated_at
-- Esta migration corrige a função approve_supplier que tentava atualizá-la
-- Data: 2026-01-17
-- ============================================================

-- Recriar função approve_supplier sem referência a updated_at
CREATE OR REPLACE FUNCTION public.approve_supplier(
  p_supplier_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_jwt_role TEXT;
  v_is_platform_admin BOOLEAN := false;
BEGIN
  -- Verificar role do JWT (service_role ou authenticated)
  -- Nota: Em ambiente de produção, isso pode retornar NULL se não houver JWT
  -- Nesse caso, verificar via service_role diretamente
  BEGIN
    v_jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION
    WHEN OTHERS THEN
      v_jwt_role := NULL;
  END;
  
  -- Se não conseguir ler do JWT, verificar se é service_role via outra forma
  IF v_jwt_role IS NULL THEN
    -- Tentar verificar se está executando como service_role
    -- (service_role tem privilégios elevados)
    -- Se não conseguir determinar, negar por segurança
    v_jwt_role := 'authenticated'; -- Default para negar
  END IF;
  
  -- Verificar se é service_role (service key)
  IF v_jwt_role = 'service_role' THEN
    -- Autorizado - continuar
  ELSE
    -- Verificar se é platform admin (opcional - se existir mecanismo)
    -- Por enquanto, apenas service_role é permitido
    -- Se no futuro houver tabela de platform_admins, adicionar verificação aqui
    
    -- Se não for service_role, negar acesso
    RAISE EXCEPTION 'not_authorized: Apenas service_role pode aprovar fornecedores';
  END IF;

  -- Validar inputs
  IF p_supplier_id IS NULL THEN
    RAISE EXCEPTION 'supplier_id_required: ID do fornecedor é obrigatório';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório';
  END IF;

  -- Verificar se supplier existe
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RAISE EXCEPTION 'supplier_not_found: Fornecedor não encontrado';
  END IF;

  -- Atualizar status do supplier
  UPDATE public.suppliers
  SET 
    status = 'approved',
    approved_at = now(),
    updated_at = now()
  WHERE id = p_supplier_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'supplier_already_processed: Fornecedor não encontrado ou já aprovado/rejeitado';
  END IF;

  -- Criar vínculo supplier_users se não existir
  -- NOTA: supplier_users não possui coluna updated_at, então não tentamos atualizá-la
  INSERT INTO public.supplier_users (
    supplier_id,
    user_id,
    role,
    active
  ) VALUES (
    p_supplier_id,
    p_user_id,
    'supplier',
    true
  )
  ON CONFLICT (supplier_id, user_id) DO UPDATE SET
    active = true,
    role = 'supplier';
    -- Removido: updated_at = now() (coluna não existe)

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função para aprovar fornecedor. Apenas service_role pode executar. Requer supplier_id e user_id válidos. Corrigida para não referenciar updated_at em supplier_users.';



-- ============================================
-- Migration: 20260117000004_disable_email_confirmation_suppliers.sql
-- ============================================

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



-- ============================================
-- Migration: 20260117000005_fix_supplier_users_rls_recursion.sql
-- ============================================

-- ============================================================
-- FIX: Recursão infinita na política RLS de supplier_users
-- ============================================================
-- Data: 2026-01-17
-- Problema: Política "Suppliers can view own users" causa recursão infinita
-- porque verifica supplier_users dentro de uma query que já acessa supplier_users
-- ============================================================

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Suppliers can view own users" ON public.supplier_users;

-- Criar política simplificada SEM recursão
-- Usuário pode ver apenas seu próprio vínculo (user_id = auth.uid())
CREATE POLICY "Suppliers can view own users"
  ON public.supplier_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Remover política de organizações que também pode causar recursão
DROP POLICY IF EXISTS "Organizations can view their suppliers" ON public.supplier_users;

-- Criar política para organizações usando função SECURITY DEFINER (sem recursão)
-- Organizações podem ver supplier_users de fornecedores vinculados
CREATE POLICY "Organizations can view linked supplier users"
  ON public.supplier_users
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND so.active = true
    )
  );

COMMENT ON POLICY "Suppliers can view own users" ON public.supplier_users IS 
'Permite que fornecedores vejam apenas seu próprio vínculo (user_id = auth.uid()). Sem recursão.';

COMMENT ON POLICY "Organizations can view linked supplier users" ON public.supplier_users IS 
'Permite que organizações vejam supplier_users de fornecedores vinculados. Usa join direto sem recursão.';



-- ============================================
-- Migration: 20260121000000_suppliers_hotfix_rls.sql
-- ============================================

-- ============================================================
-- SUPPLIERS V1 HOTFIX — RLS e Hardening
-- ============================================================
-- Data: 2026-01-21
-- Objetivo: Blindar feature contra bugs e vazamentos de dados
-- ============================================================

-- ============================================================
-- 1. CORRIGIR RLS: supplier_materials — Filtrar por status='approved'
-- ============================================================

-- Remover política antiga que não filtra por status
DROP POLICY IF EXISTS "Organizations can view linked supplier materials" ON public.supplier_materials;

-- Criar política corrigida que EXIGE suppliers.status = 'approved'
CREATE POLICY "Organizations can view linked supplier materials"
  ON public.supplier_materials
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT so.supplier_id
      FROM public.supplier_organizations so
      INNER JOIN public.organization_members om 
        ON so.organization_id = om.organization_id
      INNER JOIN public.suppliers s
        ON so.supplier_id = s.id
      WHERE om.user_id = auth.uid()
        AND so.active = true
        AND s.active = true
        AND s.status = 'approved'  -- OBRIGATÓRIO: apenas fornecedores aprovados
    )
    AND active = true
  );

COMMENT ON POLICY "Organizations can view linked supplier materials" ON public.supplier_materials IS 
'Organizações podem ver APENAS materiais de fornecedores aprovados e vinculados. Exige suppliers.status = approved.';

-- ============================================================
-- 2. HARDENING: approve_supplier — Verificação explícita de JWT
-- ============================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.approve_supplier(UUID, UUID) CASCADE;

-- Recriar função com verificação FECHADA de JWT
CREATE OR REPLACE FUNCTION public.approve_supplier(
  p_supplier_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_jwt_role TEXT;
  v_jwt_exists BOOLEAN := false;
BEGIN
  -- Verificar se JWT existe (request.jwt.claims)
  BEGIN
    -- Tentar ler JWT claims
    v_jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
    v_jwt_exists := true;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se não conseguir ler JWT, negar acesso
      v_jwt_exists := false;
      v_jwt_role := NULL;
  END;
  
  -- Se JWT não existe ou role não é service_role, NEGAR
  IF NOT v_jwt_exists OR v_jwt_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not_authorized: Apenas service_role pode aprovar fornecedores. JWT inválido ou ausente.';
  END IF;

  -- Validar inputs
  IF p_supplier_id IS NULL THEN
    RAISE EXCEPTION 'supplier_id_required: ID do fornecedor é obrigatório';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório';
  END IF;

  -- Verificar se supplier existe
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RAISE EXCEPTION 'supplier_not_found: Fornecedor não encontrado';
  END IF;

  -- Atualizar status do supplier (apenas se estiver pending)
  UPDATE public.suppliers
  SET 
    status = 'approved',
    approved_at = now(),
    updated_at = now()
  WHERE id = p_supplier_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'supplier_already_processed: Fornecedor não encontrado ou já aprovado/rejeitado';
  END IF;

  -- Criar vínculo supplier_users se não existir
  INSERT INTO public.supplier_users (
    supplier_id,
    user_id,
    role,
    active
  ) VALUES (
    p_supplier_id,
    p_user_id,
    'supplier',
    true
  )
  ON CONFLICT (supplier_id, user_id) DO UPDATE SET
    active = true,
    role = 'supplier',
    updated_at = now();

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.approve_supplier IS 
'Função para aprovar fornecedor. APENAS service_role pode executar. Verifica JWT explicitamente. Requer supplier_id e user_id válidos.';

-- Garantir que apenas service_role pode executar (revogar anon/authenticated)
REVOKE EXECUTE ON FUNCTION public.approve_supplier(UUID, UUID) FROM anon, authenticated;

-- ============================================================
-- 3. HARDENING: register_supplier — Forçar status='pending' sempre
-- ============================================================

-- Garantir que coluna cnpj_normalized existe (se não existir, criar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'suppliers' 
      AND column_name = 'cnpj_normalized'
  ) THEN
    ALTER TABLE public.suppliers ADD COLUMN cnpj_normalized TEXT;
    
    -- Preencher valores existentes
    UPDATE public.suppliers
    SET cnpj_normalized = regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g')
    WHERE cnpj_normalized IS NULL;
    
    -- Criar índice único
    CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_cnpj_normalized_unique 
    ON public.suppliers(cnpj_normalized) 
    WHERE cnpj_normalized IS NOT NULL AND cnpj_normalized != '';
  END IF;
END $$;

-- Remover função antiga
DROP FUNCTION IF EXISTS public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) CASCADE;

-- Recriar função com status sempre 'pending'
CREATE OR REPLACE FUNCTION public.register_supplier(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_service_states TEXT[] DEFAULT '{}',
  p_product_categories TEXT[] DEFAULT '{}',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_slug TEXT;
  v_supplier_id UUID;
  v_user_id_final UUID;
  v_cnpj_normalized TEXT;
BEGIN
  -- Validar inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'name_required: Nome da empresa é obrigatório';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'email_required: E-mail é obrigatório';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required: ID do usuário é obrigatório para vincular o fornecedor';
  END IF;

  -- Normalizar CNPJ (remover caracteres não numéricos)
  v_cnpj_normalized := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
  IF p_cnpj IS NOT NULL AND LENGTH(v_cnpj_normalized) != 14 THEN
    RAISE EXCEPTION 'cnpj_invalid: CNPJ deve conter 14 dígitos numéricos';
  END IF;

  -- Verificar duplicidade de CNPJ (usando normalizado)
  IF v_cnpj_normalized IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE cnpj_normalized = v_cnpj_normalized
  ) THEN
    RAISE EXCEPTION 'cnpj_already_registered: Este CNPJ já está cadastrado';
  END IF;

  -- Verificar duplicidade de email (normalizado)
  IF EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE email = trim(lower(p_email))
  ) THEN
    RAISE EXCEPTION 'email_already_registered: Este e-mail já está cadastrado';
  END IF;

  -- Gerar slug do nome
  v_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'gi'));
  v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
  
  -- Garantir unicidade do slug
  WHILE EXISTS (SELECT 1 FROM public.suppliers WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || floor(random() * 1000)::text;
  END LOOP;

  -- Usar user_id fornecido
  v_user_id_final := p_user_id;

  -- Criar ou atualizar supplier (status SEMPRE 'pending' no cadastro self-service)
  INSERT INTO public.suppliers (
    name,
    slug,
    email,
    phone,
    cnpj,
    cnpj_normalized,
    service_states,
    product_categories,
    status,
    active
  ) VALUES (
    trim(p_name),
    v_slug,
    trim(lower(p_email)),
    CASE WHEN p_phone IS NOT NULL THEN trim(p_phone) ELSE NULL END,
    CASE WHEN p_cnpj IS NOT NULL THEN trim(p_cnpj) ELSE NULL END,
    v_cnpj_normalized,
    COALESCE(p_service_states, '{}'),
    COALESCE(p_product_categories, '{}'),
    'pending', -- SEMPRE pending no cadastro self-service
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    cnpj = EXCLUDED.cnpj,
    cnpj_normalized = EXCLUDED.cnpj_normalized,
    service_states = EXCLUDED.service_states,
    product_categories = EXCLUDED.product_categories,
    status = 'pending', -- FORÇAR pending mesmo em ON CONFLICT (não manter approved)
    updated_at = now()
  RETURNING id INTO v_supplier_id;

  -- Criar vínculo supplier_users automaticamente (mesmo com status='pending')
  IF v_user_id_final IS NOT NULL THEN
    INSERT INTO public.supplier_users (
      supplier_id,
      user_id,
      role,
      active
    ) VALUES (
      v_supplier_id,
      v_user_id_final,
      'supplier',
      true
    )
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET
      active = true,
      role = 'supplier',
      updated_at = now();
  END IF;

  -- Confirmar email automaticamente (MVP - não exigir confirmação manual)
  IF v_user_id_final IS NOT NULL THEN
    BEGIN
      UPDATE auth.users
      SET email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE id = v_user_id_final
        AND email_confirmed_at IS NULL;
    EXCEPTION
      WHEN OTHERS THEN
        -- Se falhar, apenas logar (não quebrar o cadastro)
        RAISE WARNING 'Não foi possível confirmar email automaticamente: %', SQLERRM;
    END;
  END IF;

  RETURN v_supplier_id;
END;
$$;

COMMENT ON FUNCTION public.register_supplier IS 
'Função RPC para cadastro público de fornecedores. SEMPRE cria/atualiza com status=pending. Requer aprovação manual via approve_supplier.';

-- Manter permissões públicas (cadastro self-service)
GRANT EXECUTE ON FUNCTION public.register_supplier(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], UUID) TO anon, authenticated;

-- ============================================================
-- 4. GARANTIR: supplier_pending_registrations não é pública
-- ============================================================

-- Revogar acesso público (se ainda não foi revogado)
REVOKE SELECT ON public.supplier_pending_registrations FROM anon, authenticated;

-- Comentário de documentação
COMMENT ON VIEW public.supplier_pending_registrations IS 
'View auxiliar para listar fornecedores pendentes de aprovação. APENAS service_role pode acessar. Não deve ser consultada por anon/authenticated.';



-- ============================================
-- Migration: 20260123000000_ensure_studioos_pro_domain.sql
-- ============================================

-- =====================================================
-- GARANTIR DOMÍNIO studioos.pro ESTÁ CONFIGURADO
-- =====================================================

-- Garantir que a organização interna StudioOS existe
INSERT INTO public.organizations (id, name, slug, type, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'StudioOS',
  'studioos',
  'internal',
  true
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = 'StudioOS',
  slug = 'studioos',
  type = 'internal',
  active = true;

-- Garantir que o domínio studioos.pro existe e está vinculado à org interna
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES (
  'studioos.pro',
  'marketing',
  '00000000-0000-0000-0000-000000000001',
  true
)
ON CONFLICT (hostname) DO UPDATE
SET
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true;

-- Garantir que www.studioos.pro também funciona (redireciona para studioos.pro)
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES (
  'www.studioos.pro',
  'marketing',
  '00000000-0000-0000-0000-000000000001',
  true
)
ON CONFLICT (hostname) DO UPDATE
SET
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true;



-- ============================================
-- Migration: 20260128000000_fix_bidirectional_sync_orcamento_financeiro.sql
-- ============================================

-- =====================================================
-- T6.4: FIX - Sincronização Bidirecional Orçamento ↔ Financeiro
-- Adiciona trigger para sincronizar orcamento → contas_receber
-- =====================================================

-- Função para sincronizar status da conta_receber quando orçamento muda
CREATE OR REPLACE FUNCTION public.sync_contas_receber_from_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Só sincroniza quando status muda para um status de pagamento
  IF NEW.status IN ('pago', 'pago_60', 'pago_parcial', 'pago_40') THEN
    -- Atualizar todas as contas_receber vinculadas a este orçamento
    UPDATE public.contas_receber
    SET 
      status = CASE 
        WHEN NEW.status = 'pago' THEN 'pago'
        WHEN NEW.status IN ('pago_60', 'pago_parcial', 'pago_40') THEN 'parcial'
        ELSE status
      END,
      -- Se orçamento está pago, marca valor_pago = valor_total
      valor_pago = CASE 
        WHEN NEW.status = 'pago' THEN valor_total
        ELSE valor_pago
      END,
      updated_at = NOW()
    WHERE orcamento_id = NEW.id
      AND status NOT IN ('pago', 'cancelado'); -- Não sobrescrever já pagos ou cancelados
  END IF;

  -- Se orçamento foi cancelado, cancelar contas_receber também
  IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    UPDATE public.contas_receber
    SET 
      status = 'cancelado',
      updated_at = NOW()
    WHERE orcamento_id = NEW.id
      AND status NOT IN ('pago'); -- Não cancelar contas já pagas
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_sync_contas_receber_from_orcamento ON public.orcamentos;

-- Criar trigger para sincronização orcamento → contas_receber
CREATE TRIGGER trigger_sync_contas_receber_from_orcamento
  AFTER UPDATE OF status ON public.orcamentos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_contas_receber_from_orcamento();

-- Comentário explicativo
COMMENT ON FUNCTION public.sync_contas_receber_from_orcamento() IS 
'Sincroniza o status das contas_receber quando o status do orçamento muda. Se orçamento fica pago, marca conta como paga. Se orçamento é cancelado, cancela a conta (exceto se já está pago).';

-- =====================================================
-- Também garantir sincronização de parcelas quando conta muda
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_parcelas_from_conta_receber()
RETURNS TRIGGER AS $$
BEGIN
  -- Se conta foi paga, marcar todas parcelas pendentes como pagas
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    UPDATE public.parcelas_receber
    SET 
      status = 'pago',
      data_pagamento = COALESCE(NEW.updated_at, NOW()),
      updated_at = NOW()
    WHERE conta_receber_id = NEW.id
      AND status = 'pendente';
  END IF;

  -- Se conta foi cancelada, cancelar parcelas pendentes
  IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    UPDATE public.parcelas_receber
    SET 
      status = 'cancelado',
      updated_at = NOW()
    WHERE conta_receber_id = NEW.id
      AND status IN ('pendente', 'parcial');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_sync_parcelas_from_conta ON public.contas_receber;

-- Criar trigger para sincronização conta_receber → parcelas
CREATE TRIGGER trigger_sync_parcelas_from_conta
  AFTER UPDATE OF status ON public.contas_receber
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_parcelas_from_conta_receber();

-- Comentário
COMMENT ON FUNCTION public.sync_parcelas_from_conta_receber() IS 
'Sincroniza o status das parcelas quando o status da conta_receber muda.';



-- ============================================
-- Migration: 20260128000000_setup_studioos_com_br.sql
-- ============================================

-- =====================================================
-- CONFIGURAÇÃO DOMÍNIOS studioos.com.br
-- Sprint 2: Domínios e Subdomínios Personalizados
-- =====================================================

-- 1. Adicionar domínios studioos.com.br
-- Admin
INSERT INTO public.domains (hostname, role)
VALUES ('admin.studioos.com.br', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Panel (redireciona para admin)
INSERT INTO public.domains (hostname, role)
VALUES ('panel.studioos.com.br', 'admin')
ON CONFLICT (hostname) DO NOTHING;

-- Portal fornecedores
INSERT INTO public.domains (hostname, role)
VALUES ('fornecedores.studioos.com.br', 'supplier')
ON CONFLICT (hostname) DO NOTHING;

-- StudioOS marketing (vinculado à org interna)
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'studioos.com.br', 
  'marketing',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (hostname) DO NOTHING;

-- App fallback (app.studioos.com.br)
INSERT INTO public.domains (hostname, role, organization_id)
VALUES (
  'app.studioos.com.br',
  'app',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (hostname) DO NOTHING;

-- 2. Criar função para resolver domínio com suporte a subdomínios wildcard
-- Esta função pode ser usada em Edge Functions ou no backend
CREATE OR REPLACE FUNCTION public.resolve_domain(p_hostname TEXT)
RETURNS TABLE (
  hostname TEXT,
  role TEXT,
  organization_id UUID,
  organization_slug TEXT
) AS $$
DECLARE
  v_slug TEXT;
  v_reserved_slugs TEXT[] := ARRAY['admin', 'panel', 'fornecedores', 'fornecedor', 'app', 'api', 'www', 'mail', 'ftp', 'studioos'];
BEGIN
  -- Verificar domínio exato na tabela
  RETURN QUERY
  SELECT 
    d.hostname,
    d.role,
    d.organization_id,
    o.slug::TEXT as organization_slug
  FROM public.domains d
  LEFT JOIN public.organizations o ON o.id = d.organization_id
  WHERE d.hostname = p_hostname
    AND d.active = true;
  
  -- Se não encontrou, verificar subdomínio {slug}.studioos.com.br
  IF NOT FOUND THEN
    -- Extrair slug do padrão {slug}.studioos.com.br
    v_slug := regexp_replace(p_hostname, '\.studioos\.(com\.br|pro)$', '');
    
    -- Verificar se é um subdomínio de landing page válido
    IF p_hostname ~ '^[a-z0-9-]+\.studioos\.(com\.br|pro)$' 
       AND NOT v_slug = ANY(v_reserved_slugs) THEN
      
      RETURN QUERY
      SELECT 
        p_hostname::TEXT as hostname,
        'marketing'::TEXT as role,
        o.id as organization_id,
        o.slug::TEXT as organization_slug
      FROM public.organizations o
      WHERE o.slug = v_slug
        AND o.active = true;
    END IF;
    
    -- Verificar subdomínio de app {slug}-app.studioos.com.br
    IF p_hostname ~ '^[a-z0-9-]+-app\.studioos\.(com\.br|pro)$' THEN
      v_slug := regexp_replace(p_hostname, '-app\.studioos\.(com\.br|pro)$', '');
      
      IF v_slug != 'studioos' THEN
        RETURN QUERY
        SELECT 
          p_hostname::TEXT as hostname,
          'app'::TEXT as role,
          o.id as organization_id,
          o.slug::TEXT as organization_slug
        FROM public.organizations o
        WHERE o.slug = v_slug
          AND o.active = true;
      END IF;
    END IF;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Comentário da função
COMMENT ON FUNCTION public.resolve_domain IS 
'Resolve um hostname para informações de domínio.
Suporta:
- Domínios exatos na tabela domains
- Subdomínios wildcard {slug}.studioos.com.br (landing pages)
- Subdomínios app {slug}-app.studioos.com.br (apps de organização)';

-- 4. Adicionar índice para busca por slug (melhora performance)
CREATE INDEX IF NOT EXISTS idx_organizations_slug_active ON public.organizations(slug) WHERE active = true;

-- 5. Configurar Prisma Decor com subdomínio exemplo (opcional)
-- Descomentar quando quiser ativar o subdomínio para Prisma
-- INSERT INTO public.domains (hostname, role, organization_id)
-- SELECT 
--   'prisma.studioos.com.br',
--   'marketing',
--   id
-- FROM public.organizations
-- WHERE slug = 'prisma'
-- ON CONFLICT (hostname) DO NOTHING;

-- Comentário final
COMMENT ON SCHEMA public IS 
'Sprint 2: Suporte a subdomínios wildcard {slug}.studioos.com.br para landing pages personalizadas';



-- ============================================
-- Migration: 20260128000001_add_soft_delete_users.sql
-- ============================================

-- =====================================================
-- T6.7: Soft Delete Usuários - Migration
-- Adiciona coluna deleted_at e atualiza políticas
-- =====================================================

-- 1. Adicionar coluna deleted_at na tabela user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 2. Atualizar RLS policies para filtrar usuários deletados

-- Policy para SELECT: não mostrar usuários deletados
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (
  deleted_at IS NULL 
  AND auth.uid() = user_id
);

-- Policy para SELECT: admins podem ver todos os usuários ativos
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
TO authenticated
USING (
  deleted_at IS NULL 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- 3. Função para soft delete de usuário
CREATE OR REPLACE FUNCTION public.soft_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desativar usuários';
  END IF;

  -- Impedir auto-desativação
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Não é possível desativar seu próprio usuário';
  END IF;

  -- Realizar soft delete
  UPDATE public.user_roles
  SET 
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.soft_delete_user IS 
'Desativa um usuário (soft delete). Apenas admins podem executar.';

-- 4. Função para restaurar usuário
CREATE OR REPLACE FUNCTION public.restore_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem restaurar usuários';
  END IF;

  -- Restaurar usuário
  UPDATE public.user_roles
  SET 
    deleted_at = NULL,
    deleted_by = NULL
  WHERE user_id = p_user_id
    AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.restore_user IS 
'Restaura um usuário previamente desativado. Apenas admins podem executar.';

-- 5. View para listar todos os usuários (ativos e inativos) - apenas para admins
CREATE OR REPLACE VIEW public.v_users_with_status AS
SELECT 
  ur.user_id,
  ur.role,
  ur.created_at,
  ur.deleted_at,
  ur.deleted_by,
  CASE WHEN ur.deleted_at IS NULL THEN 'active' ELSE 'inactive' END as status
FROM public.user_roles ur;

COMMENT ON VIEW public.v_users_with_status IS 
'View que mostra todos os usuários com seu status de ativação';



-- ============================================
-- Migration: 20260128000001_whatsapp_rotation.sql
-- ============================================

-- Migration: Sistema de Rodízio de Vendedores no WhatsApp
-- Data: 2026-01-28
-- Sprint 4

-- ============================================================
-- 1. ADICIONAR COLUNAS NA TABELA ORGANIZATIONS
-- ============================================================

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
    -- Coluna para ativar/desativar rodízio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'whatsapp_rotation_enabled'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN whatsapp_rotation_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Coluna para armazenar array de vendedores (user_ids)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'whatsapp_vendedores'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN whatsapp_vendedores UUID[] DEFAULT '{}';
    END IF;

    -- Coluna para índice do último vendedor atendido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'whatsapp_last_vendedor_index'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN whatsapp_last_vendedor_index INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- 2. CRIAR FUNÇÃO PARA OBTER PRÓXIMO VENDEDOR
-- ============================================================

CREATE OR REPLACE FUNCTION get_next_vendedor_whatsapp(p_org_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_whatsapp TEXT,
    index_position INTEGER
) AS $$
DECLARE
    v_vendedores UUID[];
    v_last_index INTEGER;
    v_next_index INTEGER;
    v_selected_user_id UUID;
BEGIN
    -- Buscar configuração da organização
    SELECT 
        o.whatsapp_vendedores,
        o.whatsapp_last_vendedor_index
    INTO 
        v_vendedores,
        v_last_index
    FROM organizations o
    WHERE o.id = p_org_id;

    -- Verificar se há vendedores configurados
    IF v_vendedores IS NULL OR array_length(v_vendedores, 1) IS NULL THEN
        RETURN;
    END IF;

    -- Calcular próximo índice (rodízio circular)
    v_next_index := (v_last_index + 1) % array_length(v_vendedores, 1);
    
    -- Se o array está vazio, retornar vazio
    IF array_length(v_vendedores, 1) = 0 THEN
        RETURN;
    END IF;

    -- Ajustar índice para base 1 (arrays em PostgreSQL são base 1)
    v_selected_user_id := v_vendedores[v_next_index + 1];

    -- Atualizar o índice na organização
    UPDATE organizations 
    SET whatsapp_last_vendedor_index = v_next_index
    WHERE id = p_org_id;

    -- Retornar dados do vendedor selecionado
    RETURN QUERY
    SELECT 
        u.id,
        COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
        COALESCE(u.raw_user_meta_data->>'whatsapp', '') as user_whatsapp,
        v_next_index as index_position
    FROM auth.users u
    WHERE u.id = v_selected_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION get_next_vendedor_whatsapp(UUID) IS 
'Retorna o próximo vendedor do rodízio de WhatsApp para uma organização.
Implementa algoritmo round-robin circular.
Atualiza automaticamente o índice do último vendedor atendido.';

-- ============================================================
-- 3. CRIAR VIEW PARA LISTAR VENDEDORES COM WHATSAPP
-- ============================================================

CREATE OR REPLACE VIEW organization_whatsapp_vendedores AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.whatsapp_rotation_enabled,
    o.whatsapp_vendedores,
    o.whatsapp_last_vendedor_index,
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
    u.email as user_email,
    COALESCE(u.raw_user_meta_data->>'whatsapp', '') as user_whatsapp,
    COALESCE(u.raw_user_meta_data->>'phone', '') as user_phone
FROM organizations o
LEFT JOIN LATERAL unnest(o.whatsapp_vendedores) AS vendedor_id ON true
LEFT JOIN auth.users u ON u.id = vendedor_id
WHERE o.whatsapp_rotation_enabled = true;

-- Comentário da view
COMMENT ON VIEW organization_whatsapp_vendedores IS 
'Lista todos os vendedores configurados para rodízio de WhatsApp por organização.';

-- ============================================================
-- 4. CRIAR TABELA DE HISTÓRICO DE ATRIBUIÇÕES (OPCIONAL)
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_name TEXT,
    lead_phone TEXT,
    lead_source TEXT DEFAULT 'landing_page',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_assignments_org 
ON whatsapp_lead_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_assignments_vendedor 
ON whatsapp_lead_assignments(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_assignments_assigned_at 
ON whatsapp_lead_assignments(assigned_at);

-- Comentário da tabela
COMMENT ON TABLE whatsapp_lead_assignments IS 
'Histórico de atribuições de leads via WhatsApp para vendedores.';

-- ============================================================
-- 5. FUNÇÃO PARA REGISTRAR ATRIBUIÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION assign_whatsapp_lead(
    p_org_id UUID,
    p_vendedor_id UUID,
    p_lead_name TEXT DEFAULT NULL,
    p_lead_phone TEXT DEFAULT NULL,
    p_lead_source TEXT DEFAULT 'landing_page'
)
RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    INSERT INTO whatsapp_lead_assignments (
        organization_id,
        vendedor_id,
        lead_name,
        lead_phone,
        lead_source
    ) VALUES (
        p_org_id,
        p_vendedor_id,
        p_lead_name,
        p_lead_phone,
        p_lead_source
    )
    RETURNING id INTO v_assignment_id;

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION assign_whatsapp_lead(UUID, UUID, TEXT, TEXT, TEXT) IS 
'Registra uma atribuição de lead via WhatsApp para um vendedor.';

-- ============================================================
-- 6. POLÍTICAS RLS (SE RLS ESTIVER ATIVADO)
-- ============================================================

-- Habilitar RLS na tabela de histórico
ALTER TABLE whatsapp_lead_assignments ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas atribuições da sua organização
CREATE POLICY whatsapp_lead_assignments_select_org
ON whatsapp_lead_assignments
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Política: Administradores podem inserir atribuições
CREATE POLICY whatsapp_lead_assignments_insert_admin
ON whatsapp_lead_assignments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = whatsapp_lead_assignments.organization_id
        AND role = 'admin'
    )
);

-- ============================================================
-- 7. DADOS INICIAIS (PARA ORGANIZAÇÕES EXISTENTES)
-- ============================================================

-- Atualizar organizações existentes com valores padrão
UPDATE organizations 
SET 
    whatsapp_rotation_enabled = COALESCE(whatsapp_rotation_enabled, false),
    whatsapp_vendedores = COALESCE(whatsapp_vendedores, '{}'),
    whatsapp_last_vendedor_index = COALESCE(whatsapp_last_vendedor_index, 0)
WHERE whatsapp_rotation_enabled IS NULL;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================



-- ============================================
-- Migration: 20260128000002_analytics_tracking.sql
-- ============================================

-- Migration: Analytics e Tracking para StudioOS
-- Data: 2026-01-28
-- Sprint 5: Analytics e Polimento

-- ===========================================
-- TABELA: Eventos de Analytics
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL, -- 'page_view', 'interaction', 'conversion', 'error'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Dados do evento
    properties JSONB DEFAULT '{}',
    
    -- Contexto
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_org ON analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- ===========================================
-- TABELA: Métricas Diárias Agregadas
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Métricas de Visitas
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    
    -- Métricas de Conversão
    orcamentos_criados INTEGER DEFAULT 0,
    orcamentos_convertidos INTEGER DEFAULT 0,
    visitas_solicitadas INTEGER DEFAULT 0,
    visitas_agendadas INTEGER DEFAULT 0,
    
    -- Métricas de Engajamento
    avg_session_duration INTEGER DEFAULT 0, -- em segundos
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Receita
    receita_total DECIMAL(12,2) DEFAULT 0,
    ticket_medio DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint única por organização e data
    UNIQUE(organization_id, metric_date)
);

-- Índices para analytics_daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_org_date ON analytics_daily_metrics(organization_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON analytics_daily_metrics(metric_date);

-- ===========================================
-- TABELA: Funil de Conversão
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    funnel_date DATE NOT NULL,
    
    -- Estágios do funil
    visitas_landing INTEGER DEFAULT 0,
    cliques_whatsapp INTEGER DEFAULT 0,
    solicitacoes_visita INTEGER DEFAULT 0,
    orcamentos_criados INTEGER DEFAULT 0,
    orcamentos_aprovados INTEGER DEFAULT 0,
    pedidos_gerados INTEGER DEFAULT 0,
    
    -- Taxas de conversão (calculadas)
    taxa_visitas_whatsapp DECIMAL(5,2) DEFAULT 0,
    taxa_whatsapp_orcamento DECIMAL(5,2) DEFAULT 0,
    taxa_orcamento_pedido DECIMAL(5,2) DEFAULT 0,
    taxa_geral DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, funnel_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_funnel_org_date ON analytics_funnel(organization_id, funnel_date);

-- ===========================================
-- TABELA: Performance de Vendedores
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_vendedor_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    
    -- Métricas
    orcamentos_atribuidos INTEGER DEFAULT 0,
    orcamentos_convertidos INTEGER DEFAULT 0,
    leads_whatsapp INTEGER DEFAULT 0,
    leads_convertidos INTEGER DEFAULT 0,
    
    -- Taxas
    taxa_conversao DECIMAL(5,2) DEFAULT 0,
    tempo_medio_resposta INTEGER DEFAULT 0, -- em minutos
    
    -- Valores
    valor_total_vendido DECIMAL(12,2) DEFAULT 0,
    ticket_medio DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, vendedor_id, metric_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vendedor_perf_org ON analytics_vendedor_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendedor_perf_vendedor ON analytics_vendedor_performance(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendedor_perf_date ON analytics_vendedor_performance(metric_date);

-- ===========================================
-- VIEW: Dashboard Analytics Consolidado
-- ===========================================
CREATE OR REPLACE VIEW vw_analytics_dashboard AS
SELECT 
    dm.organization_id,
    dm.metric_date,
    dm.page_views,
    dm.unique_visitors,
    dm.sessions,
    dm.orcamentos_criados,
    dm.orcamentos_convertidos,
    CASE 
        WHEN dm.orcamentos_criados > 0 
        THEN ROUND((dm.orcamentos_convertidos::DECIMAL / dm.orcamentos_criados) * 100, 2)
        ELSE 0 
    END as taxa_conversao_orcamentos,
    dm.visitas_solicitadas,
    dm.visitas_agendadas,
    dm.receita_total,
    dm.ticket_medio,
    f.visitas_landing,
    f.cliques_whatsapp,
    f.taxa_visitas_whatsapp,
    f.taxa_geral as taxa_conversao_geral
FROM analytics_daily_metrics dm
LEFT JOIN analytics_funnel f ON dm.organization_id = f.organization_id 
    AND dm.metric_date = f.funnel_date;

-- ===========================================
-- FUNÇÃO: Registrar Evento de Analytics
-- ===========================================
CREATE OR REPLACE FUNCTION track_analytics_event(
    p_organization_id UUID,
    p_event_type TEXT,
    p_event_category TEXT,
    p_properties JSONB DEFAULT '{}',
    p_page_url TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_user_id UUID;
BEGIN
    -- Pegar user_id da sessão atual
    v_user_id := auth.uid();
    
    INSERT INTO analytics_events (
        organization_id,
        event_type,
        event_category,
        user_id,
        properties,
        page_url,
        referrer
    ) VALUES (
        p_organization_id,
        p_event_type,
        p_event_category,
        v_user_id,
        p_properties,
        p_page_url,
        p_referrer
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- ===========================================
-- FUNÇÃO: Atualizar Métricas Diárias
-- ===========================================
CREATE OR REPLACE FUNCTION update_daily_metrics(
    p_organization_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Upsert métricas diárias
    INSERT INTO analytics_daily_metrics (
        organization_id,
        metric_date,
        orcamentos_criados,
        orcamentos_convertidos,
        visitas_solicitadas,
        receita_total
    )
    SELECT 
        p_organization_id,
        p_date,
        COUNT(*) FILTER (WHERE DATE(o.created_at) = p_date),
        COUNT(*) FILTER (WHERE DATE(o.created_at) = p_date AND o.status = 'aprovado'),
        COUNT(*) FILTER (WHERE DATE(sv.created_at) = p_date),
        COALESCE(SUM(o.valor_total) FILTER (WHERE DATE(o.created_at) = p_date AND o.status = 'aprovado'), 0)
    FROM orcamentos o
    LEFT JOIN solicitacoes_visita sv ON sv.organization_id = p_organization_id
    WHERE o.organization_id = p_organization_id
        AND (DATE(o.created_at) = p_date OR DATE(sv.created_at) = p_date)
    ON CONFLICT (organization_id, metric_date)
    DO UPDATE SET
        orcamentos_criados = EXCLUDED.orcamentos_criados,
        orcamentos_convertidos = EXCLUDED.orcamentos_convertidos,
        visitas_solicitadas = EXCLUDED.visitas_solicitadas,
        receita_total = EXCLUDED.receita_total,
        ticket_medio = CASE 
            WHEN EXCLUDED.orcamentos_convertidos > 0 
            THEN EXCLUDED.receita_total / EXCLUDED.orcamentos_convertidos 
            ELSE 0 
        END,
        updated_at = NOW();
END;
$$;

-- ===========================================
-- FUNÇÃO: Calcular Funil de Conversão
-- ===========================================
CREATE OR REPLACE FUNCTION calculate_funnel_metrics(
    p_organization_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    funnel_date DATE,
    visitas_landing INTEGER,
    cliques_whatsapp INTEGER,
    orcamentos_criados INTEGER,
    orcamentos_aprovados INTEGER,
    taxa_conversao DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH eventos AS (
        SELECT 
            DATE(created_at) as event_date,
            event_type,
            COUNT(*) as total
        FROM analytics_events
        WHERE organization_id = p_organization_id
            AND DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at), event_type
    ),
    orcamentos AS (
        SELECT 
            DATE(created_at) as orc_date,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'aprovado') as aprovados
        FROM orcamentos
        WHERE organization_id = p_organization_id
            AND DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at)
    )
    SELECT 
        gs.date::DATE as funnel_date,
        COALESCE(e.total, 0)::INTEGER as visitas_landing,
        COALESCE(ew.total, 0)::INTEGER as cliques_whatsapp,
        COALESCE(o.total, 0)::INTEGER as orcamentos_criados,
        COALESCE(o.aprovados, 0)::INTEGER as orcamentos_aprovados,
        CASE 
            WHEN COALESCE(e.total, 0) > 0 
            THEN ROUND((COALESCE(o.total, 0)::DECIMAL / e.total) * 100, 2)
            ELSE 0 
        END as taxa_conversao
    FROM generate_series(p_start_date, p_end_date, INTERVAL '1 day') gs
    LEFT JOIN eventos e ON gs.date = e.event_date AND e.event_type = 'page_view'
    LEFT JOIN eventos ew ON gs.date = ew.event_date AND ew.event_type = 'whatsapp_click'
    LEFT JOIN orcamentos o ON gs.date = o.orc_date
    ORDER BY gs.date;
END;
$$;

-- ===========================================
-- POLÍTICAS DE RLS
-- ===========================================

-- Habilitar RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_vendedor_performance ENABLE ROW LEVEL SECURITY;

-- Políticas para analytics_events
CREATE POLICY analytics_events_select_policy ON analytics_events
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY analytics_events_insert_policy ON analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- Políticas para analytics_daily_metrics
CREATE POLICY analytics_daily_metrics_select_policy ON analytics_daily_metrics
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- Políticas para analytics_funnel
CREATE POLICY analytics_funnel_select_policy ON analytics_funnel
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- Políticas para analytics_vendedor_performance
CREATE POLICY vendedor_perf_select_policy ON analytics_vendedor_performance
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- ===========================================
-- TRIGGER: Atualizar updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_daily_metrics_updated_at
    BEFORE UPDATE ON analytics_daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_updated_at();

-- ===========================================
-- COMENTÁRIOS
-- ===========================================
COMMENT ON TABLE analytics_events IS 'Eventos brutos de tracking (page views, cliques, conversões)';
COMMENT ON TABLE analytics_daily_metrics IS 'Métricas agregadas por dia para dashboard';
COMMENT ON TABLE analytics_funnel IS 'Dados do funil de conversão por dia';
COMMENT ON TABLE analytics_vendedor_performance IS 'Performance individual dos vendedores';

-- ===========================================
-- DADOS INICIAIS (Opcional)
-- ===========================================
-- Popular métricas iniciais para os últimos 7 dias
-- SELECT update_daily_metrics(org.id, CURRENT_DATE - i)
-- FROM organizations org
-- CROSS JOIN generate_series(0, 6) i;



-- ============================================
-- Migration: 20260128230000_add_supplier_fields_to_cortina_items.sql
-- ============================================

-- Migration: Add supplier fields to cortina_items for supplier integration
-- Created: 2026-01-28

-- Add supplier-related fields to cortina_items
ALTER TABLE cortina_items
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_material_id uuid REFERENCES supplier_materials(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_price_at_time numeric(10,2),
ADD COLUMN IF NOT EXISTS supplier_name_at_time text,
ADD COLUMN IF NOT EXISTS supplier_material_name_at_time text;

-- Add comment explaining the fields
COMMENT ON COLUMN cortina_items.supplier_id IS 'Reference to the supplier providing the material';
COMMENT ON COLUMN cortina_items.supplier_material_id IS 'Reference to the specific supplier material';
COMMENT ON COLUMN cortina_items.supplier_price_at_time IS 'Price snapshot from supplier at the time of quote';
COMMENT ON COLUMN cortina_items.supplier_name_at_time IS 'Supplier name snapshot at the time of quote';
COMMENT ON COLUMN cortina_items.supplier_material_name_at_time IS 'Material name snapshot at the time of quote';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cortina_items_supplier_id ON cortina_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cortina_items_supplier_material_id ON cortina_items(supplier_material_id);

-- Update RLS policies to allow reading supplier materials
-- (Assuming existing RLS is in place, this just ensures the new fields are accessible)

-- Function to get supplier materials for an organization
CREATE OR REPLACE FUNCTION get_supplier_materials_for_organization(p_organization_id uuid)
RETURNS TABLE (
    id uuid,
    supplier_id uuid,
    supplier_name text,
    name text,
    category text,
    unit text,
    price numeric,
    width_meters numeric,
    color text,
    line text,
    is_active boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.supplier_id,
        s.company_name as supplier_name,
        sm.name,
        sm.category,
        sm.unit,
        sm.price,
        sm.width_meters,
        sm.color,
        sm.line,
        sm.is_active
    FROM supplier_materials sm
    JOIN suppliers s ON sm.supplier_id = s.id
    WHERE sm.is_active = true
      AND s.status = 'approved'
      AND s.organization_id = p_organization_id
    ORDER BY s.company_name, sm.category, sm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_supplier_materials_for_organization(uuid) TO authenticated;



-- ============================================
-- Migration: 20260128233000_organization_member_permissions.sql
-- ============================================

-- Migration: Organization Member Permissions (RBAC Granular)
-- Created: 2026-01-28

-- Table for granular permissions per organization member
CREATE TABLE IF NOT EXISTS organization_member_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Screen-level permissions
    can_access_orcamentos boolean DEFAULT true,
    can_create_orcamentos boolean DEFAULT true,
    can_edit_orcamentos boolean DEFAULT true,
    can_delete_orcamentos boolean DEFAULT false,
    
    can_access_pedidos boolean DEFAULT true,
    can_create_pedidos boolean DEFAULT true,
    can_edit_pedidos boolean DEFAULT true,
    can_delete_pedidos boolean DEFAULT false,
    
    can_access_producao boolean DEFAULT true,
    can_edit_producao boolean DEFAULT true,
    can_manage_producao boolean DEFAULT false,
    
    can_access_financeiro boolean DEFAULT true,
    can_edit_financeiro boolean DEFAULT false,
    can_view_all_financeiro boolean DEFAULT false,
    
    can_access_crm boolean DEFAULT true,
    can_edit_crm boolean DEFAULT true,
    can_delete_crm boolean DEFAULT false,
    
    can_access_estoque boolean DEFAULT true,
    can_edit_estoque boolean DEFAULT false,
    can_manage_estoque boolean DEFAULT false,
    
    can_access_configuracoes boolean DEFAULT false,
    can_manage_users boolean DEFAULT false,
    can_manage_organization boolean DEFAULT false,
    
    can_access_fornecedores boolean DEFAULT true,
    can_edit_fornecedores boolean DEFAULT false,
    
    can_access_relatorios boolean DEFAULT true,
    can_export_relatorios boolean DEFAULT false,
    
    -- Metadata
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Unique constraint
    UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_permissions_org ON organization_member_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_permissions_user ON organization_member_permissions(user_id);

-- Comments
COMMENT ON TABLE organization_member_permissions IS 'Granular permissions for organization members per screen/feature';

-- Function to create default permissions for a new member
CREATE OR REPLACE FUNCTION create_default_member_permissions(
    p_organization_id uuid,
    p_user_id uuid,
    p_role text DEFAULT 'member'
)
RETURNS uuid AS $$
DECLARE
    v_permission_id uuid;
BEGIN
    INSERT INTO organization_member_permissions (
        organization_id,
        user_id,
        can_access_orcamentos,
        can_create_orcamentos,
        can_edit_orcamentos,
        can_delete_orcamentos,
        can_access_pedidos,
        can_create_pedidos,
        can_edit_pedidos,
        can_delete_pedidos,
        can_access_producao,
        can_edit_producao,
        can_manage_producao,
        can_access_financeiro,
        can_edit_financeiro,
        can_view_all_financeiro,
        can_access_crm,
        can_edit_crm,
        can_delete_crm,
        can_access_estoque,
        can_edit_estoque,
        can_manage_estoque,
        can_access_configuracoes,
        can_manage_users,
        can_manage_organization,
        can_access_fornecedores,
        can_edit_fornecedores,
        can_access_relatorios,
        can_export_relatorios
    ) VALUES (
        p_organization_id,
        p_user_id,
        -- Owner/Admin gets full permissions, member gets restricted
        true, true, true, p_role IN ('owner', 'admin'),
        true, true, true, p_role IN ('owner', 'admin'),
        true, true, p_role IN ('owner', 'admin'),
        true, p_role IN ('owner', 'admin'), p_role IN ('owner', 'admin'),
        true, true, p_role IN ('owner', 'admin'),
        true, p_role IN ('owner', 'admin'), p_role IN ('owner', 'admin'),
        p_role IN ('owner', 'admin'), p_role = 'owner', p_role = 'owner',
        true, p_role IN ('owner', 'admin'),
        true, p_role IN ('owner', 'admin')
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        updated_at = now()
    RETURNING id INTO v_permission_id;
    
    RETURN v_permission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id uuid,
    p_organization_id uuid,
    p_permission text
)
RETURNS boolean AS $$
DECLARE
    v_has_permission boolean;
    v_is_owner boolean;
BEGIN
    -- Check if user is owner (owners have all permissions)
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_organization_id
        AND user_id = p_user_id
        AND role = 'owner'
    ) INTO v_is_owner;
    
    IF v_is_owner THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    EXECUTE format('
        SELECT %I FROM organization_member_permissions
        WHERE organization_id = $1 AND user_id = $2
    ', p_permission)
    INTO v_has_permission
    USING p_organization_id, p_user_id;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create permissions when member is added
CREATE OR REPLACE FUNCTION trigger_create_member_permissions()
RETURNS trigger AS $$
BEGIN
    PERFORM create_default_member_permissions(
        NEW.organization_id,
        NEW.user_id,
        NEW.role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_member_added_create_permissions ON organization_members;
CREATE TRIGGER on_member_added_create_permissions
    AFTER INSERT ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_member_permissions();

-- RLS Policies
ALTER TABLE organization_member_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions in their organizations"
    ON organization_member_permissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organization_member_permissions.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only owners and admins can update permissions"
    ON organization_member_permissions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organization_member_permissions.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Grant permissions
GRANT ALL ON organization_member_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_member_permissions(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(uuid, uuid, text) TO authenticated;



-- ============================================
-- Migration: 20260128234000_production_automations.sql
-- ============================================

-- ============================================================
-- T8.7: Automações de Produção
-- ============================================================
-- Triggers para automatizar fluxo de produção:
-- 1. Quando pedido fica pronto → sugerir instalação
-- 2. Quando instalação concluída → criar registro de entrega

-- ============================================================
-- FUNCTION: Trigger quando item de pedido muda para "pronto"
-- ============================================================
CREATE OR REPLACE FUNCTION handle_item_pronto_sugerir_instalacao()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido_id UUID;
    v_orcamento_id UUID;
    v_cliente_nome TEXT;
    v_endereco TEXT;
    v_cidade TEXT;
    v_todos_prontos BOOLEAN;
    v_existe_instalacao_pendente BOOLEAN;
    v_organization_id UUID;
BEGIN
    -- Verificar se o status mudou para 'pronto'
    IF NEW.status_item = 'pronto' AND (OLD.status_item IS NULL OR OLD.status_item != 'pronto') THEN
        -- Pegar ID do pedido
        v_pedido_id := NEW.pedido_id;
        
        -- Verificar se todos os itens do pedido estão prontos
        SELECT 
            NOT EXISTS(
                SELECT 1 FROM itens_pedido 
                WHERE pedido_id = v_pedido_id 
                AND status_item NOT IN ('pronto', 'cancelado')
            )
        INTO v_todos_prontos;
        
        -- Se todos os itens estão prontos, verificar e criar sugestão de instalação
        IF v_todos_prontos THEN
            -- Buscar dados do pedido/orçamento
            SELECT 
                p.orcamento_id,
                p.organization_id,
                o.cliente_nome,
                o.endereco,
                o.cidade
            INTO 
                v_orcamento_id,
                v_organization_id,
                v_cliente_nome,
                v_endereco,
                v_cidade
            FROM pedidos p
            JOIN orcamentos o ON o.id = p.orcamento_id
            WHERE p.id = v_pedido_id;
            
            -- Verificar se já existe instalação pendente para este pedido
            SELECT EXISTS(
                SELECT 1 FROM instalacoes 
                WHERE pedido_id = v_pedido_id 
                AND status IN ('pendente', 'agendada', 'em_andamento')
            ) INTO v_existe_instalacao_pendente;
            
            -- Se não existe instalação pendente, criar sugestão
            IF NOT v_existe_instalacao_pendente THEN
                INSERT INTO instalacoes (
                    pedido_id,
                    orcamento_id,
                    organization_id,
                    cliente_nome,
                    endereco,
                    cidade,
                    status,
                    data_criacao,
                    data_sugerida,
                    observacoes,
                    origem_sugestao
                ) VALUES (
                    v_pedido_id,
                    v_orcamento_id,
                    v_organization_id,
                    v_cliente_nome,
                    v_endereco,
                    v_cidade,
                    'pendente',
                    NOW(),
                    CURRENT_DATE + INTERVAL '3 days',
                    'Sugerido automaticamente quando todos os itens ficaram prontos',
                    'automation_item_pronto'
                );
                
                -- Atualizar pedido com flag de instalação sugerida
                UPDATE pedidos 
                SET 
                    instalacao_sugerida = TRUE,
                    instalacao_sugerida_em = NOW()
                WHERE id = v_pedido_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar tabela de instalações se não existir
CREATE TABLE IF NOT EXISTS instalacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    cliente_nome TEXT,
    endereco TEXT,
    cidade TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendada', 'em_andamento', 'concluida', 'cancelada')),
    data_agendada DATE,
    data_sugerida DATE,
    hora_inicio TIME,
    hora_fim TIME,
    instalador_id UUID,
    observacoes TEXT,
    origem_sugestao TEXT,
    checkin_lat DECIMAL(10,8),
    checkin_lng DECIMAL(11,8),
    checkin_foto_url TEXT,
    conclusao_lat DECIMAL(10,8),
    conclusao_lng DECIMAL(11,8),
    conclusao_foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_instalacoes_updated_at ON instalacoes;
CREATE TRIGGER update_instalacoes_updated_at
    BEFORE UPDATE ON instalacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para sugerir instalação quando item fica pronto
DROP TRIGGER IF EXISTS trg_item_pronto_sugerir_instalacao ON itens_pedido;
CREATE TRIGGER trg_item_pronto_sugerir_instalacao
    AFTER UPDATE ON itens_pedido
    FOR EACH ROW
    WHEN (NEW.status_item = 'pronto')
    EXECUTE FUNCTION handle_item_pronto_sugerir_instalacao();

-- ============================================================
-- FUNCTION: Trigger quando instalação é concluída
-- ============================================================
CREATE OR REPLACE FUNCTION handle_instalacao_concluida_entrega()
RETURNS TRIGGER AS $$
DECLARE
    v_orcamento_id UUID;
    v_cliente_nome TEXT;
    v_endereco TEXT;
    v_cidade TEXT;
    v_organization_id UUID;
    v_valor_total DECIMAL(10,2);
BEGIN
    -- Verificar se a instalação foi concluída
    IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
        -- Buscar dados do orçamento
        SELECT 
            o.id,
            o.organization_id,
            o.cliente_nome,
            o.endereco,
            o.cidade,
            o.valor_total
        INTO 
            v_orcamento_id,
            v_organization_id,
            v_cliente_nome,
            v_endereco,
            v_cidade,
            v_valor_total
        FROM orcamentos o
        JOIN pedidos p ON p.orcamento_id = o.id
        WHERE p.id = NEW.pedido_id;
        
        -- Criar registro de entrega
        INSERT INTO entregas (
            instalacao_id,
            pedido_id,
            orcamento_id,
            organization_id,
            cliente_nome,
            endereco,
            cidade,
            status,
            data_entrega,
            observacoes,
            origem_sugestao
        ) VALUES (
            NEW.id,
            NEW.pedido_id,
            v_orcamento_id,
            v_organization_id,
            v_cliente_nome,
            v_endereco,
            v_cidade,
            'pendente',
            CURRENT_DATE,
            'Gerado automaticamente após conclusão da instalação',
            'automation_instalacao_concluida'
        );
        
        -- Atualizar pedido
        UPDATE pedidos 
        SET 
            status_producao = 'instalacao_concluida',
            instalacao_concluida_em = NOW(),
            entrega_sugerida = TRUE,
            entrega_sugerida_em = NOW()
        WHERE id = NEW.pedido_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar tabela de entregas se não existir
CREATE TABLE IF NOT EXISTS entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instalacao_id UUID REFERENCES instalacoes(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    cliente_nome TEXT,
    endereco TEXT,
    cidade TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendada', 'em_andamento', 'concluida', 'cancelada')),
    data_entrega DATE,
    hora_entrega TIME,
    entregador_id UUID,
    observacoes TEXT,
    origem_sugestao TEXT,
    comprovante_foto_url TEXT,
    assinatura_cliente_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_entregas_updated_at ON entregas;
CREATE TRIGGER update_entregas_updated_at
    BEFORE UPDATE ON entregas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar entrega quando instalação é concluída
DROP TRIGGER IF EXISTS trg_instalacao_concluida_entrega ON instalacoes;
CREATE TRIGGER trg_instalacao_concluida_entrega
    AFTER UPDATE ON instalacoes
    FOR EACH ROW
    WHEN (NEW.status = 'concluida')
    EXECUTE FUNCTION handle_instalacao_concluida_entrega();

-- ============================================================
-- Adicionar campos ao pedidos para tracking
-- ============================================================
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS instalacao_sugerida BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instalacao_sugerida_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS instalacao_concluida_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS entrega_sugerida BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS entrega_sugerida_em TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- RLS Policies para novas tabelas
-- ============================================================

-- Ensure organization_id column exists in instalacoes
ALTER TABLE instalacoes
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Ensure organization_id column exists in entregas
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- RLS para instalacoes
ALTER TABLE instalacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instalacoes_select_org ON instalacoes;
CREATE POLICY instalacoes_select_org ON instalacoes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = instalacoes.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS instalacoes_insert_org ON instalacoes;
CREATE POLICY instalacoes_insert_org ON instalacoes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = instalacoes.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS instalacoes_update_org ON instalacoes;
CREATE POLICY instalacoes_update_org ON instalacoes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = instalacoes.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- RLS para entregas
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entregas_select_org ON entregas;
CREATE POLICY entregas_select_org ON entregas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = entregas.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS entregas_insert_org ON entregas;
CREATE POLICY entregas_insert_org ON entregas
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = entregas.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS entregas_update_org ON entregas;
CREATE POLICY entregas_update_org ON entregas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = entregas.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- ============================================================
-- INDEXES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_instalacoes_pedido_id ON instalacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_instalacoes_organization_id ON instalacoes(organization_id);
CREATE INDEX IF NOT EXISTS idx_instalacoes_status ON instalacoes(status);
CREATE INDEX IF NOT EXISTS idx_entregas_pedido_id ON entregas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_entregas_organization_id ON entregas(organization_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);

-- ============================================================
-- FUNCTION: Notificação quando pedido fica pronto
-- ============================================================
CREATE OR REPLACE FUNCTION notify_pedido_pronto()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido_id UUID;
    v_todos_prontos BOOLEAN;
    v_organization_id UUID;
    v_numero_pedido TEXT;
BEGIN
    -- Verificar se o status mudou para 'pronto'
    IF NEW.status_item = 'pronto' AND (OLD.status_item IS NULL OR OLD.status_item != 'pronto') THEN
        v_pedido_id := NEW.pedido_id;
        
        -- Buscar organization_id e numero_pedido
        SELECT 
            p.organization_id,
            p.numero_pedido
        INTO 
            v_organization_id,
            v_numero_pedido
        FROM pedidos p
        WHERE p.id = v_pedido_id;
        
        -- Verificar se todos os itens estão prontos
        SELECT 
            NOT EXISTS(
                SELECT 1 FROM itens_pedido 
                WHERE pedido_id = v_pedido_id 
                AND status_item NOT IN ('pronto', 'cancelado')
            )
        INTO v_todos_prontos;
        
        -- Se todos os itens estão prontos, criar notificação
        IF v_todos_prontos THEN
            INSERT INTO notifications (
                organization_id,
                type,
                title,
                message,
                entity_type,
                entity_id,
                created_at
            ) VALUES (
                v_organization_id,
                'pedido_pronto',
                'Pedido Pronto para Instalação',
                'O pedido ' || v_numero_pedido || ' está pronto para agendamento de instalação',
                'pedido',
                v_pedido_id,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificação
DROP TRIGGER IF EXISTS trg_notify_pedido_pronto ON itens_pedido;
CREATE TRIGGER trg_notify_pedido_pronto
    AFTER UPDATE ON itens_pedido
    FOR EACH ROW
    WHEN (NEW.status_item = 'pronto')
    EXECUTE FUNCTION notify_pedido_pronto();

-- Criar tabela de notificações se não existir
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_user ON notifications;
CREATE POLICY notifications_select_user ON notifications
    FOR SELECT USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_members.organization_id = notifications.organization_id
            AND organization_members.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS notifications_update_user ON notifications;
CREATE POLICY notifications_update_user ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Indexes para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

COMMENT ON TABLE instalacoes IS 'Registro de instalações sugeridas automaticamente ou criadas manualmente';
COMMENT ON TABLE entregas IS 'Registro de entregas sugeridas automaticamente após instalação';
COMMENT ON TABLE notifications IS 'Notificações do sistema para usuários';



-- ============================================
-- Migration: 20260129000000_add_super_admin_role.sql
-- ============================================

-- Migration: Add super_admin role and platform subscriptions schema
-- Data: 2026-01-29
-- Sprint: 7 - Painel Admin Supremo

-- ============================================
-- 1. Adicionar role 'super_admin' ao tipo enum
-- ============================================
-- Nota: Se o tipo for enum, precisamos adicionar o valor
-- Verificar primeiro o tipo atual da coluna role

-- Adicionar valor 'super_admin' ao enum user_role se existir
DO $$
BEGIN
    -- Verificar se o tipo enum existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Adicionar 'super_admin' ao enum se não existir
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'super_admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'super_admin';
        END IF;
    END IF;
END $$;

-- ============================================
-- 2. Tabela de subscriptions (integração ASAAS)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados do ASAAS
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    
    -- Plano e valores
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'business', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'expired')),
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Período
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_org_subscription UNIQUE (organization_id),
    CONSTRAINT unique_asaas_subscription UNIQUE (asaas_subscription_id)
);

-- ============================================
-- 3. Tabela de eventos de subscription (histórico)
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Tipo de evento
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created',
        'activated',
        'renewed',
        'cancelled',
        'paused',
        'resumed',
        'payment_received',
        'payment_failed',
        'payment_overdue',
        'trial_started',
        'trial_ended',
        'plan_changed'
    )),
    
    -- Dados do evento
    previous_status TEXT,
    new_status TEXT,
    previous_plan TEXT,
    new_plan TEXT,
    amount_cents INTEGER,
    metadata JSONB,
    
    -- Referências externas
    asaas_event_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 4. Tabela de faturas (invoices)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados da fatura
    invoice_number TEXT UNIQUE,
    asaas_invoice_id TEXT,
    
    -- Valores
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    
    -- Datas
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Referências
    payment_method TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 5. Tabela de pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados do pagamento
    asaas_payment_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'received', 'overdue', 'cancelled', 'refunded')),
    
    -- Método
    payment_method TEXT,
    
    -- Datas
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 6. Indexes para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_events_sub ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created ON subscription_events(created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_sub ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Super admin pode ver tudo, organization members veem só da sua org
CREATE POLICY "Super admin can manage all subscriptions"
    ON subscriptions FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own subscription"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- Subscription events
CREATE POLICY "Super admin can manage all subscription events"
    ON subscription_events FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own subscription events"
    ON subscription_events FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- Invoices
CREATE POLICY "Super admin can manage all invoices"
    ON invoices FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- Payments
CREATE POLICY "Super admin can manage all payments"
    ON payments FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Organization members can view own payments"
    ON payments FOR SELECT
    TO authenticated
    USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- ============================================
-- 8. Function to update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Comment para documentação
-- ============================================
COMMENT ON TABLE subscriptions IS 'Assinaturas das organizações - integração ASAAS';
COMMENT ON TABLE subscription_events IS 'Histórico de eventos das assinaturas';
COMMENT ON TABLE invoices IS 'Faturas das assinaturas';
COMMENT ON TABLE payments IS 'Pagamentos realizados';

SELECT 'Migration 20260129000000_add_super_admin_role completed successfully' AS result;


-- ============================================
-- Migration: 20260129000001_add_platform_metrics_rpc.sql
-- ============================================

-- Migration: Add RPC function for platform metrics
-- This provides a database function alternative to the Edge Function

-- Function to get platform-wide metrics for super admin dashboard
CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS TABLE (
  mrr BIGINT,
  arr BIGINT,
  total_tenants BIGINT,
  active_tenants BIGINT,
  churn_rate NUMERIC,
  avg_ltv NUMERIC,
  new_this_month BIGINT,
  canceled_this_month BIGINT,
  growth_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_mrr BIGINT;
  v_total_tenants BIGINT;
  v_active_tenants BIGINT;
  v_new_this_month BIGINT;
  v_canceled_this_month BIGINT;
  v_canceled_last_month BIGINT;
  v_active_last_month BIGINT;
  v_churn_rate NUMERIC;
  v_avg_ltv NUMERIC;
  v_growth_rate NUMERIC;
  v_last_month_mrr BIGINT;
BEGIN
  -- Check if user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;

  -- Calculate current MRR from active/trialing subscriptions
  SELECT COALESCE(SUM(
    CASE 
      WHEN s.plan_type = 'annual' THEN ROUND(s.price_cents / 12.0)
      ELSE s.price_cents
    END
  ), 0)
  INTO v_current_mrr
  FROM subscriptions s
  WHERE s.status IN ('active', 'trialing');

  -- Count total unique organizations (tenants)
  SELECT COUNT(DISTINCT organization_id)
  INTO v_total_tenants
  FROM subscriptions
  WHERE status IN ('active', 'trialing', 'canceled');

  -- Count active tenants
  SELECT COUNT(DISTINCT organization_id)
  INTO v_active_tenants
  FROM subscriptions
  WHERE status = 'active';

  -- New subscriptions this month
  SELECT COUNT(*)
  INTO v_new_this_month
  FROM subscription_events
  WHERE event_type = 'subscription_created'
    AND created_at >= DATE_TRUNC('month', NOW());

  -- Canceled subscriptions this month
  SELECT COUNT(*)
  INTO v_canceled_this_month
  FROM subscription_events
  WHERE event_type = 'subscription_canceled'
    AND created_at >= DATE_TRUNC('month', NOW());

  -- Canceled last month (for churn calculation)
  SELECT COUNT(*)
  INTO v_canceled_last_month
  FROM subscription_events
  WHERE event_type = 'subscription_canceled'
    AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', NOW());

  -- Active tenants last month
  v_active_last_month := v_active_tenants + v_canceled_this_month;

  -- Calculate churn rate
  IF v_active_last_month > 0 THEN
    v_churn_rate := ROUND((v_canceled_last_month::NUMERIC / v_active_last_month) * 100, 2);
  ELSE
    v_churn_rate := 0;
  END IF;

  -- Calculate average LTV
  IF v_total_tenants > 0 AND v_churn_rate > 0 THEN
    v_avg_ltv := ROUND((v_current_mrr::NUMERIC / v_total_tenants) / (v_churn_rate / 100), 2);
  ELSE
    v_avg_ltv := COALESCE(v_current_mrr::NUMERIC / NULLIF(v_total_tenants, 0) * 24, 0);
  END IF;

  -- Calculate MRR for last month (simplified)
  SELECT COALESCE(SUM(
    CASE 
      WHEN s.plan_type = 'annual' THEN ROUND(s.price_cents / 12.0)
      ELSE s.price_cents
    END
  ), 0)
  INTO v_last_month_mrr
  FROM subscriptions s
  WHERE s.status = 'active'
    AND s.created_at < DATE_TRUNC('month', NOW())
    AND (s.canceled_at IS NULL OR s.canceled_at >= DATE_TRUNC('month', NOW()));

  -- Calculate growth rate
  IF v_last_month_mrr > 0 THEN
    v_growth_rate := ROUND(((v_current_mrr - v_last_month_mrr)::NUMERIC / v_last_month_mrr) * 100, 2);
  ELSE
    v_growth_rate := 0;
  END IF;

  RETURN QUERY SELECT 
    v_current_mrr,
    v_current_mrr * 12,
    v_total_tenants,
    v_active_tenants,
    v_churn_rate,
    v_avg_ltv,
    v_new_this_month,
    v_canceled_this_month,
    v_growth_rate;
END;
$$;

-- Grant execute permission to authenticated users
-- (RLS check inside function ensures only super_admin can access)
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO service_role;

-- Function to get MRR history over time
CREATE OR REPLACE FUNCTION get_mrr_history(months_count INTEGER DEFAULT 12)
RETURNS TABLE (
  month_label TEXT,
  month_date DATE,
  mrr_value BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INTEGER;
  target_date DATE;
  month_mrr BIGINT;
BEGIN
  -- Check if user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;

  FOR i IN 0..(months_count - 1) LOOP
    target_date := DATE_TRUNC('month', NOW() - (i || ' months')::INTERVAL)::DATE;
    
    -- Calculate MRR for this month
    SELECT COALESCE(SUM(
      CASE 
        WHEN s.plan_type = 'annual' THEN ROUND(s.price_cents / 12.0)
        ELSE s.price_cents
      END
    ), 0)
    INTO month_mrr
    FROM subscriptions s
    WHERE s.status = 'active'
      AND s.created_at <= (target_date + INTERVAL '1 month' - INTERVAL '1 day')
      AND (s.canceled_at IS NULL OR s.canceled_at > target_date);

    month_label := TO_CHAR(target_date, 'Mon YY');
    month_date := target_date;
    mrr_value := month_mrr;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO service_role;

-- Function to get recent subscriptions with organization details
CREATE OR REPLACE FUNCTION get_recent_subscriptions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  subscription_id UUID,
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  plan_type TEXT,
  status TEXT,
  price_cents INTEGER,
  created_at TIMESTAMPTZ,
  event_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;

  RETURN QUERY
  SELECT 
    s.id AS subscription_id,
    s.organization_id,
    o.name AS organization_name,
    o.slug AS organization_slug,
    s.plan_type,
    s.status,
    s.price_cents,
    s.created_at,
    se.event_type
  FROM subscriptions s
  JOIN organizations o ON o.id = s.organization_id
  LEFT JOIN LATERAL (
    SELECT event_type 
    FROM subscription_events 
    WHERE subscription_id = s.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) se ON true
  ORDER BY s.created_at DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_platform_metrics() IS 'Returns platform-wide SaaS metrics (MRR, ARR, churn, LTV) for super admin dashboard. Requires super_admin role.';
COMMENT ON FUNCTION get_mrr_history(INTEGER) IS 'Returns MRR history for the last N months. Requires super_admin role.';
COMMENT ON FUNCTION get_recent_subscriptions(INTEGER) IS 'Returns recent subscriptions with organization details. Requires super_admin role.';



-- ============================================
-- Migration: 20260129000001_fix_admin_domain.sql
-- ============================================

-- =====================================================
-- CORREÇÃO: Adicionar domínio admin.studioos.pro
-- =====================================================
-- Issue: O domínio admin.studioos.pro não estava registrado,
-- apenas panel.studioos.pro (legacy). Isso fazia com que
-- o roteamento isAdmin não funcionasse corretamente.

-- Adicionar domínio canônico admin.studioos.pro
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.pro', 'admin', NULL, true)
ON CONFLICT (hostname) DO NOTHING;

-- Também adicionar para .com.br se necessário
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.com.br', 'admin', NULL, true)
ON CONFLICT (hostname) DO NOTHING;

-- Atualizar panel.studioos.pro para redirecionar (manter compatibilidade)
-- O redirecionamento é feito no domainResolver.ts (client-side)
-- ou via Edge Middleware no futuro
UPDATE public.domains 
SET active = true,
    updated_at = now()
WHERE hostname IN ('panel.studioos.pro', 'panel.studioos.com.br');

-- Garantir que todos os domínios de plataforma estejam ativos
UPDATE public.domains 
SET active = true,
    updated_at = now()
WHERE hostname IN (
    'studioos.pro',
    'www.studioos.pro', 
    'studioos.com.br',
    'www.studioos.com.br',
    'admin.studioos.pro',
    'admin.studioos.com.br',
    'fornecedores.studioos.pro',
    'fornecedores.studioos.com.br',
    'app.studioos.pro',
    'app.studioos.com.br'
);

-- Comentário explicativo
COMMENT ON TABLE public.domains IS 'Tabela de domínios para roteamento. admin.studioos.pro = role admin';



-- ============================================
-- Migration: 20260129000002_add_feature_flags.sql
-- ============================================

-- Migration: Add feature flags system for tenant-level feature management

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'general',
  default_value BOOLEAN DEFAULT false,
  plan_values JSONB DEFAULT '{}', -- { "starter": false, "pro": true, "business": true, "enterprise": true }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_feature_overrides table
CREATE TABLE IF NOT EXISTS organization_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  value BOOLEAN NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, feature_flag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org ON organization_feature_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_feature ON organization_feature_overrides(feature_flag_id);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_feature_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags
-- Super admin can manage all feature flags
CREATE POLICY "Super admin full access on feature_flags"
  ON feature_flags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Authenticated users can read feature flags
CREATE POLICY "Authenticated users can read feature_flags"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for organization_feature_overrides
-- Super admin can manage all overrides
CREATE POLICY "Super admin full access on org_feature_overrides"
  ON organization_feature_overrides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Organization admins can read their own overrides
CREATE POLICY "Org users can read their overrides"
  ON organization_feature_overrides
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid()
    )
  );

-- Function to check feature flag for an organization
CREATE OR REPLACE FUNCTION check_feature_flag(
  p_organization_id UUID,
  p_flag_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag_id UUID;
  v_default_value BOOLEAN;
  v_plan_values JSONB;
  v_override_value BOOLEAN;
  v_org_plan TEXT;
  v_result BOOLEAN;
BEGIN
  -- Get feature flag details
  SELECT id, default_value, plan_values
  INTO v_flag_id, v_default_value, v_plan_values
  FROM feature_flags
  WHERE name = p_flag_name;

  -- Flag not found
  IF v_flag_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check for organization override
  SELECT value INTO v_override_value
  FROM organization_feature_overrides
  WHERE organization_id = p_organization_id
    AND feature_flag_id = v_flag_id;

  -- If override exists, return it
  IF v_override_value IS NOT NULL THEN
    RETURN v_override_value;
  END IF;

  -- Get organization's subscription plan
  SELECT plan_type INTO v_org_plan
  FROM subscriptions
  WHERE organization_id = p_organization_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to starter if no subscription
  IF v_org_plan IS NULL THEN
    v_org_plan := 'starter';
  END IF;

  -- Check plan-based value
  IF v_plan_values ? v_org_plan THEN
    RETURN (v_plan_values->>v_org_plan)::BOOLEAN;
  END IF;

  -- Return default value
  RETURN v_default_value;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO anon;

-- Function to get all feature flags for an organization
CREATE OR REPLACE FUNCTION get_organization_features(
  p_organization_id UUID
)
RETURNS TABLE (
  name TEXT,
  description TEXT,
  category TEXT,
  value BOOLEAN,
  has_override BOOLEAN,
  plan_value BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_plan TEXT;
BEGIN
  -- Get organization's subscription plan
  SELECT plan_type INTO v_org_plan
  FROM subscriptions
  WHERE organization_id = p_organization_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to starter if no subscription
  IF v_org_plan IS NULL THEN
    v_org_plan := 'starter';
  END IF;

  RETURN QUERY
  SELECT 
    ff.name,
    ff.description,
    ff.category,
    COALESCE(ofo.value, 
      CASE 
        WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN
        ELSE ff.default_value
      END
    ) as value,
    ofo.value IS NOT NULL as has_override,
    CASE 
      WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN
      ELSE ff.default_value
    END as plan_value
  FROM feature_flags ff
  LEFT JOIN organization_feature_overrides ofo
    ON ofo.feature_flag_id = ff.id
    AND ofo.organization_id = p_organization_id
  ORDER BY ff.category, ff.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_organization_features(UUID) TO authenticated;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_feature_overrides_updated_at
  BEFORE UPDATE ON organization_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default feature flags
INSERT INTO feature_flags (name, description, category, default_value, plan_values) VALUES
('advanced_analytics', 'Relatórios avançados e dashboards personalizados', 'analytics', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('multi_user', 'Suporte a múltiplos usuários na organização', 'users', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('api_access', 'Acesso à API para integrações', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('webhooks', 'Webhooks para eventos em tempo real', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('custom_domain', 'Uso de domínio personalizado', 'branding', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('white_label', 'Remoção da marca Prisma', 'branding', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('priority_support', 'Suporte prioritário via chat e email', 'support', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('dedicated_manager', 'Gerente de conta dedicado', 'support', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('advanced_permissions', 'Permissões granulares por usuário', 'users', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('export_data', 'Exportação de dados em CSV/Excel', 'data', true, '{"starter": true, "pro": true, "business": true, "enterprise": true}'),
('bulk_import', 'Importação em massa de dados', 'data', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('custom_reports', 'Relatórios customizados', 'analytics', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}')
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE feature_flags IS 'Stores feature flags/ toggles for the platform with plan-based defaults';
COMMENT ON TABLE organization_feature_overrides IS 'Stores organization-specific overrides for feature flags';
COMMENT ON FUNCTION check_feature_flag(UUID, TEXT) IS 'Checks if a feature flag is enabled for a specific organization, considering plan values and overrides';
COMMENT ON FUNCTION get_organization_features(UUID) IS 'Returns all feature flags with their current values for a specific organization';



-- ============================================
-- Migration: 20260129000002_fix_studioos_com_br_role.sql
-- ============================================

-- =====================================================
-- FIX CRÍTICO: Corrigir role de studioos.com.br
-- Data: 2026-01-29
-- 
-- PROBLEMA: studioos.com.br estava incorretamente
-- configurado como 'admin' no banco de dados, permitindo
-- acesso ao painel admin via URL path incorreta.
--
-- SOLUÇÃO: Garantir que studioos.com.br seja SEMPRE 'marketing'
-- e apenas admin.studioos.com.br seja 'admin'
-- =====================================================

-- 1. CORREÇÃO PRINCIPAL: Garantir que studioos.com.br seja marketing
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'studioos.com.br';

-- 2. Garantir que www.studioos.com.br também seja marketing
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'www.studioos.com.br';

-- 3. Garantir que studioos.pro seja marketing (se existir)
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'studioos.pro';

-- 4. Garantir que www.studioos.pro seja marketing (se existir)
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname = 'www.studioos.pro';

-- 5. Verificação: Impedir que qualquer domínio principal seja 'admin'
-- Se por algum razão existir outro domínio principal como admin, corrigir
UPDATE public.domains
SET 
  role = 'marketing',
  organization_id = '00000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = now()
WHERE hostname IN ('studioos.com.br', 'www.studioos.com.br', 'studioos.pro', 'www.studioos.pro')
  AND role = 'admin';

-- 6. Inserir admin.studioos.com.br se não existir (garantir que admin funcione)
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.com.br', 'admin', NULL, true)
ON CONFLICT (hostname) DO UPDATE SET 
  role = 'admin',
  organization_id = NULL,
  active = true;

-- 7. Inserir admin.studioos.pro se não existir
INSERT INTO public.domains (hostname, role, organization_id, active)
VALUES ('admin.studioos.pro', 'admin', NULL, true)
ON CONFLICT (hostname) DO UPDATE SET 
  role = 'admin',
  organization_id = NULL,
  active = true;

-- Comentário explicativo
COMMENT ON TABLE public.domains IS 
'Tabela de domínios para roteamento. 
REGRA CRÍTICA: 
- studioos.com.br/pro = marketing (LP pública)
- admin.studioos.com.br/pro = admin (painel admin)
NUNCA misturar roles entre domínios principais e subdomínios admin.';



-- ============================================
-- Migration: 20260129000003_fix_user_role_enum.sql
-- ============================================

-- Migration para criar user_role enum e adicionar super_admin
-- Data: 2026-01-29

-- ============================================================
-- 1. CRIAR TIPO user_role SE NÃO EXISTIR
-- ============================================================
DO $$
BEGIN
    -- Verificar se o tipo user_role já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'user_role' 
        AND typtype = 'e'
    ) THEN
        -- Criar o enum com os valores básicos
        CREATE TYPE user_role AS ENUM ('admin', 'user');
        RAISE NOTICE 'Tipo user_role criado com valores: admin, user';
    ELSE
        RAISE NOTICE 'Tipo user_role já existe';
    END IF;
END $$;

-- ============================================================
-- 2. ADICIONAR super_admin AO ENUM SE AINDA NÃO EXISTIR
-- ============================================================
DO $$
DECLARE
    enum_exists boolean;
BEGIN
    -- Verificar se super_admin já existe no enum
    SELECT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumtypid = 'user_role'::regtype 
        AND enumlabel = 'super_admin'
    ) INTO enum_exists;
    
    IF NOT enum_exists THEN
        -- Adicionar super_admin ao enum
        ALTER TYPE user_role ADD VALUE 'super_admin';
        RAISE NOTICE 'Valor super_admin adicionado ao tipo user_role';
    ELSE
        RAISE NOTICE 'Valor super_admin já existe no tipo user_role';
    END IF;
END $$;

-- ============================================================
-- 3. VERIFICAR COLUNA role NA TABELA organization_members
-- ============================================================
DO $$
BEGIN
    -- Verificar se a coluna existe e é do tipo correto
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_members' 
        AND column_name = 'role'
    ) THEN
        -- Verificar o tipo da coluna
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'organization_members' 
            AND column_name = 'role'
            AND data_type = 'USER-DEFINED'
            AND udt_name = 'user_role'
        ) THEN
            RAISE NOTICE 'Coluna organization_members.role já é do tipo user_role';
        ELSE
            RAISE WARNING 'Coluna organization_members.role existe mas não é do tipo user_role. Pode ser necessário converter.';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna role não encontrada em organization_members - será necessário adicionar manualmente se necessário';
    END IF;
END $$;

-- ============================================================
-- 4. VERIFICAR SE HÁ POLÍTICAS RLS QUE DEPENDEM DO user_role
-- ============================================================
-- Listar políticas atuais para referência
DO $$
DECLARE
    policy_rec record;
BEGIN
    RAISE NOTICE 'Políticas RLS em organization_members:';
    FOR policy_rec IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_members'
    LOOP
        RAISE NOTICE '  - %: % (%)', policy_rec.policyname, policy_rec.cmd, policy_rec.permissive;
    END LOOP;
END $$;

-- ============================================================
-- 5. LOG DE CONFIRMAÇÃO
-- ============================================================
DO $$
DECLARE
    enum_values text;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype;
    
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'MIGRATION COMPLETA: user_role enum';
    RAISE NOTICE 'Valores atuais do enum: %', enum_values;
    RAISE NOTICE '===============================================';
END $$;



-- ============================================
-- Migration: 20260129000004_safe_domains_setup.sql
-- ============================================

-- Migration segura para setup de domínios
-- Data: 2026-01-29
-- Trata indexes e constraints existentes

-- ============================================================
-- 1. TABELA DOMAINS (se não existir)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostname TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('marketing', 'app', 'admin', 'supplier')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. INDEXES (criar apenas se não existirem)
-- ============================================================
DO $$
BEGIN
    -- Index em hostname
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_domains_hostname'
    ) THEN
        CREATE INDEX idx_domains_hostname ON public.domains(hostname);
        RAISE NOTICE 'Index idx_domains_hostname criado';
    ELSE
        RAISE NOTICE 'Index idx_domains_hostname já existe';
    END IF;

    -- Index em organization_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_domains_organization'
    ) THEN
        CREATE INDEX idx_domains_organization ON public.domains(organization_id);
        RAISE NOTICE 'Index idx_domains_organization criado';
    ELSE
        RAISE NOTICE 'Index idx_domains_organization já existe';
    END IF;

    -- Index em role
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_domains_role'
    ) THEN
        CREATE INDEX idx_domains_role ON public.domains(role);
        RAISE NOTICE 'Index idx_domains_role criado';
    ELSE
        RAISE NOTICE 'Index idx_domains_role já existe';
    END IF;
END $$;

-- ============================================================
-- 3. TRIGGER PARA updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente para recriar
DROP TRIGGER IF EXISTS handle_domains_updated_at ON public.domains;

CREATE TRIGGER handle_domains_updated_at
    BEFORE UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_domains_updated_at();

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
-- Habilitar RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Policy: select (todos podem ver domínios ativos)
DROP POLICY IF EXISTS "Anyone can view active domains" ON public.domains;
CREATE POLICY "Anyone can view active domains"
    ON public.domains
    FOR SELECT
    USING (active = true);

-- Policy: insert (apenas super_admin)
DROP POLICY IF EXISTS "Only super_admin can insert domains" ON public.domains;
CREATE POLICY "Only super_admin can insert domains"
    ON public.domains
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role = 'super_admin'
        )
    );

-- Policy: update (apenas super_admin)
DROP POLICY IF EXISTS "Only super_admin can update domains" ON public.domains;
CREATE POLICY "Only super_admin can update domains"
    ON public.domains
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
            AND om.role = 'super_admin'
        )
    );

-- ============================================================
-- 5. INSERT DOS DOMÍNIOS PRINCIPAIS (ignorar conflitos)
-- ============================================================
-- studioos.pro - marketing principal
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

-- www.studioos.pro - marketing principal
INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

-- admin.studioos.pro - admin
INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.pro', 'admin', true)
ON CONFLICT (hostname) DO NOTHING;

-- fornecedores.studioos.pro - supplier
INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.pro', 'supplier', true)
ON CONFLICT (hostname) DO NOTHING;

-- app.studioos.pro - app gateway
INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.pro', 'app', true)
ON CONFLICT (hostname) DO NOTHING;

-- ============================================================
-- 6. DOMÍNIOS studioos.com.br (se ainda não existirem)
-- ============================================================
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.com.br', 'admin', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.com.br', 'supplier', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.com.br', 'app', true)
ON CONFLICT (hostname) DO NOTHING;

-- ============================================================
-- 7. CONFIRMAÇÃO
-- ============================================================
DO $$
DECLARE
    domain_count int;
BEGIN
    SELECT COUNT(*) INTO domain_count FROM public.domains WHERE active = true;
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'MIGRATION COMPLETA: safe_domains_setup';
    RAISE NOTICE 'Total de domínios ativos: %', domain_count;
    RAISE NOTICE '===============================================';
END $$;



-- ============================================
-- Migration: 20260129000005_fix_domains_constraints.sql
-- ============================================

-- Migration para corrigir constraints da tabela domains
-- Data: 2026-01-29

-- ============================================================
-- 1. REMOVER CONSTRAINT PROBLEMÁTICA
-- ============================================================
-- A constraint domain_role_org_check exige organization_id para certos roles
-- mas domínios como studioos.pro não têm organization_id

ALTER TABLE public.domains 
DROP CONSTRAINT IF EXISTS domain_role_org_check;

-- ============================================================
-- 2. ADICIONAR CONSTRAINT MAIS FLEXÍVEL (opcional)
-- ============================================================
-- Regra: apenas 'app' e 'marketing' de organizações precisam de organization_id
-- Domínios da plataforma (studioos.pro, admin, fornecedores) não precisam

-- Comentário explicativo
COMMENT ON TABLE public.domains IS 
'Domínios do sistema. Domínios de plataforma (studioos.pro, admin, fornecedores) não requerem organization_id. Apenas domínios de clientes (app, marketing) requerem.';

-- ============================================================
-- 3. INSERIR DOMÍNIOS PRINCIPAIS
-- ============================================================

-- studioos.pro - marketing principal (sem organization_id)
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

-- www.studioos.pro - marketing principal
INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.pro', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

-- admin.studioos.pro - admin
INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.pro', 'admin', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'admin';

-- fornecedores.studioos.pro - supplier
INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.pro', 'supplier', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'supplier';

-- app.studioos.pro - app gateway
INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.pro', 'app', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'app';

-- ============================================================
-- 4. DOMÍNIOS studioos.com.br
-- ============================================================
INSERT INTO public.domains (hostname, role, active)
VALUES ('studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

INSERT INTO public.domains (hostname, role, active)
VALUES ('www.studioos.com.br', 'marketing', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'marketing';

INSERT INTO public.domains (hostname, role, active)
VALUES ('admin.studioos.com.br', 'admin', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'admin';

INSERT INTO public.domains (hostname, role, active)
VALUES ('fornecedores.studioos.com.br', 'supplier', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'supplier';

INSERT INTO public.domains (hostname, role, active)
VALUES ('app.studioos.com.br', 'app', true)
ON CONFLICT (hostname) DO UPDATE SET active = true, role = 'app';

-- ============================================================
-- 5. CONFIRMAÇÃO
-- ============================================================
DO $$
DECLARE
    domain_count int;
BEGIN
    SELECT COUNT(*) INTO domain_count FROM public.domains WHERE active = true;
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'MIGRATION COMPLETA: fix_domains_constraints';
    RAISE NOTICE 'Constraint domain_role_org_check removida';
    RAISE NOTICE 'Total de domínios ativos: %', domain_count;
    RAISE NOTICE '===============================================';
END $$;



-- ============================================
-- Migration: 20260129_consolidated_sprint7_migrations.sql
-- ============================================

-- =====================================================
-- CONSOLIDAÇÃO: Todas as Migrations do Sprint 7 (CORRIGIDA)
-- Data: 2026-01-29
-- Sprint: 7 - Painel Admin Supremo Parte 1
-- 
-- IMPORTANTE: Esta versão é compatível com o schema existente
-- da tabela subscriptions (usando plan_id em vez de plan_type)
-- =====================================================

-- =====================================================
-- MIGRATION 1: 20260129000000_add_super_admin_role.sql
-- Adiciona role super_admin e schema de subscriptions
-- =====================================================

-- 1. Adicionar valor 'super_admin' ao enum user_role se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'super_admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'super_admin';
        END IF;
    END IF;
END $$;

-- 2. Tabela de Super Admins (se não existir)
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Tabela de Planos (se não existir)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco_mensal DECIMAL(10,2) NOT NULL,
    preco_implementacao DECIMAL(10,2) DEFAULT 0,
    preco_usuario_adicional DECIMAL(10,2) DEFAULT 69.90,
    max_usuarios INT NOT NULL,
    max_usuarios_expansivel BOOLEAN DEFAULT true,
    max_orcamentos_mes INT,
    max_storage_gb INT DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    ativo BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    ordem INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Assinaturas - usa schema existente com plan_id
-- NOTA: A tabela já existe de 20260113_planos_assinaturas.sql
-- Apenas garantimos que as colunas necessárias existem

-- Adicionar colunas ASAAS se não existirem
DO $$
BEGIN
    -- Colunas para integração ASAAS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'asaas_customer_id') THEN
        ALTER TABLE subscriptions ADD COLUMN asaas_customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'asaas_subscription_id') THEN
        ALTER TABLE subscriptions ADD COLUMN asaas_subscription_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end') THEN
        ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_start') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_start TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_end') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_end TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'currency') THEN
        ALTER TABLE subscriptions ADD COLUMN currency TEXT DEFAULT 'BRL';
    END IF;
END $$;

-- 5. Tabela de eventos de subscription (histórico)
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'activated', 'renewed', 'cancelled', 'paused', 'resumed',
        'payment_received', 'payment_failed', 'payment_overdue', 'trial_started', 'trial_ended', 'plan_changed'
    )),
    previous_status TEXT,
    new_status TEXT,
    previous_plan TEXT,
    new_plan TEXT,
    amount_cents INTEGER,
    metadata JSONB,
    asaas_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabela de faturas (invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE,
    asaas_invoice_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asaas_payment_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'received', 'overdue', 'cancelled', 'refunded')),
    payment_method TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Inserir planos padrão se não existirem
INSERT INTO plans (codigo, nome, descricao, preco_mensal, preco_implementacao, preco_usuario_adicional, max_usuarios, max_usuarios_expansivel, max_orcamentos_mes, features, ordem, destaque) VALUES
('starter_3', 'Starter', 'Ideal para pequenas empresas começando a organizar seus processos', 
 49900, 300000, 6990, 3, true, 100,
 '["orcamentos", "crm_basico", "producao", "calendario"]'::jsonb,
 1, false),
('pro_10', 'Profissional', 'Para empresas em crescimento que precisam de mais controle',
 89900, 450000, 6990, 10, true, 500,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "calendario"]'::jsonb,
 2, true),
('business_25', 'Business', 'Solução completa para operações de médio porte',
 149900, 700000, 6990, 25, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "calendario", "suporte_prioritario"]'::jsonb,
 3, false),
('enterprise_50', 'Enterprise', 'Máxima performance para grandes operações',
 249900, 1200000, 5990, 50, true, NULL,
 '["orcamentos", "crm_basico", "crm_avancado", "producao", "financeiro", "relatorios_bi", "nfe", "integracao_whatsapp", "api_acesso", "calendario", "suporte_prioritario", "customizacoes"]'::jsonb,
 4, false)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  preco_mensal = EXCLUDED.preco_mensal,
  preco_implementacao = EXCLUDED.preco_implementacao,
  preco_usuario_adicional = EXCLUDED.preco_usuario_adicional,
  max_usuarios = EXCLUDED.max_usuarios,
  max_usuarios_expansivel = EXCLUDED.max_usuarios_expansivel,
  max_orcamentos_mes = EXCLUDED.max_orcamentos_mes,
  features = EXCLUDED.features,
  ordem = EXCLUDED.ordem,
  destaque = EXCLUDED.destaque,
  updated_at = now();

-- 9. Indexes para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas ON subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_events_sub ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created ON subscription_events(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_sub ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_super_admins_user ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_codigo ON plans(codigo);

-- 10. RLS Policies
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies para super_admins
CREATE POLICY "Super admins podem gerenciar super_admins" ON super_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Policies para plans
CREATE POLICY "Todos podem ver planos ativos" ON plans
  FOR SELECT USING (ativo = true);
CREATE POLICY "Super admins gerenciam planos" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Policies para subscriptions (já existem, mas garantimos)
DROP POLICY IF EXISTS "Super admin can manage all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Organization members can view own subscription" ON subscriptions;
CREATE POLICY "Super admin can manage all subscriptions" ON subscriptions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own subscription" ON subscriptions FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Policies para subscription_events
CREATE POLICY "Super admin can manage all subscription events" ON subscription_events FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own subscription events" ON subscription_events FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Policies para invoices
CREATE POLICY "Super admin can manage all invoices" ON invoices FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own invoices" ON invoices FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Policies para payments
CREATE POLICY "Super admin can manage all payments" ON payments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
CREATE POLICY "Organization members can view own payments" ON payments FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- 11. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE super_admins IS 'Super administradores da plataforma';
COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE subscription_events IS 'Histórico de eventos das assinaturas';
COMMENT ON TABLE invoices IS 'Faturas das assinaturas';
COMMENT ON TABLE payments IS 'Pagamentos realizados';


-- =====================================================
-- MIGRATION 2: 20260129000001_add_platform_metrics_rpc.sql
-- Adiciona RPCs para métricas da plataforma (ADAPTADO para schema existente)
-- =====================================================

-- Função auxiliar para obter código do plano a partir do subscription
CREATE OR REPLACE FUNCTION get_subscription_plan_code(p_subscription_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_plan_code TEXT;
BEGIN
    SELECT p.codigo INTO v_plan_code
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.id = p_subscription_id;
    RETURN v_plan_code;
END;
$$;

CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS TABLE (mrr BIGINT, arr BIGINT, total_tenants BIGINT, active_tenants BIGINT, churn_rate NUMERIC, avg_ltv NUMERIC, new_this_month BIGINT, canceled_this_month BIGINT, growth_rate NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_mrr BIGINT; v_total_tenants BIGINT; v_active_tenants BIGINT; v_new_this_month BIGINT; v_canceled_this_month BIGINT; v_canceled_last_month BIGINT; v_active_last_month BIGINT; v_churn_rate NUMERIC; v_avg_ltv NUMERIC; v_growth_rate NUMERIC; v_last_month_mrr BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;
  
  -- Calcular MRR baseado no preço mensal dos planos
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.codigo LIKE '%annual%' THEN ROUND(p.preco_mensal / 12.0)
      ELSE p.preco_mensal 
    END::BIGINT
  ), 0) INTO v_current_mrr 
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.status IN ('active', 'trial');
  
  SELECT COUNT(DISTINCT organization_id) INTO v_total_tenants 
  FROM subscriptions 
  WHERE status IN ('active', 'trial', 'cancelled');
  
  SELECT COUNT(DISTINCT organization_id) INTO v_active_tenants 
  FROM subscriptions 
  WHERE status = 'active';
  
  SELECT COUNT(*) INTO v_new_this_month 
  FROM subscription_events 
  WHERE event_type = 'created' AND created_at >= DATE_TRUNC('month', NOW());
  
  SELECT COUNT(*) INTO v_canceled_this_month 
  FROM subscription_events 
  WHERE event_type = 'cancelled' AND created_at >= DATE_TRUNC('month', NOW());
  
  SELECT COUNT(*) INTO v_canceled_last_month 
  FROM subscription_events 
  WHERE event_type = 'cancelled' AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', NOW());
  
  v_active_last_month := v_active_tenants + v_canceled_this_month;
  IF v_active_last_month > 0 THEN v_churn_rate := ROUND((v_canceled_last_month::NUMERIC / v_active_last_month) * 100, 2); ELSE v_churn_rate := 0; END IF;
  
  IF v_total_tenants > 0 AND v_churn_rate > 0 THEN 
    v_avg_ltv := ROUND((v_current_mrr::NUMERIC / v_total_tenants) / (v_churn_rate / 100), 2);
  ELSE 
    v_avg_ltv := COALESCE(v_current_mrr::NUMERIC / NULLIF(v_total_tenants, 0) * 24, 0); 
  END IF;
  
  -- Calcular MRR do mês anterior
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.codigo LIKE '%annual%' THEN ROUND(p.preco_mensal / 12.0)
      ELSE p.preco_mensal 
    END::BIGINT
  ), 0) INTO v_last_month_mrr 
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.status = 'active' 
    AND s.created_at < DATE_TRUNC('month', NOW()) 
    AND (s.cancelled_at IS NULL OR s.cancelled_at >= DATE_TRUNC('month', NOW()));
  
  IF v_last_month_mrr > 0 THEN 
    v_growth_rate := ROUND(((v_current_mrr - v_last_month_mrr)::NUMERIC / v_last_month_mrr) * 100, 2); 
  ELSE 
    v_growth_rate := 0; 
  END IF;
  
  RETURN QUERY SELECT v_current_mrr, v_current_mrr * 12, v_total_tenants, v_active_tenants, v_churn_rate, v_avg_ltv, v_new_this_month, v_canceled_this_month, v_growth_rate;
END;
$$;
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO service_role;

CREATE OR REPLACE FUNCTION get_mrr_history(months_count INTEGER DEFAULT 12)
RETURNS TABLE (month_label TEXT, month_date DATE, mrr_value BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE i INTEGER; target_date DATE; month_mrr BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;
  FOR i IN 0..(months_count - 1) LOOP
    target_date := DATE_TRUNC('month', NOW() - (i || ' months')::INTERVAL)::DATE;
    SELECT COALESCE(SUM(
      CASE 
        WHEN p.codigo LIKE '%annual%' THEN ROUND(p.preco_mensal / 12.0)
        ELSE p.preco_mensal 
      END::BIGINT
    ), 0) INTO month_mrr
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.status = 'active' 
      AND s.created_at <= (target_date + INTERVAL '1 month' - INTERVAL '1 day') 
      AND (s.cancelled_at IS NULL OR s.cancelled_at > target_date);
    month_label := TO_CHAR(target_date, 'Mon YY'); month_date := target_date; mrr_value := month_mrr;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;
GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION get_recent_subscriptions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (subscription_id UUID, organization_id UUID, organization_name TEXT, organization_slug TEXT, plan_code TEXT, status TEXT, price_cents INTEGER, created_at TIMESTAMPTZ, event_type TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;
  RETURN QUERY
  SELECT s.id AS subscription_id, s.organization_id, o.name AS organization_name, o.slug AS organization_slug, 
         p.codigo AS plan_code, s.status, 
         (p.preco_mensal::INTEGER) as price_cents, 
         s.created_at, se.event_type
  FROM subscriptions s 
  JOIN organizations o ON o.id = s.organization_id
  JOIN plans p ON p.id = s.plan_id
  LEFT JOIN LATERAL (SELECT event_type FROM subscription_events WHERE subscription_id = s.id ORDER BY created_at DESC LIMIT 1) se ON true
  ORDER BY s.created_at DESC LIMIT limit_count;
END;
$$;
GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO service_role;

COMMENT ON FUNCTION get_platform_metrics() IS 'Returns platform-wide SaaS metrics (MRR, ARR, churn, LTV) for super admin dashboard. Requires super_admin role.';
COMMENT ON FUNCTION get_mrr_history(INTEGER) IS 'Returns MRR history for the last N months. Requires super_admin role.';
COMMENT ON FUNCTION get_recent_subscriptions(INTEGER) IS 'Returns recent subscriptions with organization details. Requires super_admin role.';


-- =====================================================
-- MIGRATION 3: 20260129000001_fix_admin_domain.sql
-- Adiciona domínio admin.studioos.pro
-- =====================================================

INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.pro', 'admin', NULL, true) ON CONFLICT (hostname) DO NOTHING;
INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.com.br', 'admin', NULL, true) ON CONFLICT (hostname) DO NOTHING;

UPDATE public.domains SET active = true, updated_at = now() WHERE hostname IN ('panel.studioos.pro', 'panel.studioos.com.br');

UPDATE public.domains SET active = true, updated_at = now() WHERE hostname IN (
    'studioos.pro', 'www.studioos.pro', 'studioos.com.br', 'www.studioos.com.br',
    'admin.studioos.pro', 'admin.studioos.com.br',
    'fornecedores.studioos.pro', 'fornecedores.studioos.com.br',
    'app.studioos.pro', 'app.studioos.com.br'
);

COMMENT ON TABLE public.domains IS 'Tabela de domínios para roteamento. admin.studioos.pro = role admin';


-- =====================================================
-- MIGRATION 4: 20260129000002_add_feature_flags.sql
-- Adiciona sistema de feature flags (ADAPTADO para schema existente)
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'general',
  default_value BOOLEAN DEFAULT false,
  plan_values JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  value BOOLEAN NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, feature_flag_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org ON organization_feature_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_feature ON organization_feature_overrides(feature_flag_id);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on feature_flags" ON feature_flags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can read feature_flags" ON feature_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin full access on org_feature_overrides" ON organization_feature_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Org users can read their overrides" ON organization_feature_overrides FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Função auxiliar para obter código do plano da organização
CREATE OR REPLACE FUNCTION get_org_plan_code(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_plan_code TEXT;
BEGIN
    SELECT p.codigo INTO v_plan_code
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.organization_id = p_org_id
      AND s.status IN ('trial', 'active')
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_plan_code, 'starter_3');
END;
$$;

CREATE OR REPLACE FUNCTION check_feature_flag(p_organization_id UUID, p_flag_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_flag_id UUID; v_default_value BOOLEAN; v_plan_values JSONB; v_override_value BOOLEAN; v_org_plan TEXT;
BEGIN
  SELECT id, default_value, plan_values INTO v_flag_id, v_default_value, v_plan_values FROM feature_flags WHERE name = p_flag_name;
  IF v_flag_id IS NULL THEN RETURN false; END IF;
  SELECT value INTO v_override_value FROM organization_feature_overrides WHERE organization_id = p_organization_id AND feature_flag_id = v_flag_id;
  IF v_override_value IS NOT NULL THEN RETURN v_override_value; END IF;
  
  -- Obter plano da organização (código do plano)
  v_org_plan := get_org_plan_code(p_organization_id);
  
  -- Mapear códigos de plano para chaves do plan_values
  -- starter_3 -> starter, pro_10 -> pro, business_25 -> business, enterprise_50 -> enterprise
  v_org_plan := CASE 
    WHEN v_org_plan LIKE 'starter%' THEN 'starter'
    WHEN v_org_plan LIKE 'pro%' THEN 'pro'
    WHEN v_org_plan LIKE 'business%' THEN 'business'
    WHEN v_org_plan LIKE 'enterprise%' THEN 'enterprise'
    ELSE 'starter'
  END;
  
  IF v_plan_values ? v_org_plan THEN RETURN (v_plan_values->>v_org_plan)::BOOLEAN; END IF;
  RETURN v_default_value;
END;
$$;
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_feature_flag(UUID, TEXT) TO anon;

CREATE OR REPLACE FUNCTION get_organization_features(p_organization_id UUID)
RETURNS TABLE (name TEXT, description TEXT, category TEXT, value BOOLEAN, has_override BOOLEAN, plan_value BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org_plan TEXT;
BEGIN
  v_org_plan := get_org_plan_code(p_organization_id);
  
  -- Mapear para chave do plan_values
  v_org_plan := CASE 
    WHEN v_org_plan LIKE 'starter%' THEN 'starter'
    WHEN v_org_plan LIKE 'pro%' THEN 'pro'
    WHEN v_org_plan LIKE 'business%' THEN 'business'
    WHEN v_org_plan LIKE 'enterprise%' THEN 'enterprise'
    ELSE 'starter'
  END;
  
  RETURN QUERY
  SELECT ff.name, ff.description, ff.category,
    COALESCE(ofo.value, CASE WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN ELSE ff.default_value END) as value,
    ofo.value IS NOT NULL as has_override,
    CASE WHEN ff.plan_values ? v_org_plan THEN (ff.plan_values->>v_org_plan)::BOOLEAN ELSE ff.default_value END as plan_value
  FROM feature_flags ff
  LEFT JOIN organization_feature_overrides ofo ON ofo.feature_flag_id = ff.id AND ofo.organization_id = p_organization_id
  ORDER BY ff.category, ff.name;
END;
$$;
GRANT EXECUTE ON FUNCTION get_organization_features(UUID) TO authenticated;

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_feature_overrides_updated_at ON organization_feature_overrides;
CREATE TRIGGER update_org_feature_overrides_updated_at BEFORE UPDATE ON organization_feature_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO feature_flags (name, description, category, default_value, plan_values) VALUES
('advanced_analytics', 'Relatórios avançados e dashboards personalizados', 'analytics', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('multi_user', 'Suporte a múltiplos usuários na organização', 'users', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('api_access', 'Acesso à API para integrações', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('webhooks', 'Webhooks para eventos em tempo real', 'integrations', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('custom_domain', 'Uso de domínio personalizado', 'branding', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('white_label', 'Remoção da marca Prisma', 'branding', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('priority_support', 'Suporte prioritário via chat e email', 'support', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('dedicated_manager', 'Gerente de conta dedicado', 'support', false, '{"starter": false, "pro": false, "business": false, "enterprise": true}'),
('advanced_permissions', 'Permissões granulares por usuário', 'users', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}'),
('export_data', 'Exportação de dados em CSV/Excel', 'data', true, '{"starter": true, "pro": true, "business": true, "enterprise": true}'),
('bulk_import', 'Importação em massa de dados', 'data', false, '{"starter": false, "pro": true, "business": true, "enterprise": true}'),
('custom_reports', 'Relatórios customizados', 'analytics', false, '{"starter": false, "pro": false, "business": true, "enterprise": true}')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE feature_flags IS 'Stores feature flags/toggles for the platform with plan-based defaults';
COMMENT ON TABLE organization_feature_overrides IS 'Stores organization-specific overrides for feature flags';
COMMENT ON FUNCTION check_feature_flag(UUID, TEXT) IS 'Checks if a feature flag is enabled for a specific organization, considering plan values and overrides';
COMMENT ON FUNCTION get_organization_features(UUID) IS 'Returns all feature flags with their current values for a specific organization';


-- =====================================================
-- MIGRATION 5: 20260129000002_fix_studioos_com_br_role.sql
-- Corrige role de studioos.com.br para marketing
-- =====================================================

UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'studioos.com.br';
UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'www.studioos.com.br';
UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'studioos.pro';
UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now() WHERE hostname = 'www.studioos.pro';

UPDATE public.domains SET role = 'marketing', organization_id = '00000000-0000-0000-0000-000000000001', active = true, updated_at = now()
WHERE hostname IN ('studioos.com.br', 'www.studioos.com.br', 'studioos.pro', 'www.studioos.pro') AND role = 'admin';

INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.com.br', 'admin', NULL, true) ON CONFLICT (hostname) DO UPDATE SET role = 'admin', organization_id = NULL, active = true;
INSERT INTO public.domains (hostname, role, organization_id, active) VALUES ('admin.studioos.pro', 'admin', NULL, true) ON CONFLICT (hostname) DO UPDATE SET role = 'admin', organization_id = NULL, active = true;

COMMENT ON TABLE public.domains IS 'Tabela de domínios para roteamento. REGRA CRÍTICA: studioos.com.br/pro = marketing (LP pública), admin.studioos.com.br/pro = admin (painel admin)';


-- =====================================================
-- FIM DAS MIGRATIONS
-- =====================================================
SELECT 'Todas as migrations do Sprint 7 foram aplicadas com sucesso! (Versão corrigida - compatível com schema existente)' AS result;


-- Reabilitar RLS
SET session_replication_role = 'origin';
