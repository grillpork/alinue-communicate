"use client";

import { useArtworkFilterStore } from "../stores/artwork-filter.store";

export function ArtworkFilters() {
  const category = useArtworkFilterStore((state) => state.category);

  const setCategory = useArtworkFilterStore((state) => state.setCategory);

  return (
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="text-base"
    >
      <option value="all">All</option>
      <option value="anime">Anime</option>
      <option value="chibi">Chibi</option>
    </select>
  );
}
