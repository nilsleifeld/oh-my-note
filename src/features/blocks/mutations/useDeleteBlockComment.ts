import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildDeleteCommentChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useDeleteBlockComment() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      commentId,
    }: {
      blockId: string;
      commentId: string;
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);
      await apply(buildDeleteCommentChange(current, commentId));
    },
  });
}
