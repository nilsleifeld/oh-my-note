import type { QueryClient } from "@tanstack/react-query";
import type { BlockChange } from "../../../types/models";
import {
  childrenOf,
  findParentInContext,
  indentBlock,
} from "../../../utils/blockTree";
import { queryKeys } from "../../../lib/query/queryKeys";
import {
  buildIndentSnapshot,
  buildTreeChange,
} from "../changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";
import type { Block } from "../../../types/models";

export async function indentBlockByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<BlockChange | null> {
  const block = await fetchBlock(queryClient, blockId);
  const blocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const parentInfo = findParentInContext(blockId, blocks, block.day);
  if (!parentInfo || parentInfo.index === 0) return null;

  let previousSibling;
  let parent = null;

  if (parentInfo.parent === null) {
    previousSibling = childrenOf(blocks, null, block.day)[parentInfo.index - 1];
  } else {
    previousSibling = childrenOf(blocks, parentInfo.parent.id)[
      parentInfo.index - 1
    ];
    parent = parentInfo.parent;
  }

  const snapshot = buildIndentSnapshot(block, previousSibling, parent);
  const updates = indentBlock(blockId, blocks, block.day);
  if (!updates) return null;

  const change = buildTreeChange(snapshot, updates);
  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  return change;
}
