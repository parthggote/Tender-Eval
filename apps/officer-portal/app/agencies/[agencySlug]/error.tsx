'use client';

import * as React from 'react';
import { Button } from '@workspace/ui/components/button';
import { AlertCircleIcon } from 'lucide-react';

export default function AgencyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircleIcon className="size-6 text-destructive" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <Button size="sm" onClick={reset}>Try again</Button>
    </div>
  );
}
