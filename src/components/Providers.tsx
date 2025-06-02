'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOperaStore } from '../store/useOperaStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useOperaStore();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.id && !store.userWishlistLoaded) {
        console.log('Providers: User authenticated, loading wishlist...');
        store.loadUserWishlist();
      }
    } else if (status === 'unauthenticated') {
      if (store.userWishlistLoaded) {
        console.log('Providers: User unauthenticated, clearing session data...');
        store.clearUserSessionData();
      }
    }
  }, [status, session, store]);

  return <>{children}</>;
} 