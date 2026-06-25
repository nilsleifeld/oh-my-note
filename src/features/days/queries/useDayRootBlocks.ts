import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../../../api/client";
import type { BlockSortBy } from "../../../types/models";
import { queryKeys } from "../../../lib/query/queryKeys";
import { seedBlockQueries } from "../../blocks/cache/blockCache";

const defaultSortBy: BlockSortBy = { field: "sortKey", order: "asc" };

type UseDayRootBlocksOptions = {
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: BlockSortBy;
};

/** Loads all blocks for a day (roots and descendants). */
export function useDayRootBlocks(
  date: string,
  options: UseDayRootBlocksOptions = {},
) {
  const queryClient = useQueryClient();
  const client = getApiClient();
  const enabled = options.enabled ?? true;
  const sortBy = options.sortBy ?? defaultSortBy;
  const { page, pageSize } = options;

  const isDefaultSort =
    sortBy.field === defaultSortBy.field &&
    sortBy.order === defaultSortBy.order;

  const queryKey =
    page === undefined && pageSize === undefined && isDefaultSort
      ? queryKeys.day(date)
      : queryKeys.day(date, { sortBy, page, pageSize });

  return useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      const result = await client.getBlocks({
        day: date,
        page,
        pageSize,
        sortBy,
      });

      if (page === undefined && pageSize === undefined) {
        seedBlockQueries(queryClient, result.items);
      }

      return result.items;
    },
  });
}
