import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { replaceAgencySlug, routes } from '@workspace/routes';
import { PageHeader } from '~/components/layout/page-header';
import { CreateTenderForm } from './create-tender-form';

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
      <div className="flex flex-1 flex-col items-center justify-center p-6 overflow-auto animate-in fade-in duration-300">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">New tender</h1>
            <p className="text-sm text-muted-foreground">
              Give your tender a name to get started. You'll upload documents on the next screen.
            </p>
          </div>
          <CreateTenderForm agencySlug={agencySlug} />
          <p className="text-xs text-muted-foreground text-center">
            View past tenders in{' '}
            <Link
              href={replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug)}
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Tender History
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
