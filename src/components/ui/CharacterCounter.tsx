import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isError = percentage >= 100;

  return (
    <span
      className={cn(
        'char-counter',
        isWarning && 'char-counter-warning',
        isError && 'char-counter-error',
        className
      )}
    >
      {current}/{max}
    </span>
  );
}
