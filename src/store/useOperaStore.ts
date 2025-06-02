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
  userWatchedListLoaded: boolean;
  initialDataLoadAttempted: boolean;
  setSearchQuery: (query: string) => void;
  searchOperas: (query: string) => void;
  loadInitialData: () => Promise<void>;
  loadUserWishlist: () => Promise<void>;
  addToWishlist: (operaId: string) => Promise<void>;
  removeFromWishlist: (operaId: string) => Promise<void>;
  loadUserWatchedList: () => Promise<void>;
  addToWatched: (watchedItemData: Omit<WatchedOpera, 'id' | 'userId' | 'user'>) => Promise<void>;
  removeFromWatched: (operaId: string) => Promise<void>;
  addComment: (operaId: string, comment: { text: string; author: string }) => Promise<void>;
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
      userWatchedListLoaded: false,
      initialDataLoadAttempted: false,
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
        if (get().initialDataLoadAttempted && !get().error) {
          return;
        }
        set({ isLoading: true, error: null, initialDataLoadAttempted: true });
        try {
          console.log('[useOperaStore] Attempting to load initial data from /data/all_operas.json');
          const response = await fetch('/data/all_operas.json');
          if (!response.ok) {
            throw new Error(`Failed to fetch local opera data: ${response.statusText} (status: ${response.status})`);
          }
          const operasData: Opera[] = await response.json();
          console.log(`[useOperaStore] Successfully fetched initial data. Number of operas: ${operasData.length}`);
          set({ allWorks: operasData, operas: operasData, isLoading: false, error: null });
        } catch (error) {
          console.error('[useOperaStore] Failed to load initial opera data:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to load data'), isLoading: false });
        }
      },
      loadUserWishlist: async () => {
        if (get().userWishlistLoaded && !get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/wishlist');
          if (!response.ok) {
            if (response.status === 401) {
              console.log('User not authenticated, cannot load wishlist.');
              set({ isLoading: false, userWishlistLoaded: false, wishlist: [] });
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
      loadUserWatchedList: async () => {
        if (get().userWatchedListLoaded && !get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/watched');
          if (!response.ok) {
            if (response.status === 401) {
              console.log('User not authenticated, cannot load watched list.');
              set({ isLoading: false, userWatchedListLoaded: false, watched: [] });
              return;
            }
            throw new Error('Failed to fetch user watched list');
          }
          const userWatchedList: WatchedOpera[] = await response.json();
          set({ watched: userWatchedList, userWatchedListLoaded: true, isLoading: false });
        } catch (error) {
          console.error('Error loading user watched list:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to load watched list'), isLoading: false, userWatchedListLoaded: false });
        }
      },
      addToWatched: async (watchedItemData) => {
        try {
          const payload = {
            ...watchedItemData,
            date: new Date(watchedItemData.date).toISOString(),
          };
          const response = await fetch('/api/watched', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to add to watched list on server' }));
            throw new Error(errorData.message || 'Failed to add to watched list on server');
          }
          const newWatchedItem: WatchedOpera = await response.json();
          set((state) => ({
            watched: [...state.watched.filter(item => item.operaId !== newWatchedItem.operaId), newWatchedItem],
          }));
        } catch (error) {
          console.error('Error adding to watched list:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to add item to watched list') });
        }
      },
      removeFromWatched: async (operaIdToRemove) => {
        try {
          const response = await fetch(`/api/watched?operaId=${operaIdToRemove}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error('Failed to remove from watched list on server');
          }
          set((state) => ({
            watched: state.watched.filter((item) => item.operaId !== operaIdToRemove),
          }));
        } catch (error) {
          console.error('Error removing from watched list:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to remove item from watched list') });
        }
      },
      addComment: async (operaIdToComment, comment) => {
        const watchedEntry = get().watched.find(item => item.operaId === operaIdToComment);
        if (!watchedEntry || !watchedEntry.id) {
          console.error('Cannot add comment: Watched entry or its DB ID not found locally.');
          set({ error: 'Cannot add comment: Watched entry not found.'});
          return;
        }

        const newComment = {
            id: crypto.randomUUID(),
            ...comment,
            date: new Date().toISOString(),
        };
        set(state => ({
            watched: state.watched.map(item =>
                item.id === watchedEntry.id
                    ? { ...item, comments: [...(item.comments || []), newComment] }
                    : item
            ),
        })); 

        try {
            const updatedComments = [...(watchedEntry.comments || []), newComment];
            const response = await fetch('/api/watched', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...watchedEntry, comments: updatedComments }), 
            });

            if (!response.ok) {
                set(state => ({
                    watched: state.watched.map(item =>
                        item.id === watchedEntry.id
                            ? { ...item, comments: watchedEntry.comments || [] }
                            : item
                    ),
                    error: 'Failed to save comment to server.'
                }));
                throw new Error('Failed to save comment to server');
            }
            const savedWatchedItem: WatchedOpera = await response.json();
            set(state => ({
                watched: state.watched.map(item => item.id === savedWatchedItem.id ? savedWatchedItem : item),
            }));

        } catch (error) {
            console.error('Error saving comment:', error);
            if (!(error instanceof Error && get().error === 'Failed to save comment to server.')){
                set({ error: (error instanceof Error ? error.message : 'Could not save comment') });
            }
        }
      },
      clearUserSessionData: () => {
        set({
          wishlist: [],
          watched: [],
          userWishlistLoaded: false,
          userWatchedListLoaded: false,
        });
      },
    }),
    {
      name: 'opera-storage',
      partialize: (state) => ({
        allWorks: state.allWorks,
        operas: state.operas,
        searchQuery: state.searchQuery,
        wishlist: state.wishlist,
        watched: state.watched,
        initialDataLoadAttempted: state.initialDataLoadAttempted,
      }),
    }
  )
); 