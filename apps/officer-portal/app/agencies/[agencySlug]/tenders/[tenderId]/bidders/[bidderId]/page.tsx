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
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{bidder.name}</h1>
        <p className="text-sm text-muted-foreground">
          Tender: {tender.title}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
              <CardTitle className="text-sm font-semibold">Submitted Documents</CardTitle>
              <BidderDocumentUpload tenderId={tenderId} bidderId={bidderId} />
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-md bg-muted flex items-center justify-center">
                          <FileIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.originalFilename || doc.objectKey}</p>
                          <p className="text-xs text-muted-foreground">{doc.kind}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{doc.status}</Badge>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
              <CardTitle className="text-sm font-semibold">AI Evaluation Results</CardTitle>
              <Badge variant="secondary" className="text-xs">{bidderResults.length} criteria</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-3">
                  {bidderResults.map((res) => {
                    const isPass = res.verdict === 'PASS';
                    const isFail = res.verdict === 'FAIL';
                    const isReview = res.verdict === 'NEEDS_REVIEW';
                    
                    return (
                      <div key={res.criterionId} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <Badge 
                            variant={isPass ? "default" : isFail ? "destructive" : "secondary"}
                            className="text-xs font-medium"
                          >
                            {res.verdict.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Confidence</span>
                            <span className="text-xs font-mono font-semibold">{((res.confidence || 0) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Criterion</p>
                            <p className="text-sm font-medium">{res.criterionId.split('-')[0]} • Specification Match</p>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Analysis</p>
                            <p className="text-xs leading-relaxed">{res.reason}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {bidderResults.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center gap-3">
                      <CpuIcon className="size-10 text-muted-foreground/50" />
                      <div>
                        <p className="text-sm font-medium">No evaluations yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload documents and run evaluation</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card h-full">
           <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold">Evaluation Summary</CardTitle>
           </CardHeader>
           <CardContent className="pt-6 space-y-8">
              {/* Primary Metric - Score Circle */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative size-40">
                  <svg className="size-full -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                      opacity="0.1"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - passRate / 100)}`}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-semibold tracking-tight">{passCount}</div>
                    <div className="text-sm text-muted-foreground">of {totalEvaluated}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Criteria Passed</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{passRate.toFixed(1)}% pass rate</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-semibold">{passCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Pass</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-semibold">{failCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Fail</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-semibold">{reviewCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Review</div>
                </div>
              </div>

              {/* AI Confidence Metric */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium">AI Confidence</span>
                  <span className="text-sm text-muted-foreground">{(avgConfidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${avgConfidence * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Average confidence across {totalEvaluated} automated evaluations
                </p>
              </div>
           </CardContent>
        </Card>
      </div>
    </main>
  );
}
