# 🚀 Expansão do ERP - Generalização e Novos Módulos

**Data:** 2026-01-16  
**Objetivo:** Transformar sistema de cortinas/persianas em ERP genérico para decoração  
**Status:** Análise Completa e Propostas

---

## 📋 SUMÁRIO EXECUTIVO

Este documento consolida:
- Diagnóstico de partes rígidas do sistema atual
- Proposta de modelo de dados genérico para produtos
- Design do módulo de estoque
- Design do módulo de integrações
- Análise de impactos técnicos
- Comparação com ERPs do mercado
- Roadmap completo de implementação

---

## 🔍 PARTE 1: DIAGNÓSTICO DA ESTRUTURA ATUAL

### 1.1 Partes Rígidas para Cortinas/Persianas

#### A. Models/Schemas Específicos

**Tabela `cortina_items`:**
- **Arquivo:** `supabase/migrations/20251120154349_*.sql`
- **Problema:** Nome e estrutura específica para cortinas
- **Campos rígidos:**
  - `tipo_cortina` (wave, prega, painel, rolo, horizontal, vertical, romana, celular, madeira)
  - `tecido_id`, `forro_id`, `trilho_id` (FKs específicas)
  - `barra_cm`, `barra_forro_cm` (específico de cortinas)
  - `motor_id`, `motorizada` (específico de motorização de cortinas)

**Tabela `materiais`:**
- **Arquivo:** `supabase/migrations/20251223194222_*.sql`
- **Problema:** Categorias hardcoded (tecido, forro, trilho, motorizado, acessorio, persiana, papel)
- **Campos rígidos:**
  - `categoria` com valores fixos
  - `largura_metro` (específico para tecidos)
  - `area_min_fat` (específico para persianas)

**Interface `Cortina`:**
- **Arquivo:** `src/types/orcamento.ts` linhas 11-55
- **Problema:** Interface totalmente específica para cortinas/persianas
- **Campos rígidos:**
  - `tipoProduto: 'cortina' | 'persiana' | 'outro'`
  - `tipoCortina` com valores específicos
  - `tecidoId`, `forroId`, `trilhoId`
  - `barraCm`, `barraForroCm`

#### B. Regras de Cálculo Específicas

**Arquivo:** `src/lib/calculosOrcamento.ts`

**Funções rígidas:**
1. `calcularConsumoMaterial()` (linhas 83-123)
   - Lógica específica: altura + barra vs largura do rolo
   - Cálculo por panos (número de panos)
   - Cálculo por metro linear
   - **Problema:** Assume sempre tecido em rolo

2. `calcularCustosCortina()` (linhas 277-363)
   - Coeficientes específicos por tipo de cortina (wave: 3.5, prega: 3.5, etc.)
   - Cálculo de consumo de tecido/forro
   - Cálculo de trilho (largura + 0.1m)
   - **Problema:** Não funciona para outros produtos

3. `COEFICIENTES_CORTINA` e `COEFICIENTES_FORRO` (linhas 91-114)
   - Valores hardcoded por tipo de cortina
   - **Problema:** Não extensível para outros produtos

**Constantes rígidas:**
- `MARGEM_COSTURA_SUPERIOR = 0.16` (16cm específico para cortinas)
- `LARGURA_ROLO_PADRAO = 2.80` (assume rolo de tecido)

#### C. Componentes UI Específicos

**Componentes rígidos:**
1. `CortinaCard.tsx` - Totalmente específico para cortinas
2. `PersianaCard.tsx` - Específico para persianas
3. `PapelCard.tsx` - Específico para papéis de parede
4. `MotorizadoCard.tsx` - Específico para motorização
5. `AcessoriosCard.tsx` - Específico para acessórios
6. `OutrosCard.tsx` - Genérico mas limitado

**Arquivo:** `src/components/orcamento/wizard/EtapaProdutos.tsx`
- Linhas 94-150: Renderização condicional por `tipoProduto`
- Cada tipo tem seu próprio componente
- **Problema:** Não escalável para novas categorias

#### D. Serviços de Produção Específicos

**Arquivo:** `src/components/producao/KanbanProducao.tsx`
- Linhas 47-54: Colunas hardcoded: 'fila', 'corte', 'costura', 'acabamento', 'qualidade', 'pronto'
- **Problema:** Fluxo específico para confecção de cortinas

**Arquivo:** `supabase/migrations/20251224195604_*.sql`
- Tabela `itens_pedido` com campos específicos:
  - `data_inicio_corte`, `data_fim_corte`
  - `data_inicio_costura`, `data_fim_costura`
- **Problema:** Assume sempre fluxo de corte → costura

#### E. Textos e Labels Hardcoded

**Arquivos com textos rígidos:**
- `src/components/Navbar.tsx`: "Cortinas", "Persianas"
- `src/components/landing/LandingPageNavbar.tsx`: Links para #cortinas, #persianas
- `src/components/WhatsAppButton.tsx`: "cortinas e persianas"
- `src/components/orcamento/ImportarDados.tsx`: Categorias fixas

#### F. Cálculos de Dimensões

**Arquivo:** `src/lib/calculosOrcamento.ts`
- Sempre assume `largura x altura`
- Sempre assume cálculo em metros (m² ou ML)
- **Problema:** Não suporta produtos sem dimensões ou com outras unidades

---

### 1.2 Lista Completa de Arquivos a Generalizar

#### Backend/Database:
- `supabase/migrations/20251120154349_*.sql` - Tabela `cortina_items`
- `supabase/migrations/20251223194222_*.sql` - Tabela `materiais` (categorias)
- `supabase/migrations/20251224195604_*.sql` - Tabela `itens_pedido` (fluxo produção)
- `supabase/migrations/20260102212520_*.sql` - Trigger de criação de pedidos

#### Frontend/Types:
- `src/types/orcamento.ts` - Interface `Cortina`
- `src/lib/calculosOrcamento.ts` - Todas as funções de cálculo
- `src/components/orcamento/wizard/EtapaProdutos.tsx` - Lógica de produtos
- `src/components/orcamento/wizard/CortinaCard.tsx` - Componente cortina
- `src/components/orcamento/wizard/PersianaCard.tsx` - Componente persiana
- `src/components/orcamento/wizard/PapelCard.tsx` - Componente papel
- `src/components/orcamento/wizard/MotorizadoCard.tsx` - Componente motorizado
- `src/components/orcamento/wizard/AcessoriosCard.tsx` - Componente acessórios
- `src/components/orcamento/wizard/OutrosCard.tsx` - Componente outros
- `src/components/producao/KanbanProducao.tsx` - Fluxo de produção
- `src/hooks/useProducaoData.ts` - Dados de produção

#### Textos/Labels:
- `src/components/Navbar.tsx`
- `src/components/landing/LandingPageNavbar.tsx`
- `src/components/WhatsAppButton.tsx`
- `src/components/orcamento/ImportarDados.tsx`

---

