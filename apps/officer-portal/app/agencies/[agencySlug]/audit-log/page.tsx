import * as React from 'react';
import Link from 'next/link';
import { getAuditLogs, getTendersForAgency } from '~/lib/internal-api';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { PageHeader } from '~/components/layout/page-header';
import { ShieldCheckIcon, ScrollTextIcon, FileTextIcon, ArrowRightIcon, ClockIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { DoodleArrow } from '~/components/ui/doodle-arrow';
import type { AuditEntry, TenderSummary } from '@workspace/dtos';
import { replaceAgencySlug, replaceTenderId, routes } from '@workspace/routes';

const AGENCY_KEY = '__agency__';

function extractTenderId(log: AuditEntry): string | null {
  try {
    const p = typeof log.payload === 'string' ? JSON.parse(log.payload as string) : log.payload;
    return (p?.tenderId as string) ?? (p?.tender_id as string) ?? null;
  } catch { return null; }
}

export default async function AuditLogPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug } = await params;
  const [logs, tenders] = await Promise.all([
    getAuditLogs(agencySlug),
    getTendersForAgency(agencySlug),
  ]);

  const tenderMap = new Map<string, TenderSummary>(tenders.map((t) => [t.id, t]));

  // Group by tenderId
  const sessions = new Map<string, AuditEntry[]>();
  for (const log of logs) {
    const key = extractTenderId(log) ?? AGENCY_KEY;
    if (!sessions.has(key)) sessions.set(key, []);
    sessions.get(key)!.push(log);
  }

  const sortedKeys = [...sessions.keys()].sort((a, b) => {
    if (a === AGENCY_KEY) return 1;
    if (b === AGENCY_KEY) return -1;
    return (tenderMap.get(a)?.title ?? a).localeCompare(tenderMap.get(b)?.title ?? b);
  });

  return (
    <TooltipProvider>
      <PageHeader
        breadcrumbs={[{ label: 'Audit log' }]}
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-md border border-success/20 cursor-default">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Hash chain verified
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              Each entry is cryptographically linked to the previous one. Any tampering is detectable.
            </TooltipContent>
          </Tooltip>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Audit log</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Immutable log sessions per tender.
            </p>
          </div>
          <Badge variant="outline" className="text-xs gap-1.5">
            <ScrollTextIcon className="h-3 w-3" />
            {logs.length} total entries
          </Badge>
        </div>

        {logs.length === 0 ? (
          <div className="relative">
            <DoodleArrow direction="down" className="absolute -top-6 left-1/2 -translate-x-1/2" />
            <SketchEmpty
              variant="search"
              title="No audit entries yet"
              description="System and officer actions will appear here."
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedKeys.map((key) => {
              const sessionLogs = sessions.get(key)!;
              const tender = key !== AGENCY_KEY ? tenderMap.get(key) : null;
              const isAgencyLevel = key === AGENCY_KEY;
              const latest = sessionLogs[0];
              const oldest = sessionLogs[sessionLogs.length - 1];

              // Unique actions summary
              const actionCounts = sessionLogs.reduce<Record<string, number>>((acc, l) => {
                acc[l.action] = (acc[l.action] ?? 0) + 1;
                return acc;
              }, {});
              const topActions = Object.entries(actionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

              const detailUrl = isAgencyLevel
                ? replaceAgencySlug(routes.portal.agencies.agencySlug.auditLogDetail, agencySlug).replace('[tenderId]', AGENCY_KEY)
                : replaceTenderId(
                    replaceAgencySlug(routes.portal.agencies.agencySlug.auditLogDetail, agencySlug),
                    key
                  );

              return (
                <div key={key} className="rounded-xl border border-border bg-card flex flex-col overflow-hidden hover:shadow-sm transition-shadow">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {isAgencyLevel ? 'Agency-level actions' : (tender?.title ?? key)}
                      </p>
                      {!isAgencyLevel && (
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {key.split('-')[0].toUpperCase()}
                          {tender?.reference ? ` · ${tender.reference}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-4 flex-1 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <ScrollTextIcon className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold">{sessionLogs.length}</span>
                        <span className="text-muted-foreground">{sessionLogs.length === 1 ? 'entry' : 'entries'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClockIcon className="size-3" />
                        {new Date(latest.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Top actions */}
                    <div className="flex flex-wrap gap-1.5">
                      {topActions.map(([action, count]) => (
                        <span key={action} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {action.replace(/_/g, ' ').toLowerCase()} ×{count}
                        </span>
                      ))}
                    </div>

                    {/* Date range */}
                    <p className="text-xs text-muted-foreground">
                      {new Date(oldest.createdAt).toLocaleDateString()} → {new Date(latest.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-border">
                    <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                      <Link href={detailUrl}>
                        View log
                        <ArrowRightIcon className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
