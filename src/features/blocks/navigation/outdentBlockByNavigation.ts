import type { QueryClient } from "@tanstack/react-query";
import type { Block, BlockChange } from "../../../types/models";
import { findParentInContext, outdentBlock } from "../../../utils/blockTree";
import { queryKeys } from "../../../lib/query/queryKeys";
import {
  buildOutdentSnapshot,
  buildTreeChange,
} from "../changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";

export async function outdentBlockByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<BlockChange | null> {
  const block = await fetchBlock(queryClient, blockId);
  const blocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const parentInfo = findParentInContext(blockId, blocks, block.day);
  if (!parentInfo || parentInfo.parent === null) return null;

  let grandparent = null;
  if (parentInfo.parent.parentId !== null) {
    const grandparentInfo = findParentInContext(
      parentInfo.parent.id,
      blocks,
      block.day,
    );
    grandparent = grandparentInfo?.parent ?? null;
  }

  const snapshot = buildOutdentSnapshot(
    block,
    parentInfo.parent,
    grandparent ?? undefined,
  );
  const updates = outdentBlock(blockId, blocks, block.day);
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
