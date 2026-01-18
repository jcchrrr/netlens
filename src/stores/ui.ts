import { create } from "zustand";
import type { DrawerTab, BodyViewMode } from "@/lib/utils/types";

interface UIState {
  // Drawer state
  isDrawerOpen: boolean;
  activeRequestId: string | null;
  drawerTab: DrawerTab;
  bodyViewMode: BodyViewMode;
  isReplayMode: boolean;

  // Settings modal
  isSettingsOpen: boolean;

  // Privacy warning modal
  isPrivacyWarningOpen: boolean;

  // Favorites section
  isFavoritesExpanded: boolean;

  // Layout
  isNarrowLayout: boolean;

  // Actions - Drawer
  openDrawer: (requestId: string) => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: DrawerTab) => void;
  setBodyViewMode: (mode: BodyViewMode) => void;
  setReplayMode: (enabled: boolean) => void;

  // Actions - Settings
  openSettings: () => void;
  closeSettings: () => void;

  // Actions - Privacy warning
  openPrivacyWarning: () => void;
  closePrivacyWarning: () => void;

  // Actions - Favorites
  toggleFavoritesExpanded: () => void;
  setFavoritesExpanded: (expanded: boolean) => void;

  // Actions - Layout
  setNarrowLayout: (narrow: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isDrawerOpen: false,
  activeRequestId: null,
  drawerTab: "request",
  bodyViewMode: "tree",
  isReplayMode: false,
  isSettingsOpen: false,
  isPrivacyWarningOpen: false,
  isFavoritesExpanded: true,
  isNarrowLayout: false,

  // Drawer actions
  openDrawer: (requestId) => {
    set({
      isDrawerOpen: true,
      activeRequestId: requestId,
      drawerTab: "request",
      isReplayMode: false,
    });
  },

  closeDrawer: () => {
    set({
      isDrawerOpen: false,
      activeRequestId: null,
      isReplayMode: false,
    });
  },

  setDrawerTab: (tab) => {
    set({ drawerTab: tab });
  },

  setBodyViewMode: (mode) => {
    set({ bodyViewMode: mode });
  },

  setReplayMode: (enabled) => {
    set({ isReplayMode: enabled });
  },

  // Settings actions
  openSettings: () => {
    set({ isSettingsOpen: true });
  },

  closeSettings: () => {
    set({ isSettingsOpen: false });
  },

  // Privacy warning actions
  openPrivacyWarning: () => {
    set({ isPrivacyWarningOpen: true });
  },

  closePrivacyWarning: () => {
    set({ isPrivacyWarningOpen: false });
  },

  // Favorites actions
  toggleFavoritesExpanded: () => {
    set((state) => ({ isFavoritesExpanded: !state.isFavoritesExpanded }));
  },

  setFavoritesExpanded: (expanded) => {
    set({ isFavoritesExpanded: expanded });
  },

  // Layout actions
  setNarrowLayout: (narrow) => {
    set({ isNarrowLayout: narrow });
  },
}));
