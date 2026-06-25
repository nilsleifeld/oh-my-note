import { useCallback } from "react";
import { useBlockNavigation } from "./navigation/BlockNavigationProvider";
import { useQueryClient } from "@tanstack/react-query";
import { createChildBlock } from "../../data/blocks";
import {
  findParentInContext,
  indentBlock,
  moveBlockInTree,
  outdentBlock,
  rootBlockIds,
} from "../../utils/blockTree";
import { sortKeyBetween } from "../../utils/sortKey";
import type { Block, BlockType } from "../../types/models";
import type { BlockRowProps } from "../../types/ui";
import { fetchBlock, getDayBlocks } from "./cache/blockCache";
import { useDrag } from "./drag/DragProvider";
import {
  buildCreateChildChange,
  buildCreateRootChange,
  buildIndentSnapshot,
  buildMoveSnapshot,
  buildOutdentSnapshot,
  buildTreeChange,
} from "./changes/buildBlockChanges";
import { useApplyBlockMutation } from "./mutations/useApplyBlockMutation";
import type { UseQueryResult } from "@tanstack/react-query";
import { childrenOf } from "../../utils/blockTree";

export function rootKey(date: string): string {
  return `root:${date}`;
}

type UseBlockTreeProps = {
  date: string;
  rootBlocksQuery: UseQueryResult<Block[]>;
};

