import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { replaceAgencySlug, routes } from '@workspace/routes';
import { Button } from '@workspace/ui/components/button';
import { PageHeader } from '~/components/layout/page-header';
import { CreateTenderDialog } from '~/components/tenders/create-tender-dialog';
import { TemplateBrowserDialog } from '~/components/tenders/template-browser-dialog';

export const metadata: Metadata = {
  title: 'Create Tender — TenderEval',
};

type PageProps = {
  params: Promise<{ agencySlug: string }>;
};

/** Curved arrow pointing down-left toward a card */
function ArrowDoodleLeft() {
  return (
    <svg
      width="72"
      height="64"
      viewBox="0 0 72 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -top-10 left-1/2 -translate-x-1/2 text-muted-foreground/40 pointer-events-none select-none"
      aria-hidden="true"
    >
      <path
        d="M60 6 C44 4, 18 18, 8 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      <path
        d="M8 46 L4 34 M8 46 L19 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Curved arrow pointing down-right toward a card */
function ArrowDoodleRight() {
  return (
    <svg
      width="72"
      height="64"
      viewBox="0 0 72 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -top-10 left-1/2 -translate-x-1/2 scale-x-[-1] text-muted-foreground/40 pointer-events-none select-none"
      aria-hidden="true"
    >
      <path
        d="M60 6 C44 4, 18 18, 8 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      <path
        d="M8 46 L4 34 M8 46 L19 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function CreateTenderPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { agencySlug } = await params;

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Create Tender' }]} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 overflow-auto animate-in fade-in duration-300">

        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Start a new tender</h1>
          <p className="text-sm text-muted-foreground">
            Upload your existing documents for AI-assisted evaluation, or kick off from a
            pre-built template.
          </p>
        </div>

        {/* Two option cards with doodle arrows above each */}
        <div className="flex flex-col sm:flex-row gap-8 items-stretch justify-center w-full max-w-2xl">

          {/* Upload Documents */}
          <div className="relative flex-1 max-w-xs pt-12">
            <ArrowDoodleLeft />
            <div className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-md h-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-base mb-1">Upload Documents</h2>
                <p className="text-sm text-muted-foreground">
                  Upload PDFs or DOCX files. AI will extract criteria and structure the tender automatically.
                </p>
              </div>
              <div className="mt-auto pt-2 w-full">
                <CreateTenderDialog agencySlug={agencySlug} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex sm:flex-col items-center justify-center gap-2">
            <div className="h-px w-10 bg-border sm:h-10 sm:w-px" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">or</span>
            <div className="h-px w-10 bg-border sm:h-10 sm:w-px" />
          </div>

          {/* Use a Template */}
          <div className="relative flex-1 max-w-xs pt-12">
            <ArrowDoodleRight />
            <div className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-md h-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-base mb-1">Use a Template</h2>
                <p className="text-sm text-muted-foreground">
                  Pick from pre-built evaluation templates and customise criteria to your requirements.
                </p>
              </div>
              <div className="mt-auto pt-2 w-full">
                <TemplateBrowserDialog agencySlug={agencySlug} />
              </div>
            </div>
          </div>

        </div>

        <p className="text-xs text-muted-foreground">
          View past tenders in{' '}
          <Link
            href={replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.Index, agencySlug)}
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Tender History
          </Link>
        </p>
      </div>
    </>
  );
}
