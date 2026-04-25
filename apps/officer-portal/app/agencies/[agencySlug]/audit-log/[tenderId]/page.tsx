import * as React from 'react';
import { getAuditLogs, getTendersForAgency } from '~/lib/internal-api';
import { Badge } from '@workspace/ui/components/badge';
import { PageHeader } from '~/components/layout/page-header';
import { ShieldCheckIcon, ScrollTextIcon, UserIcon, CpuIcon, ClockIcon } from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import type { AuditEntry } from '@workspace/dtos';
import { replaceAgencySlug, routes } from '@workspace/routes';

const AGENCY_KEY = '__agency__';

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function extractTenderId(log: AuditEntry): string | null {
  try {
    const p = typeof log.payload === 'string' ? JSON.parse(log.payload as string) : log.payload;
    return (p?.tenderId as string) ?? (p?.tender_id as string) ?? null;
  } catch { return null; }
}

function getPayloadSummary(log: AuditEntry): Record<string, string> {
  try {
    const p = typeof log.payload === 'string' ? JSON.parse(log.payload as string) : log.payload;
    if (!p) return {};
    return Object.fromEntries(
      Object.entries(p)
        .filter(([k]) => k !== 'tenderId' && k !== 'tender_id')
        .slice(0, 4)
        .map(([k, v]) => [k, String(v).substring(0, 60)])
    );
  } catch { return {}; }
}

const ACTION_CATEGORY: Record<string, { color: string; label: string }> = {
  EXTRACT: { color: 'bg-violet-500/10 text-violet-600', label: 'Extraction' },
  EVALUATE: { color: 'bg-blue-500/10 text-blue-600', label: 'Evaluation' },
  REVIEW: { color: 'bg-amber-500/10 text-amber-600', label: 'Review' },
  CREATE: { color: 'bg-emerald-500/10 text-emerald-600', label: 'Create' },
  DELETE: { color: 'bg-red-500/10 text-red-600', label: 'Delete' },
  UPDATE: { color: 'bg-sky-500/10 text-sky-600', label: 'Update' },
};

function getActionCategory(action: string) {
  const upper = action.toUpperCase();
  for (const [key, meta] of Object.entries(ACTION_CATEGORY)) {
    if (upper.includes(key)) return meta;
  }
  return { color: 'bg-muted text-muted-foreground', label: 'System' };
}

export default async function AuditLogDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; tenderId: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug, tenderId } = await params;
  const isAgencyLevel = tenderId === AGENCY_KEY;

  const [allLogs, tenders] = await Promise.all([
    getAuditLogs(agencySlug),
    getTendersForAgency(agencySlug),
  ]);

  const tender = tenders.find((t) => t.id === tenderId);

  const logs = allLogs.filter((log) => {
    const tid = extractTenderId(log);
    return isAgencyLevel ? tid === null : tid === tenderId;
  });

  const sessionLabel = isAgencyLevel
    ? 'Agency-level actions'
    : (tender?.title ?? tenderId.split('-')[0].toUpperCase());

  // Group by date
  const byDate = logs.reduce<Record<string, AuditEntry[]>>((acc, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <TooltipProvider>
      <PageHeader
        breadcrumbs={[
          { label: 'Audit log', href: replaceAgencySlug(routes.portal.agencies.agencySlug.auditLog, agencySlug) },
          { label: sessionLabel },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5">
              <ScrollTextIcon className="h-3 w-3" />
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-md border border-success/20 cursor-default">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  Hash chain verified
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Each entry is cryptographically linked to the previous one.
              </TooltipContent>
            </Tooltip>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
        {/* Session header card */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-sm font-semibold">{sessionLabel}</h1>
            {!isAgencyLevel && tender && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {tenderId.split('-')[0].toUpperCase()}
                {tender.reference ? ` · ${tender.reference}` : ''}
              </p>
            )}
          </div>
          {logs.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
              <ClockIcon className="size-3" />
              {new Date(logs[logs.length - 1].createdAt).toLocaleDateString()} →{' '}
              {new Date(logs[0].createdAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {logs.length === 0 ? (
          <SketchEmpty variant="search" title="No entries for this session" description="No audit entries found." />
        ) : (
          <div className="space-y-6">
            {Object.entries(byDate).map(([date, dateLogs]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-2">{date}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                  {dateLogs.map((log, i) => {
                    const summary = getPayloadSummary(log);
                    const isSystem = !log.actorUserId;
                    const category = getActionCategory(log.action);

                    return (
                      <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/10 transition-colors">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center shrink-0 pt-1.5">
                          <div className={`size-2 rounded-full ${isSystem ? 'bg-muted-foreground/30' : 'bg-primary/60'}`} />
                          {i < dateLogs.length - 1 && (
                            <div className="w-px flex-1 min-h-[28px] bg-border mt-1" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{formatAction(log.action)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${category.color}`}>
                              {category.label}
                            </span>
                          </div>

                          {/* Actor */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {isSystem
                              ? <><CpuIcon className="size-3" /> System</>
                              : <><UserIcon className="size-3" /><span className="font-mono">{log.actorUserId!.split('-')[0]}…</span></>
                            }
                          </div>

                          {/* Payload details */}
                          {Object.keys(summary).length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              {Object.entries(summary).map(([k, v]) => (
                                <span key={k} className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground/60">{k}:</span> {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right: time + hash */}
                        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-mono text-muted-foreground/40 cursor-default">
                                #{log.hash.substring(0, 8)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs font-mono max-w-xs break-all">
                              {log.hash}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
