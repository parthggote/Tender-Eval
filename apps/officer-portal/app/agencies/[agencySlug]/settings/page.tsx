import * as React from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { dedupedAuth } from '@workspace/auth';
import { routes } from '@workspace/routes';
import { PageHeader } from '~/components/layout/page-header';
import { SettingsForm } from './settings-form';
import { getAgenciesForCurrentUser } from '~/lib/internal-api';

type PageProps = { params: Promise<{ agencySlug: string }> };

export default async function SettingsPage({ params }: PageProps): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!session?.user) return redirect(routes.portal.auth.SignIn);

  const { agencySlug } = await params;
  const agencies = await getAgenciesForCurrentUser();
  const agency = agencies.find((a) => a.slug === agencySlug);
  if (!agency) return redirect(routes.portal.agencies.Index);

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Settings' }]} />
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="max-w-2xl w-full mx-auto p-6 space-y-10 animate-in fade-in duration-300">
          <SettingsForm agency={agency} />
        </div>
      </div>
    </>
  );
}
