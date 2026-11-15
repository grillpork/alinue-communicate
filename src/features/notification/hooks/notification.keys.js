export const notificationKeys = {
  all: ['notifications'],
  list: (filter) => [...notificationKeys.all, 'list', filter],
  unreadCount: () => [...notificationKeys.all, 'unread-count'],
};
