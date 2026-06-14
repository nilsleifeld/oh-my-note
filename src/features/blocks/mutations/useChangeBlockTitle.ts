import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildTitleChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useChangeBlockTitle() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      title,
      previousTitle,
    }: {
      blockId: string;
      title: string;
      previousTitle: string;
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);
      await apply(buildTitleChange(current, title, previousTitle));
    },
  });
}
