'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@workspace/ui/components/sonner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { ArrowRightIcon } from 'lucide-react';
import { createTender } from '~/lib/internal-api';
import { replaceTenderId, replaceAgencySlug, routes } from '@workspace/routes';

export function CreateTenderForm({ agencySlug }: { agencySlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') ?? '').trim();
    const reference = String(fd.get('reference') ?? '').trim();
    const description = String(fd.get('description') ?? '').trim();

    try {
      const tender = await createTender(agencySlug, { title, reference, description });
      router.push(
        replaceTenderId(
          replaceAgencySlug(routes.portal.agencies.agencySlug.tenders.tenderId.overview, agencySlug),
          tender.id
        )
      );
    } catch (err) {
      toast.error('Could not create tender. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="title">Tender title *</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Smart City Infrastructure 2025"
          disabled={loading}
          autoFocus
        />
      </div>
      <div className="space-y-2">
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
      <div className="space-y-2">
        <Label htmlFor="description">
          Description
          <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Brief summary of the tender requirements…"
          rows={3}
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating…' : (
          <>
            Continue to upload documents
            <ArrowRightIcon className="ml-2 size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
