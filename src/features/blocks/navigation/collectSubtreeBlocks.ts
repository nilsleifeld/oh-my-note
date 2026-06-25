import type { Block } from "../../../types/models";
import { cloneBlock } from "../cache/blockCacheState";
import { childrenOf } from "../../../utils/blockTree";

export async function collectSubtreeBlocks(
  blockId: string,
  blocks: Block[],
): Promise<Block[]> {
  const block = blocks.find((entry) => entry.id === blockId);
  if (!block) return [];

  const result: Block[] = [cloneBlock(block)];
  for (const child of childrenOf(blocks, blockId)) {
    result.push(...(await collectSubtreeBlocks(child.id, blocks)));
  }
  return result;
}
