import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { replaceAgencySlug, routes, replaceTenderId } from '@workspace/routes';
import { Badge } from '@workspace/ui/components/badge';
import { CalendarIcon, FileTextIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '~/components/layout/page-header';
import { getTendersForAgency } from '~/lib/internal-api';
import { CreateTenderDialog } from '~/components/tenders/create-tender-dialog';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { DoodleArrow } from '~/components/ui/doodle-arrow';
import { TenderDeleteButton } from './tender-delete-button';

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
        <div>
          <h1 className="text-lg font-semibold">Tenders</h1>
          <p className="text-sm text-muted-foreground">
            {tenders.length} tender{tenders.length !== 1 ? 's' : ''} in this workspace
          </p>
        </div>

        {tenders.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-hidden divide-y divide-border">
            {tenders.map((t) => {
              const href = replaceTenderId(
                replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.tenderId.overview, agencySlug),
                t.id
              );
              // Parse date safely
              const date = t.createdAt ? new Date(t.createdAt) : null;
              const dateStr = date && !isNaN(date.getTime())
                ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';

              return (
                <div key={t.id} className="group relative flex items-center hover:bg-muted/40 transition-colors">
                  {/* Entire row is a link */}
                  <Link href={href} className="flex flex-1 items-center gap-4 px-4 py-3.5 min-w-0">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border">
                      <FileTextIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {t.reference ?? t.id.split('-')[0].toUpperCase()}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <CalendarIcon className="size-3" aria-hidden="true" />
                      {dateStr}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0 hidden md:flex">Active</Badge>
                  </Link>

                  {/* Delete button — visible on hover, outside the link */}
                  <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <TenderDeleteButton tenderId={t.id} tenderTitle={t.title} agencySlug={agencySlug} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative flex flex-1 flex-col items-center justify-center py-20 border border-dashed rounded-lg text-center gap-4">
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
