import type { QueryClient } from "@tanstack/react-query";
import type { Block, BlockChange } from "../../../types/models";
import { findParentInContext, rootBlockIds } from "../../../utils/blockTree";
import { createdAtAfter } from "../../../utils/date";
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
  const roots =
    queryClient.getQueryData<Block[]>(queryKeys.day(target.day)) ?? [];
  const rootIds = rootBlockIds(roots);
  const getBlockFn = (id: string) => fetchBlock(queryClient, id);
  const parentInfo = await findParentInContext(
    targetBlockId,
    rootIds,
    getBlockFn,
  );
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
      content: block.content.map((childId) => idMap.get(childId)!),
      day: target.day,
    };
  });

  const newRootId = idMap.get(oldRootId)!;
  const newRoot = remappedBlocks.find((block) => block.id === newRootId);
  if (!newRoot) return null;

  const updates: Block[] = [...remappedBlocks];
  const snapshot: Block[] = [];

  if (parentInfo.parent === null) {
    const nextRootId = rootIds[parentInfo.index + 1];
    const nextRoot = nextRootId
      ? await fetchBlock(queryClient, nextRootId)
      : undefined;
    newRoot.createdAt = createdAtAfter(
      target.day,
      target.createdAt,
      nextRoot?.createdAt,
    );
  } else {
    snapshot.push(cloneBlock(parentInfo.parent));
    const content = [...parentInfo.parent.content];
    content.splice(parentInfo.index + 1, 0, newRootId);
    updates.push({ ...parentInfo.parent, content });
  }

  const change = buildTreeChange(
    snapshot,
    updates,
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
