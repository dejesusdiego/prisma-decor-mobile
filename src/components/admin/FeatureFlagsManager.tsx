import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FeatureFlagsManager() {
  // Mock feature flags
  const featureFlags = [
    {
      id: 1,
      name: 'contracts',
      label: 'Módulo de Contratos',
      description: 'Permite criar e gerenciar contratos de venda',
      defaultValue: false,
      planValues: {
        starter: false,
        pro: true,
        business: true,
        enterprise: true,
      }
    },
    {
      id: 2,
      name: 'integrations',
      label: 'Integrações Avançadas',
      description: 'Integração com ERPs e ferramentas externas',
      defaultValue: false,
      planValues: {
        starter: false,
        pro: false,
        business: true,
        enterprise: true,
      }
    },
    {
      id: 3,
      name: 'blog',
      label: 'Blog na Landing Page',
      description: 'Exibe seção de blog na landing page pública',
      defaultValue: true,
      planValues: {
        starter: true,
        pro: true,
        business: true,
        enterprise: true,
      }
    },
    {
      id: 4,
      name: 'advanced_analytics',
      label: 'Analytics Avançado',
      description: 'Dashboards avançados de análise de dados',
      defaultValue: false,
      planValues: {
        starter: false,
        pro: false,
        business: false,
        enterprise: true,
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Feature Flags</h2>
        <p className="text-muted-foreground">
          Gerencie funcionalidades disponíveis por plano
        </p>
      </div>

      <div className="grid gap-4">
        {featureFlags.map((flag) => (
          <Card key={flag.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{flag.label}</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{flag.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{flag.name}</code>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-4">
                {Object.entries(flag.planValues).map(([plan, value]) => (
                  <div key={plan} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium capitalize">{plan}</span>
                    <Switch 
                      checked={value}
                      onCheckedChange={() => {}}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Novas feature flags podem ser adicionadas aqui</p>
        </CardContent>
      </Card>
    </div>
  );
}