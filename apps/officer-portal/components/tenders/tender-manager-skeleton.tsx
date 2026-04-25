import * as React from 'react';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function TenderManagerSkeleton() {
  return (
    <div className="flex h-full overflow-hidden pointer-events-none select-none">
      {/* Left panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Action bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>

        {/* Criteria section */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="rounded-lg border overflow-hidden">
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-3 w-8 ml-auto" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="h-1 w-24 rounded-full" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-80 shrink-0 border-l flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-md border">
              <Skeleton className="size-7 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
