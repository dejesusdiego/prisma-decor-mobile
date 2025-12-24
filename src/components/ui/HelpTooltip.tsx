import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}

export function HelpTooltip({ 
  content, 
  side = 'top', 
  children, 
  iconClassName,
  className 
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {children}
            <HelpCircle className={cn(
              "h-3.5 w-3.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors",
              iconClassName
            )} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[280px]">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Versão apenas com ícone (sem children)
interface InfoIconProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function InfoIcon({ content, side = 'top', className }: InfoIconProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className={cn(
            "h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors",
            className
          )} />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[280px]">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
