import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildToggleOpenChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useToggleBlockOpen() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      open,
    }: {
      blockId: string;
      open: boolean;
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);
      await apply(buildToggleOpenChange(current, open));
    },
  });
}
