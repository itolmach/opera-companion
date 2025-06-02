import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Opera, WatchedOpera, WishlistOpera } from '@/types';
// import * as api from '../lib/api'; // We'll fetch local data now

interface OperaStore {
  allWorks: Opera[];
  operas: Opera[];
  watched: WatchedOpera[];
  wishlist: WishlistOpera[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  searchOperas: (query: string) => void;
  loadInitialData: () => Promise<void>; // Renamed from loadPopularOperas
  addToWishlist: (operaId: string) => void;
  removeFromWishlist: (operaId: string) => void;
  addToWatched: (watched: Omit<WatchedOpera, 'operaId'> & { operaId: string }) => void;
  removeFromWatched: (operaId: string) => void;
  addComment: (operaId: string, comment: { text: string; author: string }) => void;
}

export const useOperaStore = create<OperaStore>()(
  persist(
    (set, get) => ({
      allWorks: [],
      operas: [],
      watched: [],
      wishlist: [],
      searchQuery: '',
      isLoading: false,
      error: null,
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().searchOperas(query);
      },
      searchOperas: (query) => {
        if (!query) {
          set((state) => ({ operas: state.allWorks }));
        } else {
          set((state) => ({
            operas: state.allWorks.filter((opera) =>
              opera.title.toLowerCase().includes(query.toLowerCase()) ||
              (opera.composer && opera.composer.toLowerCase().includes(query.toLowerCase()))
            ),
          }));
        }
      },
      loadInitialData: async () => {
        if (get().allWorks.length > 0) {
          // Data already loaded or rehydrated from persistence
          set({ operas: get().allWorks, isLoading: false });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/data/all_operas.json'); // Fetch local JSON
          if (!response.ok) {
            throw new Error(`Failed to fetch local opera data: ${response.statusText}`);
          }
          const operasData: Opera[] = await response.json();
          set({ allWorks: operasData, operas: operasData, isLoading: false });
        } catch (error) {
          console.error('Failed to load initial opera data:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to load data'), isLoading: false });
        }
      },
      addToWishlist: (operaIdToAdd) =>
        set((state) => ({
          wishlist: [
            ...state.wishlist,
            { operaId: operaIdToAdd }, 
          ],
        })),
      removeFromWishlist: (operaIdToRemove) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.operaId !== operaIdToRemove),
        })),
      addToWatched: (watchedItem) =>
        set((state) => ({
          watched: [...state.watched, watchedItem], 
        })),
      removeFromWatched: (operaIdToRemove) =>
        set((state) => ({
          watched: state.watched.filter((item) => item.operaId !== operaIdToRemove),
        })),
      addComment: (operaIdToComment, comment) =>
        set((state) => ({
          watched: state.watched.map((item) =>
            item.operaId === operaIdToComment
              ? {
                  ...item,
                  comments: [
                    ...(item.comments || []),
                    {
                      id: crypto.randomUUID(),
                      ...comment,
                      date: new Date().toISOString(),
                    },
                  ],
                }
              : item
          ),
        })),
    }),
    {
      name: 'opera-storage',
      // By default, all top-level state is persisted. 
      // We might want to only persist user-specific data like 'watched' and 'wishlist' 
      // and not 'allWorks' or 'operas' if they are always reloaded from the JSON.
      // partialize: (state) => ({ watched: state.watched, wishlist: state.wishlist, searchQuery: state.searchQuery }),
    }
  )
); 