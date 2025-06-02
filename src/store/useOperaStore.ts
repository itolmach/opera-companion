import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Opera, WatchedOpera, WishlistOpera } from '../types/opera';
import * as api from '../lib/api';

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
              opera.composer.toLowerCase().includes(query.toLowerCase())
            ),
          }));
        }
      },
      loadPopularOperas: async () => {
        set({ isLoading: true, error: null });
        try {
          const works = await api.getPopularOperas();
          const operas = works.map((work: any) => ({
            id: `${work.composer.id}-${work.id}`,
            title: work.title || 'Untitled',
            composer: work.composer.complete_name || work.composer.name || 'Unknown',
            synopsis: work.subtitle || '',
            firstPerformance: {
              date: work.year || '',
              place: work.premiere || '',
            },
            imageUrl: work.composer.portrait || '/images/placeholder.jpg',
          }));
          set({ allWorks: operas, operas, isLoading: false });
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