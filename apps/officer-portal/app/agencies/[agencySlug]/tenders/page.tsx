import * as React from 'react';
import Link from 'next/link';

import { replaceAgencySlug, routes, replaceTenderId } from '@workspace/routes';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { CalendarIcon, FileTextIcon, ArrowRightIcon } from 'lucide-react';
import { PageHeader } from '~/components/layout/page-header';
import { getTendersForAgency } from '~/lib/internal-api';
import { CreateTenderDialog } from '~/components/tenders/create-tender-dialog';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { DoodleArrow } from '~/components/ui/doodle-arrow';

type PageProps = {
  params: Promise<{ agencySlug: string }>;
};

export default async function TendersPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { agencySlug } = await params;
  const tenders = await getTendersForAgency(agencySlug);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Tenders' }]}
        actions={<CreateTenderDialog agencySlug={agencySlug} />}
      />

      <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Tenders</h1>
            <p className="text-sm text-muted-foreground">
              {tenders.length} tender{tenders.length !== 1 ? 's' : ''} in this workspace
            </p>
          </div>
        </div>

        {tenders.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Reference</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenders.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <FileTextIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <span className="font-medium text-sm line-clamp-1">{t.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {t.id.split('-')[0].toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" aria-hidden="true" />
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5">
                        <Link
                          href={replaceTenderId(
                            replaceAgencySlug(
                              routes.portal.agencies.agencySlug.tenders.tenderId.overview,
                              agencySlug
                            ),
                            t.id
                          )}
                        >
                          Open
                          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-20 border border-dashed rounded-lg text-center gap-4 relative">
            <DoodleArrow direction="down" className="absolute top-6 left-1/2 -translate-x-1/2" />
            <SketchEmpty
              variant="document"
              title="No tenders yet"
              description="Create your first tender to start uploading documents and running evaluations."
              action={<CreateTenderDialog agencySlug={agencySlug} />}
            />
          </div>
        )}
      </div>
    </>
  );
}
