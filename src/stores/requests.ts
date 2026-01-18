import { create } from "zustand";
import type { NetworkRequest } from "@/lib/utils/types";

interface RequestsState {
  // Data
  requests: NetworkRequest[];
  favorites: Set<string>;
  selected: Set<string>;

  // Capture state
  isPaused: boolean;
  maxRequests: number;

  // Search/filter
  searchQuery: string;

  // Actions
  addRequest: (request: NetworkRequest) => void;
  removeRequest: (id: string) => void;
  clearRequests: () => void;

  // Selection
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setSelected: (ids: string[]) => void;

  // Favorites
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;

  // Capture control
  setPaused: (paused: boolean) => void;
  setMaxRequests: (max: number) => void;

  // Search
  setSearchQuery: (query: string) => void;

  // Selectors (computed)
  getFilteredRequests: () => NetworkRequest[];
  getSelectedRequests: () => NetworkRequest[];
  getFavoriteRequests: () => NetworkRequest[];
  getRequestById: (id: string) => NetworkRequest | undefined;
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  // Initial state
  requests: [],
  favorites: new Set(),
  selected: new Set(),
  isPaused: false,
  maxRequests: 500,
  searchQuery: "",

  // Actions
  addRequest: (request) => {
    set((state) => {
      // Don't add if paused
      if (state.isPaused) return state;

      // Apply FIFO limit
      let newRequests = [...state.requests, request];
      if (newRequests.length > state.maxRequests) {
        const removed = newRequests.slice(0, newRequests.length - state.maxRequests);
        newRequests = newRequests.slice(-state.maxRequests);

        // Clean up favorites and selected for removed requests
        const removedIds = new Set(removed.map((r) => r.id));
        const newFavorites = new Set([...state.favorites].filter((id) => !removedIds.has(id)));
        const newSelected = new Set([...state.selected].filter((id) => !removedIds.has(id)));

        return {
          requests: newRequests,
          favorites: newFavorites,
          selected: newSelected,
        };
      }

      return { requests: newRequests };
    });
  },

  removeRequest: (id) => {
    set((state) => {
      const newFavorites = new Set(state.favorites);
      newFavorites.delete(id);

      const newSelected = new Set(state.selected);
      newSelected.delete(id);

      return {
        requests: state.requests.filter((r) => r.id !== id),
        favorites: newFavorites,
        selected: newSelected,
      };
    });
  },

  clearRequests: () => {
    set({
      requests: [],
      favorites: new Set(),
      selected: new Set(),
    });
  },

  // Selection
  toggleSelected: (id) => {
    set((state) => {
      const newSelected = new Set(state.selected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selected: newSelected };
    });
  },

  selectAll: () => {
    const filtered = get().getFilteredRequests();
    set({ selected: new Set(filtered.map((r) => r.id)) });
  },

  deselectAll: () => {
    set({ selected: new Set() });
  },

  setSelected: (ids) => {
    set({ selected: new Set(ids) });
  },

  // Favorites
  toggleFavorite: (id) => {
    set((state) => {
      const newFavorites = new Set(state.favorites);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return { favorites: newFavorites };
    });
  },

  clearFavorites: () => {
    set({ favorites: new Set() });
  },

  // Capture control
  setPaused: (paused) => {
    set({ isPaused: paused });
  },

  setMaxRequests: (max) => {
    set((state) => {
      // If reducing limit, trim existing requests
      if (max < state.requests.length) {
        const removed = state.requests.slice(0, state.requests.length - max);
        const removedIds = new Set(removed.map((r) => r.id));
        const newFavorites = new Set([...state.favorites].filter((id) => !removedIds.has(id)));
        const newSelected = new Set([...state.selected].filter((id) => !removedIds.has(id)));

        return {
          maxRequests: max,
          requests: state.requests.slice(-max),
          favorites: newFavorites,
          selected: newSelected,
        };
      }
      return { maxRequests: max };
    });
  },

  // Search
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Selectors
  getFilteredRequests: () => {
    const { requests, searchQuery } = get();
    if (!searchQuery.trim()) return requests;

    const query = searchQuery.toLowerCase();
    return requests.filter((r) => {
      return (
        r.url.toLowerCase().includes(query) ||
        r.method.toLowerCase().includes(query) ||
        r.status.toString().includes(query)
      );
    });
  },

  getSelectedRequests: () => {
    const { requests, selected } = get();
    return requests.filter((r) => selected.has(r.id));
  },

  getFavoriteRequests: () => {
    const { requests, favorites } = get();
    return requests.filter((r) => favorites.has(r.id));
  },

  getRequestById: (id) => {
    return get().requests.find((r) => r.id === id);
  },
}));
