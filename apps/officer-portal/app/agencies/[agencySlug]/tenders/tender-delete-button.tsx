'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2Icon } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { deleteTender } from '~/lib/internal-api';

export function TenderDeleteButton({
  tenderId,
  tenderTitle,
  agencySlug,
}: {
  tenderId: string;
  tenderTitle: string;
  agencySlug: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    try {
      await deleteTender(agencySlug, tenderId);
      toast.success('Tender deleted.');
      router.refresh();
    } catch {
      toast.error('Could not delete tender.');
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-colors"
          aria-label="Delete tender"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete tender?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <span className="font-medium">{tenderTitle}</span> and all its documents, criteria, and evaluations. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
