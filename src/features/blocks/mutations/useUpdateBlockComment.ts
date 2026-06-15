import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildUpdateCommentChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useUpdateBlockComment() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      commentId,
      text,
    }: {
      blockId: string;
      commentId: string;
      text: string;
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);
      await apply(buildUpdateCommentChange(current, commentId, text.trim()));
    },
  });
}
