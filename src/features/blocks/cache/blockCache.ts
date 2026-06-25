import type { QueryClient } from "@tanstack/react-query";
import { getApiClient } from "../../../api/client";
import type { Block, BlockChange } from "../../../types/models";
import { queryKeys } from "../../../lib/query/queryKeys";
import { removeDateFromDayIndex } from "../../days/cache/dayListCache";
import { cloneBlock, patchDayBlocksList } from "./blockCacheState";

export {
  affectsDayQuery,
  applyChangeToState,
  cloneBlock,
  createEmptyCacheState,
  getAllBlocksFromState,
  getBlockFromState,
  getDayBlocksFromState,
  getDayRootsFromState,
  patchDayBlocksList,
  patchDayRootsList,
  rollbackChangeInState,
  rootIdsFromState,
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

function patchDayBlockQuery(
  queryClient: QueryClient,
  block: Block,
  prev?: Block,
): void {
  const date = block.day;
  const current = queryClient.getQueryData<Block[]>(queryKeys.day(date)) ?? [];
  queryClient.setQueryData(
    queryKeys.day(date),
    patchDayBlocksList(current, block),
  );

  if (prev && prev.day !== block.day) {
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

  const byDay = new Map<string, Block[]>();
  for (const block of blocks) {
    const dayBlocks = byDay.get(block.day) ?? [];
    dayBlocks.push(block);
    byDay.set(block.day, dayBlocks);
  }

  for (const [day, dayBlocks] of byDay) {
    queryClient.setQueryData(queryKeys.day(day), dayBlocks.map(cloneBlock));
  }
}

export function setBlock(queryClient: QueryClient, block: Block): void {
  const prev = getBlock(queryClient, block.id);
  patchBlockQuery(queryClient, block);
  patchDayBlockQuery(queryClient, block, prev);
}

export function setBlocks(queryClient: QueryClient, blocks: Block[]): void {
  const prevById = new Map<string, Block | undefined>();

  for (const block of blocks) {
    prevById.set(block.id, getBlock(queryClient, block.id));
    patchBlockQuery(queryClient, block);
  }
  for (const block of blocks) {
    patchDayBlockQuery(queryClient, block, prevById.get(block.id));
  }
}

export function removeBlocks(queryClient: QueryClient, ids: string[]): void {
  for (const id of ids) {
    const block = getBlock(queryClient, id);
    if (block) {
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

export function getDayBlocks(queryClient: QueryClient, date: string): Block[] {
  return queryClient.getQueryData<Block[]>(queryKeys.day(date)) ?? [];
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