## 🎯 PARTE 2: PROPOSTA DE MODELO DE DADOS GENÉRICO

### 2.1 Nova Estrutura de Produtos

#### Tabela: `product_categories`
```sql
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  descricao TEXT,
  icone TEXT, -- Nome do ícone (lucide-react)
  cor TEXT, -- Cor do tema
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Categorias padrão
INSERT INTO public.product_categories (nome, slug, icone, cor) VALUES
  ('Cortinas', 'cortinas', 'Curtains', '#8B5CF6'),
  ('Persianas', 'persianas', 'Layers', '#3B82F6'),
  ('Tapetes', 'tapetes', 'Square', '#10B981'),
  ('Móveis', 'moveis', 'Sofa', '#F59E0B'),
  ('Papéis de Parede', 'papeis-parede', 'Wallpaper', '#EC4899'),
  ('Decoração', 'decoracao', 'Sparkles', '#6366F1');
```

#### Tabela: `product_types`
```sql
CREATE TABLE public.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  -- Configurações do tipo
  requires_dimensions BOOLEAN DEFAULT false,
  requires_width BOOLEAN DEFAULT false,
  requires_height BOOLEAN DEFAULT false,
  requires_depth BOOLEAN DEFAULT false,
  unit_type TEXT NOT NULL DEFAULT 'unit' CHECK (unit_type IN ('unit', 'm2', 'ml', 'kg', 'm3')),
  requires_stock BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT true, -- sob medida vs prateleira
  has_variants BOOLEAN DEFAULT false,
  production_workflow JSONB, -- Fluxo customizado de produção
  calculation_rules JSONB, -- Regras de cálculo específicas
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Tipos padrão para cortinas
INSERT INTO public.product_types (nome, slug, category_id, requires_dimensions, requires_width, requires_height, unit_type, is_custom, production_workflow) VALUES
  ('Cortina Wave', 'cortina-wave', (SELECT id FROM product_categories WHERE slug = 'cortinas'), true, true, true, 'm2', true, '["corte", "costura", "acabamento", "qualidade"]'::jsonb),
  ('Cortina Prega', 'cortina-prega', (SELECT id FROM product_categories WHERE slug = 'cortinas'), true, true, true, 'm2', true, '["corte", "costura", "acabamento", "qualidade"]'::jsonb),
  ('Persiana Horizontal', 'persiana-horizontal', (SELECT id FROM product_categories WHERE slug = 'persianas'), true, true, true, 'm2', true, '["fabricacao", "qualidade"]'::jsonb),
  ('Sofá', 'sofa', (SELECT id FROM product_categories WHERE slug = 'moveis'), false, false, false, 'unit', false, '["producao", "qualidade", "entrega"]'::jsonb),
  ('Tapete Pronto', 'tapete-pronto', (SELECT id FROM product_categories WHERE slug = 'tapetes'), false, false, false, 'unit', false, '["estoque", "entrega"]'::jsonb);
```

#### Tabela: `products` (Substitui `materiais`)
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
  product_type_id UUID REFERENCES public.product_types(id),
  
  -- Identificação
  codigo_item TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  sku TEXT, -- SKU único
  
  -- Classificação
  tipo_produto TEXT NOT NULL DEFAULT 'produto_final' CHECK (tipo_produto IN ('produto_final', 'insumo', 'servico')),
  -- produto_final: vendido ao cliente
  -- insumo: usado na produção (tecido, papel, trilho, etc.)
  -- servico: serviço (costura, instalação, etc.)
  
  -- Unidade e medidas
  unidade TEXT NOT NULL DEFAULT 'unit' CHECK (unidade IN ('unit', 'm2', 'ml', 'kg', 'm3')),
  largura_metro NUMERIC, -- Para produtos em rolo (tecido, papel)
  altura_metro NUMERIC,
  profundidade_metro NUMERIC,
  peso_kg NUMERIC,
  
  -- Preços
  preco_custo NUMERIC NOT NULL DEFAULT 0,
  preco_tabela NUMERIC NOT NULL DEFAULT 0,
  margem_tabela_percent NUMERIC DEFAULT 0,
  
  -- Estoque (se aplicável)
  controla_estoque BOOLEAN DEFAULT false,
  estoque_minimo NUMERIC DEFAULT 0,
  estoque_atual NUMERIC DEFAULT 0,
  
  -- Variações
  tem_variacoes BOOLEAN DEFAULT false,
  
  -- Atributos específicos (JSONB para flexibilidade)
  atributos JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: { "cor": "branco", "material": "algodão", "potencia": "220V" }
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Metadados
  fornecedor TEXT,
  fabricante TEXT,
  marca TEXT,
  imagem_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, codigo_item)
);

