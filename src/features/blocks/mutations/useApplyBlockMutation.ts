import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BlockChange } from "../../../types/models";
import {
  applyChangeToCache,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";
import { useBlockHistory } from "../history/BlockHistoryProvider";

export function useApplyBlockMutation() {
  const queryClient = useQueryClient();
  const { pushHistory, isApplyingHistory } = useBlockHistory();

  const mutation = useMutation({
    mutationFn: (change: BlockChange) => persistChange(change),
    onError: (_err, change) => {
      rollbackChange(queryClient, change);
    },
  });

  const apply = async (change: BlockChange) => {
    applyChangeToCache(queryClient, change);
    await mutation.mutateAsync(change);
    if (!isApplyingHistory()) {
      pushHistory(change);
    }
  };

  return { ...mutation, apply };
}
