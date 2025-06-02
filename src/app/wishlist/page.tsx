'use client';

import { useOperaStore } from '@/store/useOperaStore';
import { OperaCard } from '@/components/OperaCard';

export default function Wishlist() {
  const { operas, wishlist } = useOperaStore();
  const wishlistOperas = operas.filter((opera) =>
    wishlist.some((w) => w.operaId === opera.id)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-900">Wishlist</h1>
      {wishlistOperas.length === 0 ? (
        <p className="text-center text-gray-600">Your wishlist is empty</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistOperas.map((opera) => (
            <OperaCard key={opera.id} opera={opera} />
          ))}
        </div>
      )}
    </div>
  );
} 