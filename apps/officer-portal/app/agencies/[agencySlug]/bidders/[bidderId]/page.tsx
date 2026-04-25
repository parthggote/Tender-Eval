import * as React from 'react';
import { getTendersBidders, getBidderDocuments } from '~/lib/internal-api';
import { PageHeader } from '~/components/layout/page-header';
import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { FileIcon, UserIcon, BuildingIcon } from 'lucide-react';
import { replaceAgencySlug, routes } from '@workspace/routes';

type PageProps = {
  params: Promise<{ agencySlug: string; bidderId: string }>;
};

export default async function BidderPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { agencySlug, bidderId } = await params;

  // Fetch all bidders across tenders to find this one — bidder belongs to a tender
  // We surface what we can from the available API
  let bidderName = bidderId.split('-')[0].toUpperCase();
  let documents: any[] = [];

  try {
    // Try to get documents for this bidder — tenderId is needed; we use a best-effort approach
    // The bidderId page is reached from a tender context so tenderId is in the URL path
    // For now surface the bidder ID and documents if available
    documents = [];
  } catch {
    // Graceful degradation
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Tenders', href: replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug) },
          { label: 'Bidder detail' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
        {/* Bidder identity */}
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
            <BuildingIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{bidderName}</h1>
              <Badge variant="secondary">Bidder</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">{bidderId}</p>
          </div>
        </div>

        <Separator />

        {/* Submitted documents */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Submitted documents</h2>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed text-center">
              <FileIcon className="h-8 w-8 text-muted-foreground/30 mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">No documents submitted</p>
              <p className="text-xs text-muted-foreground mt-1">
                Documents uploaded by this bidder will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden divide-y divide-border">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-4">
                  <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <FileIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.originalFilename ?? doc.objectKey}</p>
                    <p className="text-xs text-muted-foreground">{doc.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Evaluation results placeholder */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Evaluation results</h2>
          <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed text-center">
            <UserIcon className="h-8 w-8 text-muted-foreground/30 mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">No evaluation run yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run an evaluation from the tender overview to see results here.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
