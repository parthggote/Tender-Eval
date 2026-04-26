import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';

type DoodleArrowProps = {
  direction?: 'down-left' | 'down-right' | 'right' | 'down';
  className?: string;
};

/**
 * Hand-drawn doodle arrow SVG — used to point toward empty-state CTAs
 * and onboarding hints throughout the app.
 */
export function DoodleArrow({ direction = 'down-left', className }: DoodleArrowProps): React.JSX.Element {
  if (direction === 'down-right') {
    return (
      <svg
        width="72" height="64" viewBox="0 0 72 64" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('text-muted-foreground/40 pointer-events-none select-none', className)}
        aria-hidden="true"
      >
        <path d="M12 6 C28 4, 54 18, 64 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
        <path d="M64 46 L68 34 M64 46 L53 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (direction === 'right') {
    return (
      <svg
        width="64" height="32" viewBox="0 0 64 32" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('text-muted-foreground/40 pointer-events-none select-none', className)}
        aria-hidden="true"
      >
        <path d="M4 16 C16 8, 40 8, 56 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
        <path d="M56 16 L46 10 M56 16 L46 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (direction === 'down') {
    return (
      <svg
        width="32" height="64" viewBox="0 0 32 64" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('text-muted-foreground/40 pointer-events-none select-none', className)}
        aria-hidden="true"
      >
        <path d="M16 4 C8 20, 8 40, 16 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
        <path d="M16 58 L8 46 M16 58 L24 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  // default: down-left
  return (
    <svg
      width="72" height="64" viewBox="0 0 72 64" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-muted-foreground/40 pointer-events-none select-none', className)}
      aria-hidden="true"
    >
      <path d="M60 6 C44 4, 18 18, 8 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      <path d="M8 46 L4 34 M8 46 L19 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
