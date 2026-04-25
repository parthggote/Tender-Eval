import * as React from 'react';

/**
 * Wraps text with a hand-drawn SVG underline beneath it.
 * Use only on landing page hero/section headings.
 */
export function SketchUnderline({
  children,
  color = 'currentColor',
  className = '',
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}): React.JSX.Element {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <svg
        className="absolute -bottom-1 left-0 w-full overflow-visible pointer-events-none"
        viewBox="0 0 200 10"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2 7 C30 3, 70 9, 110 5 C150 1, 175 8, 198 6"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </span>
  );
}
