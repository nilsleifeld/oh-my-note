import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildLanguageChange } from "../changes/buildBlockChanges";
import { getBlock } from "../cache/blockCache";
import { useApplyBlockMutation } from "./useApplyBlockMutation";

export function useChangeBlockLanguage() {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useMutation({
    mutationFn: async ({
      blockId,
      language,
      previousLanguage,
    }: {
      blockId: string;
      language: string;
      previousLanguage: string;
    }) => {
      const current = getBlock(queryClient, blockId);
      if (!current) throw new Error(`Block not in cache: ${blockId}`);
      await apply(buildLanguageChange(current, language, previousLanguage));
    },
  });
}
