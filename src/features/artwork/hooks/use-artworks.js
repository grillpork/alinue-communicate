"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import * as api from "../api/artwork.client";
import { artworkKeys } from "./artwork.keys";

// READ ALL
export function useArtworks(params = {}) {
  return useQuery({
    queryKey: artworkKeys.list(params),
    queryFn: ({ signal }) => api.getArtworks(params, signal),
  });
}

// READ DETAIL
export function useArtwork(id) {
  return useQuery({
    queryKey: artworkKeys.detail(id),
    queryFn: ({ signal }) => api.getArtwork(id, signal),
    enabled: !!id,
  });
}

// CREATE
export function useCreateArtwork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createArtwork(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: artworkKeys.lists(),
      });
    },
  });
}

// UPDATE
export function useUpdateArtwork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateArtwork(id, data),

    onSuccess: (updated) => {
      queryClient.setQueryData(artworkKeys.detail(updated.id), updated);

      queryClient.invalidateQueries({
        queryKey: artworkKeys.lists(),
      });
    },
  });
}

// DELETE
export function useDeleteArtwork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteArtwork(id),

    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: artworkKeys.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: artworkKeys.lists(),
      });
    },
  });
}
