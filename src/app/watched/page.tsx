'use client';

import { useOperaStore } from '@/store/useOperaStore';
import { OperaCard } from '@/components/OperaCard';
import { format } from 'date-fns';
import { Opera } from '@/types'; // Import Opera type for explicit typing if needed

export default function Watched() {
  const { operas, watched, removeFromWatched } = useOperaStore();

  // Prepare watchedOperas with full opera details
  // Ensure that entry.opera is not undefined before passing to OperaCard
  const watchedOperas = watched
    .map((w) => {
      const operaDetails = operas.find((o) => o.id === w.operaId);
      return {
        ...w,
        // opera: operaDetails, // This could be undefined
        // For safety, ensure OperaCard or rendering logic handles potentially undefined operaDetails
        // Or filter out entries where operaDetails is not found, though this might hide data issues
        opera: operaDetails!, // Using non-null assertion, assuming operaId always matches an opera in store
                              // A more robust solution would be to handle cases where operaDetails is undefined
      };
    })
    .filter(entry => entry.opera) // Filter out entries where opera details couldn't be found
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-900">Watched</h1>
      {watchedOperas.length === 0 ? (
        <p className="text-center text-gray-600">You haven&apos;t watched any operas yet</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {watchedOperas.map((entry) => (
            <div key={entry.operaId} className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-1/3">
                  {/* entry.opera is now guaranteed by the filter above */}
                  <OperaCard opera={entry.opera as Opera} /> 
                </div>
                <div className="p-6 sm:w-2/3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">
                        Watched on {format(new Date(entry.date), 'MMMM d, yyyy')}
                      </p>
                      {entry.venue && (
                        <p className="text-sm text-gray-600">at {entry.venue}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Display 5 stars for rating */}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-6 w-6 ${
                            i < entry.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                      <button
                        onClick={() => removeFromWatched(entry.operaId)} // Use operaId
                        className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-semibold"
                        title="Remove from watched"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Cast Section - check if cast exists and has members */}
                  {entry.cast && entry.cast.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">Cast</h3>
                      <ul className="mt-2 text-sm text-gray-600">
                        {entry.cast.map((member, i) => (
                          <li key={i}>
                            {member.artist} as {member.role} {/* Use artist instead of name */}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Comments Section - check if comments exist and have members */}
                  {entry.comments && entry.comments.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">Comments</h3>
                      <ul className="mt-2 space-y-2">
                        {entry.comments.map((comment) => (
                          <li key={comment.id} className="text-sm text-gray-600">
                            <p className="font-medium">{comment.author}</p>
                            <p>{comment.text}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(comment.date), 'MMM d, yyyy')}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 