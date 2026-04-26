'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@workspace/ui/components/sonner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@workspace/ui/components/dialog';
import { replaceTenderId, replaceAgencySlug, routes } from '@workspace/routes';
import { createTender } from '~/lib/internal-api';

/** Curved arrow pointing down-left toward a card */
function ArrowDoodleLeft() {
  return (
    <svg width="72" height="64" viewBox="0 0 72 64" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -top-10 left-1/2 -translate-x-1/2 text-muted-foreground/40 pointer-events-none select-none"
      aria-hidden="true"
    >
      <path d="M60 6 C44 4, 18 18, 8 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      <path d="M8 46 L4 34 M8 46 L19 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowDoodleRight() {
  return (
    <svg width="72" height="64" viewBox="0 0 72 64" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -top-10 left-1/2 -translate-x-1/2 scale-x-[-1] text-muted-foreground/40 pointer-events-none select-none"
      aria-hidden="true"
    >
      <path d="M60 6 C44 4, 18 18, 8 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      <path d="M8 46 L4 34 M8 46 L19 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type Mode = 'upload' | 'template';

export function CreateTenderCards({ agencySlug }: { agencySlug: string }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mode) return;
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') ?? '').trim();
    const reference = String(fd.get('reference') ?? '').trim();

    try {
      const tender = await createTender(agencySlug, { title, reference });
      // Pass setup intent as query param so overview skips the dialog
      router.push(
        replaceTenderId(
          replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.tenderId.overview, agencySlug),
          tender.id
        ) + `?setup=${mode}`
      );
    } catch {
      toast.error('Could not create tender. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      {/* Two option cards */}
      <div className="flex flex-col sm:flex-row gap-8 items-stretch justify-center w-full max-w-2xl">

        {/* Upload Documents */}
        <div className="relative flex-1 max-w-xs pt-12">
          <ArrowDoodleLeft />
          <button
            type="button"
            onClick={() => setMode('upload')}
            className="group w-full flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-md h-full cursor-pointer"
          >
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
          </button>
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
          <button
            type="button"
            onClick={() => setMode('template')}
            className="group w-full flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-md h-full cursor-pointer"
          >
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
          </button>
        </div>
      </div>

      {/* Name dialog — shown after picking a card */}
      <Dialog open={mode !== null} onOpenChange={(open) => { if (!open && !loading) setMode(null); }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (loading) e.preventDefault(); }}>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Name your tender</DialogTitle>
              <DialogDescription>
                {mode === 'upload'
                  ? "You'll upload documents on the next screen."
                  : "You'll choose a template on the next screen."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  autoFocus
                  placeholder="e.g. Smart City Infrastructure 2025"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">
                  Reference number
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="reference"
                  name="reference"
                  placeholder="e.g. TND-2025-001"
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setMode(null)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Continue →'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
