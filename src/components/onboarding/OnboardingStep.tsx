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
    if (isLastStep) {
      if (onComplete) {
        // Pequeno delay para garantir que a animação seja visível
        setTimeout(() => {
          onComplete();
        }, 100);
      } else {
        // Se não tem onComplete mas é último step, apenas avança
        onNext();
      }
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
        onClick={(e) => {
          // Só fecha se clicar diretamente no overlay, não no tooltip
          if (e.target === e.currentTarget) {
            onSkip();
          }
        }}
        style={{ pointerEvents: 'auto' }}
      />
    </AnimatePresence>,
    document.body
  ) : null;

  const tooltip = active && mounted ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ ...tooltipStyle, pointerEvents: 'auto' }}
        className="bg-card border-2 border-primary/20 rounded-lg shadow-xl p-4 w-[320px] max-w-[90vw] z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
              Passo {stepNumber} de {totalSteps}
            </span>
            {/* Barra de progresso */}
            <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <h4 className="font-semibold text-lg mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>

        <div className="flex items-center justify-between gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }} 
            className="text-xs"
          >
            Pular tour
          </Button>
          <div className="flex items-center gap-2">
            {onPrev && stepNumber > 1 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }} 
              className="min-w-[100px]"
            >
              {isLastStep ? (
                <>
                  <span>Concluir</span>
                  <span className="ml-1">✓</span>
                </>
              ) : (
                <>
                  <span>Próximo</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
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
          'relative transition-all duration-300',
          active && 'z-[9999] relative rounded-lg ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl'
        )}
      >
        {children}
      </div>
      {overlay}
      {tooltip}
    </>
  );
}
