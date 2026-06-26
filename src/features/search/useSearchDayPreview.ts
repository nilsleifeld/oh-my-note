import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "../../api/client";
import { queryKeys } from "../../lib/query/queryKeys";

export function useSearchDayPreview(day: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.day(day ?? ""),
    enabled: enabled && day !== null,
    queryFn: async () => {
      const result = await getApiClient().getBlocks({ day: day! });
      return result.items;
    },
  });
}
