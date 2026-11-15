"use client";

import { useArtworks } from "../hooks/use-artworks";

export function ArtworkList() {
  const { data, isPending, isError } = useArtworks({
    page: 1,
    limit: 12,
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Something went wrong</p>;

  return (
    <div>
      {data.data.map((artwork) => (
        <div key={artwork.id}>{artwork.title}</div>
      ))}
    </div>
  );
}
