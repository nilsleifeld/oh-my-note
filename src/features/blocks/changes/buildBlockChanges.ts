import type { Block, BlockChange } from "../../../types/models";
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

export function buildToggleOpenChange(
  block: Block,
  open: boolean,
): BlockChange {
  return buildPropertyChange(block, { open });
}

export function buildTypeChange(
  block: Block,
  type: Block["type"],
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = { ...cloneBlock(block), type };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildSlashTypeChange(
  block: Block,
  type: Block["type"],
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    type,
    properties: { ...block.properties, title: "" },
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildBulletShortcutChange(
  block: Block,
  title: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    type: "bullet" as const,
    properties: { ...block.properties, title },
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildOrderedShortcutChange(
  block: Block,
  title: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    type: "ordered" as const,
    properties: { ...block.properties, title },
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildTodoShortcutChange(
  block: Block,
  title: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    type: "todo" as const,
    properties: { ...block.properties, title, checked: false },
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildToggleShortcutChange(
  block: Block,
  title: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    type: "toggle" as const,
    properties: { ...block.properties, title, open: true },
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildHeadingShortcutChange(
  block: Block,
  type: Extract<Block["type"], "h1" | "h2" | "h3" | "h4" | "h5">,
  title: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    type,
    properties: { ...block.properties, title },
  };

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
  const snapshot = parent
    ? [cloneBlock(block), cloneBlock(parent)]
    : [cloneBlock(block)];

  return {
    snapshot,
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

export function buildCreateChildChange(child: Block): BlockChange {
  return {
    snapshot: [],
    updates: [child],
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

export function buildAddCommentChange(
  block: Block,
  comment: Block["comments"][number],
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    comments: [...block.comments, comment],
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildUpdateCommentChange(
  block: Block,
  commentId: string,
  text: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    comments: block.comments.map((comment) =>
      comment.id === commentId ? { ...comment, text } : comment,
    ),
  };

  return { snapshot: [snapshot], updates: [update] };
}

export function buildDeleteCommentChange(
  block: Block,
  commentId: string,
): BlockChange {
  const snapshot = cloneBlock(block);
  const update = {
    ...cloneBlock(block),
    comments: block.comments.filter((comment) => comment.id !== commentId),
  };

  return { snapshot: [snapshot], updates: [update] };
}
