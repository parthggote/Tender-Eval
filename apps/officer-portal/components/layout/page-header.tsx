'use client';

import * as React from 'react';
import Link from 'next/link';
import { Separator } from '@workspace/ui/components/separator';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Button } from '@workspace/ui/components/button';
import { ThemeToggle } from '@workspace/ui/components/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { UserIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import type { AgencyWorkspace } from '@workspace/dtos';
import { AgencySwitcher } from '~/components/layout/agency-switcher';
import { useAgencyContext } from '~/components/layout/agency-context';

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  breadcrumbs: BreadcrumbSegment[];
  actions?: React.ReactNode;
  agencies?: AgencyWorkspace[];
  activeAgencySlug?: string;
};

export function PageHeader({ breadcrumbs, actions }: PageHeaderProps): React.JSX.Element {
  const agencyCtx = useAgencyContext();
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

      {/* Breadcrumb — fills available space */}
      <Breadcrumb className="flex-1 min-w-0">
        <BreadcrumbList>
          {breadcrumbs.map((seg, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={seg.label}>
                <BreadcrumbItem className={i < breadcrumbs.length - 1 ? 'hidden md:block' : ''}>
                  {isLast ? (
                    <BreadcrumbPage>{seg.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={seg.href ?? '#'}>{seg.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right-side actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Agency switcher */}
      {agencyCtx && (
        <div className="w-44">
          <AgencySwitcher agencies={agencyCtx.agencies} activeAgencySlug={agencyCtx.activeAgencySlug} />
        </div>
      )}

      {/* Theme toggle — always visible */}
      <ThemeToggle />

      {/* User menu — sign out + settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="User menu">
            <UserIcon className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">My account</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/agencies" className="flex items-center gap-2">
              <SettingsIcon className="size-3.5" aria-hidden="true" />
              Workspaces
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/auth/sign-out" className="flex items-center gap-2 text-destructive focus:text-destructive">
              <LogOutIcon className="size-3.5" aria-hidden="true" />
              Sign out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
