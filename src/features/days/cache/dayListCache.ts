import type { QueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { PagedResult } from "../../../types/models";
import { queryKeys } from "../../../lib/query/queryKeys";

export const DAY_LIST_PAGE_SIZE = 30;

export function removeDateFromDayIndex(
  queryClient: QueryClient,
  date: string,
  pageSize = DAY_LIST_PAGE_SIZE,
): void {
  queryClient.setQueryData<InfiniteData<PagedResult<string>>>(
    queryKeys.days.list(pageSize),
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.filter((entry) => entry !== date),
        })),
      };
    },
  );
}
