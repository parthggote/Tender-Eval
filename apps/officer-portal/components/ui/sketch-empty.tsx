import * as React from 'react';

type SketchEmptyVariant = 'document' | 'inbox' | 'chart' | 'search' | 'flag';

const illustrations: Record<SketchEmptyVariant, React.ReactNode> = {
  document: (
    <svg width="72" height="80" viewBox="0 0 72 80" fill="none" aria-hidden="true">
      {/* Page */}
      <rect x="10" y="6" width="46" height="62" rx="3"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="4 2.5" />
      {/* Folded corner */}
      <path d="M42 6 L56 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 6 L42 20 L56 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Lines */}
      <line x1="20" y1="32" x2="50" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="40" x2="50" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="48" x2="38" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Small annotation arrow */}
      <path d="M58 28 C64 24, 68 30, 65 38" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      <path d="M62 37 L65 41 L68 37" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  ),
  inbox: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      {/* Box */}
      <rect x="8" y="28" width="56" height="36" rx="3"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="4 2.5" />
      {/* Lid open */}
      <path d="M8 28 L20 12 L52 12 L64 28"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Checkmark inside */}
      <path d="M24 46 L32 54 L50 36"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </svg>
  ),
  chart: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      {/* Axes */}
      <line x1="12" y1="60" x2="62" y2="60" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="10" x2="12" y2="60" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Bars */}
      <rect x="20" y="40" width="10" height="20" rx="2"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
      <rect x="36" y="28" width="10" height="32" rx="2"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
      <rect x="52" y="18" width="10" height="42" rx="2"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
      {/* Arrow annotation */}
      <path d="M58 14 C62 10, 66 12, 65 18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  search: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      {/* Magnifier */}
      <circle cx="30" cy="30" r="18"
        stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 2.5" fill="none" />
      <line x1="43" y1="43" x2="62" y2="62"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Question mark inside */}
      <path d="M26 24 C26 20, 34 18, 34 24 C34 28, 30 28, 30 32"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <circle cx="30" cy="36" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  flag: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      {/* Pole */}
      <line x1="18" y1="10" x2="18" y2="62"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Flag */}
      <path d="M18 12 L54 20 L18 36 Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill="none" strokeDasharray="4 2" />
      {/* Annotation */}
      <path d="M56 16 C62 12, 66 18, 62 24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
};

type SketchEmptyProps = {
  variant?: SketchEmptyVariant;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

/**
 * Hand-drawn empty state illustration.
 * Replaces plain icon + text empty states throughout the app.
 */
export function SketchEmpty({
  variant = 'document',
  title,
  description,
  action,
}: SketchEmptyProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="text-muted-foreground/25">
        {illustrations[variant]}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
