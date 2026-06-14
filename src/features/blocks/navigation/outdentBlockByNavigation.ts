import type { QueryClient } from "@tanstack/react-query";
import type { Block, BlockChange } from "../../../types/models";
import {
  findParentInContext,
  outdentBlock,
  rootBlockIds,
} from "../../../utils/blockTree";
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
  const roots =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const rootIds = rootBlockIds(roots);
  const getBlockFn = (id: string) => fetchBlock(queryClient, id);
  const parentInfo = await findParentInContext(blockId, rootIds, getBlockFn);
  if (!parentInfo || parentInfo.parent === null) return null;

  let grandparent = null;
  if (parentInfo.parent.parentId !== null) {
    const grandparentInfo = await findParentInContext(
      parentInfo.parent.id,
      rootIds,
      getBlockFn,
    );
    grandparent = grandparentInfo?.parent ?? null;
  }

  const snapshot = buildOutdentSnapshot(
    block,
    parentInfo.parent,
    grandparent ?? undefined,
  );
  const updates = await outdentBlock(blockId, rootIds, block.day, getBlockFn);
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
