import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TruncatedTextProps {
  text: string;
  maxWidth?: string;
  className?: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  as?: 'span' | 'p' | 'div';
}

export function TruncatedText({
  text,
  maxWidth = '100%',
  className,
  tooltipSide = 'top',
  as: Component = 'span',
}: TruncatedTextProps) {
  const textRef = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };

    checkTruncation();

    // Re-check on resize
    const resizeObserver = new ResizeObserver(checkTruncation);
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [text]);

  const textElement = (
    <Component
      ref={textRef as any}
      className={cn('truncate block', className)}
      style={{ maxWidth }}
      title={!isTruncated ? undefined : text}
    >
      {text}
    </Component>
  );

  if (!isTruncated) {
    return textElement;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {textElement}
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} className="max-w-[300px]">
          <p className="text-sm break-words">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
