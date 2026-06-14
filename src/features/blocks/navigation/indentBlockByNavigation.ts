import type { QueryClient } from "@tanstack/react-query";
import type { Block, BlockChange } from "../../../types/models";
import {
  findParentInContext,
  indentBlock,
  rootBlockIds,
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

export async function indentBlockByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<BlockChange | null> {
  const block = await fetchBlock(queryClient, blockId);
  const roots =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const rootIds = rootBlockIds(roots);
  const getBlockFn = (id: string) => fetchBlock(queryClient, id);
  const parentInfo = await findParentInContext(blockId, rootIds, getBlockFn);
  if (!parentInfo || parentInfo.index === 0) return null;

  let previousSibling: Block | null;
  let parent: Block | null = null;

  if (parentInfo.parent === null) {
    const prevId = rootIds[parentInfo.index - 1];
    previousSibling = (await fetchBlock(queryClient, prevId)) ?? null;
  } else {
    const prevId = parentInfo.parent.content[parentInfo.index - 1];
    previousSibling = (await fetchBlock(queryClient, prevId)) ?? null;
    parent = parentInfo.parent;
  }

  const snapshot = buildIndentSnapshot(block, previousSibling, parent);
  const updates = await indentBlock(blockId, rootIds, getBlockFn);
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
