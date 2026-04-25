import * as React from 'react';
import { getReports, getSignedUrl, getTendersForAgency } from '~/lib/internal-api';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@workspace/ui/components/table';
import { FileTextIcon, DownloadIcon } from 'lucide-react';
import { PageHeader } from '~/components/layout/page-header';
import { SketchEmpty } from '~/components/ui/sketch-empty';

// #RP-3: map raw status to readable labels
function reportStatusLabel(status: string): { label: string; variant: 'secondary' | 'outline' | 'destructive' } {
  switch (status?.toUpperCase()) {
    case 'SUCCEEDED': return { label: 'Complete', variant: 'secondary' };
    case 'PENDING':
    case 'RUNNING': return { label: 'Generating…', variant: 'outline' };
    case 'FAILED': return { label: 'Failed', variant: 'destructive' };
    default: return { label: status?.toLowerCase() ?? 'Unknown', variant: 'outline' };
  }
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug } = await params;
  // #RP-4: fetch tenders so we can show tender name on each report row
  const [reports, tenders] = await Promise.all([
    getReports(agencySlug),
    getTendersForAgency(agencySlug),
  ]);

  const tenderMap = Object.fromEntries(tenders.map((t) => [t.id, t]));

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Reports' }]} />
      <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
        <div>
          <h1 className="text-lg font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Signed evaluation reports for completed tenders.
          </p>
        </div>

        {reports.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Report</TableHead>
                  {/* #RP-4: tender name column */}
                  <TableHead className="hidden sm:table-cell">Tender</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(async (report) => {
                  let downloadUrl = '#';
                  if (report.status === 'SUCCEEDED' && report.objectKey) {
                    try {
                      const res = await getSignedUrl(report.objectKey);
                      downloadUrl = res.url;
                    } catch {}
                  }
                  const tender = report.tenderId ? tenderMap[report.tenderId] : null;
                  const { label, variant } = reportStatusLabel(report.status);

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-muted rounded-md shrink-0">
                            <FileTextIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </div>
                          <span className="text-sm font-medium">Evaluation report</span>
                        </div>
                      </TableCell>
                      {/* #RP-4: show tender title */}
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {tender?.title ?? (
                          <span className="font-mono text-xs">{report.tenderId?.split('-')[0].toUpperCase() ?? '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant} className="text-xs">{label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.status === 'SUCCEEDED' ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                              <DownloadIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not available</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <SketchEmpty
            variant="document"
            title="No reports yet"
            description="Reports are generated after a tender evaluation completes."
          />
        )}
      </div>
    </>
  );
}
