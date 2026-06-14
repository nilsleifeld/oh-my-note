import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BlockChange } from "../../types/models";
import {
  buildBulletShortcutChange,
  buildTodoShortcutChange,
  buildToggleShortcutChange,
} from "./changes/buildBlockChanges";
import { getBlock } from "./cache/blockCache";
import { useApplyBlockMutation } from "./mutations/useApplyBlockMutation";

export function useBlockTitleShortcuts(
  blockId: string,
  onRequestFocus?: (blockId: string) => void,
) {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();

  const applyShortcut = useCallback(
    (change: BlockChange) => {
      onRequestFocus?.(blockId);
      void apply(change);
    },
    [apply, blockId, onRequestFocus],
  );

  return useCallback(
    (value: string) => {
      if (value.startsWith("[] ")) {
        const title = value.slice(3);
        const current = getBlock(queryClient, blockId);
        if (current) {
          applyShortcut(buildTodoShortcutChange(current, title));
        }
        return title;
      }
      if (value.startsWith("- ")) {
        const title = value.slice(2);
        const current = getBlock(queryClient, blockId);
        if (current) {
          applyShortcut(buildBulletShortcutChange(current, title));
        }
        return title;
      }
      if (value.startsWith("> ")) {
        const title = value.slice(2);
        const current = getBlock(queryClient, blockId);
        if (current) {
          applyShortcut(buildToggleShortcutChange(current, title));
        }
        return title;
      }
      return value;
    },
    [applyShortcut, blockId, queryClient],
  );
}
