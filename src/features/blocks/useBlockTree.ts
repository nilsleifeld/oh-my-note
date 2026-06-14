import { useCallback, useState } from "react";
import { useBlockNavigation } from "./navigation/BlockNavigationProvider";
import { useQueryClient } from "@tanstack/react-query";
import { createChildBlock } from "../../data/blocks";
import { createdAtAfter } from "../../utils/date";
import {
  findParentInContext,
  indentBlock,
  moveBlockInTree,
  outdentBlock,
  rootBlockIds,
} from "../../utils/blockTree";
import type { Block, BlockType } from "../../types/models";
import type { BlockRowProps } from "../../types/ui";
import { queryKeys } from "../../lib/query/queryKeys";
import { fetchBlock } from "./cache/blockCache";
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
  const [pendingByParentId, setPendingByParentId] = useState<Record<
    string,
    string[]
  > | null>(null);

  const getBlock = useCallback(
    (id: string) => fetchBlock(queryClient, id),
    [queryClient],
  );

  const getRootIds = useCallback(() => {
    const pendingRoot = pendingByParentId?.[rootKey(date)];
    if (pendingRoot) return pendingRoot;
    return rootBlockIds(rootBlocksQuery.data ?? []);
  }, [date, pendingByParentId, rootBlocksQuery.data]);

  const pendingContent = useCallback(
    (parentId: string) => pendingByParentId?.[parentId],
    [pendingByParentId],
  );

  const addChild = useCallback(
    async (type: BlockType, afterId?: string) => {
      const rootIds = getRootIds();

      if (!afterId) {
        const roots = rootBlocksQuery.data ?? [];
        const lastRoot = roots.at(-1);
        const child = createChildBlock(type, {
          parentId: null,
          day: date,
          createdAt: createdAtAfter(date, lastRoot?.createdAt),
        });

        requestFocus(child.id);
        await apply(buildCreateRootChange(child));
        return;
      }

      const parentInfo = await findParentInContext(afterId, rootIds, getBlock);
      if (!parentInfo) return;

      const parent = parentInfo.parent;
      const parentBlock = parent ? await getBlock(parent.id) : null;
      const child = createChildBlock(type, {
        parentId: parent?.id ?? null,
        day: parentBlock?.day ?? date,
        createdAt: new Date().toISOString(),
      });

      if (parent === null) {
        const afterBlock = await getBlock(afterId);
        const nextRootId = rootIds[parentInfo.index + 1];
        const nextRoot = nextRootId ? await getBlock(nextRootId) : undefined;
        child.createdAt = createdAtAfter(
          date,
          afterBlock?.createdAt,
          nextRoot?.createdAt,
        );

        requestFocus(child.id);
        await apply(buildCreateRootChange(child));
      } else {
        requestFocus(child.id);
        await apply(
          buildCreateChildChange(parent, child, parentInfo.index + 1),
        );
      }
    },
    [apply, date, getBlock, getRootIds, requestFocus, rootBlocksQuery.data],
  );

  const rootIdsForDay = useCallback(
    (day: string) => {
      if (day === date) return getRootIds();
      const roots = queryClient.getQueryData<Block[]>(queryKeys.day(day)) ?? [];
      return rootBlockIds(roots);
    },
    [date, getRootIds, queryClient],
  );

  const finishDrop = useCallback(
    (draggedId: string, targetId: string) => {
      drag.onDragEnd();

      void (async () => {
        const dragged = await getBlock(draggedId);
        if (!dragged) return;

        const sourceDay = dragged.day;
        const targetDay = date;
        const sourceRootIds = rootIdsForDay(sourceDay);
        const targetRootIds = rootIdsForDay(targetDay);

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
        if (!draggedParent || !targetParent) return;

        const moveOptions =
          sourceDay === targetDay
            ? {}
            : {
                targetDate: targetDay,
                sourceRootIds,
                targetRootIds,
              };

        const updates = await moveBlockInTree(
          draggedId,
          targetId,
          targetRootIds,
          sourceDay,
          getBlock,
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

        setPendingByParentId({
          ...(sourceDay === targetDay
            ? {
                [rootKey(date)]: pendingRootIds(
                  targetRootIds,
                  draggedId,
                  targetId,
                  updates,
                ),
              }
            : {
                [rootKey(sourceDay)]: sourceRootIds.filter(
                  (id) => id !== draggedId,
                ),
                [rootKey(targetDay)]: pendingRootIds(
                  targetRootIds,
                  draggedId,
                  targetId,
                  updates,
                ),
              }),
          ...Object.fromEntries(
            updates.map((block) => [block.id, block.content]),
          ),
        });

        try {
          await apply(buildTreeChange(snapshot, updates));
        } finally {
          setPendingByParentId(null);
        }
      })();
    },
    [apply, date, drag, getBlock, rootIdsForDay],
  );

  const indentChild = useCallback(
    async (id: string) => {
      const rootIds = getRootIds();

      const parentInfo = await findParentInContext(id, rootIds, getBlock);
      if (!parentInfo || parentInfo.index === 0) return;

      const block = await getBlock(id);
      if (!block) return;

      let previousSibling: Block | null;
      let parent: Block | null = null;

      if (parentInfo.parent === null) {
        const prevId = rootIds[parentInfo.index - 1];
        previousSibling = (await getBlock(prevId)) ?? null;
      } else {
        const prevId = parentInfo.parent.content[parentInfo.index - 1];
        previousSibling = (await getBlock(prevId)) ?? null;
        parent = parentInfo.parent;
      }

      const snapshot = buildIndentSnapshot(block, previousSibling, parent);

      const updates = await indentBlock(id, rootIds, getBlock);
      if (!updates) return;

      requestFocus(id);
      await apply(buildTreeChange(snapshot, updates));
    },
    [apply, getBlock, getRootIds, requestFocus],
  );

  const outdentChild = useCallback(
    async (id: string) => {
      const rootIds = getRootIds();

      const parentInfo = await findParentInContext(id, rootIds, getBlock);
      if (!parentInfo || parentInfo.parent === null) return;

      const block = await getBlock(id);
      if (!block) return;

      let grandparent: Block | null | undefined = null;
      if (parentInfo.parent.parentId !== null) {
        const grandparentInfo = await findParentInContext(
          parentInfo.parent.id,
          rootIds,
          getBlock,
        );
        grandparent = grandparentInfo?.parent ?? null;
      }

      const snapshot = buildOutdentSnapshot(
        block,
        parentInfo.parent,
        grandparent ?? undefined,
      );

      const updates = await outdentBlock(id, rootIds, date, getBlock);
      if (!updates) return;

      requestFocus(id);
      await apply(buildTreeChange(snapshot, updates));
    },
    [apply, date, getBlock, getRootIds, requestFocus],
  );

  const rowProps: Omit<BlockRowProps, "blockId"> = {
    date,
    rootKey: rootKey(date),
    rootIds: getRootIds(),
    dragState: { draggingId: drag.draggingId, overId: drag.overId },
    pendingContent,
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
  };
}

function pendingRootIds(
  rootIds: string[],
  draggedId: string,
  targetId: string,
  updates: Block[],
): string[] {
  const draggedUpdate = updates.find((block) => block.id === draggedId);
  if (!draggedUpdate) return rootIds;

  if (draggedUpdate.parentId !== null) {
    return rootIds.filter((id) => id !== draggedId);
  }

  const withDragged = rootIds.includes(draggedId)
    ? rootIds
    : [...rootIds, draggedId];

  return moveRootIds(withDragged, draggedId, targetId);
}

function moveRootIds(
  rootIds: string[],
  draggedId: string,
  targetId: string,
): string[] {
  const reordered = [...rootIds];
  const from = reordered.indexOf(draggedId);
  const to = reordered.indexOf(targetId);
  if (from === -1 || to === -1) return rootIds;

  reordered.splice(from, 1);
  reordered.splice(to, 0, draggedId);
  return reordered;
}
