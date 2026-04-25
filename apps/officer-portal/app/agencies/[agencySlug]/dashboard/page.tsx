import * as React from 'react';
import Link from 'next/link';
import { getTendersForAgency, getReviewQueue, getAuditLogs } from '~/lib/internal-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { PageHeader } from '~/components/layout/page-header';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import {
  ClipboardListIcon,
  FlagIcon,
  ScrollTextIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { replaceAgencySlug, routes } from '@workspace/routes';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug } = await params;
  const [tenders, reviewQueue, auditLogs] = await Promise.all([
    getTendersForAgency(agencySlug),
    getReviewQueue(agencySlug),
    getAuditLogs(agencySlug),
  ]);

  const openFlags = reviewQueue.filter((r) => r.status === 'OPEN').length;
  const resolvedFlags = reviewQueue.filter((r) => r.status !== 'OPEN').length;

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Dashboard' }]} />

      <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto animate-in fade-in duration-300">
        {/* KPI row — clickable cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug),
              title: 'Active tenders',
              value: tenders.length,
              sub: 'In this workspace',
              icon: <ClipboardListIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />,
            },
            {
              href: replaceAgencySlug(routes.portal.agencies.agencySlug.reviewQueue, agencySlug),
              title: 'Needs review',
              value: openFlags,
              sub: openFlags === 0 ? 'Queue is clear' : 'Awaiting officer review',
              icon: <FlagIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />,
            },
            {
              href: replaceAgencySlug(routes.portal.agencies.agencySlug.reviewQueue, agencySlug),
              title: 'Resolved flags',
              value: resolvedFlags,
              sub: 'Manually verified cases',
              icon: <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />,
            },
            {
              href: replaceAgencySlug(routes.portal.agencies.agencySlug.auditLog, agencySlug),
              title: 'Audit entries',
              value: auditLogs.length,
              sub: 'Operations recorded',
              icon: <ScrollTextIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />,
            },
          ].map((kpi) => (
            <Link key={kpi.title} href={kpi.href}>
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  {kpi.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Main content: activity feed + recent tenders */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent activity — 2/3 */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>Latest system and officer actions</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs gap-1 h-7">
                <Link href={replaceAgencySlug(routes.portal.agencies.agencySlug.auditLog, agencySlug)}>
                  View all
                  <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {auditLogs.length === 0 ? (
                <SketchEmpty
                  variant="chart"
                  title="No activity yet"
                  description="System and officer actions will appear here as you use the platform."
                />
              ) : (
                <div className="divide-y divide-border">
                  {auditLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                      <div className="size-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.actorUserId ? 'Officer' : 'System'} ·{' '}
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 hidden sm:flex">
                        {log.actorUserId ? 'Officer' : 'System'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent tenders — 1/3 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent tenders</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs gap-1 h-7">
                <Link href={replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug)}>
                  All
                  <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tenders.length === 0 ? (
                <SketchEmpty
                  variant="document"
                  title="No tenders yet"
                  description="Create your first tender to get started."
                />
              ) : (
                <div className="divide-y divide-border">
                  {tenders.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      href={replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug)}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {t.id.split('-')[0].toUpperCase()}
                        </p>
                      </div>
                      <ArrowRightIcon className="size-3.5 text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
