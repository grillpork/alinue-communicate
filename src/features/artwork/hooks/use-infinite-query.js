"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getArtworks } from "../api/artwork.client";
import { artworkKeys } from "./artwork.keys";

export function useInfiniteArtworks() {
  return useInfiniteQuery({
    queryKey: artworkKeys.infinite({
      limit: 12,
    }),

    queryFn: ({ pageParam, signal }) =>
      getArtworks(
        {
          page: pageParam,
          limit: 12,
        },
        signal,
      ),

    initialPageParam: 1,

    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;

      return page < totalPages ? page + 1 : undefined;
    },
  });
}
