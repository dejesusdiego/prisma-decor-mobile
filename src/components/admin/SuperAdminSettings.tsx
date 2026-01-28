import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Save } from 'lucide-react';

export function SuperAdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações da Plataforma</h2>
        <p className="text-muted-foreground">
          Configure preços, comissões e regras da plataforma
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Planos e Preços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Preços dos Planos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="starter-price">Starter (mensal)</Label>
              <Input id="starter-price" type="number" defaultValue={99} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-price">Pro (mensal)</Label>
              <Input id="pro-price" type="number" defaultValue={299} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-price">Business (mensal)</Label>
              <Input id="business-price" type="number" defaultValue={599} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enterprise-price">Enterprise (mensal)</Label>
              <Input id="enterprise-price" type="number" defaultValue={1299} />
            </div>
          </CardContent>
        </Card>

        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Taxa de Implementação</Label>
                <p className="text-sm text-muted-foreground">
                  Valor cobrado na ativação
                </p>
              </div>
              <Input type="number" defaultValue={500} className="w-32" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comissão de Afiliados</Label>
                <p className="text-sm text-muted-foreground">
                  Percentual padrão
                </p>
              </div>
              <Input type="number" defaultValue={10} className="w-32" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir novos cadastros</Label>
                <p className="text-sm text-muted-foreground">
                  Abrir/fechar registros
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir página de manutenção
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}