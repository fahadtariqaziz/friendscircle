import { create } from "zustand";

type Tab = "home" | "explore" | "create" | "threads" | "profile";

interface AppState {
  activeTab: Tab;
  isDarkMode: boolean;
  selectedUniversityId: string | null;
  selectedCampusId: string | null;
  setActiveTab: (tab: Tab) => void;
  toggleDarkMode: () => void;
  setUniversityFilter: (id: string | null) => void;
  setCampusFilter: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "home",
  isDarkMode: true,
  selectedUniversityId: null,
  selectedCampusId: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleDarkMode: () =>
    set((state) => {
      const isDarkMode = !state.isDarkMode;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", isDarkMode);
      }
      return { isDarkMode };
    }),
  setUniversityFilter: (selectedUniversityId) =>
    set({ selectedUniversityId, selectedCampusId: null }),
  setCampusFilter: (selectedCampusId) => set({ selectedCampusId }),
}));
