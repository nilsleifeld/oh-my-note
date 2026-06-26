import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "../../api/client";
import { queryKeys } from "../../lib/query/queryKeys";

export function useBlockSearch(query: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.search.blocks(query),
    enabled,
    staleTime: 0,
    queryFn: () => getApiClient().searchBlocks({ query }),
  });
}
