import { Building2 } from 'lucide-react';
import { OrgSettingsForm } from '@/components/settings/OrgSettingsForm';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { WhatsAppRotationSettings } from '@/components/settings/WhatsAppRotationSettings';

export default function ConfiguracoesOrganizacao() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Configurações da Empresa</h1>
        </div>
        <p className="text-muted-foreground">
          Personalize a identidade visual e informações comerciais da sua empresa.
          Estas configurações serão aplicadas nos PDFs de orçamentos e na interface do sistema.
        </p>
      </div>

      <div className="space-y-6">
        <ThemeSelector />
        <OrgSettingsForm />
        <WhatsAppRotationSettings />
      </div>
    </div>
  );
}
