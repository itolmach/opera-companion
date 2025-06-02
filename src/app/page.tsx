'use client';

import { useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { OperaCard } from '@/components/OperaCard';
import { useOperaStore } from '@/store/useOperaStore';

export default function Home() {
  const { operas, searchQuery, isLoading, error, searchOperas, loadPopularOperas } = useOperaStore();

  useEffect(() => {
    if (searchQuery) {
      searchOperas(searchQuery);
    } else {
      loadPopularOperas();
    }
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-900">
        {searchQuery ? 'Search Results' : 'Popular Operas'}
      </h1>
      <SearchBar />
      {isLoading && (
        <div className="text-center text-gray-600">Loading...</div>
      )}
      {error && (
        <div className="text-center text-red-600">{error}</div>
      )}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {operas.map((opera) => (
            <OperaCard key={opera.id} opera={opera} />
          ))}
        </div>
      )}
    </div>
  );
}
