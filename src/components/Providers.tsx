'use client';

import { useEffect } from 'react';
import { useUser } from '@/lib/supabase/useUser';
import { useOperaStore } from '../store/useOperaStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useOperaStore();
  const { status } = useUser();

  useEffect(() => {
    if (status === 'authenticated') {
      if (!store.userWishlistLoaded) {
        store.loadUserWishlist();
      }
      if (!store.userWatchedListLoaded) {
        store.loadUserWatchedList();
      }
    } else if (status === 'unauthenticated') {
      if (store.userWishlistLoaded || store.userWatchedListLoaded) {
        store.clearUserSessionData();
      }
    }
  }, [status, store]);

  return <>{children}</>;
}
