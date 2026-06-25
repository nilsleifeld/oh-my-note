import type { Block, ParentInfo } from "../types/models";
import { sortKeyBetween } from "./sortKey";
import { moveInList, uniqueIds } from "./list";

export function sortBlocksBySortKey(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function childrenOf(
  blocks: Block[],
  parentId: string | null,
  day?: string,
): Block[] {
  return sortBlocksBySortKey(
    blocks.filter((block) => {
      if (block.parentId !== parentId) return false;
      if (parentId === null && day !== undefined) {
        return block.day === day;
      }
      return true;
    }),
  );
}

export function childBlockIds(
  blocks: Block[],
  parentId: string | null,
  day?: string,
): string[] {
  return childrenOf(blocks, parentId, day).map((block) => block.id);
}

export function sortRootBlocks(blocks: Block[], day: string): Block[] {
  return childrenOf(blocks, null, day);
}

export function rootBlockIds(blocks: Block[], day: string): string[] {
  return uniqueIds(sortRootBlocks(blocks, day).map((block) => block.id));
}

export function findParentInfo(
  blockId: string,
  blocks: Block[],
  day: string,
): ParentInfo | null {
  const block = blocks.find((entry) => entry.id === blockId);
  if (!block) return null;

  if (block.parentId === null) {
    const roots = childrenOf(blocks, null, day);
    const index = roots.findIndex((entry) => entry.id === blockId);
    if (index === -1) return null;
    return { parent: null, index };
  }

  const parent = blocks.find((entry) => entry.id === block.parentId);
  if (!parent) return null;

  const siblings = childrenOf(blocks, parent.id);
  const index = siblings.findIndex((entry) => entry.id === blockId);
  if (index === -1) return null;

  return { parent, index };
}

export function findParentInContext(
  blockId: string,
  blocks: Block[],
  day: string,
): ParentInfo | null {
  return findParentInfo(blockId, blocks, day);
}

export function isDescendant(
  ancestorId: string,
  blockId: string,
  blocks: Block[],
): boolean {
  let current = blocks.find((entry) => entry.id === blockId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = blocks.find((entry) => entry.id === current!.parentId);
  }
  return false;
}

function sortKeyForReorderedIds(
  blocks: Block[],
  orderedIds: string[],
  draggedId: string,
): string {
  const index = orderedIds.indexOf(draggedId);
  if (index === -1) {
    throw new Error(`sortKeyForReorderedIds: missing ${draggedId}`);
  }

  const prev =
    index > 0
      ? blocks.find((block) => block.id === orderedIds[index - 1])
      : undefined;
  const next =
    index < orderedIds.length - 1
      ? blocks.find((block) => block.id === orderedIds[index + 1])
      : undefined;

  return sortKeyBetween(prev?.sortKey ?? null, next?.sortKey ?? null);
}

function sortKeyAfterMove(
  blocks: Block[],
  parentId: string | null,
  day: string,
  draggedId: string,
  targetId: string,
): string {
  const siblings = childrenOf(blocks, parentId, day);
  const siblingIds = siblings.map((block) => block.id);
  const reordered = moveInList(siblingIds, draggedId, targetId);
  return sortKeyForReorderedIds(blocks, reordered, draggedId);
}

function sortKeyBeforeTargetAmongSiblings(
  blocks: Block[],
  parentId: string | null,
  day: string,
  targetId: string,
  draggedId: string,
): string {
  const siblingIds = childrenOf(blocks, parentId, day)
    .map((block) => block.id)
    .filter((id) => id !== draggedId);
  const targetIndex = siblingIds.indexOf(targetId);
  const orderedIds = [...siblingIds];
  orderedIds.splice(targetIndex, 0, draggedId);
  return sortKeyForReorderedIds(blocks, orderedIds, draggedId);
}

export function indentBlock(
  blockId: string,
  blocks: Block[],
  day: string,
): Block[] | null {
  const parentInfo = findParentInfo(blockId, blocks, day);
  if (!parentInfo || parentInfo.index === 0) return null;

  const block = blocks.find((entry) => entry.id === blockId);
  if (!block) return null;

  const previousSibling =
    parentInfo.parent === null
      ? childrenOf(blocks, null, day)[parentInfo.index - 1]
      : childrenOf(blocks, parentInfo.parent.id)[parentInfo.index - 1];

  const prevChildren = childrenOf(blocks, previousSibling.id);
  const lastChild = prevChildren.at(-1);
  const newSortKey = sortKeyBetween(lastChild?.sortKey ?? null, null);

  return [{ ...block, parentId: previousSibling.id, sortKey: newSortKey }];
}

export function outdentBlock(
  blockId: string,
  blocks: Block[],
  day: string,
): Block[] | null {
  const parentInfo = findParentInfo(blockId, blocks, day);
  if (!parentInfo || parentInfo.parent === null) return null;

  const block = blocks.find((entry) => entry.id === blockId);
  const parent = parentInfo.parent;
  if (!block) return null;

  if (parent.parentId === null) {
    const roots = childrenOf(blocks, null, day);
    const parentIndex = roots.findIndex((entry) => entry.id === parent.id);
    const nextRoot = roots[parentIndex + 1];
    const newSortKey = sortKeyBetween(
      parent.sortKey,
      nextRoot?.sortKey ?? null,
    );
    return [{ ...block, parentId: null, sortKey: newSortKey }];
  }

  const cousins = childrenOf(blocks, parent.parentId);
  const parentIndex = cousins.findIndex((entry) => entry.id === parent.id);
  const nextSibling = cousins[parentIndex + 1];
  const newSortKey = sortKeyBetween(
    parent.sortKey,
    nextSibling?.sortKey ?? null,
  );

  return [{ ...block, parentId: parent.parentId, sortKey: newSortKey }];
}

type MoveBlockOptions = {
  targetDate?: string;
  sourceBlocks?: Block[];
  targetBlocks?: Block[];
};

function mergeSubtreeDay(
  updates: Block[],
  draggedId: string,
  day: string,
  blocks: Block[],
): Block[] {
  const byId = new Map(updates.map((block) => [block.id, block]));

  const walk = (blockId: string): void => {
    const block = blocks.find((entry) => entry.id === blockId);
    if (!block) return;

    const existing = byId.get(blockId);
    byId.set(blockId, existing ? { ...existing, day } : { ...block, day });

    for (const child of blocks.filter((entry) => entry.parentId === blockId)) {
      walk(child.id);
    }
  };

  walk(draggedId);
  return [...byId.values()];
}

export function moveBlockInTree(
  draggedId: string,
  targetId: string,
  blocks: Block[],
  day: string,
  options: MoveBlockOptions = {},
): Block[] | null {
  const targetDate = options.targetDate ?? day;
  const sourceBlocks = options.sourceBlocks ?? blocks;
  const targetBlocks = options.targetBlocks ?? blocks;
  const crossDay = day !== targetDate;

  if (draggedId === targetId) return null;
  if (isDescendant(draggedId, targetId, sourceBlocks)) return null;

  const dragged = sourceBlocks.find((entry) => entry.id === draggedId);
  const target = targetBlocks.find((entry) => entry.id === targetId);
  if (!dragged || !target) return null;

  const draggedParent = findParentInfo(draggedId, sourceBlocks, day);
  const targetParent = findParentInfo(targetId, targetBlocks, targetDate);
  if (!draggedParent || !targetParent) return null;

  function finish(updates: Block[] | null): Block[] | null {
    if (!updates) return null;
    if (!crossDay) return updates;
    return mergeSubtreeDay(updates, draggedId, targetDate, sourceBlocks);
  }

  const isDroppedOnParent =
    draggedParent.parent !== null && targetId === draggedParent.parent.id;

  if (isDroppedOnParent && draggedParent.parent) {
    const parent = draggedParent.parent;
    const newSortKey =
      parent.parentId === null
        ? (() => {
            const roots = childrenOf(targetBlocks, null, targetDate);
            const parentIndex = roots.findIndex(
              (entry) => entry.id === parent.id,
            );
            const nextRoot = roots[parentIndex + 1];
            return sortKeyBetween(parent.sortKey, nextRoot?.sortKey ?? null);
          })()
        : sortKeyBeforeTargetAmongSiblings(
            targetBlocks,
            parent.parentId,
            targetDate,
            parent.id,
            draggedId,
          );
    return finish([
      {
        ...dragged,
        parentId: parent.parentId,
        day: targetDate,
        sortKey: newSortKey,
      },
    ]);
  }

  const newParentId = target.parentId;
  const draggedParentId = dragged.parentId;
  const sameParentReorder = draggedParentId === newParentId && !crossDay;
  const newSortKey = sameParentReorder
    ? sortKeyAfterMove(
        targetBlocks,
        newParentId,
        targetDate,
        draggedId,
        targetId,
      )
    : sortKeyBeforeTargetAmongSiblings(
        targetBlocks,
        newParentId,
        targetDate,
        targetId,
        draggedId,
      );

  const update: Block = {
    ...dragged,
    parentId: newParentId,
    day: targetDate,
    sortKey: newSortKey,
  };

  return finish([update]);
}

export function collectDescendantIds(
  blockId: string,
  blocks: Block[],
): string[] {
  const ids: string[] = [];
  for (const child of childrenOf(blocks, blockId)) {
    ids.push(child.id, ...collectDescendantIds(child.id, blocks));
  }
  return ids;
}
