'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronsUpDownIcon, CheckIcon, Building2Icon } from 'lucide-react';

import { routes, replaceAgencySlug } from '@workspace/routes';
import type { AgencyWorkspace } from '@workspace/dtos';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@workspace/ui/components/dropdown-menu';

export type AgencySwitcherProps = {
  agencies: AgencyWorkspace[];
  activeAgencySlug: string;
};

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function AgencyAvatar({ agency, size = 6 }: { agency: AgencyWorkspace; size?: number }) {
  const sizeClass = `size-${size}`;
  if (agency.logoUrl) {
    return (
      <div className={`${sizeClass} rounded-md overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center`}>
        <Image src={agency.logoUrl} alt={agency.name} width={size * 4} height={size * 4} className="object-contain" />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0`}>
      {getInitials(agency.name)}
    </div>
  );
}

export function AgencySwitcher({ agencies, activeAgencySlug }: AgencySwitcherProps): React.JSX.Element {
  const active = agencies.find((a) => a.slug === activeAgencySlug);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full justify-between px-2 gap-2"
          aria-label="Switch agency workspace"
        >
          <div className="flex items-center gap-2 min-w-0">
            {active ? (
              <AgencyAvatar agency={active} size={6} />
            ) : (
              <div className="size-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Building2Icon className="size-3.5 text-muted-foreground" />
              </div>
            )}
            <span className="truncate text-sm font-medium">
              {active?.name ?? activeAgencySlug}
            </span>
          </div>
          <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {agencies.map((agency) => (
          <DropdownMenuItem key={agency.id} asChild>
            <Link
              href={replaceAgencySlug(routes.portal.agencies.agencySlug.dashboard, agency.slug)}
              className="flex items-center gap-2"
            >
              <AgencyAvatar agency={agency} size={5} />
              <span className="flex-1 truncate">{agency.name}</span>
              {agency.slug === activeAgencySlug && (
                <CheckIcon className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
