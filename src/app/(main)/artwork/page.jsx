import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerQueryClient } from "@/lib/get-query-client";

import { getArtworksServer } from "@/features/artwork/api/artwork.server";

import { artworkKeys } from "@/features/artwork/hooks/artwork.keys";

import { ArtworkList } from "@/features/artwork/components/ArtworkList";

export default async function ArtworkPage() {
  const queryClient = getServerQueryClient();

  await queryClient.prefetchQuery({
    queryKey: artworkKeys.list({
      page: 1,
      limit: 12,
    }),

    queryFn: () =>
      getArtworksServer({
        page: 1,
        limit: 12,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ArtworkList />
    </HydrationBoundary>
  );
}
