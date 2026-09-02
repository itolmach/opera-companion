import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Opera, WatchedOpera, WishlistOpera } from '@/types';
import * as api from '@/lib/supabase/data';

// Signed-out is an ordinary state here, not an error worth showing: the
// wishlist and watched list simply stay empty until someone logs in.
function isNotSignedIn(error: unknown): boolean {
  return error instanceof Error && error.message === 'Not signed in';
}

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
  searchOperas: (query: string) => Promise<void>;
  loadInitialData: () => Promise<void>;
  loadUserWishlist: () => Promise<void>;
  addToWishlist: (operaId: string, title?: string, composer?: string) => Promise<void>;
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
      searchOperas: async (query) => {
        const { allWorks, initialDataLoadAttempted, loadInitialData } = get();
        
        if (!initialDataLoadAttempted || allWorks.length === 0) {
          set({ isLoading: true });
          await loadInitialData();
          const updatedAllWorks = get().allWorks;
          if (get().error) {
            set({ operas: [], isLoading: false });
            return;
          }
          if (!query && updatedAllWorks.length > 0) {
            set({ operas: [], isLoading: false });
            return;
          }
          set({
            operas: updatedAllWorks.filter((opera) =>
              opera.title.toLowerCase().includes(query.toLowerCase()) ||
              (opera.composer && opera.composer.toLowerCase().includes(query.toLowerCase()))
            ),
            isLoading: false,
          });
        } else {
          if (!query) {
            set({ operas: [] });
          } else {
            set({
              operas: allWorks.filter((opera) =>
                opera.title.toLowerCase().includes(query.toLowerCase()) ||
                (opera.composer && opera.composer.toLowerCase().includes(query.toLowerCase()))
              ),
            });
          }
        }
      },
      loadInitialData: async () => {
        if (get().initialDataLoadAttempted && get().allWorks.length > 0 && !get().error) {
          return;
        }
        set({ isLoading: true, error: null, initialDataLoadAttempted: true });
        try {
          // Base-path aware: under a preview the catalogue lives at
          // /<repo>/<branch>/data/all_operas.json, and fetch() does not get
          // Next's basePath prepended for it the way next/link would.
          const dataUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/all_operas.json`;
          console.log(`[useOperaStore] Attempting to load initial data from ${dataUrl}`);
          const response = await fetch(dataUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch local opera data: ${response.statusText} (status: ${response.status})`);
          }
          const operasData: Opera[] = await response.json();
          console.log(`[useOperaStore] Successfully fetched initial data. Number of operas: ${operasData.length}`);
          set({ allWorks: operasData, isLoading: false, error: null });
        } catch (error) {
          console.error('[useOperaStore] Failed to load initial opera data:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to load data'), isLoading: false, allWorks: [] });
        }
      },
      loadUserWishlist: async () => {
        if (get().userWishlistLoaded && !get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const userWishlist = await api.fetchWishlist();
          set({ wishlist: userWishlist, userWishlistLoaded: true, isLoading: false });
        } catch (error) {
          if (isNotSignedIn(error)) {
            set({ isLoading: false, userWishlistLoaded: false, wishlist: [] });
            return;
          }
          console.error('Error loading user wishlist:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to load wishlist'), isLoading: false, userWishlistLoaded: false });
        }
      },
      addToWishlist: async (operaIdToAdd, title, composer) => {
        try {
          const newWishlistItem = await api.addToWishlist(operaIdToAdd, title, composer);
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
          await api.removeFromWishlist(operaIdToRemove);
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
          const userWatchedList = await api.fetchWatched();
          set({ watched: userWatchedList, userWatchedListLoaded: true, isLoading: false });
        } catch (error) {
          if (isNotSignedIn(error)) {
            set({ isLoading: false, userWatchedListLoaded: false, watched: [] });
            return;
          }
          console.error('Error loading user watched list:', error);
          set({ error: (error instanceof Error ? error.message : 'Failed to load watched list'), isLoading: false, userWatchedListLoaded: false });
        }
      },
      addToWatched: async (watchedItemData) => {
        try {
          const newWatchedItem = await api.saveWatched({
            ...watchedItemData,
            date: new Date(watchedItemData.date).toISOString(),
          });
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
          await api.removeFromWatched(operaIdToRemove);
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
            const savedWatchedItem = await api.saveWatched({ ...watchedEntry, comments: updatedComments });
            set(state => ({
                watched: state.watched.map(item => item.id === savedWatchedItem.id ? savedWatchedItem : item),
            }));
        } catch (error) {
            // Put the optimistic comment back the way it was before failing.
            console.error('Error saving comment:', error);
            set(state => ({
                watched: state.watched.map(item =>
                    item.id === watchedEntry.id
                        ? { ...item, comments: watchedEntry.comments || [] }
                        : item
                ),
                error: (error instanceof Error ? error.message : 'Could not save comment'),
            }));
        }
      },
      clearUserSessionData: () => {
        set({
          wishlist: [],
          watched: [],
          userWishlistLoaded: false,
          userWatchedListLoaded: false,
          operas: [],
        });
      },
    }),
    {
      name: 'opera-storage',
      partialize: (state) => ({
        allWorks: state.allWorks,
        searchQuery: state.searchQuery,
        wishlist: state.wishlist,
        watched: state.watched,
        initialDataLoadAttempted: state.initialDataLoadAttempted,
      }),
    }
  )
); 