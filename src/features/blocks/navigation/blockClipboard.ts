import type { Block } from "../../../types/models";

export type BlockClipboard = {
  rootId: string;
  blocks: Block[];
};

let clipboard: BlockClipboard | null = null;

export function getBlockClipboard(): BlockClipboard | null {
  return clipboard;
}

export function setBlockClipboard(next: BlockClipboard): void {
  clipboard = next;
}

export function hasBlockClipboard(): boolean {
  return clipboard !== null && clipboard.blocks.length > 0;
}
