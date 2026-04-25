// Convention:
// - Everything lowercase is an object
// - Everything uppercase is a string (the route)

import { keys } from '../keys';

export const baseUrl = {
  Portal: keys().NEXT_PUBLIC_PORTAL_URL,
  InternalApi: keys().NEXT_PUBLIC_INTERNAL_API_URL
} as const;

export const routes = {
  portal: {
    Index: `${baseUrl.Portal}/`,
    auth: {
      SignIn: `${baseUrl.Portal}/auth/sign-in`
    },
    agencies: {
      Index: `${baseUrl.Portal}/agencies`,
      agencySlug: {
        Index: `${baseUrl.Portal}/agencies/[agencySlug]`,
        dashboard: `${baseUrl.Portal}/agencies/[agencySlug]/dashboard`,
        createTender: `${baseUrl.Portal}/agencies/[agencySlug]/create-tender`,
        tenders: {
          Index: `${baseUrl.Portal}/agencies/[agencySlug]/tenders`,
          tenderId: {
            Index: `${baseUrl.Portal}/agencies/[agencySlug]/tenders/[tenderId]`,
            overview: `${baseUrl.Portal}/agencies/[agencySlug]/tenders/[tenderId]/overview`,
            documents: `${baseUrl.Portal}/agencies/[agencySlug]/tenders/[tenderId]/documents`,
            criteria: `${baseUrl.Portal}/agencies/[agencySlug]/tenders/[tenderId]/criteria`,
            bidders: {
              Index: `${baseUrl.Portal}/agencies/[agencySlug]/tenders/[tenderId]/bidders`,
              bidderId: `${baseUrl.Portal}/agencies/[agencySlug]/tenders/[tenderId]/bidders/[bidderId]`
            }
          }
        },
        criteria: `${baseUrl.Portal}/agencies/[agencySlug]/criteria`,
        criteriaDetail: `${baseUrl.Portal}/agencies/[agencySlug]/criteria/[tenderId]`,
        templates: `${baseUrl.Portal}/agencies/[agencySlug]/templates`,
        templateDetail: `${baseUrl.Portal}/agencies/[agencySlug]/templates/[templateId]`,
        bidders: {
          bidderId: `${baseUrl.Portal}/agencies/[agencySlug]/bidders/[bidderId]`
        },
        reviewQueue: `${baseUrl.Portal}/agencies/[agencySlug]/review-queue`,
        auditLog: `${baseUrl.Portal}/agencies/[agencySlug]/audit-log`,
        auditLogDetail: `${baseUrl.Portal}/agencies/[agencySlug]/audit-log/[tenderId]`,
        reports: `${baseUrl.Portal}/agencies/[agencySlug]/reports`,
        settings: `${baseUrl.Portal}/agencies/[agencySlug]/settings`
      }
    }
  },
  internalApi: {
    v1: `${baseUrl.InternalApi}/api/v1`
  }
} as const;

export function getPathname(route: string, base: string): string {
  return new URL(route, base).pathname;
}

export function replaceAgencySlug(route: string, agencySlug: string): string {
  if (!route.includes('[agencySlug]')) {
    throw new Error(
      `Invalid route: ${route}. Route must contain the placeholder [agencySlug].`
    );
  }
  return route.replace('[agencySlug]', agencySlug);
}

export function replaceTenderId(route: string, tenderId: string): string {
  if (!route.includes('[tenderId]')) {
    throw new Error(
      `Invalid route: ${route}. Route must contain the placeholder [tenderId].`
    );
  }
  return route.replace('[tenderId]', tenderId);
}

export function replaceBidderId(route: string, bidderId: string): string {
  if (!route.includes('[bidderId]')) {
    throw new Error(
      `Invalid route: ${route}. Route must contain the placeholder [bidderId].`
    );
  }
  return route.replace('[bidderId]', bidderId);
}

