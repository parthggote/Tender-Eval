'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronsUpDownIcon, CheckIcon } from 'lucide-react';

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
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function AgencySwitcher({
  agencies,
  activeAgencySlug
}: AgencySwitcherProps): React.JSX.Element {
  const active = agencies.find((a) => a.slug === activeAgencySlug);
  const initials = active ? getInitials(active.name) : '??';

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
            <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
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
              <div className="size-5 rounded-sm bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(agency.name)}
              </div>
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
