"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useLikeArtwork(id) {
  const queryClient = useQueryClient();
  const key = ["artworks", "detail", id];

  return useMutation({
    mutationFn: (liked) =>
      fetch(`/api/artworks/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ liked }),
      }).then((res) => {
        if (!res.ok) throw new Error("Like failed");
        return res.json();
      }),

    onMutate: async (liked) => {
      await queryClient.cancelQueries({
        queryKey: key,
      });

      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old) => ({
        ...old,
        isLiked: liked,
      }));

      return { previous };
    },

    onError: (_error, _liked, context) => {
      queryClient.setQueryData(key, context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: key,
      });
    },
  });
}
