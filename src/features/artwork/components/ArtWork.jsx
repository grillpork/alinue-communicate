import React from 'react'

const ArtWork = () => {
    const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteArtworks();

const artworks = data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <div>ArtWork</div>
  )
}

export default ArtWork