import type { BlockChange } from "../../../types/models";
import type { QueryClient } from "@tanstack/react-query";
import { findParentInContext } from "../../../utils/blockTree";
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
  const blocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const parentInfo = findParentInContext(blockId, blocks, block.day);
  if (!parentInfo) return null;

  const change = buildDeleteChange(block, parentInfo.parent);
  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  const remainingBlocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const hasRoots = remainingBlocks.some((entry) => entry.parentId === null);
  if (!hasRoots) {
    handleDayEmptied(queryClient, block.day);
  }

  return change;
}
