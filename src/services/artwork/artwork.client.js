import { apiClient } from "@/services/api/api-client";

// GET ALL
export function getArtworks(params, signal) {
  return apiClient("/artworks", {
    params,
    signal,
  });
}

// GET DETAIL
export function getArtwork(id, signal) {
  return apiClient(`/artworks/${id}`, {
    signal,
  });
}

// CREATE
export function createArtwork(data) {
  return apiClient("/artworks", {
    method: "POST",
    body: data,
  });
}

// UPDATE
export function updateArtwork(id, data) {
  return apiClient(`/artworks/${id}`, {
    method: "PATCH",
    body: data,
  });
}

// DELETE
export function deleteArtwork(id) {
  return apiClient(`/artworks/${id}`, {
    method: "DELETE",
  });
}

// UPLOAD
export function uploadArtwork(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient("/artworks/upload", {
    method: "POST",
    body: formData,
  });
}
