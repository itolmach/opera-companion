/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOperaStore } from '@/store/useOperaStore';
import { BookmarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Image from 'next/image';

// Reached as /opera?id=<composerId>-<workId> rather than /opera/<id>.
//
// A static export has to know every URL at build time, and a path segment
// would mean pre-rendering one HTML file per opera in the entire OpenOpus
// catalogue. A query string is invisible to the static build -- one page
// serves every opera -- and the page reads its data from the store on the
// client either way, so nothing is lost.

function OperaDetail() {
  const searchParams = useSearchParams();
  const operaId = searchParams.get('id') ?? '';
  const store = useOperaStore();
  const [opera, setOpera] = useState<any>(null);
  const isInWishlist = store.wishlist.some((w) => w.operaId === operaId);
  const watchedEntry = store.watched.find((w) => w.operaId === operaId);

  useEffect(() => {
    const foundOpera = store.operas.find((o) => o.id === operaId);
    if (foundOpera) {
      setOpera(foundOpera);
    }
  }, [store.operas, operaId]);

  if (!opera) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-64">
          <Image
            src={opera.imageUrl}
            alt={opera.title}
            fill
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
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
                    store.removeFromWishlist(operaId);
                  } else {
                    store.addToWishlist(operaId, opera.title, opera.composer);
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
                      operaId: operaId,
                      rating: 3,
                      date: new Date().toISOString(),
                      venue: '',
                      cast: [],
                      comments: [],
                      title: opera.title,
                      composer: opera.composer,
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
              {watchedEntry && watchedEntry.comments && watchedEntry.comments.length > 0 && (
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

// useSearchParams() needs a Suspense boundary, or the static build fails
// with "should be wrapped in a suspense boundary".
export default function OperaPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <OperaDetail />
    </Suspense>
  );
}
