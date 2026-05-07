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
  
  // Calculate actual metrics
  const passCount = bidderResults.filter(r => r.verdict === 'PASS').length;
  const failCount = bidderResults.filter(r => r.verdict === 'FAIL').length;
  const reviewCount = bidderResults.filter(r => r.verdict === 'NEEDS_REVIEW').length;
  const totalEvaluated = bidderResults.length;
  const avgConfidence = totalEvaluated > 0 
    ? bidderResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / totalEvaluated 
    : 0;
  const passRate = totalEvaluated > 0 ? (passCount / totalEvaluated) * 100 : 0;

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
                <div className="space-y-4">
                  {bidderResults.map((res) => {
                    const verdictStyles = {
                      PASS: {
                        badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                        border: 'border-emerald-500/20',
                        bg: 'bg-emerald-500/5',
                        icon: '✓'
                      },
                      FAIL: {
                        badge: 'bg-destructive/10 text-destructive border-destructive/20',
                        border: 'border-destructive/20',
                        bg: 'bg-destructive/5',
                        icon: '✗'
                      },
                      NEEDS_REVIEW: {
                        badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                        border: 'border-amber-500/20',
                        bg: 'bg-amber-500/5',
                        icon: '!'
                      }
                    };
                    const style = verdictStyles[res.verdict as keyof typeof verdictStyles] || verdictStyles.NEEDS_REVIEW;
                    
                    return (
                      <div key={res.criterionId} className={cn(
                        "p-5 border rounded-xl transition-all group hover:shadow-md",
                        style.border,
                        "bg-white/[0.01] hover:bg-white/[0.03]"
                      )}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("size-6 rounded-full flex items-center justify-center text-xs font-bold", style.bg)}>
                              {style.icon}
                            </div>
                            <Badge className={cn("text-[9px] uppercase tracking-wider font-bold border", style.badge)}>
                              {res.verdict.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Confidence</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all" 
                                  style={{ width: `${(res.confidence || 0) * 100}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-mono text-primary font-bold">{((res.confidence || 0) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5">Criterion</p>
                            <p className="text-xs font-medium leading-relaxed">{res.criterionId.split('-')[0]} • Specification Match</p>
                          </div>
                          
                          <div className={cn("p-3 rounded-lg border", style.border, style.bg)}>
                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5">AI Analysis</p>
                            <p className="text-xs leading-relaxed">{res.reason}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
           <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-8">
              {/* Score Circle */}
              <div className="relative">
                <div className="size-48 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                  <div className="absolute inset-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin duration-[4s]" />
                  <div className="flex flex-col items-center">
                    <div className="text-5xl font-light tracking-tighter">
                      {passCount}<span className="text-2xl text-muted-foreground">/{totalEvaluated}</span>
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Criteria Passed</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-2xl font-bold text-emerald-600">{passCount}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Pass</div>
                </div>
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                  <div className="text-2xl font-bold text-destructive">{failCount}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Fail</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="text-2xl font-bold text-amber-600">{reviewCount}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Review</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="w-full space-y-4">
                {/* Pass Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">Pass Rate</span>
                    <span className="text-primary">{passRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">AI Confidence</span>
                    <span className="text-primary">{(avgConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                      style={{ width: `${avgConfidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                AI analysis cross-referenced {totalEvaluated} criteria against submitted artifacts using semantic search and LLM evaluation.
              </p>
           </CardContent>
        </Card>
      </div>
    </main>
  );
}
