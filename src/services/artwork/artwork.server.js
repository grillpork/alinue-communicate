import { serverApi } from "@/services/api/api.server";

// GET ALL
export function getArtworksServer(params) {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  });

  const suffix = query.size ? `?${query.toString()}` : "";

  return serverApi < ArtworkListResponse > `/artworks${suffix}`;
}

// GET DETAIL
export function getArtworkServer(id) {
  return serverApi(`/artworks/${id}`);
}
