import * as React from 'react';
import { PageHeader } from '~/components/layout/page-header';
import { TemplatesClient } from '~/components/templates/templates-client';

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug } = await params;
  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Templates' }]} />
      <TemplatesClient agencySlug={agencySlug} />
    </>
  );
}
