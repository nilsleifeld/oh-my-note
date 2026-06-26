import type { QueryClient } from "@tanstack/react-query";
import { getApiClient } from "../../api/client";
import type { Block } from "../../types/models";
import { buildToggleOpenChange } from "../blocks/changes/buildBlockChanges";
import {
  applyChangeToCache,
  fetchBlock,
  persistChange,
  seedBlockQueries,
} from "../blocks/cache/blockCache";
import { scrollBlockIntoView } from "../blocks/navigation/blockNavigationUtils";
import type { FeedJumpController } from "./FeedJumpProvider";

async function waitForElement(
  selector: string,
  timeoutMs = 5000,
): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) return element;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  return null;
}

function collectCollapsedToggleAncestors(
  blockId: string,
  blocks: Block[],
): Block[] {
  const toOpen: Block[] = [];
  let current = blocks.find((block) => block.id === blockId);

  while (current?.parentId) {
    const parent = blocks.find((block) => block.id === current!.parentId);
    if (parent?.type === "toggle" && !parent.properties.open) {
      toOpen.push(parent);
    }
    current = parent;
  }

  return toOpen;
}

async function openToggleAncestors(
  queryClient: QueryClient,
  blockId: string,
  dayBlocks: Block[],
): Promise<void> {
  const toggles = collectCollapsedToggleAncestors(blockId, dayBlocks);
  if (!toggles.length) return;

  const snapshot = toggles.flatMap(
    (block) => buildToggleOpenChange(block, true).snapshot,
  );
  const updates = toggles.flatMap(
    (block) => buildToggleOpenChange(block, true).updates,
  );

  applyChangeToCache(queryClient, { snapshot, updates });
  await persistChange({ snapshot, updates });
}

export async function jumpToBlock(options: {
  queryClient: QueryClient;
  blockId: string;
  feedController: FeedJumpController | null;
  navigateToBlock: (blockId: string) => void;
}): Promise<void> {
  const { queryClient, blockId, feedController, navigateToBlock } = options;

  const block = await fetchBlock(queryClient, blockId);
  const dayResult = await getApiClient().getBlocks({ day: block.day });
  seedBlockQueries(queryClient, dayResult.items);

  if (feedController) {
    await feedController.ensureDayVisible(block.day);
  }

  await openToggleAncestors(queryClient, blockId, dayResult.items);

  await waitForElement(`[data-block-id="${blockId}"]`);
  scrollBlockIntoView(blockId);
  navigateToBlock(blockId);
}
