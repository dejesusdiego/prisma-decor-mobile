import { Button } from '@/components/ui/button';
import { Loader2, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  saving: boolean;
  saved?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  savedLabel?: string;
  savingLabel?: string;
}

export function SaveButton({
  saving,
  saved,
  onClick,
  disabled,
  className,
  label = 'Salvar',
  savedLabel = 'Salvo!',
  savingLabel = 'Salvando...',
}: SaveButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className={cn(
        'w-full transition-all duration-200',
        saved && !saving && 'bg-green-600 hover:bg-green-700',
        className
      )}
    >
      {saving ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 spinner" />
          {savingLabel}
        </>
      ) : saved ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          {savedLabel}
        </>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
