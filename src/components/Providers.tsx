'use client';

import { useEffect } from 'react';
import { useOperaStore } from '../store/useOperaStore';
import { sampleOperas } from '../lib/sample-data';

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useOperaStore();

  useEffect(() => {
    if (store.operas.length === 0) {
      store.operas = sampleOperas;
    }
  }, [store]);

  return <>{children}</>;
} 