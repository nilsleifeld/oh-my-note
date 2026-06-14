import type { BlockSortBy } from "../../types/models";

/**
 * Hierarchical query keys — same pattern as TanStack Query's queryKey factories.
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */
export const queryKeys = {
  days: {
    all: ["days"] as const,
    list: (pageSize: number) => ["days", "list", pageSize] as const,
  },
  block: (id: string) => ["block", id] as const,
  day: (
    date: string,
    options?: {
      sortBy?: BlockSortBy;
      page?: number;
      pageSize?: number;
    },
  ) => (options ? (["day", date, options] as const) : (["day", date] as const)),
};
