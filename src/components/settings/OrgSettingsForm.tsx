import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Save, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { LogoUploader } from './LogoUploader';

interface OrgFormData {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  cnpj: string;
  address: string;
  primary_color: string;
}

export function OrgSettingsForm() {
  const { organization, organizationId, isLoading: isOrgLoading } = useOrganizationContext();
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<OrgFormData>({
    defaultValues: {
      name: '',
      tagline: '',
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      cnpj: '',
      address: '',
      primary_color: '#111111',
    }
  });

  const primaryColor = watch('primary_color');

  // Carregar dados da organização
  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name || '',
        tagline: (organization as any).tagline || '',
        email: (organization as any).email || '',
        phone: (organization as any).phone || '',
        whatsapp: (organization as any).whatsapp || '',
        website: (organization as any).website || '',
        cnpj: (organization as any).cnpj || '',
        address: (organization as any).address || '',
        primary_color: organization.primary_color || '#111111',
      });
      setLogoUrl(organization.logo_url);
    }
  }, [organization, reset]);

  const onSubmit = async (data: OrgFormData) => {
    if (!organizationId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          tagline: data.tagline,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          website: data.website,
          cnpj: data.cnpj,
          address: data.address,
          primary_color: data.primary_color,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      
      // Forçar reload para aplicar novas cores
      window.location.reload();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (url: string) => {
    setLogoUrl(url);
    
    // Salvar imediatamente no banco
    if (organizationId) {
      await supabase
        .from('organizations')
        .update({ logo_url: url, updated_at: new Date().toISOString() })
        .eq('id', organizationId);
    }
  };

  const handleLogoRemove = async () => {
    setLogoUrl(null);
    
    if (organizationId) {
      await supabase
        .from('organizations')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', organizationId);
    }
  };

  if (isOrgLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma organização vinculada.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logotipo</CardTitle>
          <CardDescription>
            Esta logo aparecerá nos PDFs de orçamentos e na interface do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUploader
            organizationId={organizationId!}
            currentLogoUrl={logoUrl}
            onUploadComplete={handleLogoUpload}
            onRemove={handleLogoRemove}
          />
        </CardContent>
      </Card>

      {/* Identidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identidade da Empresa</CardTitle>
          <CardDescription>
            Informações que aparecem no cabeçalho e rodapé dos documentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Nome é obrigatório' })}
                placeholder="Ex: Minha Empresa Decorações"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Slogan / Tagline</Label>
              <Input
                id="tagline"
                {...register('tagline')}
                placeholder="Ex: Transformando ambientes..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">Cor Principal</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primary_color"
                {...register('primary_color')}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => {
                  // Validar formato hex
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    register('primary_color').onChange(e);
                  }
                }}
                placeholder="#111111"
                className="w-28 font-mono"
              />
              <span className="text-sm text-muted-foreground">
                Usada em botões e destaques
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações de Contato</CardTitle>
          <CardDescription>
            Dados que aparecem no PDF para o cliente entrar em contato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(XX) XXXXX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                {...register('whatsapp')}
                placeholder="(XX) XXXXX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register('website')}
                placeholder="www.empresa.com.br"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Fiscais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Fiscais</CardTitle>
          <CardDescription>
            Informações legais exibidas no rodapé dos documentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                {...register('cnpj')}
                placeholder="XX.XXX.XXX/XXXX-XX"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Rua, número, bairro, cidade - UF, CEP"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </form>
  );
}
