# Documentação: Sistema de Feature Flags

## Visão Geral

O StudioOS possui um sistema completo de **Feature Flags** que permite:
- Habilitar/desabilitar funcionalidades por plano (starter, pro, business, enterprise)
- Fazer overrides por organização específica
- Controlar rollout gradual de novas features

## Hooks Disponíveis

### 1. `useFeatureFlag()` - Verificar uma flag específica

Use este hook quando precisar verificar se uma única feature está habilitada.

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MeuComponente() {
  const { organization } = useOrganization();
  
  // Verifica se a feature 'crm_pipeline' está habilitada
  const { isEnabled, isLoading, error } = useFeatureFlag(
    organization?.id,
    'crm_pipeline'
  );

  if (isLoading) return <Spinner />;
  
  if (isEnabled) {
    return <PipelineCRM />;
  }
  
  return <UpgradePrompt feature="Pipeline de CRM" />;
}
```

### 2. `useFeatureFlags()` - Listar todas as flags

Use quando precisar mostrar várias features ou fazer múltiplas verificações.

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlag';

function FeatureList() {
  const { organization } = useOrganization();
  const { flags, isLoading, checkFlag } = useFeatureFlags(organization?.id);

  if (isLoading) return <Spinner />;

  // Usando checkFlag para verificar uma específica
  const hasCRM = checkFlag('crm_pipeline');
  const hasFornecedores = checkFlag('supplier_catalog');

  return (
    <div>
      <h2>Features disponíveis:</h2>
      {flags.map(flag => (
        <FeatureToggle 
          key={flag.name}
          name={flag.name}
          enabled={flag.value}
          description={flag.description}
        />
      ))}
    </div>
  );
}
```

### 3. `useFeatureFlagManager()` - Gerenciamento (Super Admin)

Use apenas no painel de administração para gerenciar flags.

```typescript
import { useFeatureFlagManager } from '@/hooks/useFeatureFlag';

function FeatureFlagAdmin() {
  const { isLoading, updatePlanValues, setOrganizationOverride } = useFeatureFlagManager();

  // Atualizar valores padrão por plano
  const handleUpdatePlan = async (flagId: string) => {
    await updatePlanValues(flagId, {
      starter: false,
      pro: true,
      business: true,
      enterprise: true
    });
  };

  // Fazer override para uma organização específica
  const handleOverride = async (orgId: string, flagName: string) => {
    await setOrganizationOverride(
      orgId,
      flagName,
      true,  // habilitar
      'Cliente solicitou acesso antecipado'  // motivo
    );
  };

  return (...);
}
```

## Casos de Uso Comuns

### Esconder/Mostrar Item de Menu

```typescript
function Sidebar() {
  const { organization } = useOrganization();
  const { checkFlag } = useFeatureFlags(organization?.id);

  return (
    <nav>
      <MenuItem href="/orcamentos">Orçamentos</MenuItem>
      
      {/* Só mostra se feature estiver habilitada */}
      {checkFlag('crm_pipeline') && (
        <MenuItem href="/crm">CRM</MenuItem>
      )}
      
      {checkFlag('supplier_catalog') && (
        <MenuItem href="/fornecedores">Fornecedores</MenuItem>
      )}
    </nav>
  );
}
```

### Bloquear Acesso a Página

```typescript
import { Navigate } from 'react-router-dom';

function CRMPage() {
  const { organization } = useOrganization();
  const { isEnabled, isLoading } = useFeatureFlag(organization?.id, 'crm_pipeline');

  if (isLoading) return <Spinner />;
  
  if (!isEnabled) {
    return <Navigate to="/upgrade" replace />;
  }

  return <CRMDashboard />;
}
```

### Desabilitar Botão com Tooltip

