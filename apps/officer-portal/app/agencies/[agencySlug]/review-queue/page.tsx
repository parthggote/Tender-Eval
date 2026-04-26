import * as React from 'react';
import { getReviewQueue } from '~/lib/internal-api';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { PageHeader } from '~/components/layout/page-header';
import { FlagIcon, ArrowRightIcon, CheckCircle2Icon } from 'lucide-react';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { DoodleArrow } from '~/components/ui/doodle-arrow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';

export default async function ReviewQueuePage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug } = await params;
  const cases = await getReviewQueue(agencySlug);
  const openCases = cases.filter((c) => c.status === 'OPEN');
  const resolvedCases = cases.filter((c) => c.status !== 'OPEN');

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Review queue' }]}
        actions={
          openCases.length > 0 ? (
            <Badge variant="destructive" className="text-xs">
              {openCases.length} open
            </Badge>
          ) : undefined
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
        {/* Summary strip */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open items</CardTitle>
              <FlagIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openCases.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {openCases.length === 0 ? 'Queue is clear' : 'Require officer verification'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedCases.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Manually verified cases</p>
            </CardContent>
          </Card>
        </div>

        {/* Open cases */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Open items</h2>
            <Separator className="flex-1" />
          </div>

          {openCases.length === 0 ? (
            <div className="relative">
              <DoodleArrow direction="right" className="absolute -top-8 left-1/2 -translate-x-1/2" />
              <SketchEmpty
                variant="inbox"
                title="Queue is clear"
                description="No items require review at this time."
              />
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden divide-y divide-border">
              {openCases.map((c) => (
                <div key={c.id} className="flex items-start gap-4 p-4">
                  {/* Left accent */}
                  <div className="mt-0.5 size-8 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
                    <FlagIcon className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        Criterion {c.criterionId.split('-')[0].toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-xs">{c.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.reason}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">Dismiss</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Dismiss this flag?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This marks the flag as dismissed. The action is recorded in the audit log.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction>Dismiss flag</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1.5">
                          Resolve
                          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Resolve this case?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This marks the criterion as manually verified. The decision is recorded in the audit log and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction>Confirm resolution</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
