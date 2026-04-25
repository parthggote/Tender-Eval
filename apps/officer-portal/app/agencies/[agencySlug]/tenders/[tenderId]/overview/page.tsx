import * as React from 'react';
import { getTender } from '~/lib/internal-api';
import { TenderManager } from '~/components/tenders/tender-manager';

type PageProps = {
  params: Promise<{ agencySlug: string; tenderId: string }>;
};

export default async function TenderOverviewPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { tenderId, agencySlug } = await params;
  const tender = await getTender(tenderId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TenderManager tender={tender} agencySlug={agencySlug} />
    </div>
  );
}
