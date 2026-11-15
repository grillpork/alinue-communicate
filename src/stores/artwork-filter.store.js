"use client";

import { create } from "zustand";

export const useArtworkFilterStore = create((set) => ({
  category: "all",
  sort: "newest",
  search: "",

  setCategory: (category) => set({ category }),
  setSort: (sort) => set({ sort }),
  setSearch: (search) => set({ search }),

  reset: () =>
    set({
      category: "all",
      sort: "newest",
      search: "",
    }),
}));
