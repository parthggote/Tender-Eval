import { redirect } from 'next/navigation';

import { replaceAgencySlug, routes } from '@workspace/routes';

type PageProps = {
  params: Promise<{ agencySlug: string }>;
};

export default async function AgencyIndexPage(props: PageProps): Promise<never> {
  const { agencySlug } = await props.params;
  return redirect(replaceAgencySlug(routes.portal.agencies.agencySlug.createTender, agencySlug));
}

