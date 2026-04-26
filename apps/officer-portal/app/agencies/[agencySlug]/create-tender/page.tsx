import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { replaceAgencySlug, routes } from '@workspace/routes';
import { PageHeader } from '~/components/layout/page-header';
import { CreateTenderCards } from './create-tender-cards';

export const metadata: Metadata = {
  title: 'Create Tender — TenderEval',
};

type PageProps = {
  params: Promise<{ agencySlug: string }>;
};

export default async function CreateTenderPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { agencySlug } = await params;

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Create Tender' }]} />
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 overflow-auto animate-in fade-in duration-300">

        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Start a new tender</h1>
          <p className="text-sm text-muted-foreground">
            Upload your existing documents for AI-assisted evaluation, or kick off from a pre-built template.
          </p>
        </div>

        <CreateTenderCards agencySlug={agencySlug} />

        <p className="text-xs text-muted-foreground">
          View past tenders in{' '}
          <Link
            href={replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug)}
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Tender History
          </Link>
        </p>
      </div>
    </>
  );
}
