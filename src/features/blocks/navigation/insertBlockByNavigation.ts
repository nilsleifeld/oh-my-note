import type { QueryClient } from "@tanstack/react-query";
import { createChildBlock, isHeadingBlockType } from "../../../data/blocks";
import type { Block, BlockChange, BlockType } from "../../../types/models";
import { findParentInContext, rootBlockIds } from "../../../utils/blockTree";
import { createdAtAfter } from "../../../utils/date";
import { queryKeys } from "../../../lib/query/queryKeys";
import {
  buildCreateChildChange,
  buildCreateRootChange,
} from "../changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";

type InsertResult = {
  change: BlockChange;
  newBlockId: string;
};

function blockTypeForSiblingInsert(type: BlockType): BlockType {
  if (type === "image" || isHeadingBlockType(type)) {
    return "text";
  }
  return type;
}

async function insertBlockRelative(
  queryClient: QueryClient,
  blockId: string,
  position: "above" | "below",
): Promise<InsertResult | null> {
  const block = await fetchBlock(queryClient, blockId);
  const type = blockTypeForSiblingInsert(block.type);
  const roots =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const rootIds = rootBlockIds(roots);
  const getBlockFn = (id: string) => fetchBlock(queryClient, id);
  const parentInfo = await findParentInContext(blockId, rootIds, getBlockFn);
  if (!parentInfo) return null;

  const parent = parentInfo.parent;
  const parentBlock = parent ? await fetchBlock(queryClient, parent.id) : null;
  const child = createChildBlock(type, {
    parentId: parent?.id ?? null,
    day: parentBlock?.day ?? block.day,
    createdAt: new Date().toISOString(),
  });

  let change: BlockChange;

  if (parent === null) {
    if (position === "below") {
      const nextRootId = rootIds[parentInfo.index + 1];
      const nextRoot = nextRootId
        ? await fetchBlock(queryClient, nextRootId)
        : undefined;
      child.createdAt = createdAtAfter(
        block.day,
        block.createdAt,
        nextRoot?.createdAt,
      );
    } else {
      const prevRootId = rootIds[parentInfo.index - 1];
      const prevRoot = prevRootId
        ? await fetchBlock(queryClient, prevRootId)
        : undefined;
      child.createdAt = createdAtAfter(
        block.day,
        prevRoot?.createdAt,
        block.createdAt,
      );
    }
    change = buildCreateRootChange(child);
  } else {
    const index =
      position === "below" ? parentInfo.index + 1 : parentInfo.index;
    change = buildCreateChildChange(parent, child, index);
  }

  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  return { change, newBlockId: child.id };
}

export function insertBlockBelowByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<InsertResult | null> {
  return insertBlockRelative(queryClient, blockId, "below");
}

export function insertBlockAboveByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<InsertResult | null> {
  return insertBlockRelative(queryClient, blockId, "above");
}
