import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Block } from "../../../types/models";
import { buildTypeChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useChangeBlockType() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      type,
    }: {
      blockId: string;
      type: Block["type"];
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);
      await apply(buildTypeChange(current, type));
    },
  });
}
