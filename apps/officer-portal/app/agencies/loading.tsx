import * as React from 'react';
import { Building2Icon } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';

export default function AgenciesLoading(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-2xl p-8 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="border rounded-lg overflow-hidden divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="size-4 rounded" />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-6">
        Connecting to server…
      </p>
    </main>
  );
}
