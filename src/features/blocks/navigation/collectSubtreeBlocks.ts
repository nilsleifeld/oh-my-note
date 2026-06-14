import type { Block } from "../../../types/models";
import { cloneBlock } from "../cache/blockCacheState";

export async function collectSubtreeBlocks(
  blockId: string,
  getBlock: (id: string) => Promise<Block | undefined>,
): Promise<Block[]> {
  const block = await getBlock(blockId);
  if (!block) return [];

  const blocks: Block[] = [cloneBlock(block)];
  for (const childId of block.content) {
    blocks.push(...(await collectSubtreeBlocks(childId, getBlock)));
  }
  return blocks;
}
