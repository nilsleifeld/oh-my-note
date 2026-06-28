import type { QueryClient } from "@tanstack/react-query";
import type { Block, BlockChange } from "../../../types/models";
import {
  buildRescheduleToDayUpdates,
  findParentInContext,
} from "../../../utils/blockTree";
import { queryKeys } from "../../../lib/query/queryKeys";
import {
  buildMoveSnapshot,
  buildTreeChange,
} from "../changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  getDayBlocks,
  handleDayEmptied,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";

export async function rescheduleBlockByNavigation(
  queryClient: QueryClient,
  blockId: string,
  targetDate: string,
): Promise<BlockChange | null> {
  const block = await fetchBlock(queryClient, blockId);
  if (block.day === targetDate) return null;

  const sourceDay = block.day;
  const sourceBlocks = getDayBlocks(queryClient, sourceDay);
  const targetBlocks = getDayBlocks(queryClient, targetDate);
  const parentInfo = findParentInContext(blockId, sourceBlocks, sourceDay);
  if (!parentInfo) return null;

  const updates = buildRescheduleToDayUpdates(
    blockId,
    sourceBlocks,
    targetDate,
    targetBlocks,
  );
  if (!updates) return null;

  const change = buildTreeChange(
    buildMoveSnapshot(block, parentInfo.parent, null),
    updates,
  );

  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  const remainingBlocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(sourceDay)) ?? [];
  const hasRoots = remainingBlocks.some((entry) => entry.parentId === null);
  if (!hasRoots) {
    handleDayEmptied(queryClient, sourceDay);
  }

  return change;
}
