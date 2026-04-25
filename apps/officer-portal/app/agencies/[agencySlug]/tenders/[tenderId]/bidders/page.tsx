import * as React from 'react';
import Link from 'next/link';
import { getTender, getTendersBidders, getEvaluationRuns } from '~/lib/internal-api';
import { replaceAgencySlug, routes, replaceTenderId, replaceBidderId } from '@workspace/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { UserIcon, ChevronRightIcon } from 'lucide-react';
import { CreateBidderDialog } from '~/components/tenders/create-bidder-dialog';
import { cn } from '@workspace/ui/lib/utils';

export default async function BiddersPage({ params }: { params: Promise<{ agencySlug: string, tenderId: string }> }) {
  const { agencySlug, tenderId } = await params;
  const [tender, bidders, evalRuns] = await Promise.all([
    getTender(tenderId),
    getTendersBidders(tenderId),
    getEvaluationRuns(tenderId)
  ]);

  const hasSuccessfulRun = evalRuns.some(r => r.status === 'SUCCEEDED');

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Bidder Registry</h1>
          <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium opacity-60">
            Current Tender Context: <span className="text-primary font-bold">{tender.title}</span>
          </p>
        </div>
        <CreateBidderDialog tenderId={tenderId} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bidders.map((bidder) => (
          <Card key={bidder.id} className="glass-card group overflow-hidden border-none bg-white/[0.01]">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-500 group-hover:rotate-6 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <UserIcon className="size-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold tracking-tight">{bidder.name}</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest opacity-40">Artifact: {bidder.id.split('-')[0]}</p>
                </div>
              </div>
              <Badge variant={hasSuccessfulRun ? "default" : "outline"} className={cn(
                "text-[9px] uppercase tracking-tighter",
                hasSuccessfulRun ? "bg-primary text-primary-foreground border-transparent" : "border-white/10 opacity-60"
              )}>
                {hasSuccessfulRun ? "EVALUATED" : "PENDING"}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-between hover:bg-primary/10 hover:text-primary group/btn h-11 border border-white/5">
                <Link href={replaceBidderId(
                  replaceTenderId(
                    replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.tenderId.bidders.bidderId, agencySlug),
                    tenderId
                  ),
                  bidder.id
                )}>
                  Inspect Submission
                  <ChevronRightIcon className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {bidders.length === 0 && (
          <Card className="border-dashed border-white/10 bg-transparent col-span-full py-20 text-center opacity-30">
            <CardContent>
              <p className="text-sm font-bold uppercase tracking-widest">Awaiting Bidder Ingestion</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
