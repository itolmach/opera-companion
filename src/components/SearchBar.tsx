import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useOperaStore } from '../store/useOperaStore';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useOperaStore();

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Search for an opera"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
} 