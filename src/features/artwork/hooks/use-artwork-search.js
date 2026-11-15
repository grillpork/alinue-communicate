"use client";

import { useQuery } from "@tanstack/react-query";

import { getArtworks } from "../api/artwork.client";
import { artworkKeys } from "./artwork.keys";

export function useArtworkSearch(search) {
  return useQuery({
    queryKey: artworkKeys.list({
      search,
      page: 1,
      limit: 12,
    }),

    queryFn: ({ signal }) =>
      getArtworks(
        {
          search,
          page: 1,
          limit: 12,
        },
        signal,
      ),

    enabled: search.trim().length >= 2,
  });
}