export function useBlockTree({ date, rootBlocksQuery }: UseBlockTreeProps) {
  const queryClient = useQueryClient();
  const drag = useDrag();
  const { apply } = useApplyBlockMutation();
  const { focusId, requestFocus, clearFocusRequest } = useBlockNavigation();

  const dayBlocks = rootBlocksQuery.data ?? [];

  const getBlock = useCallback(
    (id: string) => fetchBlock(queryClient, id),
    [queryClient],
  );

  const getDayBlocksForDate = useCallback(
    (day: string) => {
      if (day === date) return rootBlocksQuery.data ?? [];
      return getDayBlocks(queryClient, day);
    },
    [date, queryClient, rootBlocksQuery.data],
  );

  const getRootIds = useCallback(() => {
    return rootBlockIds(getDayBlocksForDate(date), date);
  }, [date, getDayBlocksForDate]);

  const addChild = useCallback(
    async (type: BlockType, afterId?: string) => {
      const blocks = getDayBlocksForDate(date);

      if (!afterId) {
        const roots = childrenOf(blocks, null, date);
        const lastRoot = roots.at(-1);
        const child = createChildBlock(type, {
          parentId: null,
          day: date,
          createdAt: new Date().toISOString(),
          sortKey: sortKeyBetween(lastRoot?.sortKey ?? null, null),
        });

        requestFocus(child.id);
        await apply(buildCreateRootChange(child));
        return;
      }

      const parentInfo = findParentInContext(afterId, blocks, date);
      if (!parentInfo) return;

      const parent = parentInfo.parent;
      const parentBlock = parent;
      const child = createChildBlock(type, {
        parentId: parent?.id ?? null,
        day: parentBlock?.day ?? date,
        createdAt: new Date().toISOString(),
        sortKey: sortKeyBetween(null, null),
      });

      if (parent === null) {
        const afterBlock = blocks.find((entry) => entry.id === afterId);
        const siblings = childrenOf(blocks, null, date);
        const afterIndex = siblings.findIndex((entry) => entry.id === afterId);
        const nextRoot = siblings[afterIndex + 1];
        child.sortKey = sortKeyBetween(
          afterBlock?.sortKey ?? null,
          nextRoot?.sortKey ?? null,
        );

        requestFocus(child.id);
        await apply(buildCreateRootChange(child));
      } else {
        const siblings = childrenOf(blocks, parent.id);
        const insertIndex = parentInfo.index + 1;
        const prev = siblings[insertIndex - 1];
        const next = siblings[insertIndex];
        child.sortKey = sortKeyBetween(
          prev?.sortKey ?? null,
          next?.sortKey ?? null,
        );

        requestFocus(child.id);
        await apply(buildCreateChildChange(child));
      }
    },
    [apply, date, getDayBlocksForDate, requestFocus],
  );

  const finishDrop = useCallback(
    (draggedId: string, targetId: string) => {
      drag.onDragEnd();

      void (async () => {
        const dragged = await getBlock(draggedId);
        if (!dragged) return;

        const sourceDay = dragged.day;
        const targetDay = date;
        const sourceBlocks = getDayBlocksForDate(sourceDay);
        const targetBlocks = getDayBlocksForDate(targetDay);

        const draggedParent = findParentInContext(
          draggedId,
          sourceBlocks,
          sourceDay,
        );
        const targetParent = findParentInContext(
          targetId,
          targetBlocks,
          targetDay,
        );
        if (!draggedParent || !targetParent) return;

        const moveOptions =
          sourceDay === targetDay
            ? {}
            : {
                targetDate: targetDay,
                sourceBlocks,
                targetBlocks,
              };

        const updates = moveBlockInTree(
          draggedId,
          targetId,
          targetBlocks,
          sourceDay,
          moveOptions,
        );
        if (!updates) return;

        const snapshot = buildMoveSnapshot(
          dragged,
          draggedParent.parent,
          targetParent.parent &&
            targetParent.parent.id !== draggedParent.parent?.id
            ? targetParent.parent
            : null,
        );

        try {
          await apply(buildTreeChange(snapshot, updates));
        } catch {
          // apply handles rollback
        }
      })();
    },
    [apply, date, drag, getBlock, getDayBlocksForDate],
  );

  const indentChild = useCallback(
    async (id: string) => {
      const blocks = getDayBlocksForDate(date);
      const parentInfo = findParentInContext(id, blocks, date);
      if (!parentInfo || parentInfo.index === 0) return;

      const block = blocks.find((entry) => entry.id === id);
      if (!block) return;

      let previousSibling;
      let parent: Block | null = null;

      if (parentInfo.parent === null) {
        previousSibling = childrenOf(blocks, null, date)[parentInfo.index - 1];
      } else {
        previousSibling = childrenOf(blocks, parentInfo.parent.id)[
          parentInfo.index - 1
        ];
        parent = parentInfo.parent;
      }

      const snapshot = buildIndentSnapshot(block, previousSibling, parent);
      const updates = indentBlock(id, blocks, date);
      if (!updates) return;

      requestFocus(id);
      await apply(buildTreeChange(snapshot, updates));
    },
    [apply, date, getDayBlocksForDate, requestFocus],
  );

  const outdentChild = useCallback(
    async (id: string) => {
      const blocks = getDayBlocksForDate(date);
      const parentInfo = findParentInContext(id, blocks, date);
      if (!parentInfo || parentInfo.parent === null) return;

      const block = blocks.find((entry) => entry.id === id);
      if (!block) return;

      let grandparent: Block | null | undefined = null;
      if (parentInfo.parent.parentId !== null) {
        const grandparentInfo = findParentInContext(
          parentInfo.parent.id,
          blocks,
          date,
        );
        grandparent = grandparentInfo?.parent ?? null;
      }

      const snapshot = buildOutdentSnapshot(
        block,
        parentInfo.parent,
        grandparent ?? undefined,
      );

      const updates = outdentBlock(id, blocks, date);
      if (!updates) return;

      requestFocus(id);
      await apply(buildTreeChange(snapshot, updates));
    },
    [apply, date, getDayBlocksForDate, requestFocus],
  );

  const rowProps: Omit<BlockRowProps, "blockId"> = {
    date,
    dayBlocks,
    rootIds: getRootIds(),
    dragState: { draggingId: drag.draggingId, overId: drag.overId },
    onDragStart: drag.onDragStart,
    onDragOver: drag.onDragOver,
    onDrop: (dropId) => {
      const draggedId = drag.getDraggingId();
      if (!draggedId || draggedId === dropId) {
        drag.onDragEnd();
        return;
      }
      finishDrop(draggedId, dropId);
    },
    onDragEnd: drag.onDragEnd,
    focusId,
    onFocused: clearFocusRequest,
    onRequestFocus: requestFocus,
    onAddBelow: (type, afterId) => void addChild(type, afterId),
    onIndent: (id) => void indentChild(id),
    onOutdent: (id) => void outdentChild(id),
  };

  return {
    rowProps,
    addChild,
    getRootIds,
    dayBlocks,
  };
}
