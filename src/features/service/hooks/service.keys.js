export const serviceKeys = {
  all: ["services"],
  lists: () => [...serviceKeys.all, "list"],
  list: (filters) => [...serviceKeys.lists(), filters],
  my: () => [...serviceKeys.all, "my"],
  details: () => [...serviceKeys.all, "detail"],
  detail: (id) => [...serviceKeys.details(), id],
};
