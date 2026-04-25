'use client';

import * as React from 'react';
import type { AgencyWorkspace } from '@workspace/dtos';

type AgencyContextValue = {
  agencies: AgencyWorkspace[];
  activeAgencySlug: string;
};

const AgencyContext = React.createContext<AgencyContextValue | null>(null);

export function AgencyProvider({
  agencies,
  activeAgencySlug,
  children,
}: React.PropsWithChildren<AgencyContextValue>) {
  return (
    <AgencyContext value={{ agencies, activeAgencySlug }}>
      {children}
    </AgencyContext>
  );
}

export function useAgencyContext(): AgencyContextValue | null {
  return React.useContext(AgencyContext);
}
