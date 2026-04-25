'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { replaceAgencySlug, replaceTenderId, routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { PageHeader } from '~/components/layout/page-header';

export default function TenderLayout({
  params,
  children,
}: {
  params: Promise<{ agencySlug: string; tenderId: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { agencySlug, tenderId } = React.use(params);

  const tabs = [
    {
      title: 'Overview',
      href: replaceTenderId(
        replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.tenderId.overview, agencySlug),
        tenderId
      ),
    },
    {
      title: 'Bidders',
      href: replaceTenderId(
        replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.tenderId.bidders.Index, agencySlug),
        tenderId
      ),
    },
  ];

  const activeTab = tabs.find((t) => pathname.startsWith(t.href));

  return (
    <div className="flex flex-col size-full overflow-hidden">
      {/* #39: PageHeader with SidebarTrigger + breadcrumb */}
      <PageHeader
        breadcrumbs={[
          {
            label: 'Tenders',
            href: replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug),
          },
          { label: activeTab?.title ?? 'Tender' },
        ]}
      />

      {/* Tab bar */}
      <div className="border-b bg-background px-6">
        <nav className="flex gap-1" aria-label="Tender sections">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'text-sm font-medium transition-colors py-3 px-3 border-b-2 -mb-px',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
