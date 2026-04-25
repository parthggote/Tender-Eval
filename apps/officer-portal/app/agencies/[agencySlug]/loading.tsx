import * as React from 'react';
import { Skeleton } from '@workspace/ui/components/skeleton';

export default function AgencyLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="h-14 border-b flex items-center gap-3 px-4">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
      {/* KPI cards skeleton */}
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4 rounded" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border p-4 space-y-4">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-2 border-b last:border-0">
                <Skeleton className="size-2 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between py-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
