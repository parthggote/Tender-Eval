import * as React from 'react';

/**
 * Hand-drawn rough circle/ellipse that wraps around content.
 * Rendered as an absolutely-positioned SVG overlay.
 * Use only on landing page to highlight key words or numbers.
 */
export function SketchCircle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <span className={`relative inline-block px-2 ${className}`}>
      {children}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <ellipse
          cx="50"
          cy="20"
          rx="46"
          ry="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
          style={{ filter: 'url(#sketch-filter)' }}
        />
      </svg>
    </span>
  );
}
