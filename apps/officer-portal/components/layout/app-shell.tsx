'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2Icon,
  ChevronDownIcon,
  ClipboardListIcon,
  FilePlusIcon,
  FilterIcon,
  FlagIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  SettingsIcon,
  LayoutTemplateIcon,
  ShieldCheckIcon,
  UserCogIcon,
} from 'lucide-react';

import { routes, replaceAgencySlug } from '@workspace/routes';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar
} from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';

import { AppLogo } from '~/components/ui/app-logo';
import type { AgencyWorkspace } from '@workspace/dtos';
import { AgencySwitcher } from './agency-switcher';
import { AgencyProvider } from './agency-context';

export type AppShellProps = React.PropsWithChildren & {
  agencies: AgencyWorkspace[];
  activeAgencySlug: string;
  defaultSidebarOpen?: boolean;
};

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

function useAgencyNav(activeAgencySlug: string): NavGroup[] {
  return React.useMemo(() => {
    const to = (route: string) => replaceAgencySlug(route, activeAgencySlug);
    return [
      {
        label: 'Tenders',
        icon: ClipboardListIcon,
        items: [
          {
            title: 'Create Tender',
            href: to(routes.portal.agencies.agencySlug.createTender),
            icon: FilePlusIcon
          },
          {
            title: 'Tender History',
            href: to(routes.portal.agencies.agencySlug.tenders.Index),
            icon: ClipboardListIcon
          },
          {
            title: 'Dashboard',
            href: to(routes.portal.agencies.agencySlug.dashboard),
            icon: LayoutDashboardIcon
          }
        ]
      },
      {
        label: 'Evaluation',
        icon: FilterIcon,
        items: [
          {
            title: 'Criteria',
            href: to(routes.portal.agencies.agencySlug.criteria),
            icon: FilterIcon
          },
          {
            title: 'Templates',
            href: to(routes.portal.agencies.agencySlug.templates),
            icon: LayoutTemplateIcon
          },
          {
            title: 'Review queue',
            href: to(routes.portal.agencies.agencySlug.reviewQueue),
            icon: FlagIcon
          }
        ]
      },
      {
        label: 'Compliance',
        icon: ShieldCheckIcon,
        items: [
          {
            title: 'Audit log',
            href: to(routes.portal.agencies.agencySlug.auditLog),
            icon: ScrollTextIcon
          },
          {
            title: 'Reports',
            href: to(routes.portal.agencies.agencySlug.reports),
            icon: Building2Icon
          }
        ]
      },
      {
        label: 'Admin',
        icon: UserCogIcon,
        items: [
          {
            title: 'Settings',
            href: to(routes.portal.agencies.agencySlug.settings),
            icon: SettingsIcon
          }
        ]
      }
    ];
  }, [activeAgencySlug]);
}

export function AppShell({
  agencies,
  activeAgencySlug,
  defaultSidebarOpen = true,
  children
}: AppShellProps): React.JSX.Element {
  const pathname = usePathname();
  const navGroups = useAgencyNav(activeAgencySlug);
  const [openGroup, setOpenGroup] = React.useState<string>('Tenders'); // Default to first group

  // Find which group contains the active item
  React.useEffect(() => {
    const activeGroup = navGroups.find(group =>
      group.items.some(item => 
        pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
    );
    if (activeGroup) {
      setOpenGroup(activeGroup.label);
    }
  }, [pathname, navGroups]);

  const toggleGroup = (groupLabel: string) => {
    setOpenGroup(openGroup === groupLabel ? '' : groupLabel);
  };

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <Sidebar collapsible="icon" className="border-r border-border/60 bg-background flex flex-col h-full">
        <SidebarHeader className="flex h-16 flex-row items-center px-4 border-b border-border/60">
          <Link 
            href={replaceAgencySlug(routes.portal.agencies.agencySlug.createTender, activeAgencySlug)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:justify-center"
          >
            <AppLogo size={32} />
            <span className="font-sketch text-xl group-data-[collapsible=icon]:hidden">
              TenderEval
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto px-3 py-6">
          <div className="space-y-2">
            {navGroups.map((group, groupIndex) => {
              const isOpen = openGroup === group.label;
              const hasActiveItem = group.items.some(item => 
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              );
              const GroupIcon = group.icon;
              
              return (
                <div key={group.label} className="space-y-1">
                  {/* Group Header - Accordion Trigger */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg transition-all duration-200 group",
                      hasActiveItem 
                        ? "bg-muted text-foreground" 
                        : "hover:bg-muted/50 text-foreground/70 hover:text-foreground",
                      "group-data-[collapsible=icon]:justify-center"
                    )}
                    title={group.label} // Tooltip when collapsed
                  >
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
                      <GroupIcon className={cn(
                        "h-4 w-4 shrink-0",
                        hasActiveItem ? "text-foreground" : "text-foreground/60"
                      )} />
                      <span className="text-xs uppercase tracking-wider font-semibold group-data-[collapsible=icon]:hidden">
                        {group.label}
                      </span>
                    </div>
                    <ChevronDownIcon 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                        isOpen ? "rotate-180" : "rotate-0"
                      )} 
                    />
                  </button>

                  {/* Group Items - Accordion Content */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-200 ease-in-out",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="space-y-1 pl-2">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "transition-all duration-200 rounded-lg py-2.5 px-3",
                                isActive 
                                  ? "bg-foreground text-background font-medium shadow-sm" 
                                  : "hover:bg-muted text-foreground/80 hover:text-foreground"
                              )}
                            >
                              <Link href={item.href} className="flex items-center gap-3">
                                <Icon className={cn(
                                  "size-4 shrink-0", 
                                  isActive ? "text-background" : "text-foreground/60"
                                )} />
                                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                                  {item.title}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section separator - not after last group */}
                  {groupIndex < navGroups.length - 1 && (
                    <div className="mx-3 my-4 h-px bg-border/40" />
                  )}
                </div>
              );
            })}
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-border/60 p-3">
          <div className="text-xs text-foreground/50 text-center group-data-[collapsible=icon]:hidden">
            TenderEval Portal
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset id="skip" className="flex flex-col size-full overflow-hidden">
        <AgencyProvider agencies={agencies} activeAgencySlug={activeAgencySlug}>
          {children}
        </AgencyProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}

