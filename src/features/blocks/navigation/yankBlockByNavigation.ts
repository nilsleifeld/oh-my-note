import type { QueryClient } from "@tanstack/react-query";
import type { Block } from "../../../types/models";
import { queryKeys } from "../../../lib/query/queryKeys";
import { fetchBlock } from "../cache/blockCache";
import { setBlockClipboard } from "./blockClipboard";
import { collectSubtreeBlocks } from "./collectSubtreeBlocks";

export async function yankBlockByNavigation(
  queryClient: QueryClient,
  blockId: string,
): Promise<boolean> {
  const block = await fetchBlock(queryClient, blockId);
  const blocks =
    queryClient.getQueryData<Block[]>(queryKeys.day(block.day)) ?? [];
  const subtree = await collectSubtreeBlocks(blockId, blocks);
  if (!subtree.length) return false;

  setBlockClipboard({ rootId: blockId, blocks: subtree });
  return true;
}