```typescript
function GerarOrcamentoButton() {
  const { organization } = useOrganization();
  const { isEnabled } = useFeatureFlag(organization?.id, 'limite_orcamentos');
  
  // Verificar se atingiu limite do plano
  const { data: limite } = useLimiteOrcamentos(organization?.id);
  const atingiuLimite = limite?.atual >= limite?.maximo;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button disabled={atingiuLimite}>
          Novo Orçamento
        </Button>
      </TooltipTrigger>
      {atingiuLimite && (
        <TooltipContent>
          Limite do plano atingido. Faça upgrade!
        </TooltipContent>
      )}
    </Tooltip>
  );
}
```

## Lista de Feature Flags Disponíveis

| Flag | Descrição | Padrão Starter | Padrão Pro | Padrão Business | Padrão Enterprise |
|------|-----------|----------------|------------|-----------------|-------------------|
| `crm_pipeline` | Pipeline de CRM e gestão de oportunidades | ❌ | ✅ | ✅ | ✅ |
| `supplier_catalog` | Catálogo de fornecedores e materiais | ❌ | ❌ | ✅ | ✅ |
| `financeiro_avancado` | Conciliação bancária e relatórios financeiros | ❌ | ✅ | ✅ | ✅ |
| `multi_usuarios` | Múltiplos usuários por organização | ❌ | ✅ | ✅ | ✅ |
| `whitelabel` | Remover branding do StudioOS | ❌ | ❌ | ❌ | ✅ |
| `api_access` | Acesso à API REST | ❌ | ❌ | ✅ | ✅ |
| `prioridade_suporte` | Atendimento prioritário no suporte | ❌ | ❌ | ✅ | ✅ |
| `analytics_avancado` | Dashboard com métricas avançadas | ❌ | ✅ | ✅ | ✅ |

## Como Criar uma Nova Feature Flag

### 1. Adicionar na Migration

```sql
-- Inserir a nova flag
INSERT INTO feature_flags (name, description, category, plan_values)
VALUES (
  'nova_feature',
  'Descrição do que a feature faz',
  'categoria',
  '{"starter": false, "pro": true, "business": true, "enterprise": true}'::jsonb
);
```

### 2. Usar no Código

```typescript
const { isEnabled } = useFeatureFlag(orgId, 'nova_feature');

if (isEnabled) {
  // Nova funcionalidade
}
```

### 3. Documentar

Adicione a nova flag na tabela acima e avise o time comercial sobre as limitações do plano.

## Debug e Troubleshooting

### Verificar flags no Console do Supabase

```sql
-- Listar todas as flags e seus valores por plano
SELECT name, description, plan_values FROM feature_flags;

-- Verificar override para uma organização específica
SELECT 
  f.name,
  o.value as override_value,
  o.reason,
  o.created_at
FROM organization_feature_overrides o
JOIN feature_flags f ON f.id = o.feature_flag_id
WHERE o.organization_id = 'UUID_DA_ORG';

-- Verificar valor efetivo de uma flag para uma org
SELECT check_feature_flag('UUID_DA_ORG', 'crm_pipeline');
```

### Logs no Frontend

```typescript
// Adicionar logs temporários para debug
const { flags, isLoading } = useFeatureFlags(orgId);

useEffect(() => {
  console.log('Feature Flags:', flags);
}, [flags]);
```

## Boas Práticas

1. **Sempre verifique `isLoading`**: Antes de tomar decisões baseadas na flag, espere o carregamento
2. **Graceful Degradation**: Se a feature estiver desabilitada, mostre uma UI alternativa amigável
3. **Não quebre a navegação**: Use redirects em vez de esconder completamente rotas
4. **Cache**: O hook já faz cache automático via React Query
5. **Nomeclatura**: Use `snake_case` para nomes de flags, ex: `feature_name`

## Suporte

Em caso de dúvidas ou problemas:
1. Verifique se a organização tem um override ativo
2. Confira se o plano da organização inclui a feature
3. Verifique os logs da Edge Function `update-feature-flag`
4. Contate o time de engenharia
