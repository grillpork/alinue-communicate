export const postKeys = {
  all: ["posts"],
  lists: () => [...postKeys.all, "list"],
  list: (params = {}) => [...postKeys.all, "list", params],
  details: () => [...postKeys.all, "detail"],
  detail: (id) => [...postKeys.all, "detail", id],
  comments: (postId) => [...postKeys.all, "comments", postId],
};
