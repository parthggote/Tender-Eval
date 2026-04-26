import { cn } from '@workspace/ui/lib/utils';

type GradientBlurBgProps = {
  className?: string;
  variant?: 'right' | 'both';
};

/**
 * Gradient blur background with grid lines and purple radial glow.
 * Use as an absolute-positioned backdrop inside a relative container.
 */
export function GradientBlurBg({ className, variant = 'both' }: GradientBlurBgProps) {
  const gradient =
    variant === 'right'
      ? `linear-gradient(to right, #f0f0f0 1px, transparent 1px),
         linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
         radial-gradient(circle 800px at 100% 200px, #d5c5ff, transparent)`
      : `linear-gradient(to right, #f0f0f0 1px, transparent 1px),
         linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
         radial-gradient(circle 600px at 0% 200px, #d5c5ff, transparent),
         radial-gradient(circle 600px at 100% 200px, #d5c5ff, transparent)`;

  const size =
    variant === 'right'
      ? '96px 64px, 96px 64px, 100% 100%'
      : '20px 20px, 20px 20px, 100% 100%, 100% 100%';

  return (
    <div
      className={cn('absolute inset-0 z-0', className)}
      style={{ backgroundImage: gradient, backgroundSize: size }}
      aria-hidden="true"
    />
  );
}
