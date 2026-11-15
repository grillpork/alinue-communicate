export const userKeys = {
  all: ['users'],
  suggested: () => [...userKeys.all, 'suggested'],
  profile: (username) => [...userKeys.all, 'profile', username],
  posts: (userId) => [...userKeys.all, 'posts', userId],
  likes: (userId) => [...userKeys.all, 'likes', userId],
  search: (q) => [...userKeys.all, 'search', q],
};
