export const artworkKeys = {
  all: ["artworks"],
  lists: () => [...artworkKeys.all, "list"],

  list: (params) => [...artworkKeys.lists(), params],

  infinite: (params) => [...artworkKeys.all, "infinite", params],

  details: () => [...artworkKeys.all, "detail"],

  detail: (id) => [...artworkKeys.details(), id],
};
