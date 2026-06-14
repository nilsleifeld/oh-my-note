import type { QueryClient } from "@tanstack/react-query";
import { fetchBlock } from "../cache/blockCache";
import { setBlockClipboard } from "./blockClipboard";
import { collectSubtreeBlocks } from "./collectSubtreeBlocks";

export async function yankBlockByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<boolean> {
  const getBlockFn = (id: string) => fetchBlock(queryClient, id);
  const blocks = await collectSubtreeBlocks(blockId, getBlockFn);
  if (!blocks.length) return false;

  setBlockClipboard({ rootId: blockId, blocks });
  return true;
}
