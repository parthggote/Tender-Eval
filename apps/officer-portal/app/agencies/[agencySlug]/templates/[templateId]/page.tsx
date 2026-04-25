import * as React from 'react';
import { PageHeader } from '~/components/layout/page-header';
import { TemplateDetailClient } from '~/components/templates/template-detail-client';
import { replaceAgencySlug, routes } from '@workspace/routes';

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; templateId: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug, templateId } = await params;
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Templates', href: replaceAgencySlug(routes.portal.agencies.agencySlug.templates, agencySlug) },
          { label: 'Template' },
        ]}
      />
      <TemplateDetailClient agencySlug={agencySlug} templateId={templateId} />
    </>
  );
}
