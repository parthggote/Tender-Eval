'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { createTender } from '~/lib/internal-api';

export function CreateTenderDialog({ agencySlug }: { agencySlug: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const reference = formData.get('reference') as string;
    const description = formData.get('description') as string;

    try {
      await createTender(agencySlug, { title, reference, description });
      setOpen(false);
      router.refresh();
      toast.success('Tender created successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Could not create tender. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          Create tender
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => { if (loading) e.preventDefault(); }}
      >
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create tender</DialogTitle>
            <DialogDescription>
              Add a new procurement tender to this agency workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="e.g. Smart City Infrastructure 2025" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Reference number</Label>
              <Input id="reference" name="reference" placeholder="e.g. TND-2025-001" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief summary of the tender requirements…" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create tender'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
