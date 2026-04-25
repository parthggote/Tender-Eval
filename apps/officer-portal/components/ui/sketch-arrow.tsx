import * as React from 'react';

/**
 * Vertical dashed hand-drawn arrow connector between workflow steps.
 * Use only on landing page.
 */
export function SketchArrowDown({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <div className={`flex justify-center py-1 ${className}`} aria-hidden="true">
      <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
        <path
          d="M10 2 C8 8, 12 14, 9 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 2.5"
          className="text-muted-foreground/40"
        />
        <path
          d="M6 19 L9 24 L13 19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground/40"
        />
      </svg>
    </div>
  );
}

/**
 * Horizontal curved arrow pointing right.
 */
export function SketchArrowRight({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <svg
      width="40"
      height="24"
      viewBox="0 0 40 24"
      fill="none"
      className={`text-muted-foreground/50 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M2 12 C10 8, 24 16, 34 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 2"
      />
      <path
        d="M30 6 L35 10 L31 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
