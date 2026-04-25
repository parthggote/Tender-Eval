import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { CheckCircle2Icon, ArrowRightIcon, CalendarIcon } from 'lucide-react';
import { CriterionType } from '@workspace/dtos';

export const TYPE_COLORS: Record<string, string> = {
  [CriterionType.FINANCIAL]:     'bg-blue-500/10 text-blue-600',
  [CriterionType.TECHNICAL]:     'bg-violet-500/10 text-violet-600',
  [CriterionType.COMPLIANCE]:    'bg-amber-500/10 text-amber-600',
  [CriterionType.CERTIFICATION]: 'bg-emerald-500/10 text-emerald-600',
};

type CriteriaCardProps = {
  /** Icon element shown in the header icon box */
  icon: React.ReactNode;
  /** Primary title */
  title: string;
  /** Subtitle shown in mono below title */
  subtitle?: string;
  /** Optional star/badge shown next to title */
  titleBadge?: React.ReactNode;
  /** Total criteria count */
  criteriaCount: number;
  /** Mandatory criteria count */
  mandatoryCount: number;
  /** Type → count map for pills */
  typeCounts: Record<string, number>;
  /** 0–100 confidence value, omit to hide bar */
  avgConfidence?: number;
  /** Source badge label e.g. "AI extracted" or "manual" */
  sourceBadge?: string;
  /** ISO date string for the meta row */
  date?: string;
  /** Extra content below the meta row */
  extraMeta?: React.ReactNode;
  /** Footer left slot (e.g. "Set default" button) */
  footerLeft?: React.ReactNode;
  /** Footer right slot — defaults to "View →" link */
  footerRight?: React.ReactNode;
  /** href for the default "View →" button */
  href?: string;
  /** Label for the default "View →" button */
  hrefLabel?: string;
};

export function CriteriaCard({
  icon, title, subtitle, titleBadge,
  criteriaCount, mandatoryCount, typeCounts,
  avgConfidence, sourceBadge, date, extraMeta,
  footerLeft, footerRight, href, hrefLabel = 'View',
}: CriteriaCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden hover:shadow-sm transition-shadow">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-start gap-3">
        <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{title}</p>
            {titleBadge}
          </div>
          {subtitle && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-1 space-y-3">
        {/* Count row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{criteriaCount}</span> criteria
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2Icon className="size-3 text-success" />
            {mandatoryCount} mandatory
          </div>
        </div>

        {/* Type pills */}
        {Object.keys(typeCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(typeCounts).map(([type, count]) => (
              <span
                key={type}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[type] ?? 'bg-muted text-muted-foreground'}`}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()} · {count}
              </span>
            ))}
          </div>
        )}

        {/* Confidence bar */}
        {avgConfidence != null && criteriaCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avg. confidence</span>
              <span className="font-mono">{Math.round(avgConfidence)}%</span>
            </div>
            <Progress value={avgConfidence} className="h-1.5" />
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {sourceBadge && <Badge variant="outline" className="text-xs capitalize">{sourceBadge}</Badge>}
          {date && (() => {
            const d = new Date(date);
            return !isNaN(d.getTime()) ? (
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {d.toLocaleDateString()}
              </span>
            ) : null;
          })()}
        </div>

        {extraMeta}

        {criteriaCount === 0 && (
          <p className="text-xs text-muted-foreground">No criteria yet.</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center gap-2">
        {footerLeft}
        <div className={`flex items-center gap-2 ${footerLeft ? 'ml-auto' : 'w-full'}`}>
          {footerRight ?? (href && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 w-full">
              <Link href={href}>
                {hrefLabel} <ArrowRightIcon className="size-3.5" />
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
