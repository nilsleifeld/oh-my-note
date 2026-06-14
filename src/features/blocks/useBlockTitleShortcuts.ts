import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  buildBulletShortcutChange,
  buildTodoShortcutChange,
  buildToggleShortcutChange,
} from "./changes/buildBlockChanges";
import { getBlock } from "./cache/blockCache";
import { useApplyBlockMutation } from "./mutations/useApplyBlockMutation";

export function useBlockTitleShortcuts(blockId: string) {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  return useCallback(
    (value: string) => {
      if (value.startsWith("[] ")) {
        const title = value.slice(3);
        const current = getBlock(queryClient, blockId);
        if (current) {
          void apply(buildTodoShortcutChange(current, title));
        }
        return title;
      }
      if (value.startsWith("- ")) {
        const title = value.slice(2);
        const current = getBlock(queryClient, blockId);
        if (current) {
          void apply(buildBulletShortcutChange(current, title));
        }
        return title;
      }
      if (value.startsWith("> ")) {
        const title = value.slice(2);
        const current = getBlock(queryClient, blockId);
        if (current) {
          void apply(buildToggleShortcutChange(current, title));
        }
        return title;
      }
      return value;
    },
    [apply, blockId, queryClient],
  );
}
