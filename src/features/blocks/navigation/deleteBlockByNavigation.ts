import type { BlockChange } from "../../../types/models";
import type { QueryClient } from "@tanstack/react-query";
import { findParentInContext, rootBlockIds } from "../../../utils/blockTree";
import type { Block } from "../../../types/models";
import { queryKeys } from "../../../lib/query/queryKeys";
import { buildDeleteChange } from "../changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  handleDayEmptied,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";

export async function deleteBlockByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<BlockChange | null> {
  const block = await fetchBlock(queryClient, blockId);
  const roots =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const rootIds = rootBlockIds(roots);
  const getBlockFn = (id: string) => fetchBlock(queryClient, id);
  const parentInfo = await findParentInContext(blockId, rootIds, getBlockFn);
  if (!parentInfo) return null;

  const change = buildDeleteChange(block, parentInfo.parent);
  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  const remainingRoots =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  if (remainingRoots.length === 0) {
    handleDayEmptied(queryClient, block.day);
  }

  return change;
}
