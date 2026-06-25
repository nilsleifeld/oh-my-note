import type { QueryClient } from "@tanstack/react-query";
import type { Block, BlockChange } from "../../../types/models";
import { childrenOf, findParentInContext } from "../../../utils/blockTree";
import { sortKeyBetween } from "../../../utils/sortKey";
import { queryKeys } from "../../../lib/query/queryKeys";
import { buildTreeChange } from "../changes/buildBlockChanges";
import { cloneBlock } from "../cache/blockCacheState";
import {
  applyChangeToCache,
  fetchBlock,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";
import { getBlockClipboard } from "./blockClipboard";

type PasteResult = {
  change: BlockChange;
  newRootId: string;
};

export async function pasteBlockByNavigation(
  queryClient: QueryClient,
  targetBlockId: string,
): Promise<PasteResult | null> {
  const clipboard = getBlockClipboard();
  if (!clipboard?.blocks.length) return null;

  const target = await fetchBlock(queryClient, targetBlockId);
  const blocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(target.day)) ?? [];
  const parentInfo = findParentInContext(targetBlockId, blocks, target.day);
  if (!parentInfo) return null;

  const idMap = new Map<string, string>();
  for (const block of clipboard.blocks) {
    idMap.set(block.id, crypto.randomUUID());
  }

  const oldRootId = clipboard.rootId;
  const remappedBlocks: Block[] = clipboard.blocks.map((block) => {
    const newId = idMap.get(block.id)!;
    return {
      ...cloneBlock(block),
      id: newId,
      parentId:
        block.id === oldRootId
          ? (parentInfo.parent?.id ?? null)
          : (idMap.get(block.parentId!) ?? null),
      day: target.day,
    };
  });

  const newRootId = idMap.get(oldRootId)!;
  const newRoot = remappedBlocks.find((block) => block.id === newRootId);
  if (!newRoot) return null;

  if (parentInfo.parent === null) {
    const siblings = childrenOf(blocks, null, target.day);
    const targetIndex = siblings.findIndex(
      (entry) => entry.id === targetBlockId,
    );
    const nextRoot = siblings[targetIndex + 1];
    newRoot.sortKey = sortKeyBetween(target.sortKey, nextRoot?.sortKey ?? null);
  } else {
    const siblings = childrenOf(blocks, parentInfo.parent.id);
    const insertIndex = parentInfo.index + 1;
    const prev = siblings[insertIndex - 1];
    const next = siblings[insertIndex];
    newRoot.sortKey = sortKeyBetween(
      prev?.sortKey ?? null,
      next?.sortKey ?? null,
    );
  }

  const change = buildTreeChange(
    [],
    remappedBlocks,
    remappedBlocks.map((block) => block.id),
  );

  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  return { change, newRootId };
}
