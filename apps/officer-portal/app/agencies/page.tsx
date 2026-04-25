import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@workspace/auth';
import { replaceAgencySlug, routes } from '@workspace/routes';
import { Building2Icon, ArrowRightIcon } from 'lucide-react';

import { getAgenciesForCurrentUser } from '~/lib/internal-api';

export default async function AgenciesIndexPage(): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!session?.user) {
    return redirect(routes.portal.auth.SignIn);
  }

  const agencies = await getAgenciesForCurrentUser();
  if (agencies.length === 1) {
    return redirect(
      replaceAgencySlug(routes.portal.agencies.agencySlug.createTender, agencies[0].slug)
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-8 animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Select a workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose an agency workspace to continue.
        </p>
      </div>

      {agencies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-lg text-center">
          <Building2Icon className="h-10 w-10 text-muted-foreground/30 mb-4" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">No agencies available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contact your administrator to be added to an agency.
          </p>
        </div>
      ) : (
        /* #55: entire row is a Link — keyboard navigable, no false affordance on container */
        <div className="border rounded-lg overflow-hidden divide-y divide-border">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={replaceAgencySlug(routes.portal.agencies.agencySlug.createTender, agency.slug)}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-md bg-muted flex items-center justify-center border border-border">
                  <Building2Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium">{agency.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{agency.slug}</p>
                </div>
              </div>
              <ArrowRightIcon
                className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