-- Índices
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_type ON public.products(product_type_id);
CREATE INDEX idx_products_tipo ON public.products(tipo_produto);
CREATE INDEX idx_products_organization ON public.products(organization_id);
```

#### Tabela: `product_variants`
```sql
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- Ex: "Branco", "Pequeno", "Algodão"
  valor TEXT NOT NULL, -- Valor da variação
  tipo_variacao TEXT NOT NULL, -- 'cor', 'tamanho', 'material', 'acabamento'
  sku TEXT,
  preco_adicional NUMERIC DEFAULT 0, -- Preço adicional desta variação
  estoque_atual NUMERIC, -- Se controla estoque por variação
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, tipo_variacao, valor)
);
```

#### Tabela: `order_items` (Substitui `cortina_items`)
```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  
  -- Produto
  product_id UUID REFERENCES public.products(id),
  product_type_id UUID REFERENCES public.product_types(id),
  category_id UUID REFERENCES public.product_categories(id),
  
  -- Identificação
  nome_identificacao TEXT NOT NULL,
  descricao TEXT,
  
  -- Dimensões (quando aplicável)
  largura NUMERIC,
  altura NUMERIC,
  profundidade NUMERIC,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  
  -- Unidade
  unidade TEXT NOT NULL DEFAULT 'unit',
  area_m2 NUMERIC, -- Calculado: largura * altura
  comprimento_ml NUMERIC, -- Para produtos em metro linear
  
  -- Variações selecionadas
  variacoes_selecionadas JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: { "cor": "branco", "tamanho": "grande" }
  
  -- Materiais/Insumos (para produtos sob medida)
  insumos JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [{ "product_id": "...", "quantidade": 5.2, "unidade": "ml" }]
  
  -- Serviços
  servicos_ids UUID[], -- IDs de serviços aplicados
  
  -- Custos e Preços
  preco_unitario NUMERIC,
  preco_total NUMERIC,
  custo_total NUMERIC,
  margem_percent NUMERIC,
  
  -- Instalação
  precisa_instalacao BOOLEAN DEFAULT false,
  pontos_instalacao INTEGER DEFAULT 1,
  valor_instalacao NUMERIC,
  
  -- Produção
  ambiente TEXT,
  observacoes_internas TEXT,
  observacoes_cliente TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_order_items_orcamento ON public.order_items(orcamento_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
CREATE INDEX idx_order_items_category ON public.order_items(category_id);
```

### 2.2 Migração dos Dados Atuais

#### Mapeamento `materiais` → `products`:
```sql
-- Migration: migrar_materiais_para_products.sql

-- 1. Criar categorias padrão
INSERT INTO public.product_categories (organization_id, nome, slug, icone, cor)
SELECT DISTINCT 
  organization_id,
  CASE categoria
    WHEN 'tecido' THEN 'Tecidos'
    WHEN 'forro' THEN 'Forros'
    WHEN 'trilho' THEN 'Trilhos'
    WHEN 'motorizado' THEN 'Motorizados'
    WHEN 'acessorio' THEN 'Acessórios'
    WHEN 'persiana' THEN 'Persianas'
    WHEN 'papel' THEN 'Papéis de Parede'
    ELSE 'Outros'
  END,
  categoria,
  'Package',
  '#8B5CF6'
FROM public.materiais
WHERE organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2. Migrar materiais para products
INSERT INTO public.products (
  organization_id,
  category_id,
  codigo_item,
  nome,
  categoria, -- Manter por compatibilidade temporária
  unidade,
  largura_metro,
  preco_custo,
  preco_tabela,
  margem_tabela_percent,
  tipo_produto,
  controla_estoque,
  atributos,
  ativo,
  created_at,
  updated_at
)
SELECT 
  m.organization_id,
  pc.id as category_id,
  m.codigo_item,
  m.nome,
  m.categoria,
  m.unidade,
  m.largura_metro,
  m.preco_custo,
  m.preco_tabela,
  m.margem_tabela_percent,
  CASE 
    WHEN m.categoria IN ('tecido', 'forro', 'trilho', 'acessorio') THEN 'insumo'
    ELSE 'produto_final'
  END,
  false, -- Por enquanto não controla estoque
  jsonb_build_object(
    'linha', m.linha,
    'cor', m.cor,
    'tipo', m.tipo,
    'aplicacao', m.aplicacao,
    'potencia', m.potencia,
    'area_min_fat', m.area_min_fat
  ),
  m.ativo,
  m.created_at,
  m.updated_at
FROM public.materiais m
LEFT JOIN public.product_categories pc ON pc.slug = m.categoria AND pc.organization_id = m.organization_id;
```

#### Mapeamento `cortina_items` → `order_items`:
```sql
-- Migration: migrar_cortina_items_para_order_items.sql

INSERT INTO public.order_items (
  orcamento_id,
  product_id, -- Mapear tecido_id, forro_id, etc.
  nome_identificacao,
  largura,
  altura,
  quantidade,
  unidade,
  area_m2,
  variacoes_selecionadas,
  insumos,
  precisa_instalacao,
  pontos_instalacao,
  ambiente,
  observacoes_internas,
  preco_unitario,
  preco_total,
  custo_total,
  created_at,
  updated_at
)
SELECT 
  ci.orcamento_id,
  -- Mapear product_id baseado no tipo
  CASE 
    WHEN ci.tipo_produto = 'cortina' THEN ci.tecido_id
    WHEN ci.tipo_produto = 'persiana' THEN ci.material_principal_id
    ELSE NULL
  END,
  ci.nome_identificacao,
  ci.largura,
  ci.altura,
  ci.quantidade,
  CASE 
    WHEN ci.tipo_produto IN ('cortina', 'persiana') THEN 'm2'
    ELSE 'unit'
  END,
  ci.largura * ci.altura as area_m2,
  jsonb_build_object(
    'tipo_cortina', ci.tipo_cortina,
    'tipo_produto', ci.tipo_produto,
    'motorizada', ci.motorizada
  ),
  jsonb_build_array(
    jsonb_build_object('product_id', ci.forro_id, 'quantidade', 0, 'unidade', 'ml'),
    jsonb_build_object('product_id', ci.trilho_id, 'quantidade', ci.largura + 0.1, 'unidade', 'ml'),
    jsonb_build_object('product_id', ci.motor_id, 'quantidade', 1, 'unidade', 'unit')
  ),
  ci.precisa_instalacao,
  ci.pontos_instalacao,
  ci.ambiente,
  ci.observacoes_internas,
  ci.preco_unitario,
  ci.preco_venda,
  ci.custo_total,
  ci.created_at,
  ci.updated_at
FROM public.cortina_items ci;
```

---

## 🎨 PARTE 3: ADAPTAÇÃO DE UI/UX

### 3.1 Cadastro de Produtos Genérico

**Arquivo:** `src/components/products/ProductForm.tsx` (novo)

**Estrutura:**
```typescript
interface ProductFormProps {
  product?: Product;
  categoryId?: string;
  onSave: (product: Product) => void;
}

export function ProductForm({ product, categoryId, onSave }: ProductFormProps) {
  const [category, setCategory] = useState(categoryId);
  const [productType, setProductType] = useState<string>();
  const [typeConfig, setTypeConfig] = useState<ProductType | null>(null);
  
  // Buscar configuração do tipo de produto
  const { data: typeData } = useQuery({
    queryKey: ['product-type', productType],
    queryFn: async () => {
      if (!productType) return null;
      const { data } = await supabase
        .from('product_types')
        .select('*')
        .eq('id', productType)
        .single();
      return data;
    }
  });
  
  return (
    <Form>
      {/* Categoria */}
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a categoria" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Tipo de Produto (baseado na categoria) */}
      {category && (
        <Select value={productType} onValueChange={setProductType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {productTypes
              .filter(pt => pt.category_id === category)
              .map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.nome}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Campos dinâmicos baseados no tipo */}
      {typeConfig && (
        <>
          {/* Dimensões (se required) */}
          {typeConfig.requires_dimensions && (
            <>
              {typeConfig.requires_width && (
                <Input label="Largura (m)" type="number" />
              )}
              {typeConfig.requires_height && (
                <Input label="Altura (m)" type="number" />
              )}
              {typeConfig.requires_depth && (
                <Input label="Profundidade (m)" type="number" />
              )}
            </>
          )}
          
          {/* Estoque (se aplicável) */}
          {typeConfig.requires_stock && (
            <div>
              <Switch label="Controlar Estoque" />
              <Input label="Estoque Mínimo" type="number" />
            </div>
          )}
          
          {/* Variações (se aplicável) */}
          {typeConfig.has_variants && (
            <VariantsEditor />
          )}
        </>
      )}
    </Form>
  );
}
```

### 3.2 Fluxo de Orçamento Adaptativo

**Arquivo:** `src/components/orcamento/wizard/EtapaProdutos.tsx` (refatorar)

**Nova estrutura:**
```typescript
// Componente genérico de produto
function ProductCard({ 
  item, 
  productType, 
  onUpdate, 
  onRemove 
}: ProductCardProps) {
  const { data: typeConfig } = useProductType(item.product_type_id);
  
  // Renderizar campos baseados na configuração
  if (typeConfig?.requires_dimensions) {
    return <DimensionalProductCard item={item} typeConfig={typeConfig} />;
  } else {
    return <SimpleProductCard item={item} typeConfig={typeConfig} />;
  }
}

// Card para produtos com dimensões
function DimensionalProductCard({ item, typeConfig }) {
  return (
    <Card>
      <CardHeader>
        <Input label="Nome" value={item.nome_identificacao} />
      </CardHeader>
      <CardContent>
        {typeConfig.requires_width && (
          <Input label="Largura (m)" type="number" />
        )}
        {typeConfig.requires_height && (
          <Input label="Altura (m)" type="number" />
        )}
        {typeConfig.requires_depth && (
          <Input label="Profundidade (m)" type="number" />
        )}
        <Input label="Quantidade" type="number" />
        
        {/* Seleção de insumos (se produto sob medida) */}
        {typeConfig.is_custom && (
          <InsumosSelector 
            categoryId={typeConfig.category_id}
            onSelect={(insumos) => updateInsumos(insumos)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Card para produtos de prateleira
function SimpleProductCard({ item, typeConfig }) {
  return (
    <Card>
      <CardHeader>
        <ProductSelector 
          categoryId={typeConfig.category_id}
          onSelect={(product) => setProduct(product)}
        />
      </CardHeader>
      <CardContent>
        <Input label="Quantidade" type="number" />
        
        {/* Variações (se aplicável) */}
        {typeConfig.has_variants && (
          <VariantsSelector 
            productId={item.product_id}
            onSelect={(variants) => setVariants(variants)}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

### 3.3 Organização de Categorias na Interface

**Estrutura de Menu:**
```typescript
// src/components/orcamento/OrcamentoSidebar.tsx
const productCategories = [
  { id: 'cortinas', label: 'Cortinas', icon: Curtains },
  { id: 'persianas', label: 'Persianas', icon: Layers },
  { id: 'tapetes', label: 'Tapetes', icon: Square },
  { id: 'moveis', label: 'Móveis', icon: Sofa },
  { id: 'papeis', label: 'Papéis', icon: Wallpaper },
  { id: 'decoracao', label: 'Decoração', icon: Sparkles },
];

// Menu dropdown ou tabs
<Tabs defaultValue="cortinas">
  {productCategories.map(cat => (
    <TabsTrigger key={cat.id} value={cat.id}>
      <cat.icon className="h-4 w-4" />
      {cat.label}
    </TabsTrigger>
  ))}
</Tabs>
```

### 3.4 Seleção de Produtos no Orçamento

**Componente:** `src/components/orcamento/ProductSelector.tsx` (novo)

```typescript
export function ProductSelector({ 
  categoryId, 
  onSelect 
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    tipo_produto: 'produto_final',
    controla_estoque: null,
  });
  
  const { data: products } = useQuery({
    queryKey: ['products', categoryId, search, filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, category:product_categories(*), type:product_types(*)')
        .eq('category_id', categoryId)
        .eq('ativo', true);
      
      if (search) {
        query = query.ilike('nome', `%${search}%`);
      }
      
      if (filters.tipo_produto) {
        query = query.eq('tipo_produto', filters.tipo_produto);
      }
      
      const { data } = await query.limit(50);
      return data;
    }
  });
  
  return (
    <Dialog>
      <DialogTrigger>
        <Button>Selecionar Produto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <Input 
          placeholder="Buscar produtos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          {products?.map(product => (
            <Card 
              key={product.id}
              className="cursor-pointer hover:border-primary"
              onClick={() => onSelect(product)}
            >
              <CardContent>
                <img src={product.imagem_url} alt={product.nome} />
                <h3>{product.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(product.preco_tabela)} / {product.unidade}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📦 PARTE 4: MÓDULO DE ESTOQUE

### 4.1 Modelo de Dados de Estoque

#### Tabela: `warehouses` (Locais/Depósitos)
```sql
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  responsavel TEXT,
  telefone TEXT,
  email TEXT,
  tipo TEXT DEFAULT 'deposito' CHECK (tipo IN ('deposito', 'loja', 'fabrica', 'showroom', 'outro')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, codigo)
);
```

#### Tabela: `inventory_items` (Itens de Estoque)
```sql
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Quantidades
  quantidade_atual NUMERIC NOT NULL DEFAULT 0,
  quantidade_reservada NUMERIC NOT NULL DEFAULT 0, -- Reservada para pedidos
  quantidade_disponivel NUMERIC GENERATED ALWAYS AS (quantidade_atual - quantidade_reservada) STORED,
  
  -- Controles
  estoque_minimo NUMERIC DEFAULT 0,
  estoque_maximo NUMERIC,
  ponto_reposicao NUMERIC, -- Quando chegar aqui, alertar
  
  -- Localização física
  localizacao TEXT, -- Ex: "Prateleira A-12"
  lote TEXT, -- Número do lote
  data_validade DATE,
  
  -- Custo
  custo_medio NUMERIC, -- Custo médio ponderado
  custo_unitario NUMERIC, -- Custo do último lote
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, product_id, warehouse_id, variant_id)
);

-- Índices
CREATE INDEX idx_inventory_product ON public.inventory_items(product_id);
CREATE INDEX idx_inventory_warehouse ON public.inventory_items(warehouse_id);
CREATE INDEX idx_inventory_organization ON public.inventory_items(organization_id);
```

#### Tabela: `inventory_movements` (Movimentações)
```sql
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id),
  
  -- Tipo de movimentação
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'transferencia', 'reserva', 'liberacao')),
  motivo TEXT NOT NULL, -- 'compra', 'venda', 'producao', 'perda', 'inventario', etc.
  
  -- Quantidade
  quantidade NUMERIC NOT NULL,
  quantidade_anterior NUMERIC NOT NULL,
  quantidade_nova NUMERIC NOT NULL,
  
  -- Referências
  referencia_tipo TEXT, -- 'pedido', 'orcamento', 'compra', 'producao', etc.
  referencia_id UUID, -- ID da referência
  
  -- Custo (para entradas)
  custo_unitario NUMERIC,
  custo_total NUMERIC,
  
  -- Observações
  observacoes TEXT,
  
  -- Usuário
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  
  -- Data
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_movements_inventory ON public.inventory_movements(inventory_item_id);
CREATE INDEX idx_movements_warehouse ON public.inventory_movements(warehouse_id);
CREATE INDEX idx_movements_tipo ON public.inventory_movements(tipo);
CREATE INDEX idx_movements_referencia ON public.inventory_movements(referencia_tipo, referencia_id);
CREATE INDEX idx_movements_data ON public.inventory_movements(data_movimentacao);
```

### 4.2 Integração com Orçamentos/Pedidos/Produção

#### Trigger: Baixar Estoque ao Aprovar Orçamento
```sql
CREATE OR REPLACE FUNCTION public.baixar_estoque_aprovacao()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_insumo RECORD;
  v_inventory_item RECORD;
BEGIN
  -- Só processar se status mudou para pagamento
  IF NEW.status NOT IN ('pago_40', 'pago_parcial', 'pago_60', 'pago') THEN
    RETURN NEW;
  END IF;
  
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Para cada item do orçamento
  FOR v_item IN 
    SELECT * FROM public.order_items WHERE orcamento_id = NEW.id
  LOOP
    -- Se produto controla estoque e é prateleira, baixar diretamente
    IF EXISTS (
      SELECT 1 FROM public.products 
      WHERE id = v_item.product_id 
      AND controla_estoque = true 
      AND tipo_produto = 'produto_final'
    ) THEN
      -- Baixar produto final
      UPDATE public.inventory_items
      SET 
        quantidade_atual = quantidade_atual - v_item.quantidade,
        quantidade_reservada = quantidade_reservada - v_item.quantidade
      WHERE product_id = v_item.product_id
      AND organization_id = NEW.organization_id;
      
      -- Registrar movimentação
      INSERT INTO public.inventory_movements (
        organization_id,
        inventory_item_id,
        warehouse_id,
        tipo,
        motivo,
        quantidade,
        quantidade_anterior,
        quantidade_nova,
        referencia_tipo,
        referencia_id,
        usuario_id,
        usuario_nome
      )
      SELECT 
        NEW.organization_id,
        ii.id,
        ii.warehouse_id,
        'saida',
        'venda',
        v_item.quantidade,
        ii.quantidade_atual,
        ii.quantidade_atual - v_item.quantidade,
        'orcamento',
        NEW.id,
        NEW.created_by_user_id,
        'Sistema'
      FROM public.inventory_items ii
      WHERE ii.product_id = v_item.product_id
      AND ii.organization_id = NEW.organization_id
      LIMIT 1;
    END IF;
    
    -- Se produto sob medida, baixar insumos
    IF v_item.insumos IS NOT NULL THEN
      FOR v_insumo IN 
        SELECT * FROM jsonb_array_elements(v_item.insumos) AS insumo
      LOOP
        -- Baixar insumo
        UPDATE public.inventory_items
        SET quantidade_atual = quantidade_atual - (v_insumo->>'quantidade')::numeric
        WHERE product_id = (v_insumo->>'product_id')::uuid
        AND organization_id = NEW.organization_id;
        
        -- Registrar movimentação
        INSERT INTO public.inventory_movements (
          organization_id,
          inventory_item_id,
          tipo,
          motivo,
          quantidade,
          referencia_tipo,
          referencia_id
        )
        SELECT 
          NEW.organization_id,
          ii.id,
          'saida',
          'producao',
          (v_insumo->>'quantidade')::numeric,
          'orcamento',
          NEW.id
        FROM public.inventory_items ii
        WHERE ii.product_id = (v_insumo->>'product_id')::uuid
        AND ii.organization_id = NEW.organization_id
        LIMIT 1;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_baixar_estoque_aprovacao
AFTER UPDATE OF status ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.baixar_estoque_aprovacao();
```

### 4.3 Telas de Estoque

#### 1. Visão Geral de Estoque
**Arquivo:** `src/components/estoque/DashboardEstoque.tsx` (novo)

```typescript
export function DashboardEstoque() {
  const { data: estoque } = useQuery({
    queryKey: ['estoque-geral'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select(`
          *,
          product:products(*, category:product_categories(*)),
          warehouse:warehouses(*)
        `)
        .order('quantidade_disponivel', { ascending: true });
      return data;
    }
  });
  
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estoque?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Itens em Falta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {estoque?.filter(e => e.quantidade_disponivel <= e.estoque_minimo).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabela de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estoque?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.nome}</TableCell>
                  <TableCell>{item.warehouse.nome}</TableCell>
                  <TableCell>{item.quantidade_disponivel}</TableCell>
                  <TableCell>{item.estoque_minimo}</TableCell>
                  <TableCell>
                    {item.quantidade_disponivel <= item.estoque_minimo ? (
                      <Badge variant="destructive">Em Falta</Badge>
                    ) : (
                      <Badge variant="success">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2. Movimentações
**Arquivo:** `src/components/estoque/MovimentacoesEstoque.tsx` (novo)

#### 3. Entrada/Saída Rápida
**Arquivo:** `src/components/estoque/DialogMovimentacao.tsx` (novo)

#### 4. Alertas de Estoque Mínimo
**Arquivo:** `src/components/estoque/AlertasEstoque.tsx` (novo)

---

## 🔌 PARTE 5: MÓDULO DE INTEGRAÇÕES

### 5.1 Modelo de Dados

#### Tabela: `integration_categories`
```sql
CREATE TABLE public.integration_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icone TEXT,
  descricao TEXT,
  ordem INTEGER DEFAULT 0
);

-- Categorias padrão
INSERT INTO public.integration_categories (nome, slug, icone, ordem) VALUES
  ('Marketing', 'marketing', 'Megaphone', 1),
  ('Site/E-commerce', 'site-ecommerce', 'Globe', 2),
  ('Fiscal', 'fiscal', 'FileText', 3),
  ('Comunicação', 'comunicacao', 'MessageCircle', 4),
  ('Pagamento', 'pagamento', 'CreditCard', 5),
  ('Logística', 'logistica', 'Truck', 6);
```

#### Tabela: `integration_providers`
```sql
CREATE TABLE public.integration_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.integration_categories(id),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  logo_url TEXT,
  website_url TEXT,
  documentacao_url TEXT,
  
  -- Configuração
  auth_type TEXT NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('api_key', 'oauth2', 'webhook', 'basic')),
  required_fields JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [{"name": "api_key", "label": "API Key", "type": "text", "required": true}]
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  disponivel BOOLEAN DEFAULT true, -- Se está disponível para uso
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Provedores padrão
INSERT INTO public.integration_providers (category_id, nome, slug, auth_type, required_fields) VALUES
  ((SELECT id FROM integration_categories WHERE slug = 'marketing'), 'Google Ads', 'google-ads', 'oauth2', '[{"name": "client_id", "label": "Client ID"}, {"name": "client_secret", "label": "Client Secret"}]'::jsonb),
  ((SELECT id FROM integration_categories WHERE slug = 'marketing'), 'Meta Ads', 'meta-ads', 'oauth2', '[{"name": "access_token", "label": "Access Token"}]'::jsonb),
  ((SELECT id FROM integration_categories WHERE slug = 'marketing'), 'Google Analytics', 'google-analytics', 'oauth2', '[]'::jsonb),
  ((SELECT id FROM integration_categories WHERE slug = 'fiscal'), 'PlugNotas', 'plugnotas', 'api_key', '[{"name": "api_key", "label": "API Key", "type": "text", "required": true}]'::jsonb),
  ((SELECT id FROM integration_categories WHERE slug = 'comunicacao'), 'WhatsApp Business API', 'whatsapp-api', 'api_key', '[{"name": "api_key", "label": "API Key"}, {"name": "phone_number_id", "label": "Phone Number ID"}]'::jsonb),
  ((SELECT id FROM integration_categories WHERE slug = 'site-ecommerce'), 'Webhook Genérico', 'webhook-generico', 'webhook', '[{"name": "webhook_url", "label": "URL do Webhook", "type": "url", "required": true}]'::jsonb);
```

#### Tabela: `connected_integrations`
```sql
CREATE TABLE public.connected_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.integration_providers(id) ON DELETE CASCADE,
  
  -- Credenciais (criptografadas)
  credentials_encrypted TEXT NOT NULL, -- JSON criptografado com as credenciais
  credentials_hash TEXT, -- Hash para validação
  
  -- Status
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Configurações
  config JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: {"auto_sync": true, "sync_interval": 3600}
  
  -- Metadados
  connected_by_user_id UUID NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, provider_id)
);

-- Índices
CREATE INDEX idx_integrations_org ON public.connected_integrations(organization_id);
CREATE INDEX idx_integrations_provider ON public.connected_integrations(provider_id);
CREATE INDEX idx_integrations_status ON public.connected_integrations(status);
```

#### Tabela: `integration_logs`
```sql
CREATE TABLE public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.connected_integrations(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('sync', 'webhook', 'error', 'test')),
  evento TEXT NOT NULL,
  payload JSONB,
  response JSONB,
  status_code INTEGER,
  sucesso BOOLEAN DEFAULT false,
  mensagem_erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Interface de Integrações

**Arquivo:** `src/components/integrations/IntegrationsPage.tsx` (novo)

```typescript
export function IntegrationsPage() {
  const { data: categories } = useQuery({
    queryKey: ['integration-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('integration_categories')
        .select('*, providers:integration_providers(*)')
        .order('ordem');
      return data;
    }
  });
  
  const { data: connected } = useQuery({
    queryKey: ['connected-integrations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('connected_integrations')
        .select('*, provider:integration_providers(*)');
      return data;
    }
  });
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">
          Conecte seu sistema com ferramentas externas
        </p>
      </div>
      
      {categories?.map(category => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <category.icone className="h-5 w-5" />
              {category.nome}
            </CardTitle>
            <CardDescription>{category.descricao}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {category.providers?.map(provider => {
                const isConnected = connected?.some(
                  c => c.provider_id === provider.id
                );
                const connection = connected?.find(
                  c => c.provider_id === provider.id
                );
                
                return (
                  <IntegrationCard
                    key={provider.id}
                    provider={provider}
                    isConnected={isConnected}
                    connection={connection}
                    onConnect={() => openConnectDialog(provider)}
                    onDisconnect={() => handleDisconnect(connection.id)}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 5.3 Camada de Abstração (Backend)

**Arquivo:** `src/lib/integrations/IntegrationDriver.ts` (novo)

```typescript
// Interface base para drivers de integração
export interface IntegrationDriver {
  name: string;
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  sync(data: any): Promise<any>;
  handleWebhook(payload: any): Promise<void>;
}

// Driver para Google Ads
export class GoogleAdsDriver implements IntegrationDriver {
  name = 'google-ads';
  
  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    // Validar OAuth2 token
    try {
      const response = await fetch('https://googleads.googleapis.com/v14/customers', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async sync(data: any): Promise<any> {
    // Sincronizar conversões
  }
}

// Driver para Webhook Genérico
export class WebhookDriver implements IntegrationDriver {
  name = 'webhook-generico';
  
  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    // Validar URL do webhook
    try {
      const url = new URL(credentials.webhook_url);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  async sync(data: any): Promise<any> {
    const response = await fetch(this.credentials.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Factory para criar drivers
export function createIntegrationDriver(providerSlug: string): IntegrationDriver {
  switch (providerSlug) {
    case 'google-ads':
      return new GoogleAdsDriver();
    case 'webhook-generico':
      return new WebhookDriver();
    default:
      throw new Error(`Driver não encontrado: ${providerSlug}`);
  }
}
```

### 5.4 Integrações Prioritárias

#### Fáceis de Implementar (Primeiro):
1. **Webhook Genérico** - Apenas POST para URL
2. **PlugNotas (NFe)** - API REST simples com API key
3. **WhatsApp Business API** - API REST com token

#### Médias Complexidade:
4. **Google Analytics** - OAuth2 + API
5. **Meta Ads** - OAuth2 + API

#### Complexas:
6. **Google Ads** - OAuth2 + API complexa
7. **WooCommerce** - OAuth + webhooks bidirecionais

---

## 📊 PARTE 6: IMPACTO TÉCNICO E PLANO DE IMPLEMENTAÇÃO

### 6.1 Impacto no Backend

#### Migrations Necessárias:
1. `20260117_create_product_categories.sql`
2. `20260117_create_product_types.sql`
3. `20260117_create_products.sql`
4. `20260117_create_product_variants.sql`
5. `20260117_create_order_items.sql`
6. `20260117_migrate_materiais_to_products.sql`
7. `20260117_migrate_cortina_items_to_order_items.sql`
8. `20260117_create_warehouses.sql`
9. `20260117_create_inventory_items.sql`
10. `20260117_create_inventory_movements.sql`
11. `20260117_create_integration_tables.sql`

#### Rotas/Services:
- `src/lib/products/` - Serviços de produtos
- `src/lib/inventory/` - Serviços de estoque
- `src/lib/integrations/` - Serviços de integrações

### 6.2 Impacto no Frontend

#### Novos Componentes:
- `src/components/products/` - Gestão de produtos
- `src/components/estoque/` - Gestão de estoque
- `src/components/integrations/` - Gestão de integrações

#### Componentes a Refatorar:
- `src/components/orcamento/wizard/EtapaProdutos.tsx`
- `src/components/orcamento/wizard/*Card.tsx` (todos)
- `src/components/producao/KanbanProducao.tsx`

### 6.3 Estratégia de Rollout

#### Fase 1: Fundação (2-3 semanas)
1. Criar novas tabelas (products, order_items, etc.)
2. Migrar dados existentes
3. Manter compatibilidade com `cortina_items` (deprecated)
4. Feature flag: `use_new_product_system`

#### Fase 2: UI Genérica (2-3 semanas)
1. Criar componentes genéricos de produtos
2. Refatorar wizard de orçamento
3. Testar com dados reais

#### Fase 3: Estoque (2 semanas)
1. Implementar módulo de estoque
2. Integrar com orçamentos/pedidos
3. Testar movimentações

#### Fase 4: Integrações (2-3 semanas)
1. Implementar módulo de integrações
2. Criar drivers básicos (webhook, PlugNotas)
3. Testar sincronizações

#### Fase 5: Deprecação (1 semana)
1. Remover código antigo (`cortina_items`, `materiais`)
2. Atualizar todas as referências
3. Limpeza final

---

## 🎯 PARTE 7: CATEGORIAS QUE PODEM SER ATENDIDAS

### ✅ Pode Atender Agora (com mudanças propostas):

1. **Tapetes**
   - Prontos: `is_custom = false`, `unit_type = 'unit'`
   - Sob medida: `is_custom = true`, `unit_type = 'm2'`
   - Variações: cor, material, tamanho padrão

2. **Móveis Soltos**
   - Poltronas, cadeiras: `is_custom = false`, `unit_type = 'unit'`
   - Sofás sob medida simples: `is_custom = true`, dimensões opcionais
   - Variações: cor, tecido, tamanho

3. **Papéis de Parede**
   - Já parcialmente suportado
   - `unit_type = 'ml'` ou `'m2'`
   - Insumo: rolo de papel

4. **Decoração**
   - Almofadas: `unit_type = 'unit'`, variações (cor, tamanho)
   - Espelhos: `unit_type = 'unit'` ou `'m2'` (sob medida)
   - Quadros: `unit_type = 'unit'`
   - Luminárias: `unit_type = 'unit'`

### ❌ Não Deve Atender Agora:

1. **Móveis Planejados Complexos**
   - Requer CAD, renderização 3D
   - Cálculos de engenharia
   - Projetos técnicos
   - **Justificativa:** Fluxo muito diferente, requer módulo específico

2. **Marcenaria sob Projeto**
   - Requer desenhos técnicos
   - Cálculos estruturais
   - Aprovações de projeto
   - **Justificativa:** Não se encaixa no modelo atual

---

## 🔍 PARTE 8: ANÁLISE PROFUNDA DO SISTEMA

### 8.1 Gargalos Estruturais Identificados

#### 1. Acoplamento Forte entre Orçamento e Produção
**Arquivo:** `supabase/migrations/20260102212520_*.sql` linhas 104-117
- Trigger cria `itens_pedido` diretamente de `cortina_items`
- **Problema:** Não funciona para outros tipos de produtos
- **Solução:** Abstrair criação de pedidos via `order_items`

#### 2. Cálculos Hardcoded
**Arquivo:** `src/lib/calculosOrcamento.ts`
- Coeficientes fixos por tipo de cortina
- Lógica específica de panos/rolos
- **Problema:** Não extensível
- **Solução:** Mover para `product_types.calculation_rules` (JSONB)

#### 3. Fluxo de Produção Fixo
**Arquivo:** `src/components/producao/KanbanProducao.tsx` linhas 47-54
- Colunas hardcoded: corte, costura, acabamento
- **Problema:** Não funciona para outros produtos
- **Solução:** Usar `product_types.production_workflow` (JSONB)

#### 4. Falta de Abstração de Serviços
**Arquivo:** `src/lib/integracaoOrcamentoFinanceiro.ts`
- Lógica de criação de contas a receber hardcoded
- **Problema:** Não genérico
- **Solução:** Criar service layer abstrato

### 8.2 Duplicação de Lógica

#### 1. Cálculo de Custos
- `calcularCustosCortina()` - Específico para cortinas
- `calcularCustosPersiana()` - Específico para persianas
- **Solução:** Unificar em `calculateProductCosts(product, typeConfig)`

#### 2. Validação de Dados
- Validações espalhadas em cada Card component
- **Solução:** Criar `ProductValidator` centralizado

### 8.3 Pontos Frágeis para Escalabilidade

#### 1. Queries sem Paginação
**Arquivo:** `src/components/orcamento/ListaOrcamentos.tsx`
- Carrega todos os orçamentos de uma vez
- **Impacto:** Performance degrada com muitos registros
- **Solução:** Implementar paginação/infinite scroll

#### 2. Cálculos no Frontend
**Arquivo:** `src/lib/calculosOrcamento.ts`
- Cálculos complexos executados no cliente
- **Impacto:** Performance e inconsistências
- **Solução:** Mover para Edge Functions ou triggers

#### 3. Falta de Cache
- Queries repetidas sem cache adequado
- **Impacto:** Muitas requisições ao banco
- **Solução:** Melhorar `staleTime` e `gcTime` do React Query

---

## 📈 PARTE 9: COMPARAÇÃO COM ERPs DO MERCADO

### 9.1 ERPs de Nicho (Cortinas/Persianas)

#### O que já temos:
- ✅ Cálculo de consumo de tecido
- ✅ Gestão de orçamentos
- ✅ Produção (Kanban)
- ✅ Financeiro básico
- ✅ CRM

#### O que falta:
- ❌ Estoque de tecidos/insumos
- ❌ Cálculo automático de preço baseado em custos
- ❌ Integração com fornecedores
- ❌ Relatórios avançados de produção
- ❌ Gestão de garantias

#### O que fazemos melhor:
- ✅ Interface moderna (React + Tailwind)
- ✅ Multi-tenant nativo
- ✅ SaaS B2B
- ✅ Feature flags por plano

### 9.2 ERPs de Decoração

#### O que falta:
- ❌ Catálogo visual de produtos
- ❌ Configurador 3D (opcional)
- ❌ Gestão de projetos de decoração
- ❌ Integração com moodboards
- ❌ Cálculo de frete

### 9.3 ERPs Genéricos (E-commerce, Lojas)

#### Funcionalidades a Adaptar:

1. **Pipelines Avançados** ✅
   - Já temos funil de vendas básico
   - **Melhorar:** Adicionar estágios customizáveis

2. **Automações Internas** ❌
   - **Falta:** Workflows automáticos (ex: criar pedido ao aprovar orçamento)
   - **Implementar:** Sistema de automações baseado em eventos

3. **Auditoria Completa** ⚠️
   - Já temos `log_alteracoes_status`
   - **Melhorar:** Log completo de todas as ações

4. **Permissões Granulares** ⚠️
   - Já temos roles básicos (admin/user)
   - **Melhorar:** Permissões por módulo/funcionalidade

5. **Centros de Custo** ❌
   - **Falta:** Separar custos por departamento/projeto
   - **Implementar:** Tabela `cost_centers`

6. **Multi-loja** ❌
   - **Falta:** Gestão de múltiplas lojas
   - **Implementar:** Usar `warehouses` como lojas

7. **Multi-empresas (White-label)** ✅
   - Já temos multi-tenancy
   - **Melhorar:** Customização por organização

8. **API Pública** ❌
   - **Falta:** API REST para integrações externas
   - **Implementar:** Edge Functions com autenticação

9. **Webhooks** ❌
   - **Falta:** Notificações de eventos
   - **Implementar:** Sistema de webhooks

10. **Dashboards Personalizáveis** ⚠️
    - Já temos dashboards
    - **Melhorar:** Widgets arrastáveis, customizáveis

---

## 💡 PARTE 10: MELHORIAS ESSENCIAIS NÃO CITADAS

### 10.1 Funcionalidades Must-Have

1. **Permissões Detalhadas por Usuário**
   - Permissões por módulo (orçamentos, financeiro, produção)
   - Permissões por ação (criar, editar, deletar, visualizar)
   - **Implementação:** Tabela `user_permissions`

2. **Histórico Completo de Ações (Audit Log)**
   - Log de todas as ações (criar, editar, deletar)
   - Quem fez, quando, o que mudou
   - **Implementação:** Expandir `log_alteracoes_status`

3. **Timeline de Pedidos/Orçamentos**
   - Visualização tipo Kibana
   - Eventos ordenados cronologicamente
   - **Implementação:** Componente `TimelineView`

4. **API Pública para Integrações**
   - REST API documentada
   - Autenticação via API keys
   - Rate limiting
   - **Implementação:** Edge Functions + documentação OpenAPI

5. **Módulo de Tarefas/Checklist**
   - Tarefas por instalação
   - Checklist de qualidade
   - **Implementação:** Tabela `tasks` + `task_checklists`

6. **Módulo de Garantias e Pós-venda**
   - Registro de garantias
   - Chamados de suporte
   - **Implementação:** Tabela `warranties` + `support_tickets`

7. **Módulo de Comissões Avançado**
   - Comissões por vendedor
   - Regras complexas (% por produto, % por margem)
   - **Implementação:** Expandir `comissoes` + `comission_rules`

8. **Módulo de Metas e Performance**
   - Metas por vendedor
   - Dashboard de performance
   - **Implementação:** Tabela `sales_targets` + `performance_metrics`

9. **Calendário Integrado**
   - Já existe parcialmente
   - **Melhorar:** Integração com Google Calendar, Outlook

10. **Sistema de Arquivos/Anexos**
    - Upload de arquivos por cliente/orçamento
    - **Implementação:** Supabase Storage + tabela `attachments`

11. **Templates de Orçamento**
    - Templates personalizáveis
    - **Implementação:** Tabela `quote_templates`

12. **Mensagens Internas**
    - Chat/comentários por orçamento/pedido
    - **Implementação:** Tabela `internal_messages`

13. **Painel Admin Multi-empresas**
    - Gestão centralizada
    - **Implementação:** Já existe parcialmente, expandir

14. **Multi-lojas/Multi-depósitos**
    - Já proposto no estoque
    - **Implementação:** Usar `warehouses`

15. **Integração com Gateways de Pagamento**
    - Stripe, Pagar.me
    - **Implementação:** Módulo de integrações

16. **Sistema de Assinatura Recorrente Interno**
    - Já existe parcialmente
    - **Melhorar:** Gestão completa de assinaturas

17. **Webhooks de Eventos**
    - Notificar sistemas externos
    - **Implementação:** Tabela `webhooks` + Edge Function

---

## 🎯 PARTE 11: CONCLUSÃO EXECUTIVA

### 11.1 Estado Atual do Sistema

**Pontos Fortes:**
- ✅ Arquitetura multi-tenant sólida
- ✅ Sistema funcional para cortinas/persianas
- ✅ Módulos principais implementados
- ✅ UI moderna e responsiva

**Pontos Fracos:**
- ❌ Código muito específico para cortinas/persianas
- ❌ Falta de abstração em cálculos e fluxos
- ❌ Sem módulo de estoque
- ❌ Sem módulo de integrações
- ❌ Falta de funcionalidades avançadas (permissões, audit log, etc.)

### 11.2 Visão Ideal do Sistema

**ERP Completo para Decoração:**
- ✅ Produtos genéricos (cortinas, móveis, tapetes, decoração)
- ✅ Estoque completo (insumos + produtos finais)
- ✅ Integrações plug-and-play
- ✅ Permissões granulares
- ✅ Audit log completo
- ✅ API pública
- ✅ Automações
- ✅ Multi-loja
- ✅ Dashboards personalizáveis

### 11.3 Prioridades por Impacto

#### P0 - Crítico (Fazer Primeiro):
1. Generalizar modelo de produtos
2. Migrar dados existentes
3. Refatorar UI para produtos genéricos
4. Implementar módulo de estoque básico

#### P1 - Alto (1-2 meses):
5. Módulo de integrações (webhook + NFe)
6. Permissões granulares
7. Audit log completo
8. API pública básica

#### P2 - Médio (3-6 meses):
9. Automações internas
10. Dashboards personalizáveis
11. Módulo de garantias
12. Templates de orçamento

#### P3 - Baixo (Backlog):
13. Configurador 3D (opcional)
14. Integração com moodboards
15. Cálculo de frete

### 11.4 Roadmap Profissional

#### Q1 2026: Fundação
- ✅ Generalização de produtos
- ✅ Módulo de estoque
- ✅ Migração de dados
- ✅ Refatoração de UI

#### Q2 2026: Integrações e Automações
- ✅ Módulo de integrações
- ✅ API pública
- ✅ Automações básicas
- ✅ Webhooks

#### Q3 2026: Funcionalidades Avançadas
- ✅ Permissões granulares
- ✅ Audit log completo
- ✅ Dashboards personalizáveis
- ✅ Módulo de garantias

#### Q4 2026: Polimento e Escala
- ✅ Performance
- ✅ Testes automatizados
- ✅ Documentação completa
- ✅ Onboarding melhorado

### 11.5 Recomendações Técnicas Finais

1. **Feature Flags:** Usar para rollout gradual
2. **Migrações Incrementais:** Não quebrar sistema atual
3. **Testes:** Criar testes antes de refatorar
4. **Documentação:** Documentar todas as mudanças
5. **Backup:** Backup completo antes de migrações

### 11.6 Riscos Potenciais

1. **Migração de Dados:** Pode perder dados se mal executada
2. **Breaking Changes:** Pode quebrar integrações existentes
3. **Performance:** Novas queries podem ser mais lentas
4. **Complexidade:** Sistema pode ficar muito complexo

### 11.7 Oportunidades de Diferenciação

1. **Interface Moderna:** Manter UI superior aos concorrentes
2. **Multi-tenant Nativo:** Vantagem competitiva
3. **API Pública:** Permitir integrações avançadas
4. **Automações:** Reduzir trabalho manual
5. **Estoque Inteligente:** Alertas e sugestões automáticas

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Generalização (4-6 semanas)
- [ ] Criar tabelas de produtos genéricos
- [ ] Migrar `materiais` → `products`
- [ ] Migrar `cortina_items` → `order_items`
- [ ] Criar componentes genéricos de produtos
- [ ] Refatorar wizard de orçamento
- [ ] Testar com dados reais

### Fase 2: Estoque (2-3 semanas)
- [ ] Criar tabelas de estoque
- [ ] Implementar telas de estoque
- [ ] Integrar com orçamentos/pedidos
- [ ] Testar movimentações

### Fase 3: Integrações (2-3 semanas)
- [ ] Criar tabelas de integrações
- [ ] Implementar UI de integrações
- [ ] Criar drivers básicos
- [ ] Testar conexões

### Fase 4: Funcionalidades Avançadas (4-6 semanas)
- [ ] Permissões granulares
- [ ] Audit log completo
- [ ] API pública
- [ ] Automações básicas

---

**Este documento será atualizado conforme a implementação progride.**
