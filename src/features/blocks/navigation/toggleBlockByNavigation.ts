import type { QueryClient } from "@tanstack/react-query";
import type { BlockChange } from "../../../types/models";
import {
  buildToggleChange,
  buildToggleOpenChange,
} from "../changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  persistChange,
  rollbackChange,
} from "../cache/blockCache";

export async function toggleTodoByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<BlockChange | null> {
  const block = await fetchBlock(queryClient, blockId);
  if (block.type !== "todo") return null;

  const change = buildToggleChange(block, !block.properties.checked);
  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  return change;
}

export async function toggleBlockOpenByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<BlockChange | null> {
  const block = await fetchBlock(queryClient, blockId);
  if (block.type !== "toggle") return null;

  const change = buildToggleOpenChange(block, !block.properties.open);
  applyChangeToCache(queryClient, change);

  try {
    await persistChange(change);
  } catch (error) {
    rollbackChange(queryClient, change);
    throw error;
  }

  return change;
}
