import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "../../../api/client";
import { queryKeys } from "../../../lib/query/queryKeys";

export function useBlockQuery(id: string) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.block(id),
    queryFn: async () => {
      const block = await client.getBlock(id);
      if (!block) throw new Error(`Block not found: ${id}`);
      return block;
    },
  });
}
