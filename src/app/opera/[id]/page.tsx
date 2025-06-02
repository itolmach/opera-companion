'use client';

import { useOperaStore } from '@/store/useOperaStore';
import Image from 'next/image';
import { BookmarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function OperaDetails({ params }: { params: { id: string } }) {
  const store = useOperaStore();
  const opera = store.operas.find((o) => o.id === params.id);
  const isInWishlist = store.wishlist.some((w) => w.operaId === params.id);
  const watchedEntry = store.watched.find((w) => w.operaId === params.id);

  if (!opera) {
    return <div>Opera not found</div>;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="relative h-64 sm:h-96">
        <Image
          src={opera.imageUrl}
          alt={opera.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{opera.title}</h1>
            <p className="text-xl text-gray-600">{opera.composer}</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                if (isInWishlist) {
                  store.removeFromWishlist(params.id);
                } else {
                  store.addToWishlist(params.id);
                }
              }}
              className={`p-2 rounded-full ${
                isInWishlist
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <BookmarkIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => {
                if (!watchedEntry) {
                  store.addToWatched({
                    operaId: params.id,
                    rating: 3,
                    date: new Date().toISOString(),
                    venue: '',
                    cast: [],
                    comments: [],
                  });
                }
              }}
              className={`p-2 rounded-full ${
                watchedEntry
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CheckCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900">Synopsis</h2>
          <p className="mt-2 text-gray-600">{opera.synopsis}</p>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900">First Performance</h2>
          <p className="mt-2 text-gray-600">
            {format(new Date(opera.firstPerformance.date), 'MMMM d, yyyy')} at{' '}
            {opera.firstPerformance.place}
          </p>
        </div>
        {watchedEntry && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Experience</h2>
            <div className="mt-2">
              <p className="text-gray-600">
                Watched on {format(new Date(watchedEntry.date), 'MMMM d, yyyy')}
              </p>
              <div className="mt-2 flex">
                {Array.from({ length: 3 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      store.addToWatched({
                        ...watchedEntry,
                        rating: (i + 1) as 1 | 2 | 3,
                      });
                    }}
                    className={`h-6 w-6 mr-1 ${
                      i < watchedEntry.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 