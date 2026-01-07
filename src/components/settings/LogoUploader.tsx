import { useState, useRef } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogoUploaderProps {
  organizationId: string;
  currentLogoUrl: string | null;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
}

export function LogoUploader({ 
  organizationId, 
  currentLogoUrl, 
  onUploadComplete, 
  onRemove 
}: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato inválido', {
        description: 'Use PNG, JPG, SVG ou WebP'
      });
      return;
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo é 2MB'
      });
      return;
    }

    setIsUploading(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}/logo.${fileExt}`;

      // Upload para o bucket
      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      // Adicionar timestamp para invalidar cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      
      onUploadComplete(urlWithTimestamp);
      toast.success('Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setIsUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentLogoUrl) return;
    
    setIsRemoving(true);
    try {
      // Extrair path do arquivo da URL
      const urlParts = currentLogoUrl.split('/organization-assets/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0]; // Remove query string
        
        const { error } = await supabase.storage
          .from('organization-assets')
          .remove([filePath]);
        
        if (error) throw error;
      }
      
      onRemove();
      toast.success('Logo removida');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        {/* Preview da logo */}
        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
          {currentLogoUrl ? (
            <img 
              src={currentLogoUrl} 
              alt="Logo da empresa" 
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              <span className="text-xs">Sem logo</span>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {currentLogoUrl ? 'Alterar Logo' : 'Enviar Logo'}
          </Button>

          {currentLogoUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-destructive hover:text-destructive gap-2"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remover
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            PNG, JPG, SVG ou WebP. Máximo 2MB.<br />
            Recomendado: 200x200px ou maior.
          </p>
        </div>
      </div>
    </div>
  );
}
