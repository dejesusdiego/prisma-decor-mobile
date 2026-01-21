/**
 * FeatureGate - Componente para controlar acesso a features por plano
 * 
 * Uso:
 * <FeatureGate feature="financeiro_completo">
 *   <ComponenteFinanceiro />
 * </FeatureGate>
 */

import { ReactNode } from 'react';
import { useFeatureFlags, FEATURE_NAMES, OrganizationFeatures } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  /** Nome da feature a verificar */
  feature: keyof OrganizationFeatures;
  /** Conteúdo a renderizar se tiver acesso */
  children: ReactNode;
  /** Conteúdo alternativo quando não tem acesso (opcional) */
  fallback?: ReactNode;
  /** Se true, renderiza children mesmo sem acesso, mas com overlay */
  showPreview?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showPreview = false,
  className 
}: FeatureGateProps) {
  const { hasFeature, getUpgradePlanFor, features, isLoading } = useFeatureFlags();

  // Durante carregamento, mostrar children (otimista)
  if (isLoading) {
    return <>{children}</>;
  }

  // Se tem a feature, renderiza normalmente
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // Se tem fallback customizado, usa ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Se deve mostrar preview com overlay
  if (showPreview) {
    return (
      <div className={cn("relative", className)}>
        <div className="opacity-30 pointer-events-none blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <UpgradeCard 
            feature={feature} 
            currentPlan={features?.plano_nome || 'Starter'}
            upgradePlan={getUpgradePlanFor(feature)}
          />
        </div>
      </div>
    );
  }

  // Padrão: mostrar card de upgrade
  return (
    <div className={cn("p-4", className)}>
      <UpgradeCard 
        feature={feature} 
        currentPlan={features?.plano_nome || 'Starter'}
        upgradePlan={getUpgradePlanFor(feature)}
      />
    </div>
  );
}

interface UpgradeCardProps {
  feature: keyof OrganizationFeatures;
  currentPlan: string;
  upgradePlan: string;
}

function UpgradeCard({ feature, currentPlan, upgradePlan }: UpgradeCardProps) {
  const featureName = FEATURE_NAMES[feature as string] || feature;
  const upgradePlanName = getPlanDisplayName(upgradePlan);

  return (
    <Card className="max-w-md mx-auto border-dashed border-2 border-muted-foreground/30">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Recurso Bloqueado</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{featureName}</span> não está 
          disponível no seu plano atual.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm">
          <Badge variant="secondary">{currentPlan}</Badge>
          <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
            <Sparkles className="h-3 w-3 mr-1" />
            {upgradePlanName}
          </Badge>
        </div>

        <Button className="w-full gap-2" onClick={handleUpgradeClick}>
          <Sparkles className="h-4 w-4" />
          Fazer Upgrade
        </Button>

        <p className="text-xs text-muted-foreground">
          Entre em contato com o suporte para atualizar seu plano
        </p>
      </CardContent>
    </Card>
  );
}

function getPlanDisplayName(plan: string): string {
  const names: Record<string, string> = {
    starter: 'Starter',
    profissional: 'Profissional',
    business: 'Business',
    enterprise: 'Enterprise',
  };
  return names[plan] || plan;
}

function handleUpgradeClick() {
  // Por enquanto, abre link para contato
  // Futuramente: modal com planos ou redirect para página de upgrade
  window.open('https://wa.me/5511999999999?text=Olá! Gostaria de fazer upgrade do meu plano no StudioOS', '_blank');
}

/**
 * Hook helper para usar em condicionais
 */
export function useFeatureAccess(feature: keyof OrganizationFeatures): boolean {
  const { hasFeature } = useFeatureFlags();
  return hasFeature(feature);
}

/**
 * Componente para mostrar badge de plano necessário
 */
interface PlanBadgeProps {
  plan: string;
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const colors: Record<string, string> = {
    starter: 'bg-slate-100 text-slate-700',
    profissional: 'bg-blue-100 text-blue-700',
    business: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };

  return (
    <Badge className={cn(colors[plan] || colors.starter, className)}>
      {getPlanDisplayName(plan)}
    </Badge>
  );
}

export default FeatureGate;
