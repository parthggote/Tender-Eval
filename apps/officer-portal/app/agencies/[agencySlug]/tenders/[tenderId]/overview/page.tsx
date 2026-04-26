import * as React from 'react';
import { getTender } from '~/lib/internal-api';
import { TenderManager } from '~/components/tenders/tender-manager';

type PageProps = {
  params: Promise<{ agencySlug: string; tenderId: string }>;
  searchParams: Promise<{ setup?: string }>;
};

export default async function TenderOverviewPage({ params, searchParams }: PageProps): Promise<React.JSX.Element> {
  const { tenderId, agencySlug } = await params;
  const { setup } = await searchParams;
  const tender = await getTender(tenderId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TenderManager tender={tender} agencySlug={agencySlug} initialSetup={setup as 'upload' | 'template' | undefined} />
    </div>
  );
}
