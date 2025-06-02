'use client';

import { useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { OperaCard } from '@/components/OperaCard';
import { useOperaStore } from '@/store/useOperaStore';

export default function Home() {
  const { operas, searchQuery, isLoading, error, searchOperas, loadInitialData, allWorks } = useOperaStore();

  useEffect(() => {
    if (allWorks.length === 0 && !isLoading) {
      loadInitialData();
    }
    if (searchQuery && allWorks.length > 0) {
      searchOperas(searchQuery);
    } else if (!searchQuery && allWorks.length > 0) {
      searchOperas('');
    }
  }, [searchQuery, loadInitialData, searchOperas, allWorks, isLoading]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-900">
        {searchQuery ? 'Search Results' : 'All Operas'}
      </h1>
      <SearchBar />
      {isLoading && allWorks.length === 0 && (
        <div className="text-center text-gray-600">Loading opera data...</div>
      )}
      {error && (
        <div className="text-center text-red-600">Error: {error}</div>
      )}
      {!isLoading && operas.length === 0 && searchQuery && (
         <div className="text-center text-gray-600">No operas found for &quot;{searchQuery}&quot;.</div>
      )}
      {!isLoading && operas.length === 0 && !searchQuery && allWorks.length > 0 && (
         <div className="text-center text-gray-600">No operas available.</div>
      )}
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {operas.map((opera) => (
          <OperaCard key={opera.id} opera={opera} />
        ))}
      </div>
    </div>
  );
}
