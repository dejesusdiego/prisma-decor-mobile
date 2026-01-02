import { ReactNode, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStepProps {
  active: boolean;
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  onComplete?: () => void;
  children: ReactNode;
}

export function OnboardingStep({
  active,
  stepNumber,
  totalSteps,
  title,
  description,
  position = 'bottom',
  onNext,
  onPrev,
  onSkip,
  onComplete,
  children,
}: OnboardingStepProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (active && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const style: React.CSSProperties = { position: 'fixed', zIndex: 9999 };

      switch (position) {
        case 'top':
          style.bottom = window.innerHeight - rect.top + 12;
          style.left = rect.left + rect.width / 2;
          style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          style.top = rect.bottom + 12;
          style.left = rect.left + rect.width / 2;
          style.transform = 'translateX(-50%)';
          break;
        case 'left':
          style.top = rect.top + rect.height / 2;
          style.right = window.innerWidth - rect.left + 12;
          style.transform = 'translateY(-50%)';
          break;
        case 'right':
          style.top = rect.top + rect.height / 2;
          style.left = rect.right + 12;
          style.transform = 'translateY(-50%)';
          break;
      }

      setTooltipStyle(style);

      // Scroll into view
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [active, position]);

  const isLastStep = stepNumber === totalSteps;

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else {
      onNext();
    }
  };

  const overlay = active && mounted ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onSkip}
      />
    </AnimatePresence>,
    document.body
  ) : null;

  const tooltip = active && mounted ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={tooltipStyle}
        className="bg-card border rounded-lg shadow-xl p-4 w-[300px]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            Passo {stepNumber} de {totalSteps}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Pular tour
          </Button>
          <div className="flex items-center gap-1">
            {onPrev && stepNumber > 1 && (
              <Button variant="outline" size="sm" onClick={onPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={targetRef}
        className={cn(
          'relative',
          active && 'z-[9999] relative rounded ring-4 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        {children}
      </div>
      {overlay}
      {tooltip}
    </>
  );
}
