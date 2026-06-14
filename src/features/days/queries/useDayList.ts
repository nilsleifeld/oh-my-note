import { useInfiniteQuery } from "@tanstack/react-query";
import { getApiClient } from "../../../api/client";
import { queryKeys } from "../../../lib/query/queryKeys";
import { DAY_LIST_PAGE_SIZE } from "../cache/dayListCache";

export function useDayList(pageSize = DAY_LIST_PAGE_SIZE) {
  const client = getApiClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.days.list(pageSize),
    queryFn: ({ pageParam }) =>
      client.getDayDates({ page: pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  const data = query.data?.pages.flatMap((page) => page.items);

  return {
    ...query,
    data,
  };
}
