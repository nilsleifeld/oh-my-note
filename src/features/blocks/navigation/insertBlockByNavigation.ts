import type { QueryClient } from "@tanstack/react-query";
import { createChildBlock, isHeadingBlockType } from "../../../data/blocks";
import type { Block, BlockChange, BlockType } from "../../../types/models";
import { childrenOf, findParentInContext } from "../../../utils/blockTree";
import { sortKeyBetween } from "../../../utils/sortKey";
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
  const blocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const parentInfo = findParentInContext(blockId, blocks, block.day);
  if (!parentInfo) return null;

  const parent = parentInfo.parent;
  const parentBlock = parent;
  const child = createChildBlock(type, {
    parentId: parent?.id ?? null,
    day: parentBlock?.day ?? block.day,
    createdAt: new Date().toISOString(),
    sortKey: sortKeyBetween(null, null),
  });

  let change: BlockChange;

  if (parent === null) {
    const siblings = childrenOf(blocks, null, block.day);
    if (position === "below") {
      const afterIndex = siblings.findIndex((entry) => entry.id === blockId);
      const nextRoot = siblings[afterIndex + 1];
      child.sortKey = sortKeyBetween(block.sortKey, nextRoot?.sortKey ?? null);
    } else {
      const afterIndex = siblings.findIndex((entry) => entry.id === blockId);
      const prevRoot = siblings[afterIndex - 1];
      child.sortKey = sortKeyBetween(prevRoot?.sortKey ?? null, block.sortKey);
    }
    change = buildCreateRootChange(child);
  } else {
    const siblings = childrenOf(blocks, parent.id);
    const index =
      position === "below" ? parentInfo.index + 1 : parentInfo.index;
    const prev = siblings[index - 1];
    const next = siblings[index];
    child.sortKey = sortKeyBetween(
      prev?.sortKey ?? null,
      next?.sortKey ?? null,
    );
    change = buildCreateChildChange(child);
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
