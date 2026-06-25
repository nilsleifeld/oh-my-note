import { useMutation, useQueryClient } from "@tanstack/react-query";
import { findParentInContext } from "../../../utils/blockTree";
import { buildDeleteChange } from "../changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  getDayBlocks,
  handleDayEmptied,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";
import { useBlockHistory } from "../history/BlockHistoryProvider";

export function useDeleteBlock(date: string, getRootIds: () => string[]) {
  const queryClient = useQueryClient();
  const { pushHistory, isApplyingHistory } = useBlockHistory();

  return useMutation({
    mutationFn: async (id: string) => {
      const change = await resolveDeleteChange(queryClient, id, date);
      if (!change) return;
      await persistChange(change);
    },
    onMutate: async (id) => {
      const change = await resolveDeleteChange(queryClient, id, date);
      if (!change) return undefined;
      applyChangeToCache(queryClient, change);
      return { change };
    },
    onError: (_err, _id, context) => {
      if (context?.change) rollbackChange(queryClient, context.change);
    },
    onSuccess: (_id, _vars, context) => {
      if (context?.change && !isApplyingHistory()) {
        pushHistory(context.change);
      }

      if (getRootIds().length === 0) {
        handleDayEmptied(queryClient, date);
      }
    },
  });
}

async function resolveDeleteChange(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  date: string,
) {
  const blocks = getDayBlocks(queryClient, date);
  const parentInfo = findParentInContext(id, blocks, date);
  const block =
    blocks.find((entry) => entry.id === id) ??
    (await fetchBlock(queryClient, id));
  if (!block || !parentInfo) return null;
  return buildDeleteChange(block, parentInfo.parent);
}
