import * as React from 'react';
import { Skeleton } from '@workspace/ui/components/skeleton';

export default function TendersLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b flex items-center gap-3 px-4">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-4 w-20" />
        <div className="ml-auto"><Skeleton className="h-8 w-28 rounded-md" /></div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="rounded-lg border overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
              <Skeleton className="size-8 rounded-md shrink-0" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
              <Skeleton className="h-4 w-20 hidden sm:block" />
              <Skeleton className="h-4 w-24 hidden md:block" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-md ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
