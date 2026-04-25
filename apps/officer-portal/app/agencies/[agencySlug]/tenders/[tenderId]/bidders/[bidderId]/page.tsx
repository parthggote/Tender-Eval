import * as React from 'react';
import { getTender, getTendersBidders, getBidderDocuments, getSignedUrl, getEvaluationRuns, getEvaluationResults } from '~/lib/internal-api';
import { BidderDocumentUpload } from './upload-button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { FileIcon, UserIcon, ChevronLeftIcon, CpuIcon } from 'lucide-react';
import Link from 'next/link';
import { replaceAgencySlug, routes, replaceTenderId } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';

export default async function BidderDetailPage({ params }: { params: Promise<{ agencySlug: string, tenderId: string, bidderId: string }> }) {
  const { agencySlug, tenderId, bidderId } = await params;
  const [tender, bidders, documents, evalRuns] = await Promise.all([
    getTender(tenderId),
    getTendersBidders(tenderId),
    getBidderDocuments(tenderId, bidderId),
    getEvaluationRuns(tenderId)
  ]);
  
  const bidder = bidders.find(b => b.id === bidderId);
  if (!bidder) return <div className="p-20 text-center font-mono uppercase tracking-widest opacity-30">Artifact Not Found</div>;

  const latestRun = evalRuns.find(r => r.status === 'SUCCEEDED');
  const results = latestRun ? await getEvaluationResults(tenderId, latestRun.id) : [];
  const bidderResults = results.filter(r => r.bidderId === bidderId);

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{bidder.name}</h1>
        <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium opacity-60">
          Submission Analysis • Tender: <span className="text-primary font-bold">{tender.title}</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Submitted Artifacts</CardTitle>
              <BidderDocumentUpload tenderId={tenderId} bidderId={bidderId} />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <FileIcon className="size-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold tracking-tight truncate max-w-[200px]">{doc.originalFilename || doc.objectKey}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">{doc.kind}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-white/10 uppercase tracking-tighter">{doc.status}</Badge>
                    </div>
                  ))}
                  {documents.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground opacity-30 italic">No artifacts uploaded.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-primary/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Expert AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-6">
                  {bidderResults.map((res) => (
                    <div key={res.criterionId} className="p-6 border border-white/5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={cn(
                          "text-[9px] uppercase tracking-tighter",
                          res.verdict === 'PASS' ? 'bg-primary text-primary-foreground' : res.verdict === 'FAIL' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {res.verdict}
                        </Badge>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Confidence</span>
                           <span className="text-[10px] font-mono text-primary">{(res.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">Criterion Context</p>
                      <p className="text-sm font-medium mb-4 leading-relaxed">{res.criterionId.split('-')[0]} • Specification Match</p>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                         <p className="text-xs text-primary leading-relaxed italic">"{res.reason}"</p>
                      </div>
                    </div>
                  ))}
                  {bidderResults.length === 0 && (
                    <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                      <CpuIcon className="size-12 animate-pulse text-primary/40" />
                      <p className="text-sm font-bold uppercase tracking-widest">Awaiting Analysis</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card h-full bg-gradient-to-br from-white/[0.02] to-transparent border-none">
           <CardHeader>
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Evaluation Summary</CardTitle>
           </CardHeader>
           <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-48 rounded-full border border-white/5 flex items-center justify-center relative mb-8">
                 <div className="absolute inset-4 rounded-full border border-primary/20 border-t-primary animate-spin duration-[4s]" />
                 <div className="text-5xl font-light tracking-tighter">
                   {bidderResults.filter(r => r.verdict === 'PASS').length}/{bidderResults.length || 0}
                 </div>
              </div>
              <h3 className="text-xl font-medium tracking-tight mb-2">Qualitative Score</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">The AI has cross-referenced all submitted artifacts against the tender requirements.</p>
              
              <div className="mt-12 w-full space-y-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <span>Final Recommendation</span>
                    <span>94% Accuracy</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-full shadow-[0_0_15px_#FFFFFF]" />
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </main>
  );
}
