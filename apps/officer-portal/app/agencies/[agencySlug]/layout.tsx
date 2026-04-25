import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@workspace/auth';
import { routes } from '@workspace/routes';

import { AppShell } from '~/components/layout/app-shell';
import { getAgenciesForCurrentUser } from '~/lib/internal-api';

type LayoutProps = React.PropsWithChildren & {
  params: Promise<{ agencySlug: string }>;
};

export default async function AgencyLayout({
  params,
  children
}: LayoutProps): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!session?.user) {
    return redirect(routes.portal.auth.SignIn);
  }

  const { agencySlug } = await params;
  const [cookieStore, agencies] = await Promise.all([
    cookies(),
    getAgenciesForCurrentUser()
  ]);

  const isMember = agencies.some((a) => a.slug === agencySlug);
  if (!isMember) {
    return redirect(routes.portal.agencies.Index);
  }

  return (
    <div className="flex size-full overflow-hidden">
      <AppShell
        agencies={agencies}
        activeAgencySlug={agencySlug}
        defaultSidebarOpen={
          (cookieStore.get('sidebar:state')?.value ?? 'true') === 'true'
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

