import type { Block, BlockChange, BlockType } from "../../../types/models";
import { cloneBlock } from "../cache/blockCacheState";

export function buildPropertyChange(
  block: Block,
  properties: Partial<Block["properties"]>,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    properties: { ...block.properties, ...properties },
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildTitleChange(
  block: Block,
  title: string,
  previousTitle: string,
): BlockChange {
  return {
    snapshot: [
      {
        ...cloneBlock(block),
        properties: { ...block.properties, title: previousTitle },
      },
    ],
    updates: [
      {
        ...cloneBlock(block),
        properties: { ...block.properties, title },
      },
    ],
  };
}

export function buildToggleChange(block: Block, checked: boolean): BlockChange {
  return buildPropertyChange(block, { checked });
}

export function buildTypeChange(block: Block, type: BlockType): BlockChange {
  const snapshot = cloneBlock(block);
  const update = { ...cloneBlock(block), type };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildImagePasteChange(
  block: Block,
  imageData: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    type: "image" as const,
    properties: { ...block.properties, title: "", imageData },
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildLanguageChange(
  block: Block,
  language: string,
  previousLanguage: string,
): BlockChange {
  return {
    snapshot: [
      {
        ...cloneBlock(block),
        properties: { ...block.properties, language: previousLanguage },
      },
    ],
    updates: [
      {
        ...cloneBlock(block),
        properties: { ...block.properties, language },
      },
    ],
  };
}

export function buildDeleteChange(
  block: Block,
  parent: Block | null,
): BlockChange {
  if (parent) {
    const content = parent.content.filter((childId) => childId !== block.id);
    return {
      snapshot: [cloneBlock(block), cloneBlock(parent)],
      updates: [{ ...parent, content }],
      deletedIds: [block.id],
    };
  }

  return {
    snapshot: [cloneBlock(block)],
    updates: [],
    deletedIds: [block.id],
  };
}

export function buildCreateRootChange(child: Block): BlockChange {
  return {
    snapshot: [],
    updates: [child],
    createdIds: [child.id],
  };
}

export function buildCreateChildChange(
  parent: Block,
  child: Block,
  index: number,
): BlockChange {
  const content = parent.content.filter((id) => id !== child.id);
  content.splice(index, 0, child.id);

  return {
    snapshot: [cloneBlock(parent)],
    updates: [{ ...parent, content }, child],
    createdIds: [child.id],
  };
}

export function buildTreeChange(
  snapshot: Block[],
  updates: Block[],
  createdIds?: string[],
): BlockChange {
  return {
    snapshot: snapshot.map(cloneBlock),
    updates,
    createdIds,
  };
}

export function buildIndentSnapshot(
  block: Block,
  previousSibling: Block | null | undefined,
  parent: Block | null | undefined,
): Block[] {
  const snapshot: Block[] = [];
  if (previousSibling) snapshot.push(cloneBlock(previousSibling));
  if (block) snapshot.push(cloneBlock(block));
  if (parent) snapshot.push(cloneBlock(parent));
  return snapshot;
}

export function buildOutdentSnapshot(
  block: Block,
  parent: Block,
  grandparent?: Block | null,
): Block[] {
  const snapshot: Block[] = [cloneBlock(block), cloneBlock(parent)];
  if (grandparent) snapshot.push(cloneBlock(grandparent));
  return snapshot;
}

export function buildMoveSnapshot(
  dragged: Block,
  sourceParent: Block | null | undefined,
  targetParent: Block | null | undefined,
): Block[] {
  const snapshot: Block[] = [cloneBlock(dragged)];
  if (sourceParent) snapshot.push(cloneBlock(sourceParent));
  if (targetParent && targetParent.id !== sourceParent?.id) {
    snapshot.push(cloneBlock(targetParent));
  }
  return snapshot;
}
