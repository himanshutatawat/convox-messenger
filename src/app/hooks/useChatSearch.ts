import { create } from "zustand";

interface ChatSearchStore {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
}

export const useChatSearch = create<ChatSearchStore>((set) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),
}));

export default useChatSearch;

