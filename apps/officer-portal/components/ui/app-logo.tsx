import * as React from 'react';
import Image from 'next/image';

type AppLogoProps = {
  /**
   * Height in pixels. Width is calculated automatically from the logo's
   * natural aspect ratio (552 × 414 → ~1.33 : 1).
   */
  size?: number;
  className?: string;
  /** Show the "TenderEval" wordmark next to the icon */
  showName?: boolean;
  /** Extra classes for the wordmark text */
  nameClassName?: string;
  /** Use Caveat sketch font for wordmark instead of system font */
  useSketchFont?: boolean;
};

// Logo SVG is now a square viewBox (137.8 × 137.8)
const LOGO_W = 1;
const LOGO_H = 1;

/**
 * TenderEval brand mark using the official logo.svg.
 *
 * Design system heuristics:
 * - 2.8 Prägnanz: original brand mark, not a substitute
 * - 7.2 Media Performance: next/image handles optimisation
 * - 6.1 Readability: wordmark can use sketch font (Caveat) for brand consistency
 */
export function AppLogo({
  size = 28,
  className = '',
  showName = false,
  nameClassName = '',
  useSketchFont = false,
}: AppLogoProps): React.JSX.Element {
  const w = Math.round((size * LOGO_W) / LOGO_H);

  const fontClasses = useSketchFont
    ? 'font-sketch font-semibold tracking-tight'
    : 'font-sans font-semibold tracking-tight';

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      <Image
        src="/logo.svg"
        alt="TenderEval"
        width={w}
        height={size}
        className="shrink-0 object-contain"
        priority
      />
      {showName && (
        <span className={`${fontClasses} text-foreground leading-none ${nameClassName}`}>
          TenderEval
        </span>
      )}
    </span>
  );
}
