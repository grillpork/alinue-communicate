export const showcaseKeys = {
  all: ["showcases"],
  lists: () => [...showcaseKeys.all, "list"],
  list: (filters) => [...showcaseKeys.lists(), filters],
  details: () => [...showcaseKeys.all, "detail"],
  detail: (id) => [...showcaseKeys.details(), id],
};
