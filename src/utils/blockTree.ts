import type { Block, ParentInfo } from "../types/models";
import { createdAtAfter } from "./date";
import { insertAtIndex, moveInList, uniqueIds } from "./list";

export async function findParent(
  root: Block,
  blockId: string,
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<{ parent: Block; index: number } | null> {
  const index = root.content.indexOf(blockId);
  if (index !== -1) return { parent: root, index };

  for (const childId of root.content) {
    const child = await getBlock(childId);
    if (!child) continue;
    const found = await findParent(child, blockId, getBlock);
    if (found) return found;
  }

  return null;
}

export async function findParentInContext(
  blockId: string,
  rootIds: string[],
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<ParentInfo | null> {
  const rootIndex = rootIds.indexOf(blockId);
  if (rootIndex !== -1) return { parent: null, index: rootIndex };

  for (const rootId of rootIds) {
    const root = await getBlock(rootId);
    if (!root) continue;
    const found = await findParent(root, blockId, getBlock);
    if (found) return found;
  }

  return null;
}

export async function isDescendant(
  ancestorId: string,
  blockId: string,
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<boolean> {
  const block = await getBlock(ancestorId);
  if (!block) return false;

  for (const childId of block.content) {
    if (childId === blockId) return true;
    if (await isDescendant(childId, blockId, getBlock)) return true;
  }

  return false;
}

export async function indentBlock(
  blockId: string,
  rootIds: string[],
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<Block[] | null> {
  const parentInfo = await findParentInContext(blockId, rootIds, getBlock);
  if (!parentInfo || parentInfo.index === 0) return null;

  if (parentInfo.parent === null) {
    const prevId = rootIds[parentInfo.index - 1];
    const prev = await getBlock(prevId);
    const block = await getBlock(blockId);
    if (!prev || !block) return null;

    return [
      { ...prev, content: uniqueIds([...prev.content, blockId]) },
      { ...block, parentId: prevId },
    ];
  }

  const { parent, index } = parentInfo;
  const prevId = parent.content[index - 1];
  const prev = await getBlock(prevId);
  if (!prev) return null;

  const parentContent = [...parent.content];
  parentContent.splice(index, 1);

  return [
    { ...prev, content: uniqueIds([...prev.content, blockId]) },
    { ...parent, content: parentContent },
  ];
}

export async function outdentBlock(
  blockId: string,
  rootIds: string[],
  date: string,
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<Block[] | null> {
  const parentInfo = await findParentInContext(blockId, rootIds, getBlock);
  if (!parentInfo || parentInfo.parent === null) return null;

  const { parent, index } = parentInfo;
  const block = await getBlock(blockId);
  if (!block) return null;

  const parentContent = [...parent.content];
  parentContent.splice(index, 1);

  if (parent.parentId === null) {
    const parentRootIndex = rootIds.indexOf(parent.id);
    const nextRootId = rootIds[parentRootIndex + 1];
    const nextRoot = nextRootId ? await getBlock(nextRootId) : undefined;
    const createdAt = createdAtAfter(
      date,
      parent.createdAt,
      nextRoot?.createdAt,
    );

    return [
      { ...block, parentId: null, createdAt },
      { ...parent, content: parentContent },
    ];
  }

  const grandparentInfo = await findParentInContext(
    parent.id,
    rootIds,
    getBlock,
  );
  if (!grandparentInfo || grandparentInfo.parent === null) return null;

  const grandparentContent = [...grandparentInfo.parent.content];
  grandparentContent.splice(grandparentInfo.index + 1, 0, blockId);

  return [
    { ...grandparentInfo.parent, content: grandparentContent },
    { ...parent, content: parentContent },
  ];
}

type MoveBlockOptions = {
  targetDate?: string;
  sourceRootIds?: string[];
  targetRootIds?: string[];
};

async function mergeSubtreeDay(
  updates: Block[],
  draggedId: string,
  day: string,
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<Block[]> {
  const byId = new Map(updates.map((block) => [block.id, block]));

  async function walk(blockId: string): Promise<void> {
    const block = await getBlock(blockId);
    if (!block) return;

    const existing = byId.get(blockId);
    byId.set(blockId, existing ? { ...existing, day } : { ...block, day });

    for (const childId of block.content) {
      await walk(childId);
    }
  }

  await walk(draggedId);
  return [...byId.values()];
}

export async function moveBlockInTree(
  draggedId: string,
  targetId: string,
  rootIds: string[],
  date: string,
  getBlock: (id: string) => Promise<Block | undefined>,
  options: MoveBlockOptions = {},
): Promise<Block[] | null> {
  const targetDate = options.targetDate ?? date;
  const sourceRootIds = options.sourceRootIds ?? rootIds;
  const targetRootIds = options.targetRootIds ?? rootIds;
  const crossDay = date !== targetDate;

  if (draggedId === targetId) return null;
  if (await isDescendant(draggedId, targetId, getBlock)) return null;

  const draggedParent = await findParentInContext(
    draggedId,
    sourceRootIds,
    getBlock,
  );
  const targetParent = await findParentInContext(
    targetId,
    targetRootIds,
    getBlock,
  );
  if (!draggedParent || !targetParent) return null;

  async function finish(updates: Block[] | null): Promise<Block[] | null> {
    if (!updates) return null;
    if (!crossDay) return updates;
    return mergeSubtreeDay(updates, draggedId, targetDate, getBlock);
  }

  if (draggedParent.parent === null && targetParent.parent === null) {
    if (!crossDay) {
      const reordered = moveInList(rootIds, draggedId, targetId);
      if (reordered === rootIds) return null;

      const dragged = await getBlock(draggedId);
      if (!dragged) return null;

      const draggedIndex = reordered.indexOf(draggedId);
      const prevId = reordered[draggedIndex - 1];
      const nextId = reordered[draggedIndex + 1];
      const prev = prevId ? await getBlock(prevId) : undefined;
      const next = nextId ? await getBlock(nextId) : undefined;

      const createdAt = createdAtAfter(
        targetDate,
        prev?.createdAt,
        next?.createdAt,
      );

      return finish([{ ...dragged, parentId: null, createdAt }]);
    }

    const dragged = await getBlock(draggedId);
    if (!dragged) return null;

    const targetIndex = targetRootIds.indexOf(targetId);
    const prevId = targetRootIds[targetIndex - 1];
    const nextId = targetRootIds[targetIndex];
    const prev = prevId ? await getBlock(prevId) : undefined;
    const next = nextId ? await getBlock(nextId) : undefined;
    const createdAt = createdAtAfter(
      targetDate,
      prev?.createdAt,
      next?.createdAt,
    );

    return finish([{ ...dragged, parentId: null, day: targetDate, createdAt }]);
  }

  if (
    draggedParent.parent !== null &&
    targetParent.parent !== null &&
    draggedParent.parent.id === targetParent.parent.id
  ) {
    const content = moveInList(
      draggedParent.parent.content,
      draggedId,
      targetId,
    );
    if (content === draggedParent.parent.content) return null;
    return finish([{ ...draggedParent.parent, content }]);
  }

  if (draggedParent.parent === null) {
    const dragged = await getBlock(draggedId);
    if (!dragged) return null;

    if (targetParent.parent === null) {
      const targetIndex = targetRootIds.indexOf(targetId);
      const prevId = targetRootIds[targetIndex - 1];
      const nextId = targetRootIds[targetIndex + 1];
      const prev = prevId ? await getBlock(prevId) : undefined;
      const next = nextId ? await getBlock(nextId) : undefined;
      const createdAt = createdAtAfter(
        targetDate,
        prev?.createdAt,
        next?.createdAt,
      );
      return finish([{ ...dragged, parentId: null, createdAt }]);
    }

    const targetContent = insertAtIndex(
      targetParent.parent.content,
      draggedId,
      targetParent.index,
    );

    return finish([
      { ...targetParent.parent, content: targetContent },
      { ...dragged, parentId: targetParent.parent.id },
    ]);
  }

  if (targetParent.parent === null) {
    const sourceContent = [...draggedParent.parent.content];
    sourceContent.splice(draggedParent.index, 1);

    const dragged = await getBlock(draggedId);
    if (!dragged) return null;

    const targetIndex = targetRootIds.indexOf(targetId);
    const prevId = targetRootIds[targetIndex - 1];
    const nextId = targetRootIds[targetIndex + 1];
    const prev = prevId ? await getBlock(prevId) : undefined;
    const next = nextId ? await getBlock(nextId) : undefined;
    const createdAt = createdAtAfter(
      targetDate,
      prev?.createdAt,
      next?.createdAt,
    );

    return finish([
      { ...dragged, parentId: null, createdAt },
      { ...draggedParent.parent, content: sourceContent },
    ]);
  }

  const sourceContent = [...draggedParent.parent.content];
  sourceContent.splice(draggedParent.index, 1);

  const targetContent = insertAtIndex(
    targetParent.parent.content,
    draggedId,
    targetParent.index,
  );

  const dragged = await getBlock(draggedId);
  if (!dragged) return null;

  return finish([
    { ...targetParent.parent, content: targetContent },
    { ...draggedParent.parent, content: sourceContent },
    { ...dragged, parentId: targetParent.parent.id },
  ]);
}

export async function collectDescendantIds(
  blockId: string,
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<string[]> {
  const block = await getBlock(blockId);
  if (!block) return [];

  const ids: string[] = [];
  for (const childId of block.content) {
    ids.push(childId, ...(await collectDescendantIds(childId, getBlock)));
  }
  return ids;
}

export function sortRootBlocks(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function rootBlockIds(blocks: Block[]): string[] {
  return uniqueIds(sortRootBlocks(blocks).map((block) => block.id));
}
