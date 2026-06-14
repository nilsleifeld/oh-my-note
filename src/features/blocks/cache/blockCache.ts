import type { QueryClient } from "@tanstack/react-query";
import { getApiClient } from "../../../api/client";
import type { Block, BlockChange } from "../../../types/models";
import { queryKeys } from "../../../lib/query/queryKeys";
import { removeDateFromDayIndex } from "../../days/cache/dayListCache";
import {
  affectsDayRootQuery,
  cloneBlock,
  patchDayRootsList,
} from "./blockCacheState";

export {
  affectsDayRootQuery,
  applyChangeToState,
  cloneBlock,
  createEmptyCacheState,
  getBlockFromState,
  getDayRootsFromState,
  patchDayRootsList,
  rollbackChangeInState,
  setBlockInState,
  setBlocksInState,
} from "./blockCacheState";

export function getBlock(
  queryClient: QueryClient,
  id: string,
): Block | undefined {
  return queryClient.getQueryData<Block>(queryKeys.block(id));
}

function patchBlockQuery(queryClient: QueryClient, block: Block): void {
  queryClient.setQueryData(queryKeys.block(block.id), cloneBlock(block));
}

function patchDayRootQuery(
  queryClient: QueryClient,
  block: Block,
  prev?: Block,
): void {
  const date = block.day;
  const current = queryClient.getQueryData<Block[]>(queryKeys.day(date)) ?? [];
  queryClient.setQueryData(
    queryKeys.day(date),
    patchDayRootsList(current, block),
  );

  if (prev?.parentId === null && prev.day !== block.day) {
    const oldCurrent =
      queryClient.getQueryData<Block[]>(queryKeys.day(prev.day)) ?? [];
    queryClient.setQueryData(
      queryKeys.day(prev.day),
      oldCurrent.filter((entry) => entry.id !== block.id),
    );
  }
}

export function seedBlockQueries(
  queryClient: QueryClient,
  blocks: Block[],
): void {
  for (const block of blocks) {
    patchBlockQuery(queryClient, block);
  }
}

export function setBlock(queryClient: QueryClient, block: Block): void {
  const prev = getBlock(queryClient, block.id);
  patchBlockQuery(queryClient, block);
  if (affectsDayRootQuery(prev, block)) {
    patchDayRootQuery(queryClient, block, prev);
  }
}

export function setBlocks(queryClient: QueryClient, blocks: Block[]): void {
  const prevById = new Map<string, Block | undefined>();

  for (const block of blocks) {
    prevById.set(block.id, getBlock(queryClient, block.id));
    patchBlockQuery(queryClient, block);
  }
  for (const block of blocks) {
    if (affectsDayRootQuery(prevById.get(block.id), block)) {
      patchDayRootQuery(queryClient, block, prevById.get(block.id));
    }
  }
}

export function removeBlocks(queryClient: QueryClient, ids: string[]): void {
  for (const id of ids) {
    const block = getBlock(queryClient, id);
    if (block?.parentId === null) {
      const date = block.day;
      const current =
        queryClient.getQueryData<Block[]>(queryKeys.day(date)) ?? [];
      queryClient.setQueryData(
        queryKeys.day(date),
        current.filter((entry) => entry.id !== id),
      );
    }
    queryClient.removeQueries({ queryKey: queryKeys.block(id) });
  }
}

export function handleDayEmptied(queryClient: QueryClient, date: string): void {
  queryClient.setQueryData(queryKeys.day(date), []);
  removeDateFromDayIndex(queryClient, date);
}

export async function fetchBlock(
  queryClient: QueryClient,
  id: string,
): Promise<Block> {
  const cached = getBlock(queryClient, id);
  if (cached) return cached;

  const client = getApiClient();
  return queryClient.fetchQuery({
    queryKey: queryKeys.block(id),
    queryFn: async () => {
      const block = await client.getBlock(id);
      if (!block) throw new Error(`Block not found: ${id}`);
      return block;
    },
  });
}

export function applyChangeToCache(
  queryClient: QueryClient,
  change: BlockChange,
): void {
  if (change.deletedIds?.length) {
    removeBlocks(queryClient, change.deletedIds);
  }
  setBlocks(queryClient, change.updates);
}

export function rollbackChange(
  queryClient: QueryClient,
  change: BlockChange,
): void {
  if (change.createdIds?.length) {
    removeBlocks(queryClient, change.createdIds);
  }
  setBlocks(queryClient, change.snapshot);
}

export async function persistChange(change: BlockChange): Promise<void> {
  const client = getApiClient();

  if (change.deletedIds?.length) {
    await client.deleteBlocks(change.deletedIds);
  }

  if (change.updates.length) {
    await client.saveBlocks(change.updates);
  }
}

export async function persistUndo(change: BlockChange): Promise<void> {
  const client = getApiClient();

  if (change.createdIds?.length) {
    await client.deleteBlocks(change.createdIds);
  }

  if (change.snapshot.length) {
    await client.saveBlocks(change.snapshot);
  }
}
