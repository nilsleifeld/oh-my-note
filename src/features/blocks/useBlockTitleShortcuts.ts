import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BlockChange, BlockType } from "../../types/models";
import {
  buildBulletShortcutChange,
  buildHeadingShortcutChange,
  buildTodoShortcutChange,
  buildToggleShortcutChange,
} from "./changes/buildBlockChanges";
import { getBlock } from "./cache/blockCache";
import { useApplyBlockMutation } from "./mutations/useApplyBlockMutation";

const headingShortcutPattern = /^(#{1,5}) (.*)$/;

function parseHeadingShortcut(value: string): {
  type: Extract<BlockType, "h1" | "h2" | "h3" | "h4" | "h5">;
  title: string;
} | null {
  const match = value.match(headingShortcutPattern);
  if (!match) return null;

  const level = match[1].length;
  return {
    type: `h${level}` as Extract<BlockType, "h1" | "h2" | "h3" | "h4" | "h5">,
    title: match[2],
  };
}

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
      const headingShortcut = parseHeadingShortcut(value);
      if (headingShortcut) {
        const current = getBlock(queryClient, blockId);
        if (current) {
          applyShortcut(
            buildHeadingShortcutChange(
              current,
              headingShortcut.type,
              headingShortcut.title,
            ),
          );
        }
        return headingShortcut.title;
      }
      return value;
    },
    [applyShortcut, blockId, queryClient],
  );
}
