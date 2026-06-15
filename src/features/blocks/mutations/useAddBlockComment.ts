import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildAddCommentChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useAddBlockComment() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      text,
    }: {
      blockId: string;
      text: string;
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);

      const comment = {
        id: crypto.randomUUID(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      await apply(buildAddCommentChange(current, comment));
      return comment;
    },
  });
}
