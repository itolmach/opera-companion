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
  userWishlistLoaded: boolean;
  setSearchQuery: (query: string) => void;
  searchOperas: (query: string) => void;
  loadInitialData: () => Promise<void>;
  loadUserWishlist: () => Promise<void>;
  addToWishlist: (operaId: string) => Promise<void>;
  removeFromWishlist: (operaId: string) => Promise<void>;
  addToWatched: (watched: Omit<WatchedOpera, 'operaId'> & { operaId: string }) => void;
  removeFromWatched: (operaId: string) => void;
  addComment: (operaId: string, comment: { text: string; author: string }) => void;
  clearUserSessionData: () => void;
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
      userWishlistLoaded: false,
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
        if (get().allWorks.length > 0 && !get().isLoading) {
          set({ operas: get().allWorks, isLoading: false });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/data/all_operas.json');
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
      loadUserWishlist: async () => {
        if (get().userWishlistLoaded) return;
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/wishlist');
          if (!response.ok) {
            if (response.status === 401) {
              console.log('User not authenticated, cannot load wishlist.');
              set({ isLoading: false, userWishlistLoaded: false });
              return;
            }
            throw new Error('Failed to fetch user wishlist');
          }
          const userWishlist: WishlistOpera[] = await response.json();
          set({ wishlist: userWishlist, userWishlistLoaded: true, isLoading: false });
        } catch (error) {
          console.error('Error loading user wishlist:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to load wishlist'), isLoading: false, userWishlistLoaded: false });
        }
      },
      addToWishlist: async (operaIdToAdd) => {
        try {
          const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operaId: operaIdToAdd }),
          });
          if (!response.ok) {
            throw new Error('Failed to add to wishlist on server');
          }
          const newWishlistItem: WishlistOpera = await response.json();
          set((state) => ({
            wishlist: [...state.wishlist.filter(item => item.operaId !== operaIdToAdd), newWishlistItem],
          }));
        } catch (error) {
          console.error('Error adding to wishlist:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to add item') });
        }
      },
      removeFromWishlist: async (operaIdToRemove) => {
        try {
          const response = await fetch(`/api/wishlist?operaId=${operaIdToRemove}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error('Failed to remove from wishlist on server');
          }
          set((state) => ({
            wishlist: state.wishlist.filter((item) => item.operaId !== operaIdToRemove),
          }));
        } catch (error) {
          console.error('Error removing from wishlist:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to remove item') });
        }
      },
      clearUserSessionData: () => {
        set({
          wishlist: [],
          watched: [],
          userWishlistLoaded: false,
        });
      },
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
      partialize: (state) => ({
        allWorks: state.allWorks,
        operas: state.operas,
        searchQuery: state.searchQuery,
        wishlist: state.wishlist,
        watched: state.watched,
      }),
    }
  )
); 