import * as React from 'react';

type Direction = 'left' | 'right' | 'down';

/**
 * Hand-drawn annotation callout with an arrow.
 * Use only on landing page surfaces.
 */
export function SketchAnnotation({
  children,
  direction = 'right',
  className = '',
}: {
  children: React.ReactNode;
  direction?: Direction;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sketch text-sm text-muted-foreground select-none ${className}`}
      aria-hidden="true"
    >
      {direction === 'right' && <ArrowRight />}
      {direction === 'down' && <ArrowDown />}
      {children}
      {direction === 'left' && <ArrowLeft />}
    </span>
  );
}

function ArrowRight() {
  return (
    <svg width="28" height="18" viewBox="0 0 28 18" fill="none" aria-hidden="true">
      <path d="M2 9 C8 7, 16 11, 24 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 5 L24 8 L21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="28" height="18" viewBox="0 0 28 18" fill="none" aria-hidden="true">
      <path d="M26 9 C20 7, 12 11, 4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 5 L4 8 L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="18" height="28" viewBox="0 0 18 28" fill="none" aria-hidden="true">
      <path d="M9 2 C7 8, 11 16, 8 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 20 L8 25 L12 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
