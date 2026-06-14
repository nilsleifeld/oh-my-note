import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildToggleChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useToggleTodo() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      checked,
    }: {
      blockId: string;
      checked: boolean;
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);
      await apply(buildToggleChange(current, checked));
    },
  });
}
