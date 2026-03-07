export const swrKeys = {
  orders: (businessId?: string) => ['orders', businessId ?? 'all'] as const,
  menu: (businessId?: string) => ['menu', businessId ?? 'all'] as const,
  users: (businessId?: string) => ['users', businessId ?? 'all'] as const,
  businesses: () => ['businesses'] as const,
};
