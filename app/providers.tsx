'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
      }}
    >
      {children}
    </DynamicContextProvider>
  );
} 