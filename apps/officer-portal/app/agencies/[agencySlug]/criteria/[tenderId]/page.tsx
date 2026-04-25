import * as React from 'react';
import { getTenderCriteria, getTender } from '~/lib/internal-api';
import { PageHeader } from '~/components/layout/page-header';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { replaceAgencySlug, routes } from '@workspace/routes';
import { CriteriaDetailClient } from '~/components/criteria/criteria-detail-client';

export default async function CriteriaDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; tenderId: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug, tenderId } = await params;
  const [criteria, tender] = await Promise.all([
    getTenderCriteria(tenderId),
    getTender(tenderId).catch(() => null),
  ]);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Criteria', href: replaceAgencySlug(routes.portal.agencies.agencySlug.criteria, agencySlug) },
          { label: tender?.title ?? tenderId.split('-')[0].toUpperCase() },
        ]}
      />
      <CriteriaDetailClient
        agencySlug={agencySlug}
        tenderId={tenderId}
        tenderTitle={tender?.title ?? tenderId.split('-')[0].toUpperCase()}
        initialCriteria={criteria}
      />
    </>
  );
}
