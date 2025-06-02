import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Opera, WatchedOpera, WishlistOpera } from '../types/opera';
import * as api from '../lib/api';

interface OperaStore {
  operas: Opera[];
  watched: WatchedOpera[];
  wishlist: WishlistOpera[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  searchOperas: (query: string) => Promise<void>;
  loadPopularOperas: () => Promise<void>;
  addToWishlist: (operaId: string) => void;
  removeFromWishlist: (operaId: string) => void;
  addToWatched: (watched: Omit<WatchedOpera, 'id'>) => void;
  removeFromWatched: (id: string) => void;
  addComment: (watchedId: string, comment: { text: string; author: string }) => void;
}

export const useOperaStore = create<OperaStore>()(
  persist(
    (set, get) => ({
      operas: [],
      watched: [],
      wishlist: [],
      searchQuery: '',
      isLoading: false,
      error: null,
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchOperas: async (query) => {
        set({ isLoading: true, error: null });
        try {
          const results = await api.searchOperas(query);
          const operas = results.map((result: any) => ({
            id: `${result.composer.id}-${result.work.id}`,
            title: result.work.title,
            composer: result.composer.name,
            synopsis: result.work.subtitle || '',
            firstPerformance: {
              date: result.work.year || '',
              place: result.work.premiere || '',
            },
            imageUrl: result.composer.portrait || '/images/placeholder.jpg',
          }));
          set({ operas, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to search operas', isLoading: false });
        }
      },
      loadPopularOperas: async () => {
        set({ isLoading: true, error: null });
        try {
          const works = await api.getPopularOperas();
          const operas = works.map((work: any) => ({
            id: `${work.composer.id}-${work.id}`,
            title: work.title,
            composer: work.composer.complete_name || work.composer.name,
            synopsis: work.subtitle || '',
            firstPerformance: {
              date: work.year || '',
              place: work.premiere || '',
            },
            imageUrl: `/images/${work.composer.id}.jpg`,
          }));
          set({ operas, isLoading: false });
        } catch (error) {
          console.error('Failed to load popular operas:', error);
          set({ error: 'Failed to load popular operas', isLoading: false });
        }
      },
      addToWishlist: (operaId) =>
        set((state) => ({
          wishlist: [
            ...state.wishlist,
            { id: crypto.randomUUID(), operaId, addedDate: new Date().toISOString() },
          ],
        })),
      removeFromWishlist: (operaId) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.operaId !== operaId),
        })),
      addToWatched: (watched) =>
        set((state) => ({
          watched: [...state.watched, { ...watched, id: crypto.randomUUID() }],
        })),
      removeFromWatched: (id) =>
        set((state) => ({
          watched: state.watched.filter((item) => item.id !== id),
        })),
      addComment: (watchedId, comment) =>
        set((state) => ({
          watched: state.watched.map((item) =>
            item.id === watchedId
              ? {
                  ...item,
                  comments: [
                    ...item.comments,
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
    }
  )
); 