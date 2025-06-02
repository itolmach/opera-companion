/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useOperaStore } from '@/store/useOperaStore';
import { BookmarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function OperaPage(props: any) {
  const params = props.params;
  const store = useOperaStore();
  const [opera, setOpera] = useState<any>(null);
  const isInWishlist = store.wishlist.some((w) => w.operaId === params.id);
  const watchedEntry = store.watched.find((w) => w.operaId === params.id);

  useEffect(() => {
    const foundOpera = store.operas.find((o) => o.id === params.id);
    if (foundOpera) {
      setOpera(foundOpera);
    }
  }, [store.operas, params.id]);

  if (!opera) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-64">
          <img
            src={opera.imageUrl}
            alt={opera.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{opera.title}</h1>
              <h2 className="text-xl text-gray-600 mb-4">by {opera.composer}</h2>
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
          
          <div className="mb-6 mt-6">
            <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
            <p className="text-gray-700">{opera.synopsis || 'No synopsis available.'}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">First Performance</h3>
            <p className="text-gray-700">
              {opera.firstPerformance?.date && opera.firstPerformance?.place ? (
                <>
                  {opera.firstPerformance.date} at {opera.firstPerformance.place}
                </>
              ) : (
                'First performance details not available.'
              )}
            </p>
          </div>

          {watchedEntry && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Your Experience</h3>
              <p className="text-gray-700">
                Watched on {format(new Date(watchedEntry.date), 'MMMM d, yyyy')}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-yellow-400 text-xl">
                  {'★'.repeat(watchedEntry.rating)}
                  {'☆'.repeat(5 - watchedEntry.rating)}
                </span>
              </div>
              {watchedEntry.comments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">Comments:</h4>
                  <ul className="mt-2 space-y-2">
                    {watchedEntry.comments.map((comment) => (
                      <li key={comment.id} className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-700">{comment.text}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          - {comment.author}, {format(new Date(comment.date), 'MMM d, yyyy')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 