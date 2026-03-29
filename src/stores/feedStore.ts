import { create } from 'zustand';
import { FeedService } from '@/src/services/FeedService';
import type { DiveShare } from '@/src/models';

interface FeedState {
  feed: DiveShare[];
  exploreFeed: DiveShare[];
  loading: boolean;

  loadFeed: () => Promise<void>;
  loadExploreFeed: () => Promise<void>;
  toggleTap: (shareId: string) => Promise<void>;
  shareDive: (input: Parameters<typeof FeedService.shareDive>[0]) => Promise<DiveShare>;
  deleteShare: (shareId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feed: [],
  exploreFeed: [],
  loading: false,

  loadFeed: async () => {
    set({ loading: true });
    try {
      const feed = await FeedService.getFeed();
      set({ feed });
    } catch (e) {
      console.warn('[FeedStore] loadFeed error:', e);
    } finally {
      set({ loading: false });
    }
  },

  loadExploreFeed: async () => {
    set({ loading: true });
    try {
      const exploreFeed = await FeedService.getExploreFeed();
      set({ exploreFeed });
    } catch (e) {
      console.warn('[FeedStore] loadExploreFeed error:', e);
    } finally {
      set({ loading: false });
    }
  },

  toggleTap: async (shareId) => {
    try {
      const isTapped = await FeedService.toggleTap(shareId);

      const updateShares = (shares: DiveShare[]) =>
        shares.map(s =>
          s.id === shareId
            ? { ...s, isTapped, tapCount: (s.tapCount ?? 0) + (isTapped ? 1 : -1) }
            : s,
        );

      set(s => ({
        feed: updateShares(s.feed),
        exploreFeed: updateShares(s.exploreFeed),
      }));
    } catch (e) {
      console.warn('[FeedStore] toggleTap error:', e);
    }
  },

  shareDive: async (input) => {
    const share = await FeedService.shareDive(input);
    set(s => ({ feed: [share, ...s.feed] }));
    return share;
  },

  deleteShare: async (shareId) => {
    await FeedService.deleteShare(shareId);
    set(s => ({
      feed: s.feed.filter(d => d.id !== shareId),
      exploreFeed: s.exploreFeed.filter(d => d.id !== shareId),
    }));
  },
}));
