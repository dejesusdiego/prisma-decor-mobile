import { useState } from 'react';
import { MessageCircle, Users, RotateCcw, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useWhatsAppRotation, 
  useWhatsAppRotationConfig,
  useAvailableVendedores 
} from '@/hooks/useWhatsAppRotation';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export function WhatsAppRotationSettings() {
  const { organizationId: orgId } = useOrganization();
  
  const { 
    config, 
    isLoadingConfig, 
    availableVendedores, 
    isLoadingVendedores,
    updateConfig,
    isUpdating 
  } = useWhatsAppRotation(orgId);

  const [selectedVendedores, setSelectedVendedores] = useState<string[]>(config?.vendedores || []);
  const [enabled, setEnabled] = useState(config?.enabled || false);

  // Sincronizar estado quando config carregar
  if (config && selectedVendedores.length === 0 && !isLoadingConfig) {
    setSelectedVendedores(config.vendedores);
    setEnabled(config.enabled);
  }

  const handleToggleVendedor = (vendedorId: string) => {
    setSelectedVendedores(prev => {
      if (prev.includes(vendedorId)) {
        return prev.filter(id => id !== vendedorId);
      }
      return [...prev, vendedorId];
    });
  };

  const handleSave = () => {
    if (selectedVendedores.length === 0 && enabled) {
      toast.error('Selecione pelo menos um vendedor para ativar o rodízio');
      return;
    }
    
    updateConfig({ 
      enabled, 
      vendedores: selectedVendedores 
    });
  };

  const isLoading = isLoadingConfig || isLoadingVendedores;
  const hasChanges = 
    enabled !== (config?.enabled || false) || 
    JSON.stringify(selectedVendedores.sort()) !== JSON.stringify((config?.vendedores || []).sort());

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Rodízio de Vendedores WhatsApp</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              id="rotation-enabled"
            />
            <Label htmlFor="rotation-enabled" className="cursor-pointer">
              {enabled ? 'Ativado' : 'Desativado'}
            </Label>
          </div>
        </div>
        <CardDescription>
          Configure um rodízio automático de vendedores para atendimento via WhatsApp.
          Quando um visitante clicar no botão do WhatsApp, será direcionado para o próximo vendedor da fila.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status do Rodízio */}
        {enabled && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <RotateCcw className="h-4 w-4" />
              <span className="font-medium">Rodízio ativo</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              {selectedVendedores.length} vendedor(es) na fila de atendimento
            </p>
          </div>
        )}

        {/* Lista de Vendedores Disponíveis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Vendedores Disponíveis</Label>
          </div>
          
          {availableVendedores.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
              Nenhum usuário encontrado na organização. 
              Adicione usuários primeiro para configurar o rodízio.
            </div>
          ) : (
            <div className="grid gap-2">
              {availableVendedores.map((vendedor) => {
                const isSelected = selectedVendedores.includes(vendedor.id);
                return (
                  <div
                    key={vendedor.id}
                    onClick={() => enabled && handleToggleVendedor(vendedor.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      enabled 
                        ? isSelected 
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20 cursor-pointer' 
                          : 'border-border hover:border-green-300 cursor-pointer'
                        : 'border-border bg-muted/50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {vendedor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{vendedor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendedor.email}</p>
                        {vendedor.whatsapp && (
                          <p className="text-xs text-green-600">{vendedor.whatsapp}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isSelected && enabled && (
                        <Badge variant="default" className="bg-green-600">
                          #{selectedVendedores.indexOf(vendedor.id) + 1}
                        </Badge>
                      )}
                      {vendedor.whatsapp ? (
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem WhatsApp</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instruções */}
        <Separator />
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Os leads serão distribuídos igualmente entre os vendedores selecionados</li>
            <li>O sistema mantém uma fila circular (round-robin)</li>
            <li>Cada clique no botão WhatsApp direciona para o próximo vendedor</li>
            <li>O histórico de atribuições é registrado automaticamente</li>
          </ul>
        </div>

        {/* Botão Salvar */}
        {hasChanges && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedVendedores(config?.vendedores || []);
                setEnabled(config?.enabled || false);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
